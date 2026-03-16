/**
 * ObsidiTube — /api/convert  (Next.js App Router)
 * ================================================
 * POST { url: string, cookies?: string }
 * → { markdown, notion, title, author }
 *
 * Replicates the Python FastAPI backend entirely in TypeScript so it runs
 * natively on Vercel's Node.js runtime (no separate Python service needed).
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Config ────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic"; // never cache; always fetch fresh
export const maxDuration = 30; // seconds (Vercel Pro allows up to 300)

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

// Bypasses YouTube's EU consent banner for all requests
const CONSENT_COOKIES =
  "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnSmgY; " +
  "CONSENT=PENDING+987";

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildHeaders(extraCookies?: string | null): Record<string, string> {
  const cookie = extraCookies
    ? `${CONSENT_COOKIES}; ${extraCookies}`
    : CONSENT_COOKIES;
  return {
    "User-Agent": USER_AGENT,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    Cookie: cookie,
  };
}

/** Extract the playlist ID from any youtube.com URL containing list= */
function parsePlaylistId(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL must start with http:// or https://");
  }
  if (!["www.youtube.com", "youtube.com"].includes(parsed.hostname)) {
    throw new Error("URL must be a YouTube URL");
  }
  const listId = parsed.searchParams.get("list");
  if (!listId) {
    throw new Error(
      "URL must contain a playlist ID (add ?list=... or &list=...)"
    );
  }
  return listId;
}

/** Pull ytInitialData JSON out of raw YouTube HTML */
function extractYtInitialData(html: string): Record<string, unknown> {
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("ytInitialData not found in page");

  const jsonStart = start + marker.length;
  const scriptEnd = html.indexOf("</script>", jsonStart);
  if (scriptEnd === -1) throw new Error("Cannot find end of ytInitialData");

  let jsonStr = html.slice(jsonStart, scriptEnd).trim();
  if (jsonStr.endsWith(";")) jsonStr = jsonStr.slice(0, -1);

  return JSON.parse(jsonStr) as Record<string, unknown>;
}

// ─── Card formatters (mirror of Python make_card / make_notion_card) ───────

