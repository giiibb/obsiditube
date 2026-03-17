# ObsidiTube Project Context

## Project Overview
ObsidiTube is a full-stack application and CLI tool designed to convert YouTube playlists into organized Obsidian `cardlink` checklists or Notion-compatible markdown. It automates the process of creating "todo" items for video playlists, complete with rich link previews and thumbnails.

### Key Features
- **Obsidian Integration:** Generates `cardlink` blocks compatible with the [Auto Card Link](https://github.com/nekoshita/obsidian-auto-card-link) plugin.
- **Notion Export:** Provides markdown optimized for Notion with embedded thumbnails and checkboxes.
- **Hybrid Architecture:** Features a FastAPI backend for local development and a duplicate TypeScript implementation in Next.js for seamless Vercel deployment.
- **Private Playlist Support:** Allows users to provide cookie headers to scrape their own private playlists.
- **Smart Detection:** Frontend automatically detects YouTube URLs from the clipboard.

## Tech Stack
- **Backend (Python):** FastAPI, Uvicorn, Typer (CLI), Requests.
- **Backend (Node.js/Next.js):** TypeScript implementation of the scraping logic for Vercel Edge/Serverless compatibility.
- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, Shadcn UI, React Markdown, Lucide Icons.
- **Environment Management:** [uv](https://github.com/astral-sh/uv) for Python, npm for Node.js.

## Architecture & Key Files
- `api.py`: FastAPI server exposing `/api/convert`.
- `main.py`: The original CLI entry point.
- `dev.py`: A launcher script that runs both the Python backend and Next.js frontend concurrently.
- `src/`: Core Python logic:
    - `parser.py`: Custom byte-level HTML parser to extract `ytInitialData` JSON without heavy dependencies.
    - `fetch.py`: Handles YouTube's pagination/continuation tokens.
    - `config.py`: HTTP session configuration and headers.
- `frontend/`: Next.js application:
    - `src/app/api/convert/route.ts`: **Critical:** A TypeScript port of the Python scraping logic to allow the app to function fully when deployed on Vercel without a Python runtime.
    - `src/app/page.tsx`: Main dashboard UI.
    - `src/components/ObsidianCardPreview.tsx`: Visual renderer for Obsidian card blocks.

## Building and Running

### Prerequisites
- Python 3.13+ with `uv` installed.
- Node.js 18+.

### Development Setup
1. **Sync Python Environment:**
   ```bash
   uv sync
   ```
2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```
3. **Run Dev Environment (Both Backend & Frontend):**
   ```bash
   uv run python dev.py
   ```
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8000`

### CLI Usage
```bash
uv run main.py "https://www.youtube.com/playlist?list=ID"
```

## Development Conventions
- **Dual Logic Maintenance:** Since the scraping logic exists in both Python (`src/`) and TypeScript (`frontend/src/app/api/convert/route.ts`), any changes to the parsing or formatting logic should be mirrored in both implementations to ensure consistency between local and deployed versions.
- **Direct HTML Parsing:** Avoid adding heavy parsing libraries like BeautifulSoup or Selenium. The project favors lightweight, byte-level searching of the raw HTML response to extract JSON data.
- **CORS:** The FastAPI backend has wide-open CORS to facilitate local development with the Next.js dev server.
- **Styling:** Uses Tailwind CSS v4 with the `@tailwindcss/postcss` plugin. Component styling follows the Shadcn UI pattern.
