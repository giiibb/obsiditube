"use client";

import { ExternalLink } from "lucide-react";

interface NotionCard {
  index: number;
  title: string;
  videoId: string;
  playlistId: string;
  thumbnailUrl: string;
  videoUrl: string;
}

function parseNotionCards(notion: string): NotionCard[] {
  if (!notion.trim()) return [];
  // Each card block is separated by \n\n
  // Format:
  //   ![Title](thumb_url)
  //   - [ ] [N. **Title**](video_url)
  const blocks = notion.split("\n\n");
  const cards: NotionCard[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Parse image line: ![title](url)
    const imgMatch = lines[0].match(/^!\[(.*?)\]\((.+?)\)$/);
    // Parse checkbox line: - [ ] [N. **title** (meta)](url)
    const cbMatch = lines[1].match(/^- \[ \] \[(?:.*?)?(\d+)\.\s*(.*?)\s*\]\((.+?)\)$/);

    if (!imgMatch || !cbMatch) continue;

    const thumbUrl = imgMatch[2];
    const index = parseInt(cbMatch[1], 10);
    // Clean up title (remove markdown bolding if present)
    const title = cbMatch[2].replace(/\*\*/g, "").replace(/\\\[/g, "[").replace(/\\\]/g, "]");
    const videoUrl = cbMatch[3];

    // Extract video ID from thumbnail URL: .../vi/VIDEO_ID/hqdefault.jpg
    const vidMatch = thumbUrl.match(/\/vi\/([^/]+)\//);
    const videoId = vidMatch ? vidMatch[1] : "";
    // Extract playlist ID from video URL
    const plMatch = videoUrl.match(/[?&]list=([^&]+)/);
    const playlistId = plMatch ? plMatch[1] : "";

    cards.push({ index, title, videoId, playlistId, thumbnailUrl: thumbUrl, videoUrl });
  }
  return cards;
}

interface NotionCardPreviewProps {
  notion: string;
}

export function NotionCardPreview({ notion }: NotionCardPreviewProps) {
  const cards = parseNotionCards(notion);

  if (cards.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground text-center opacity-50">
        No cards to preview.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-3 pb-12">
      {/* Notion-style header hint */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-5 h-5 flex-shrink-0">
          {/* Notion "N" logo simplified */}
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect width="24" height="24" rx="4" fill="white" />
            <path
              d="M5 5.5C5 5.22 5.22 5 5.5 5H14.5L19 9.5V18.5C19 18.78 18.78 19 18.5 19H5.5C5.22 19 5 18.78 5 18.5V5.5Z"
              fill="#191919"
            />
            <path d="M14 5V10H19" stroke="white" strokeWidth="1.5" />
            <path d="M8.5 13H15.5M8.5 16H13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xs text-muted-foreground/60 font-medium">
          Notion preview — paste into any Notion page
        </span>
      </div>

      {cards.map((card) => (
        <a
          key={card.index}
          href={card.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="group block rounded-lg overflow-hidden border border-white/8 bg-[#1a1a1a] hover:border-white/20 transition-all hover:bg-[#202020] hover:shadow-lg"
        >
          {/* Thumbnail */}
          <div className="relative w-full aspect-video bg-black overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.thumbnailUrl}
              alt={card.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card footer — Notion-style to-do row */}
          <div className="flex items-start gap-2.5 px-3 py-2.5">
            {/* Checkbox (decorative — not interactive in preview) */}
            <div className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border border-white/25 bg-transparent" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                <span className="text-white/40 mr-1.5 font-normal">{card.index}.</span>
                {card.title}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-white/20 group-hover:text-white/50 transition-colors mt-0.5" />
          </div>
        </a>
      ))}
    </div>
  );
}