function makeCard(
  playlistId: string,
  index: number,
  videoId: string,
  title: string
): string {
  const t = title.replace(/"/g, '\\"');
  return (
    `${index}. [ ] **"${t}"**\n` +
    "```cardlink\n" +
    `url: https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}\n` +
    `title: "${t}"\n` +
    `host: www.youtube.com\n` +
    `favicon: https://m.youtube.com/static/favicon.ico\n` +
    `image: https://i.ytimg.com/vi/${videoId}/hqdefault.jpg\n` +
    "```"
  );
}

function makeNotionCard(
  playlistId: string,
  index: number,
  videoId: string,
  title: string
): string {
  const url = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}`;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const t = title.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  return `![${t}](${thumb})\n- [ ] [${index}. **${t}**](${url})`;
}

// ─── Continuation fetcher (handles playlists > ~100 videos) ────────────────

interface VideoInfo {
  videoId: string;
  title: string;
  index: number;
}

async function fetchContinuation(
  playlistId: string,
  token: string,
  startIndex: number,
  cookies?: string | null
): Promise<VideoInfo[]> {
  const resp = await fetch(
    "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false",
    {
      method: "POST",
      headers: {
        ...buildHeaders(cookies),
        "Content-Type": "application/json",
        Referer: `https://www.youtube.com/playlist?list=${playlistId}`,
      },
      body: JSON.stringify({
        context: {
          client: {
            userAgent: USER_AGENT,
            clientName: "WEB",
            clientVersion: "2.20260206.08.00",
            osName: "X11",
            osVersion: "",
            originalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
            screenPixelDensity: 2,
            platform: "DESKTOP",
            clientFormFactor: "UNKNOWN_FORM_FACTOR",
          },
        },
        continuation: token,
      }),
    }
  );
  if (!resp.ok) throw new Error(`Continuation HTTP ${resp.status}`);

  const data = (await resp.json()) as Record<string, unknown>;
  const actions = data?.onResponseReceivedActions as unknown[];
  const items = (
    actions?.[0] as Record<string, unknown>
  )?.appendContinuationItemsAction as Record<string, unknown>;
  const continuationItems = items?.continuationItems as unknown[];

  if (!Array.isArray(continuationItems)) return [];

  const videos: VideoInfo[] = [];
  let idx = startIndex;

  for (const item of continuationItems) {
    const ci = item as Record<string, unknown>;
    if (ci.continuationItemRenderer) {
      // next page
      const nextToken = (
        (
          (ci.continuationItemRenderer as Record<string, unknown>)
            ?.continuationEndpoint as Record<string, unknown>
        )?.continuationCommand as Record<string, unknown>
      )?.token as string;
      if (nextToken) {
        const more = await fetchContinuation(
          playlistId,
          nextToken,
          idx,
          cookies
        );
        videos.push(...more);
        idx += more.length;
      }
      break;
    } else if (ci.playlistVideoRenderer) {
      const pvr = ci.playlistVideoRenderer as Record<string, unknown>;
      const videoId = pvr.videoId as string;
      const title =
        ((pvr.title as Record<string, unknown>)?.runs as { text: string }[])?.[0]
          ?.text ?? "";
      videos.push({ videoId, title, index: idx++ });
    }
  }

  return videos;
}

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse body
  let url: string, cookies: string | null | undefined;
  try {
    ({ url, cookies } = await request.json());
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Validate URL → playlist ID
  let playlistId: string;
  try {
    playlistId = parsePlaylistId(url);
  } catch (e: unknown) {
    return NextResponse.json(
      { detail: e instanceof Error ? e.message : "Invalid URL" },
      { status: 400 }
    );
  }

  // 3. Fetch playlist HTML
  let html: string;
  try {
    const resp = await fetch(
      `https://www.youtube.com/playlist?list=${playlistId}`,
      { headers: buildHeaders(cookies) }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    html = await resp.text();
  } catch (e: unknown) {
    return NextResponse.json(
      {
        detail: `Failed to fetch playlist page: ${e instanceof Error ? e.message : e}`,
      },
      { status: 400 }
    );
  }

  // 4. Extract ytInitialData
  let data: Record<string, unknown>;
  try {
    data = extractYtInitialData(html);
  } catch (e: unknown) {
    return NextResponse.json(
      {
        detail: `Failed to parse page data: ${e instanceof Error ? e.message : e}`,
      },
      { status: 400 }
    );
  }

  // 5. Title
  const title =
    (
      (data?.metadata as Record<string, unknown>)
        ?.playlistMetadataRenderer as Record<string, unknown>
    )?.title as string ?? "";

  // 6. Author (two possible paths)
  let author = "";
  try {
    author =
      (
        (
          (
            (data?.header as Record<string, unknown>)
              ?.playlistHeaderRenderer as Record<string, unknown>
          )?.ownerText as Record<string, unknown>
        )?.runs as { text: string }[]
      )?.[0]?.text ?? "";
  } catch {
    /* ignore */
  }
  if (!author) {
    try {
      const sidebarItems = (
        (
          (data?.sidebar as Record<string, unknown>)
            ?.playlistSidebarRenderer as Record<string, unknown>
        )?.items as Record<string, unknown>[]
      ) ?? [];
      for (const si of sidebarItems) {
        const t = (
          (
            (
              (
                si?.playlistSidebarSecondaryInfoRenderer as Record<
                  string,
                  unknown
                >
              )?.videoOwner as Record<string, unknown>
            )?.videoOwnerRenderer as Record<string, unknown>
          )?.title as Record<string, unknown>
        )?.runs as { text: string }[];
        if (t?.[0]?.text) {
          author = t[0].text;
          break;
        }
      }
    } catch {
      /* ignore */
    }
  }

  // 7. Navigate to video list
  let contents: Record<string, unknown>[];
  try {
    const tabs = (
      (data?.contents as Record<string, unknown>)
        ?.twoColumnBrowseResultsRenderer as Record<string, unknown>
    )?.tabs as Record<string, unknown>[];

    const tab = tabs?.find((t) => t.tabRenderer) ?? tabs?.[0];
    const sectionContents = (
      (tab?.tabRenderer as Record<string, unknown>)?.content as Record<
        string,
        unknown
      >
    )?.sectionListRenderer as Record<string, unknown>;
    const sec = (
      sectionContents?.contents as Record<string, unknown>[]
    )?.find((s) => s.itemSectionRenderer);
    const listContents = (
      sec?.itemSectionRenderer as Record<string, unknown>
    )?.contents as Record<string, unknown>[];
    const pvl = listContents?.find((c) => c.playlistVideoListRenderer);
    contents = (
      (pvl?.playlistVideoListRenderer as Record<string, unknown>)
        ?.contents as Record<string, unknown>[]
    ) ?? [];
  } catch {
    return NextResponse.json(
      {
        detail:
          "Failed to parse playlist contents. Check cookies if this is a private playlist.",
      },
      { status: 400 }
    );
  }

  // 8. Build cards, following continuation tokens
  const cards: string[] = [];
  const notionCards: string[] = [];
  let videoIndex = 1;

  try {
    for (const item of contents) {
      if (item.continuationItemRenderer) {
        // Find the continuation token (nested under commandExecutorCommand)
        const cmds = (
          (
            (item.continuationItemRenderer as Record<string, unknown>)
              ?.continuationEndpoint as Record<string, unknown>
          )?.commandExecutorCommand as Record<string, unknown>
        )?.commands as Record<string, unknown>[];

        const token = cmds
          ?.find((c) => c.continuationCommand)
          ?.continuationCommand as Record<string, unknown>;
        const tok = token?.token as string;

        if (tok) {
          const more = await fetchContinuation(
            playlistId,
            tok,
            videoIndex,
            cookies
          );
          for (const v of more) {
            cards.push(makeCard(playlistId, v.index, v.videoId, v.title));
            notionCards.push(
              makeNotionCard(playlistId, v.index, v.videoId, v.title)
            );
          }
        }
      } else if (item.playlistVideoRenderer) {
        const pvr = item.playlistVideoRenderer as Record<string, unknown>;
        const videoId = pvr.videoId as string;
        const title =
          ((pvr.title as Record<string, unknown>)?.runs as {
            text: string;
          }[])?.[0]?.text ?? "";
        cards.push(makeCard(playlistId, videoIndex, videoId, title));
        notionCards.push(
          makeNotionCard(playlistId, videoIndex, videoId, title)
        );
        videoIndex++;
      }
    }
  } catch (e: unknown) {
    return NextResponse.json(
      {
        detail: `Failed to extract videos: ${e instanceof Error ? e.message : e}`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    markdown: cards.join("\n"),
    notion: notionCards.join("\n\n"),
    title,
    author,
  });
}
