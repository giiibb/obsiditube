# ObsidiTube 🎬 → 📝

**Turn any YouTube playlist into Obsidian checklist cards — instantly.**

> **Forked from** [thefcraft/youtube-playlist-to-obsidian-cards](https://github.com/thefcraft/youtube-playlist-to-obsidian-cards)  
> ObsidiTube wraps the original CLI in a full-stack web dashboard with a modern 2026 glassmorphism UI, private playlist support, rendered card preview, dynamic OG images, robust recursive video extraction, and one-click download.

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

## 🏗 Architecture (Dual Backend)

ObsidiTube operates in two distinct modes depending on the environment:

1. **Local Mode (Python FastAPI)**: Unlimited usage, no license required, no Redis dependency. Runs locally on your machine.
2. **Cloud Mode (Next.js TypeScript)**: Deployed on Vercel Edge/Serverless. Features a 10-video free tier limit, Upstash Redis 1-hour caching, and integrated license verification via webhooks.

```
obsiditube/
├── api.py              # Local FastAPI backend — POST /api/convert
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
        │   ├── page.tsx        # Main dashboard (Glassmorphism 2026 UI)
        │   ├── layout.tsx      # Root layout, fonts, dark mode, OG meta
        │   ├── globals.css     # Tailwind v4 theme, OKLCH colors, dynamic scroll fade
        │   └── api/
        │       ├── convert/route.ts       # TS port of Python logic with Redis Cache & recursive extraction
        │       ├── og/route.tsx           # Dynamic Open Graph image generation (@vercel/og)
        │       ├── license/validate/route.ts # License key validation
        │       └── webhooks/              # Creem (Fiat) & NOWPayments (Crypto) auto-provisioning
        ├── lib/
        │   ├── redis.ts           # Upstash Redis client
        │   └── license-manager.ts # Key generation & Resend email delivery
        └── components/
            ├── ObsidianCardPreview.tsx  # Renders Obsidian cardlink blocks
            ├── NotionCardPreview.tsx    # Renders Notion export cards
            └── PaywallModal.tsx         # Pro upgrade modal
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
- **FastAPI backend** on `http://localhost:8000` (Unlimited, no license needed)
- **Next.js frontend** on `http://localhost:3000`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployed

**Live app:** [obsiditube.vercel.app](https://obsiditube.vercel.app)

> ⚠️ **Cloud Deployment Restrictions:** The Vercel deployment uses the TypeScript Next.js backend, which includes a **10-video limit** for the free tier and a 1-hour Redis cache. To bypass limits without purchasing a Pro license, run the app locally using the Python backend.

---

## 🔒 Private Playlists

To convert a private playlist:

1. Open YouTube in your browser and log in
2. Press `F12` → Console tab
3. Paste `copy(document.cookie); console.log('✅ Cookies copied!')` and press Enter
4. In ObsidiTube, click **"Private playlist? Click here"** and paste your cookies

---

## 📋 Features

| Feature | Description |
|---|---|
| 🎨 **2026 UI/UX Aesthetic** | Stunning glassmorphism, dynamic scroll fades, and OKLCH color spaces. |
| 🔍 **Robust Video Extraction** | Recursive JSON walking ensures no videos are missed, regardless of YouTube UI structure. |
| ⚡ **1-Hour Caching** | Vercel deployment caches successful conversions in Upstash Redis for extreme speed. |
| 📸 **Dynamic OG Images** | Beautiful, dynamically generated social sharing cards via `@vercel/og`. |
| 👁 **Preview / Code toggle** | Preview renders cards visually; Code shows raw markdown. |
| 📥 **Smart download** | Export as Markdown (`.md`), CSV, or JSON. |
| 🔒 **Private support** | Cookie-based auth with a step-by-step extraction guide. |
| 📋 **Notion export** | Switch to Notion mode for copy-paste-ready markdown with thumbnails. |

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

- Uses YouTube's internal (undocumented) API — may break if YouTube changes their page structure (though recursive search mitigates this).
- Descriptions are not fetched (intentionally — not needed for a todo tracker).
- Private playlists require manual cookie extraction.

---

## 🙏 Credits

- **Original project:** [thefcraft/youtube-playlist-to-obsidian-cards](https://github.com/thefcraft/youtube-playlist-to-obsidian-cards) — the core scraping & parsing logic
- **Fork / Web UI:** [giiibb/obsiditube](https://github.com/giiibb/obsiditube)

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
