"use client";

interface CardData {
  index: number;
  title: string;
  url: string;
  host: string;
  favicon: string;
  image: string;
}

function parseCards(markdown: string): CardData[] {
  const cards: CardData[] = [];
  // Updated regex to support metadata like duration/views before the title
  const cardlinkRegex =
    /(\d+)\.\s*\[\s*\]\s*(?:.*?)?(\*\*)?"(.+?)"\2\s*```cardlink\s*([\s\S]*?)```/g;

  let match;
  while ((match = cardlinkRegex.exec(markdown)) !== null) {
    const index = parseInt(match[1], 10);
    const title = match[3];
    const body = match[4];

    const get = (key: string) => {
      const m = body.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim().replace(/^"|"$/g, "") : "";
    };

    cards.push({
      index,
      title: get("title") || title,
      url: get("url"),
      host: get("host"),
      favicon: get("favicon"),
      image: get("image"),
    });
  }
  return cards;
}

export function ObsidianCardPreview({ markdown }: { markdown: string }) {
  const cards = parseCards(markdown);

  if (cards.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">
        No cards found in output.
      </p>
    );
  }

  return (
    <div className="space-y-3 p-4 md:p-5">
      {cards.map((card) => (
        <a
          key={card.index}
          href={card.url}
          target="_blank"
          rel="noreferrer"
          className="group flex rounded-xl border border-white/8 bg-[#141414] hover:bg-[#1a1a1a] hover:border-primary/30 transition-all duration-150 overflow-hidden shadow-sm hover:shadow-primary/10 hover:shadow-md no-underline"
        >
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-40 sm:w-48 bg-black">
            {card.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-[#111] text-muted-foreground text-xs">
                No thumbnail
              </div>
            )}
            {/* Index badge */}
            <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              #{card.index}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between flex-1 px-4 py-3 min-w-0">
            <div>
              {/* Checkbox row */}
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 h-4 w-4 rounded border border-white/20 flex-shrink-0 flex items-center justify-center bg-black/30">
                  {/* empty checkbox */}
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {card.title}
                </p>
              </div>
            </div>

            {/* Host row */}
            <div className="flex items-center gap-1.5 mt-3">
              {card.favicon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.favicon}
                  alt=""
                  width={12}
                  height={12}
                  className="rounded-sm opacity-70"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="text-[11px] text-muted-foreground truncate">
                {card.host || "www.youtube.com"}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
