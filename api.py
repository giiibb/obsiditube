"""
ObsidiTube — FastAPI Backend
============================
Exposes a single REST endpoint that wraps the original CLI scraping logic:

  POST /api/convert
    body: { url: str, cookies?: str }
    response: { markdown: str, title: str, author: str }

The endpoint:
  1. Validates and extracts the playlist ID from the given YouTube URL.
  2. Creates an HTTP session with consent cookies + optional user-provided cookies.
  3. Fetches the YouTube playlist page and extracts ytInitialData (inline JSON).
  4. Iterates over all videos, following continuation tokens for long playlists.
  5. Returns the assembled Obsidian cardlink markdown.

CORS is fully open so the Next.js frontend (or any other client) can call this
regardless of port or origin.
"""

import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.config import create_session
from src.parser import (
    ParserError,
    parser_url_and_get_playlist_id,
    get_json_from_content,
)
from src.fetch import fetch_continuation
from src import utils
from main import make_card, make_notion_card  # reuse card formatters from the original CLI

app = FastAPI(
    title="ObsidiTube API",
    description="Convert YouTube playlists to Obsidian cardlink markdown.",
    version="1.0.0",
)

# Allow all origins so the Next.js dev server and Vercel frontend can reach this.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConvertRequest(BaseModel):
    """Request body for the /api/convert endpoint."""
    url: str           # Full YouTube playlist URL
    cookies: str | None = None  # Optional raw cookie header string (for private playlists)


class ConvertResponse(BaseModel):
    """Response body returned after successful conversion."""
    markdown: str  # Full Obsidian cardlink markdown output
    notion: str    # Notion-compatible markdown (image + checkbox per video)
    title: str     # Playlist title (used as the suggested filename)
    author: str    # Channel / uploader name (may be empty if not found)


@app.post("/api/convert", response_model=ConvertResponse)
def convert_playlist(req: ConvertRequest):
    """
    Main conversion endpoint.

    Steps:
      1. Parse playlist ID from URL (raises 400 on invalid URL / missing list= param).
      2. Fetch the YouTube playlist HTML page.
      3. Extract ytInitialData JSON embedded in the page.
      4. Pull out title, author, and the list of video renderers.
      5. For playlists > ~100 videos, follow YouTube's continuation tokens recursively.
      6. Assemble and return the full markdown.
    """

    # --- Step 1: validate URL and extract playlist ID ---
    try:
        playlist_id = parser_url_and_get_playlist_id(req.url)
    except ParserError as e:
        raise HTTPException(status_code=400, detail=str(e.msg))

    # Build the requests Session with appropriate headers and cookies.
    # SOCS/CONSENT cookies are always injected to bypass the EU consent gate.
    # User-provided cookies are appended after (for private playlist access).
    session = create_session(cached=False, cookies=req.cookies)

    # --- Step 2 & 3: fetch the page and extract ytInitialData ---
    try:
        with session.get(
            url=f"https://www.youtube.com/playlist?list={playlist_id}"
        ) as resp:
            resp.raise_for_status()

            # YouTube embeds a large JSON object in the HTML as:
            #   var ytInitialData = { ... };
            # We extract it with a custom byte-level parser (no regex /  beautifulsoup
            # needed — faster and avoids encoding issues with large pages).
            ytInitialData = json.loads(
                get_json_from_content(
                    resp.content, name=b"var ytInitialData = ", prefix=b"", postfix=b""
                )
            )

            # Playlist title — always present under metadata.
            title = utils.get_nested_item(
                ytInitialData,
                "metadata",
                "playlistMetadataRenderer",
                "title",
            )

            # Channel / uploader name — found under the header renderer.
            # Two possible paths depending on playlist type; fall back to "".
            try:
                author = utils.get_nested_item(
                    ytInitialData,
                    "header",
                    "playlistHeaderRenderer",
                    "ownerText",
                    "runs",
                    utils.ListExactlyOne,
                    "text",
                )
            except Exception:
                try:
                    # Alternative path used for some playlist types
                    author = utils.get_nested_item(
                        ytInitialData,
                        "sidebar",
                        "playlistSidebarRenderer",
                        "items",
                        utils.ListExactlyOneChildDictKey,
                        "playlistSidebarSecondaryInfoRenderer",
                        "videoOwner",
                        "videoOwnerRenderer",
                        "title",
                        "runs",
                        utils.ListExactlyOne,
                        "text",
                    )
                except Exception:
                    author = ""  # Not critical — download filename will omit the _by_ suffix

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to fetch initial page: {str(e)}"
        )

    # --- Step 4: navigate the nested ytInitialData to the video list ---
    try:
        contents = utils.get_nested_item(
            ytInitialData,
            "contents",
            "twoColumnBrowseResultsRenderer",
            "tabs",
            utils.ListExactlyOne,
            "tabRenderer",
            "content",
            "sectionListRenderer",
            "contents",
            utils.ListExactlyOneChildDictKey,
            "itemSectionRenderer",
            "contents",
            utils.ListExactlyOneChildDictKey,
            "playlistVideoListRenderer",
            "contents",
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Failed to parse playlist contents. Make sure the cookies are valid if the playlist is private.",
        )

    # --- Step 5: iterate videos, following continuation tokens if needed ---
    continuationItemRenderer_found: bool = False
    cards: list[str] = []
    notion_cards: list[str] = []

    try:
        for video_index, content in enumerate(contents, start=1):
            continuationItemRenderer = content.get("continuationItemRenderer")

            if continuationItemRenderer_found:
                # Should never happen — continuation must be the last item
                raise ValueError(
                    "continuationItemRenderer can only occure at max 1 time and it should be at last."
                )
            elif continuationItemRenderer is not None:
                # This batch is paginated — fetch subsequent pages via the API
                continuationItemRenderer_found = True
                continuation_videos = list(
                    fetch_continuation(
                        session,
                        playlist_id,
                        continuation_token=utils.get_nested_item(
                            continuationItemRenderer,
                            "continuationEndpoint",
                            "commandExecutorCommand",
                            "commands",
                            utils.ListExactlyOneChildDictKey,
                            "continuationCommand",
                            "token",
                        ),
                        video_index=video_index,
                    )
                )
                for video_info in continuation_videos:
                    cards.append(make_card(
                        playlist_id=video_info["playlist_id"],
                        index=video_info["index"],
                        video_id=video_info["video_id"],
                        title=video_info["title"],
                    ))
                    notion_cards.append(make_notion_card(
                        playlist_id=video_info["playlist_id"],
                        index=video_info["index"],
                        video_id=video_info["video_id"],
                        title=video_info["title"],
                    ))
            else:
                # Normal video entry — extract video ID and title
                playlistVideoRenderer = content["playlistVideoRenderer"]
                video_id = playlistVideoRenderer["videoId"]
                video_title = utils.get_nested_item(
                    playlistVideoRenderer,
                    "title",
                    "runs",
                    utils.ListExactlyOne,
                    "text",
                )
                cards.append(make_card(
                    playlist_id=playlist_id,
                    index=video_index,
                    video_id=video_id,
                    title=video_title,
                ))
                notion_cards.append(make_notion_card(
                    playlist_id=playlist_id,
                    index=video_index,
                    video_id=video_id,
                    title=video_title,
                ))

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to extract videos: {str(e)}"
        )

    # Join all cards with a single newline between each block
    result = "\n".join(cards)
    notion_result = "\n\n".join(notion_cards)

    return ConvertResponse(markdown=result, notion=notion_result, title=title, author=author)
