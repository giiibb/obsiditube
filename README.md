# ObsidiTube

A beautiful, frictionless web dashboard that seamlessly turns any YouTube playlist into Obsidian “cardlink” blocks so you can manage videos as actionable todos.

Built with a modern stack (**Next.js, FastAPI, Tailwind CSS, Shadcn UI**).

---

## What you get

**ObsidiTube** takes any playlist (public or private) and generates beautifully formatted Markdown:

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

Copy the generated markdown to your Obsidian vault, and the **Auto Card Link** plugin will render rich link previews.

---

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js & npm
- `uv` (for Python dependency management)

### 1. Install Dependencies

**Backend (Python)**:
```bash
uv sync
```

**Frontend (Next.js)**:
```bash
cd frontend
npm install
cd ..
```

### 2. Run the Development Server

A combined dev script is included so you don't have to start the FastAPI and Next.js servers separately:

```bash
uv run python dev.py
```

This will run the FastAPI backend on port `8000` and the Next.js frontend on port `3000` (or the next available port).
Open `http://localhost:3000` in your web browser.

---

## Private Playlists
If you need to convert a private playlist or a "Watch Later" list:
1. Open any YouTube network request in your browser's DevTools.
2. Grab the `cookie` header.
3. In the ObsidiTube UI, click **Advanced options** and paste the cookie string.

---

## Recommended Obsidian Setup
- Install the **Auto Card Link** community plugin.
- Make sure it's enabled and set to render fenced `cardlink` blocks.
- *(Optional)* Checklist plugin for better task UI.
