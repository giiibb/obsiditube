import typer
import json
import os
import re
from textwrap import dedent
from src.config import change_dir_to_root, create_session
from src.parser import (
    ParserError,
    parser_url_and_get_playlist_id,
    get_json_from_content,
)
from src.fetch import fetch_continuation
from src import utils
from pathlib import Path

app = typer.Typer(
    pretty_exceptions_enable=False,
    pretty_exceptions_short=False,
    pretty_exceptions_show_locals=False,
)


def safe_filename(name: str, playlist_id: str) -> str:
    """Make a safe filename from playlist title."""
    name = re.sub(r"[^\w\s.-]", "", name)
    name = re.sub(r"\s+", "_", name).strip("_")
    return name or f"playlist - {playlist_id}"


def make_card(
    playlist_id: str, 
    index: int, 
    video_id: str, 
    title: str,
    duration: str = "",
    views: str = "",
    publish_date: str = ""
) -> str:
    """
    Generates an Obsidian cardlink block with extra metadata.
    """
    t = title.replace('"', '\\"')
    
    # Build metadata string
    meta_parts = []
    if duration: meta_parts.append(f"**{duration}**")
    if views: meta_parts.append(views)
    if publish_date: meta_parts.append(publish_date)
    metadata_line = " • ".join(meta_parts)
    
    prefix = f"{index}. [ ] {metadata_line} " if metadata_line else f"{index}. [ ] "
    
    return dedent(f"""
    {prefix}**"{t}"**
    ```cardlink
    url: https://www.youtube.com/watch?v={video_id}&list={playlist_id}&index={index}
    title: "{t}"
    host: www.youtube.com
    favicon: https://m.youtube.com/static/favicon.ico
    image: https://i.ytimg.com/vi/{video_id}/hqdefault.jpg
    ```
    """).strip()


def make_notion_card(
    playlist_id: str, 
    index: int, 
    video_id: str, 
    title: str,
    duration: str = "",
    views: str = "",
    publish_date: str = ""
) -> str:
    """Generate a Notion-compatible markdown card with metadata."""
    url = f"https://www.youtube.com/watch?v={video_id}&list={playlist_id}&index={index}"
    thumb = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    safe_title = title.replace("[", "\\[").replace("]", "\\]")
    meta = f" ({duration})" if duration else ""
    return f"![{safe_title}]({thumb})\n- [ ] [**{index}. {safe_title}**{meta}]({url})"


def generate_yaml_properties(metadata: dict) -> str:
    """Generates Obsidian YAML frontmatter from playlist metadata."""
    yaml = dedent(f"""
    ---
    title: "{metadata.get('title', '').replace('"', '\\"')}"
    author: "{metadata.get('author', '').replace('"', '\\"')}"
    video_count: {metadata.get('video_count', 0)}
    view_count: "{metadata.get('view_count', '')}"
    last_updated: "{metadata.get('last_updated', '')}"
    description: "{metadata.get('description', '').replace('"', '\\"').replace('\\n', ' ')}"
    playlist_url: "https://www.youtube.com/playlist?list={metadata.get('id', '')}"
    ---
    """).strip()
    return yaml


