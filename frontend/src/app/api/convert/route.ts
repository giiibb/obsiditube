/**
 * ObsidiTube — /api/convert  (Next.js App Router)
 * ================================================
 * Replicates the Python FastAPI backend entirely in TypeScript.
 */

import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

const CONSENT_COOKIES =
  "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnSmgY; " +
  "CONSENT=PENDING+987";

const FREE_TIER_LIMIT = 10;
const CACHE_TTL = 3600; // 1 hour

// ─── Helpers ───────────────────────────────────────────────────────────────

async function verifyLicenseKey(key: string | null): Promise<boolean> {
  if (!key || key.length < 8) return false;
  try {
    const payload = await redis.get<any>(`license:${key}`);
    return payload?.status === 'active';
  } catch (e) {
    console.error("License validation error:", e);
    return false;
  }
}

function buildHeaders(extraCookies?: string | null): Record<string, string> {
  const cookie = extraCookies ? `${CONSENT_COOKIES}; ${extraCookies}` : CONSENT_COOKIES;
  return {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    Cookie: cookie,
  };
}

function makeCard(playlistId: string, index: number, videoId: string, title: string, duration: string = "", views: string = "", date: string = ""): string {
  const t = title.replace(/"/g, '\\"');
  let meta = [];
  if (duration) meta.push(`**${duration}**`);
  if (views) meta.push(views);
  if (date) meta.push(date);
  const metaStr = meta.join(" • ");
  const prefix = metaStr ? `${index}. [ ] ${metaStr} ` : `${index}. [ ] `;
  return `${prefix}**"${t}"**\n\`\`\`cardlink\nurl: https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}\ntitle: "${t}"\nhost: www.youtube.com\nfavicon: https://m.youtube.com/static/favicon.ico\nimage: https://i.ytimg.com/vi/${videoId}/hqdefault.jpg\n\`\`\``;
}

function makeNotionCard(playlistId: string, index: number, videoId: string, title: string, duration: string = "", views: string = "", date: string = ""): string {
  const url = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}`;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const t = title.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  const meta = duration ? ` (${duration})` : "";
  return `![${t}](${thumb})\n- [ ] [**${index}. {t}**${meta}](${url})`;
}

function generateYamlProperties(meta: any): string {
  return [
    "---",
    `title: "${(meta.title || "").replace(/"/g, '\\"')}"`,
    `author: "${(meta.author || "").replace(/"/g, '\\"')}"`,
    `video_count: ${meta.video_count || 0}`,
    `view_count: "${meta.view_count || ""}"`,
    `last_updated: "${meta.last_updated || ""}"`,
    `description: "${(meta.description || "").replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
    `playlist_url: "https://www.youtube.com/playlist?list=${meta.id || ""}"`,
    "---"
  ].join("\n");
}

/**
 * Resiliently finds the playlist videos list in the nested JSON structure.
 */
function findContents(data: any): any[] {
  if (!data || typeof data !== 'object') return [];

  // 1. Try known paths
  const paths = [
    data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents,
    data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents,
    data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.richGridRenderer?.contents
  ];

  for (const p of paths) {
    if (Array.isArray(p) && p.length > 0) return p;
  }

  // 2. Recursive search for ANY array that contains objects with 'playlistVideoRenderer'
  let foundArray: any[] | null = null;

  function walk(obj: any) {
    if (foundArray || !obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      if (obj.some(item => item?.playlistVideoRenderer || item?.richItemRenderer)) {
        foundArray = obj;
        return;
      }
      for (const item of obj) walk(item);
    } else {
      for (const key in obj) walk(obj[key]);
    }
  }

  // Also check for specific renderer containers if the above didn't find it
  function deepSearchRenderer(obj: any): any[] | null {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.playlistVideoListRenderer?.contents) return obj.playlistVideoListRenderer.contents;
    if (obj.playlistRenderer?.contents) return obj.playlistRenderer.contents;
    
    for (const key in obj) {
      const res = deepSearchRenderer(obj[key]);
      if (res) return res;
    }
    return null;
  }

  walk(data);
  if (Array.isArray(foundArray)) return foundArray;

  return deepSearchRenderer(data) || [];
}

async function fetchContinuation(
  playlistId: string, 
  token: string, 
  startIndex: number, 
  isPro: boolean, 
  cookies?: string | null
): Promise<{ cards: string[], notionCards: string[], nextIndex: number, truncated: boolean }> {
  const resp = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
    method: "POST",
    headers: { ...buildHeaders(cookies), "Content-Type": "application/json" },
    body: JSON.stringify({
      context: { client: { userAgent: USER_AGENT, clientName: "WEB", clientVersion: "2.20260206.08.00" } },
      continuation: token,
    }),
  });
  
  if (!resp.ok) return { cards: [], notionCards: [], nextIndex: startIndex, truncated: true };

  const data = await resp.json();
  const continuationItems = data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems;
  if (!Array.isArray(continuationItems)) return { cards: [], notionCards: [], nextIndex: startIndex, truncated: false };

  const cards: string[] = [];
  const notionCards: string[] = [];
  let idx = startIndex;
  let truncated = false;

  for (const item of continuationItems) {
    if (!isPro && idx > FREE_TIER_LIMIT) {
      truncated = true;
      break;
    }
    
    if (item.continuationItemRenderer) {
      if (!isPro) {
        truncated = true;
        break;
      }
      const nextToken = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      if (nextToken) {
        const more = await fetchContinuation(playlistId, nextToken, idx, isPro, cookies);
        cards.push(...more.cards);
        notionCards.push(...more.notionCards);
        idx = more.nextIndex;
        truncated = more.truncated;
      }
      break;
    } else if (item.playlistVideoRenderer) {
      const pvr = item.playlistVideoRenderer;
      const v_id = pvr.videoId;
      const v_title = pvr.title?.runs?.[0]?.text ?? "";
      const v_dur = pvr.lengthText?.simpleText ?? "";
      const v_stats = pvr.videoInfo?.runs ?? [];
      const v_views = v_stats[0]?.text ?? "";
      const v_date = v_stats[2]?.text ?? "";

      cards.push(makeCard(playlistId, idx, v_id, v_title, v_dur, v_views, v_date));
      notionCards.push(makeNotionCard(playlistId, idx, v_id, v_title, v_dur, v_views, v_date));
      idx++;
    }
  }
  return { cards, notionCards, nextIndex: idx, truncated };
}

export async function POST(request: NextRequest) {
  try {
    const { url, cookies } = await request.json();
    const licenseKey = request.headers.get("X-License-Key");
    const isPro = await verifyLicenseKey(licenseKey);

    const playlistId = new URL(url).searchParams.get("list");
    if (!playlistId) return NextResponse.json({ detail: "Invalid URL" }, { status: 400 });

    // ─── Cache Check ────────────────────────────────────────────────────────
    const cacheKey = `playlist:${playlistId}:${isPro ? 'pro' : 'free'}:${cookies ? 'auth' : 'public'}`;
    const cached = await redis.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let resp;
    try {
      resp = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, { 
        headers: buildHeaders(cookies),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ detail: "YouTube request timed out. The playlist might be too large or YouTube is slow." }, { status: 504 });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }
      
    if (!resp.ok) return NextResponse.json({ detail: "YouTube request failed" }, { status: 400 });
      
      const html = await resp.text();
      const marker = "var ytInitialData = ";
      const start = html.indexOf(marker);
      if (start === -1) {
        return NextResponse.json({ detail: "YouTube data not found. Try providing cookies for restricted playlists." }, { status: 400 });
      }
      const jsonStart = start + marker.length;
      const scriptEnd = html.indexOf("</script>", jsonStart);
      let jsonStr = html.slice(jsonStart, scriptEnd).trim();
      if (jsonStr.endsWith(";")) jsonStr = jsonStr.slice(0, -1);
      
      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (parseErr) {
        return NextResponse.json({ detail: "Failed to parse YouTube data structure." }, { status: 500 });
      }

    const title = data?.metadata?.playlistMetadataRenderer?.title ?? 
                  data?.header?.playlistHeaderRenderer?.title?.simpleText ?? 
                  data?.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text ?? "";
    const author = data?.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ?? 
                   data?.sidebar?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer?.ownerText?.runs?.[0]?.text ?? "";
    
    const sidebar = data?.sidebar?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer;
    const description = sidebar?.description?.simpleText ?? data?.metadata?.playlistMetadataRenderer?.description ?? "";
    const stats = sidebar?.stats ?? [];
    const videoCountText = stats[0]?.runs?.[0]?.text ?? stats[0]?.simpleText ?? "0";
    const viewCount = stats[1]?.simpleText ?? stats[1]?.simpleText ?? "";
    
    let lastUpdated = "";
    for (const s of stats) {
      const runs = s.runs || [];
      const fullText = runs.map((r: any) => r.text).join("");
      if (fullText.includes("Updated")) {
        lastUpdated = fullText;
        break;
      }
    }

    const playlistMetadata = {
      id: playlistId, title, author, description,
      video_count: parseInt(videoCountText.replace(/\D/g, '') || "0"),
      view_count: viewCount, last_updated: lastUpdated
    };

    const contents = findContents(data);

    const cards: string[] = [];
    const notionCards: string[] = [];
    let videoIndex = 1;
    let truncated = false;

    for (const item of contents) {
      if (!isPro && videoIndex > FREE_TIER_LIMIT) {
        truncated = true;
        break;
      }

      // Handle both standard playlist items and rich grid items
      const videoData = item.playlistVideoRenderer || item.richItemRenderer?.content?.videoRenderer;

      if (item.continuationItemRenderer) {
        if (!isPro) { truncated = true; break; }
        const tok = item.continuationItemRenderer?.continuationEndpoint?.commandExecutorCommand?.commands?.find((c: any) => c.continuationCommand)?.continuationCommand?.token || 
                    item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        if (tok) {
          const more = await fetchContinuation(playlistId, tok, videoIndex, isPro, cookies);
          cards.push(...more.cards);
          notionCards.push(...more.notionCards);
          videoIndex = more.nextIndex;
          truncated = more.truncated;
        }
      } else if (videoData) {
        const v_id = videoData.videoId;
        const v_title = videoData.title?.runs?.[0]?.text ?? videoData.title?.simpleText ?? "";
        const duration = videoData.lengthText?.simpleText ?? "";
        const v_stats = videoData.videoInfo?.runs ?? [];
        const v_views = v_stats[0]?.text ?? "";
        const v_date = v_stats[2]?.text ?? "";

        cards.push(makeCard(playlistId, videoIndex, v_id, v_title, duration, v_views, v_date));
        notionCards.push(makeNotionCard(playlistId, videoIndex, v_id, v_title, duration, v_views, v_date));
        videoIndex++;
      }
    }

    const result = {
      markdown: generateYamlProperties(playlistMetadata) + "\n\n" + cards.join("\n"),
      notion: notionCards.join("\n\n"),
      title, author,
      total_count: playlistMetadata.video_count,
      truncated: truncated || (playlistMetadata.video_count > FREE_TIER_LIMIT && !isPro)
    };

    // ─── Save to Cache ──────────────────────────────────────────────────────
    try {
      await redis.set(cacheKey, result, { ex: CACHE_TTL });
    } catch (cacheErr) {
      console.warn("Failed to save to cache:", cacheErr);
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Vercel route error:", e);
    return NextResponse.json({ detail: e.message || "Internal Server Error" }, { status: 500 });
  }
}
