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
  if (!url || !token) return false;
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
  } catch { return false; }
}

function buildHeaders(extraCookies?: string | null): Record<string, string> {
  const cookie = extraCookies ? `${CONSENT_COOKIES}; ${extraCookies}` : CONSENT_COOKIES;
  return { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8", Cookie: cookie };
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

function makeNotionCard(playlistId: string, index: number, videoId: string, title: string, duration: string = ""): string {
  const url = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}`;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const t = title.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  const meta = duration ? ` (${duration})` : "";
  return `![${t}](${thumb})\n- [ ] [**${index}. ${t}**${meta}](${url})`;
}

function generateYamlProperties(meta: any): string {
  return [
    "---",
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `author: "${meta.author.replace(/"/g, '\\"')}"`,
    `video_count: ${meta.video_count}`,
    `view_count: "${meta.view_count}"`,
    `last_updated: "${meta.last_updated}"`,
    `description: "${meta.description.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
    `playlist_url: "https://www.youtube.com/playlist?list=${meta.id}"`,
    "---"
  ].join("\n");
}

async function fetchContinuation(
  playlistId: string, token: string, startIndex: number, isPro: boolean, cookies?: string | null
): Promise<{ videos: VideoInfo[], truncated: boolean }> {
  const resp = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
    method: "POST",
    headers: { ...buildHeaders(cookies), "Content-Type": "application/json" },
    body: JSON.stringify({ context: { client: { userAgent: USER_AGENT, clientName: "WEB", clientVersion: "2.20260206.08.00" } }, continuation: token }),
  });
  if (!resp.ok) return { videos: [], truncated: true };
  const data = await resp.json();
  const continuationItems = data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems;
  if (!Array.isArray(continuationItems)) return { videos: [], truncated: false };
  const videos: VideoInfo[] = [];
  let idx = startIndex;
  let truncated = false;
  for (const item of continuationItems) {
    if (!isPro && idx > FREE_TIER_LIMIT) { truncated = true; break; }
    if (item.continuationItemRenderer) {
      if (!isPro) { truncated = true; break; }
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

interface VideoInfo { videoId: string; title: string; index: number; }

export async function POST(request: NextRequest) {
  const { url, cookies } = await request.json();
  const licenseKey = request.headers.get("X-License-Key");
  const isPro = await verifyLicenseKey(licenseKey);

  const playlistId = new URL(url).searchParams.get("list") || "";
  const resp = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, { headers: buildHeaders(cookies) });
  const html = await resp.text();
  
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  const jsonStart = start + marker.length;
  const scriptEnd = html.indexOf("</script>", jsonStart);
  let jsonStr = html.slice(jsonStart, scriptEnd).trim();
  if (jsonStr.endsWith(";")) jsonStr = jsonStr.slice(0, -1);
  const data = JSON.parse(jsonStr);

  const title = data?.metadata?.playlistMetadataRenderer?.title ?? "";
  const author = data?.header?.playlistHeaderRenderer?.ownerText?.runs?.[0]?.text ?? "";
  
  const sidebar = data?.sidebar?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer;
  const description = sidebar?.description?.simpleText ?? "";
  const stats = sidebar?.stats ?? [];
  const videoCountText = stats[0]?.runs?.[0]?.text ?? "0";
  const viewCount = stats[1]?.simpleText ?? "";
  const lastUpdated = stats[2]?.runs ? stats[2].runs.map((r:any)=>r.text).join("") : "";

  const playlistMetadata = {
    id: playlistId, title, author, description,
    video_count: parseInt(videoCountText.replace(/\D/g, '') || "0"),
    view_count: viewCount, last_updated: lastUpdated
  };

  const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents ?? [];

  const cards: string[] = [];
  const notionCards: string[] = [];
  let videoIndex = 1;
  let truncated = false;

  for (const item of contents) {
    if (!isPro && videoIndex > FREE_TIER_LIMIT) { truncated = true; break; }
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
      const duration = pvr.lengthText?.simpleText ?? "";
      const v_stats = pvr.videoInfo?.runs ?? [];
      const v_views = v_stats[0]?.text ?? "";
      const v_date = v_stats[2]?.text ?? "";

      cards.push(makeCard(playlistId, videoIndex, pvr.videoId, pvr.title?.runs?.[0]?.text ?? "", duration, v_views, v_date));
      notionCards.push(makeNotionCard(playlistId, videoIndex, pvr.videoId, pvr.title?.runs?.[0]?.text ?? "", duration));
      videoIndex++;
    }
  }

  return NextResponse.json({
    markdown: generateYamlProperties(playlistMetadata) + "\n\n" + cards.join("\n"),
    notion: notionCards.join("\n\n"),
    title, author,
    total_count: playlistMetadata.video_count,
    truncated: truncated || (playlistMetadata.video_count > FREE_TIER_LIMIT && !isPro)
  });
}