@app.command()
def main(
    url: str,
    cached: bool = typer.Option(False, help="Use cached HTTP session"),
    out: Path | None = typer.Option(
        None,
        "--out",
        "-o",
        help="Output markdown file (default: playlist_title.md)",
        exists=False,
        dir_okay=False,
    ),
    chdir: Path | None = typer.Option(
        "output",
        "--chdir",
        "-C",
        help="Change directory before writing output",
        exists=False,
        file_okay=False,
    ),
    stdout: bool = typer.Option(
        False,
        help="Print cards to stdout instead of writing a file",
    ),
    title_as_filename: bool = typer.Option(
        True,
        help="Use playlist title as filename when --out not provided",
    ),
    force: bool = typer.Option(
        False,
        help="Overwrite existing file",
    ),
):
    try:
        playlist_id = parser_url_and_get_playlist_id(url)
    except ParserError as e:
        raise typer.BadParameter(e.msg)
    typer.secho(f"playlist ID: {playlist_id}", fg=typer.colors.GREEN)

    change_dir_to_root()
    if chdir:
        typer.secho(f"cd → {chdir}", fg=typer.colors.BRIGHT_BLUE)
        chdir.mkdir(parents=True, exist_ok=True)
        os.chdir(chdir)

    session = create_session(cached=cached)

    # ---- FETCH INITIAL PAGE ----
    with session.get(
        url=f"https://www.youtube.com/playlist?list={playlist_id}"
    ) as resp:
        resp.raise_for_status()
        ytInitialData = json.loads(
            get_json_from_content(
                resp.content, name=b"var ytInitialData = ", prefix=b"", postfix=b""
            )
        )

        title = utils.get_nested_item(ytInitialData, "metadata", "playlistMetadataRenderer", "title")
        try:
            sidebar_primary = utils.get_nested_item(
                ytInitialData, "sidebar", "playlistSidebarRenderer", "items", 
                utils.ListExactlyOneChildDictKey, "playlistSidebarPrimaryInfoRenderer"
            )
            description = sidebar_primary.get("description", {}).get("simpleText", "")
            stats = sidebar_primary.get("stats", [])
            video_count_text = stats[0].get("runs", [{}])[0].get("text", "0") if len(stats) > 0 else "0"
            view_count = stats[1].get("simpleText", "") if len(stats) > 1 else ""
            last_updated = ""
            for s in stats:
                if "Updated" in str(s):
                    last_updated = "".join([r.get("text", "") for r in s.get("runs", [])])
        except Exception:
            description, video_count_text, view_count, last_updated = "", "0", "", ""

        try:
            author = utils.get_nested_item(ytInitialData, "header", "playlistHeaderRenderer", "ownerText", "runs", utils.ListExactlyOne, "text")
        except Exception:
            author = ""

        playlist_metadata = {
            "id": playlist_id,
            "title": title,
            "author": author,
            "description": description,
            "video_count": int(''.join(filter(str.isdigit, video_count_text)) or 0),
            "view_count": view_count,
            "last_updated": last_updated
        }

    typer.secho(f"TITLE: {title}", fg=typer.colors.BRIGHT_YELLOW)

    # ---- DETERMINE OUTPUT PATH ----
    out_path: Path | None = None
    if not stdout:
        if out is None and title_as_filename:
            out = Path(f"{safe_filename(title, playlist_id=playlist_id)}.md")
        elif out is None:
            out = Path(f"playlist - {playlist_id}")

        if out.exists() and not force:
            raise typer.BadParameter(f"{out} already exists. Use --force to overwrite.")

        out_path = out

    # ---- EXTRACT CONTENTS ----
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
    
    cards: list[str] = []
    video_index = 1

    for content in contents:
        continuationItemRenderer = content.get("continuationItemRenderer")
        if continuationItemRenderer is not None:
            continuation_videos = fetch_continuation(
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
            for v in continuation_videos:
                cards.append(make_card(playlist_id, v["index"], v["video_id"], v["title"]))
                video_index += 1
        else:
            pvr = content.get("playlistVideoRenderer")
            if not pvr: continue
            
            video_id = pvr["videoId"]
            v_title = utils.get_nested_item(pvr, "title", "runs", utils.ListExactlyOne, "text")
            duration = pvr.get("lengthText", {}).get("simpleText", "")
            v_stats = pvr.get("videoInfo", {}).get("runs", [])
            v_views = v_stats[0].get("text", "") if len(v_stats) > 0 else ""
            v_date = v_stats[2].get("text", "") if len(v_stats) > 2 else ""

            cards.append(make_card(playlist_id, video_index, video_id, v_title, duration, v_views, v_date))
            video_index += 1

    result = generate_yaml_properties(playlist_metadata) + "\n\n" + "\n".join(cards)

    if stdout:
        typer.echo(result)
    else:
        if out_path is None:
            raise RuntimeError("UNLIKELY.")
        out_path.write_text(result, encoding="utf-8")
        typer.secho(f"Wrote {len(cards)} cards → {out_path}", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
