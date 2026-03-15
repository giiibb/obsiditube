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
from main import make_card

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConvertRequest(BaseModel):
    url: str
    cookies: str | None = None


class ConvertResponse(BaseModel):
    markdown: str
    title: str
    author: str


@app.post("/api/convert", response_model=ConvertResponse)
def convert_playlist(req: ConvertRequest):
    try:
        playlist_id = parser_url_and_get_playlist_id(req.url)
    except ParserError as e:
        raise HTTPException(status_code=400, detail=str(e.msg))

    session = create_session(cached=False, cookies=req.cookies)

    # ---- FETCH INITIAL PAGE ----
    try:
        with session.get(
            url=f"https://www.youtube.com/playlist?list={playlist_id}"
        ) as resp:
            resp.raise_for_status()
            ytInitialData = json.loads(
                get_json_from_content(
                    resp.content, name=b"var ytInitialData = ", prefix=b"", postfix=b""
                )
            )

            title = utils.get_nested_item(
                ytInitialData,
                "metadata",
                "playlistMetadataRenderer",
                "title",
            )

            # Try to get channel/author name from the header
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
                    author = ""
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to fetch initial page: {str(e)}"
        )

    # ---- EXTRACT CONTENTS ----
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

    continuationItemRenderer_found: bool = False
    cards: list[str] = []
    
    try:
        for video_index, content in enumerate(contents, start=1):
            continuationItemRenderer = content.get("continuationItemRenderer")
            if continuationItemRenderer_found:
                raise ValueError(
                    "continuationItemRenderer can only occure at max 1 time and it should be at last."
                )
            elif continuationItemRenderer is not None:
                continuationItemRenderer_found = True
                cards.extend(
                    map(
                        lambda video_info: make_card(
                            playlist_id=video_info["playlist_id"],
                            index=video_info["index"],
                            video_id=video_info["video_id"],
                            title=video_info["title"],
                        ),
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
                        ),
                    )
                )
            else:
                playlistVideoRenderer = content["playlistVideoRenderer"]
                video_id = playlistVideoRenderer["videoId"]
                card = make_card(
                    playlist_id=playlist_id,
                    index=video_index,
                    video_id=video_id,
                    title=utils.get_nested_item(
                        playlistVideoRenderer,
                        "title",
                        "runs",
                        utils.ListExactlyOne,
                        "text",
                    ),
                )
                cards.append(card)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to extract videos: {str(e)}"
        )

    result = "\n".join(cards)

    return ConvertResponse(markdown=result, title=title, author=author)
