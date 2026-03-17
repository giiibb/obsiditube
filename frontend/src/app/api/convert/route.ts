/**
 * ObsidiTube — /api/convert  (Next.js App Router)
 * ================================================
 * Replicates the Python FastAPI backend entirely in TypeScript.
 */

import { NextRequest, NextResponse } from "next/server";

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

// ─── Helpers ───────────────────────────────────────────────────────────────

async function verifyLicenseKey(key: string | null): Promise<boolean> {
  if (!key || key.length < 8) return false;
  
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    console.warn("KV_REST_API_URL or TOKEN not set. License validation skipped.");
    return false;
  }

  try {
    const res = await fetch(`${url}/get/license:${key}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.result) return false;
    const payload = JSON.parse(data.result);
    return payload.status === 'active';
  } catch (e) {
    console.error("License validation error:", e);
    return false;
  }
}

function buildHeaders(extraCookies?: string | null): Record<string, string> {
  const cookie = extraCookies
    ? `${CONSENT_COOKIES}; ${extraCookies}`
    : CONSENT_COOKIES;
  return {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    Cookie: cookie,
  };
}

function parsePlaylistId(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const listId = parsed.searchParams.get("list");
    if (listId) return listId;
  } catch {}
  throw new Error("Invalid YouTube playlist URL");
}

function extractYtInitialData(html: string): Record<string, unknown> {
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("ytInitialData not found");
  const jsonStart = start + marker.length;
  const scriptEnd = html.indexOf("</script>", jsonStart);
  let jsonStr = html.slice(jsonStart, scriptEnd).trim();
  if (jsonStr.endsWith(";")) jsonStr = jsonStr.slice(0, -1);
  return JSON.parse(jsonStr);
}

function makeCard(playlistId: string, index: number, videoId: string, title: string): string {
  const t = title.replace(/"/g, '\\"');
  return `${index}. [ ] **"${t}"**\n\`\`\`cardlink\nurl: https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}\ntitle: "${t}"\nhost: www.youtube.com\nfavicon: https://m.youtube.com/static/favicon.ico\nimage: https://i.ytimg.com/vi/${videoId}/hqdefault.jpg\n\`\`\``;
}

function makeNotionCard(playlistId: string, index: number, videoId: string, title: string): string {
  const url = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}`;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const t = title.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  return `![${t}](${thumb})\n- [ ] [${index}. **${t}**](${url})`;
}

async function fetchContinuation(
  playlistId: string,
  token: string,
  startIndex: number,
  isPro: boolean,
  cookies?: string | null
): Promise<{ videos: VideoInfo[], truncated: boolean }> {
  const resp = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
    method: "POST",
    headers: { ...buildHeaders(cookies), "Content-Type": "application/json" },
    body: JSON.stringify({
      context: { client: { userAgent: USER_AGENT, clientName: "WEB", clientVersion: "2.20260206.08.00" } },
      continuation: token,
    }),
  });
  if (!resp.ok) return { videos: [], truncated: true };

  const data = await resp.json();
  const continuationItems = data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems;
  if (!Array.isArray(continuationItems)) return { videos: [], truncated: false };

  const videos: VideoInfo[] = [];
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
        videos.push(...more.videos);
        truncated = more.truncated;
      }
      break;
    } else if (item.playlistVideoRenderer) {
      const pvr = item.playlistVideoRenderer;
      videos.push({ videoId: pvr.videoId, title: pvr.title?.runs?.[0]?.text ?? "", index: idx++ });
    }
  }
  return { videos, truncated };
}

interface VideoInfo {
  videoId: string;
  title: string;
  index: number;
}

export async function POST(request: NextRequest) {
  const { url, cookies } = await request.json();
  const licenseKey = request.headers.get("X-License-Key");
  const isPro = await verifyLicenseKey(licenseKey);

  let playlistId: string;
  try { playlistId = parsePlaylistId(url); } catch (e: any) { return NextResponse.json({ detail: e.message }, { status: 400 }); }

  const resp = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, { headers: buildHeaders(cookies) });
  if (!resp.ok) return NextResponse.json({ detail: "YouTube request failed" }, { status: 400 });
  
  const html = await resp.text();
  const data = extractYtInitialData(html);

  const title = (data?.metadata as any)?.playlistMetadataRenderer?.title ?? "";
  let author = (data?.header as any)?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ?? "";

  const contents = (data?.contents as any)?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents ?? [];

  const cards: string[] = [];
  const notionCards: string[] = [];
  let videoIndex = 1;
  let truncated = false;

  for (const item of contents) {
    if (!isPro && videoIndex > FREE_TIER_LIMIT) {
      truncated = true;
      break;
    }

    if (item.continuationItemRenderer) {
      if (!isPro) { truncated = true; break; }
      const tok = item.continuationItemRenderer?.continuationEndpoint?.commandExecutorCommand?.commands?.find((c: any) => c.continuationCommand)?.continuationCommand?.token;
      if (tok) {
        const more = await fetchContinuation(playlistId, tok, videoIndex, isPro, cookies);
        for (const v of more.videos) {
          cards.push(makeCard(playlistId, v.index, v.videoId, v.title));
          notionCards.push(makeNotionCard(playlistId, v.index, v.videoId, v.title));
        }
        videoIndex += more.videos.length;
        truncated = more.truncated;
      }
    } else if (item.playlistVideoRenderer) {
      const pvr = item.playlistVideoRenderer;
      cards.push(makeCard(playlistId, videoIndex, pvr.videoId, pvr.title?.runs?.[0]?.text ?? ""));
      notionCards.push(makeNotionCard(playlistId, videoIndex, pvr.videoId, pvr.title?.runs?.[0]?.text ?? ""));
      videoIndex++;
    }
  }

  // Get total count from sidebar
  let totalCount = videoIndex - 1;
  try {
    const statsText = (data?.sidebar as any)?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer?.stats?.[0]?.runs?.[0]?.text;
    if (statsText) totalCount = parseInt(statsText.replace(/\D/g, ''));
  } catch {}

  return NextResponse.json({
    markdown: cards.join("\n"),
    notion: notionCards.join("\n\n"),
    title,
    author,
    total_count: totalCount,
    truncated: truncated || (totalCount > FREE_TIER_LIMIT && !isPro)
  });
}
