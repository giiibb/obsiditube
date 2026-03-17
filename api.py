"""
ObsidiTube — FastAPI Backend
============================
Exposes a single REST endpoint that wraps the original CLI scraping logic:

  POST /api/convert
    body: { url: str, cookies?: str }
    headers: { X-License-Key: str }
    response: { markdown: str, notion: str, title: str, author: str, total_count: int, truncated: bool }
"""

import json
from fastapi import FastAPI, HTTPException, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Annotated, Dict, Any
from textwrap import dedent

from src.config import create_session
from src.parser import (
    ParserError,
    parser_url_and_get_playlist_id,
    get_json_from_content,
)
from src.fetch import fetch_continuation
from src import utils
from src.license import verify_license_key, get_license_data, FREE_TIER_LIMIT
from src.webhooks import (
    verify_creem_signature, 
    verify_nowpayments_signature, 
    provision_license,
    send_license_email
)
from main import make_card, make_notion_card, generate_yaml_properties

app = FastAPI(
    title="ObsidiTube API",
    description="Convert YouTube playlists to Obsidian cardlink markdown.",
    version="1.2.0",
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
    url: str
    cookies: str | None = None


class ConvertResponse(BaseModel):
    """Response body returned after successful conversion."""
    markdown: str
    notion: str
    title: str
    author: str
    total_count: int
    truncated: bool


class LicenseValidateRequest(BaseModel):
    license_key: str


class LicenseValidateResponse(BaseModel):
    valid: bool
    data: Dict[str, Any] | None = None


@app.post("/api/convert", response_model=ConvertResponse)
def convert_playlist(
    req: ConvertRequest, 
    x_license_key: Annotated[str | None, Header()] = None
):
    """Main conversion endpoint with Paywall truncation and Metadata."""
    try:
        playlist_id = parser_url_and_get_playlist_id(req.url)
    except ParserError as e:
        raise HTTPException(status_code=400, detail=str(e.msg))

    is_pro = verify_license_key(x_license_key) if x_license_key else False
    session = create_session(cached=False, cookies=req.cookies)

    try:
        with session.get(url=f"https://www.youtube.com/playlist?list={playlist_id}") as resp:
            resp.raise_for_status()
            ytInitialData = json.loads(
                get_json_from_content(resp.content, name=b"var ytInitialData = ", prefix=b"", postfix=b"")
            )
            title = utils.get_nested_item(ytInitialData, "metadata", "playlistMetadataRenderer", "title")
            
            # Author
            try:
                author = utils.get_nested_item(ytInitialData, "header", "playlistHeaderRenderer", "ownerText", "runs", utils.ListExactlyOne, "text")
            except Exception:
                author = ""

            # Extra Playlist Metadata for YAML
            try:
                sidebar_primary = utils.get_nested_item(
                    ytInitialData, "sidebar", "playlistSidebarRenderer", "items", 
                    utils.ListExactlyOneChildDictKey, "playlistSidebarPrimaryInfoRenderer"
                )
                description = sidebar_primary.get("description", {}).get("simpleText", "")
                stats = sidebar_primary.get("stats", [])
                video_count_text = stats[0].get("runs", [{}])[0].get("text", "0") if len(stats) > 0 else "0"
                view_count = stats[1].get("simpleText", "") if len(stats) > 1 else ""
                last_updated = "".join([r.get("text", "") for r in stats[2].get("runs", [])]) if len(stats) > 2 else ""
            except Exception:
                description, video_count_text, view_count, last_updated = "", "0", "", ""

            playlist_metadata = {
                "id": playlist_id,
                "title": title,
                "author": author,
                "description": description,
                "video_count": int(''.join(filter(str.isdigit, video_count_text)) or 0),
                "view_count": view_count,
                "last_updated": last_updated
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch initial page: {str(e)}")

    try:
        contents = utils.get_nested_item(
            ytInitialData, "contents", "twoColumnBrowseResultsRenderer", "tabs", utils.ListExactlyOne, "tabRenderer", 
            "content", "sectionListRenderer", "contents", utils.ListExactlyOneChildDictKey, "itemSectionRenderer", 
            "contents", utils.ListExactlyOneChildDictKey, "playlistVideoListRenderer", "contents"
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse playlist contents. Check cookies if private.")

    cards, notion_cards = [], []
    total_processed, truncated = 0, False

    try:
        for content in contents:
            if not is_pro and total_processed >= FREE_TIER_LIMIT:
                truncated = True
                break

            continuationItemRenderer = content.get("continuationItemRenderer")
            if continuationItemRenderer is not None:
                if not is_pro:
                    truncated = True
                    break
                
                continuation_videos = fetch_continuation(
                    session, playlist_id, video_index=total_processed + 1,
                    continuation_token=utils.get_nested_item(
                        continuationItemRenderer, "continuationEndpoint", "commandExecutorCommand", "commands", 
                        utils.ListExactlyOneChildDictKey, "continuationCommand", "token"
                    )
                )
                for video_info in continuation_videos:
                    cards.append(make_card(video_info["playlist_id"], video_info["index"], video_info["video_id"], video_info["title"]))
                    notion_cards.append(make_notion_card(video_info["playlist_id"], video_info["index"], video_info["video_id"], video_info["title"]))
                    total_processed += 1
            else:
                pvr = content["playlistVideoRenderer"]
                total_processed += 1
                video_id = pvr["videoId"]
                v_title = utils.get_nested_item(pvr, "title", "runs", utils.ListExactlyOne, "text")
                
                # Video Metadata
                duration = pvr.get("lengthText", {}).get("simpleText", "")
                v_stats = pvr.get("videoInfo", {}).get("runs", [])
                v_views = v_stats[0].get("text", "") if len(v_stats) > 0 else ""
                v_date = v_stats[2].get("text", "") if len(v_stats) > 2 else ""

                cards.append(make_card(playlist_id, total_processed, video_id, v_title, duration, v_views, v_date))
                notion_cards.append(make_notion_card(playlist_id, total_processed, video_id, v_title, duration, v_views, v_date))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract videos: {str(e)}")

    yaml_props = generate_yaml_properties(playlist_metadata)
    markdown_result = yaml_props + "\n\n" + "\n".join(cards)
    notion_result = "\n\n".join(notion_cards)

    return ConvertResponse(
        markdown=markdown_result, 
        notion=notion_result, 
        title=title, 
        author=author, 
        total_count=playlist_metadata["video_count"], 
        truncated=truncated
    )


@app.post("/api/license/validate", response_model=LicenseValidateResponse)
def validate_license(req: LicenseValidateRequest):
    """Validate a license key and return metadata."""
    data = get_license_data(req.license_key)
    if data and data.get("status") == "active":
        return LicenseValidateResponse(valid=True, data=data)
    return LicenseValidateResponse(valid=False)


@app.post("/api/webhooks/creem")
async def webhook_creem(request: Request, creem_signature: Annotated[str | None, Header()] = None):
    """Handle Creem.io payment notifications."""
    if not creem_signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    body = await request.body()
    if not verify_creem_signature(body, creem_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    event = data.get("event")
    
    if event == "order.created":
        order = data.get("data", {}).get("order", {})
        customer = data.get("data", {}).get("customer", {})
        email = customer.get("email")
        order_id = order.get("id")
        
        if email and order_id:
            provision_license(email, order_id, "creem")
            
    return {"status": "success"}


@app.post("/api/webhooks/nowpayments")
async def webhook_nowpayments(request: Request, x_nowpayments_sig: Annotated[str | None, Header()] = None, background_tasks: BackgroundTasks = None):
    """Handle NOWPayments crypto notifications."""
    if not x_nowpayments_sig:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    data = await request.json()
    if not verify_nowpayments_signature(data, x_nowpayments_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payment_status = data.get("payment_status")
    if payment_status == "finished":
        email = data.get("customer_email") or data.get("order_description")
        order_id = data.get("payment_id")
        
        if email and "@" in email:
            key = provision_license(email, str(order_id), "nowpayments")
            background_tasks.add_task(send_license_email, email, key)
            
    return {"status": "success"}
