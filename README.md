# ObsidiTube 🎬 → 📝

**Turn any YouTube playlist into Obsidian checklist cards — instantly.**

> **Forked from** [thefcraft/youtube-playlist-to-obsidian-cards](https://github.com/thefcraft/youtube-playlist-to-obsidian-cards)  
> ObsidiTube wraps the original CLI in a full-stack web dashboard with a modern UI, private playlist support, rendered card preview, and one-click download.

---

## ✨ What it does

For every video in a playlist, it generates an Obsidian `cardlink` block:

```md
1. [ ] **"Some Video Title"**
```cardlink
url: https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID&index=1
title: "Some Video Title"
host: www.youtube.com
favicon: https://m.youtube.com/static/favicon.ico
image: https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
```
```

Each card:
- ☐ Acts as a **todo checkbox** in Obsidian
- 🖼 Renders as a **rich link preview** via the [Auto Card Link](https://github.com/nekoshita/obsidian-auto-card-link) community plugin
- 🔗 Keeps the original playlist index and video link

---

## 🏗 Architecture

```
obsiditube/
├── api.py              # FastAPI backend — POST /api/convert
├── main.py             # Original CLI entry point (kept intact)
├── dev.py              # Dev launcher: runs backend + frontend concurrently
├── src/
│   ├── config.py       # HTTP session factory, User-Agent, consent cookies
│   ├── fetch.py        # YouTube continuation API (paginated playlists)
│   ├── parser.py       # URL validation + inline JSON extractor from HTML
│   └── utils.py        # Nested dict accessor helpers
└── frontend/           # Next.js 15 + Shadcn UI dashboard
    └── src/
        ├── app/
        │   ├── page.tsx        # Main dashboard (URL input, results, preview/code toggle)
        │   ├── layout.tsx      # Root layout, fonts, dark mode
        │   └── globals.css     # Tailwind v4 theme, dark palette with pastel red/orange
        └── components/
            ├── ObsidianCardPreview.tsx  # Renders Obsidian cardlink blocks as visual cards
            └── NotionCardPreview.tsx   # Renders Notion export as thumbnail cards (feature branch)
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Python ≥ 3.11 with [uv](https://github.com/astral-sh/uv)
- Node.js ≥ 18

### 1. Clone
```bash
git clone https://github.com/giiibb/obsiditube.git
cd obsiditube
```

### 2. Install Python dependencies
```bash
uv sync
```

### 3. Install frontend dependencies
```bash
cd frontend && npm install && cd ..
```

### 4. Run
```bash
uv run python dev.py
```

This starts:
- **FastAPI backend** on `http://localhost:8000`
- **Next.js frontend** on `http://localhost:3000`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployed

**Live app:** [obsiditube.vercel.app](https://obsiditube.vercel.app)

> ⚠️ **The Vercel deployment hosts the frontend only.** The conversion is done by a local FastAPI backend (`uv run python dev.py`). If you're just browsing the UI online, you'll need to run the backend locally to actually convert playlists — see [Quick Start](#-quick-start-local-dev) above.

---

## 🔒 Private Playlists

To convert a private playlist:

1. Open YouTube in your browser and log in
2. Press `F12` → Network tab → refresh the page
3. Click on any `youtube.com` request
4. Find the `cookie:` header → copy the entire value
5. In ObsidiTube, click **"Private playlist? Click here"** and paste your cookies

---

## 📋 Features

| Feature | Description |
|---|---|
| 🔍 **Auto clipboard detect** | Automatically detects a YouTube playlist URL on page focus |
| ⚡ **Auto-generate on paste** | Starts generating as soon as a valid playlist URL is entered |
| 👁 **Preview / Code toggle** | Preview renders cards visually; Code shows raw markdown |
| 🃏 **Card renderer** | Thumbnails, checkboxes, titles, favicon, and host — click to open video |
| 📥 **Smart download** | Filename: `ObsidiTube_PLAYLIST_Playlist_by_CHANNELNAME.md` |
| 🔒 **Private support** | Cookie-based auth with step-by-step extraction guide |
| 📋 **Notion export** | Switch to Notion mode for copy-paste-ready markdown with thumbnails |

---

## 🛠 CLI Usage (original)

The original CLI is still fully functional:

```bash
# Basic
uv run main.py "https://www.youtube.com/playlist?list=PLAYLIST_ID"

# Custom output file
uv run main.py "https://..." -o todos.md

# Print to stdout
uv run main.py "https://..." --stdout

# Overwrite existing file
uv run main.py "https://..." -o playlist.md --force
```

---

## 🧩 Obsidian Setup

Install the **[Auto Card Link](https://github.com/nekoshita/obsidian-auto-card-link)** community plugin.  
It renders `cardlink` fenced blocks as rich link previews with thumbnails.

---

## 📋 Notion Export (Copy-Paste)

Switch to **Notion mode** in the output panel to get markdown optimized for Notion — no API, no token required.

For each video, the Notion format generates:
```md
![Video Title](https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg)
- [ ] [1. **Video Title**](https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID&index=1)
```

When pasted into a Notion page:
- 🖼 The `![...]` becomes an **embedded image** (Notion fetches the YouTube thumbnail automatically)
- ☑️ The `- [ ]` becomes a **to-do checkbox** linked to the video

> **Note:** A proper Notion database with gallery view and page covers requires the Notion API (planned for a future phase).

---

## ⚠️ Limitations

- Uses YouTube's internal (undocumented) API — may break if YouTube changes their page structure
- Descriptions are not fetched (intentionally — not needed for a todo tracker)
- Private playlists require manual cookie extraction

---

## 🙏 Credits

- **Original project:** [thefcraft/youtube-playlist-to-obsidian-cards](https://github.com/thefcraft/youtube-playlist-to-obsidian-cards) — the core scraping & parsing logic
- **Fork / Web UI:** [giiibb/obsiditube](https://github.com/giiibb/obsiditube)

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
