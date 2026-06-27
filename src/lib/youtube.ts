// Fetches the latest long-form videos from the channel WITHOUT a YouTube API key.
//
// How it works:
//   1. Resolve the channel ID from the @handle (or use YOUTUBE_CHANNEL_ID env).
//   2. Read the public RSS feed of uploads (no key required).
//   3. The RSS feed has no duration, so we detect Shorts by probing the
//      /shorts/<id> URL — a real Short serves 200, a normal video redirects.
//   4. Keep only non-Shorts, newest first.
//
// Results are cached/revalidated, so a new upload appears automatically.

const REVALIDATE_SECONDS = 1800; // 30 min
const HANDLE = process.env.YOUTUBE_HANDLE || "AdelinBTC";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

async function resolveChannelId(): Promise<string | null> {
  if (process.env.YOUTUBE_CHANNEL_ID) return process.env.YOUTUBE_CHANNEL_ID;
  try {
    const res = await fetch(`https://www.youtube.com/@${HANDLE}`, {
      next: { revalidate: 86400 }, // channel id never changes — cache a day
      headers: { "Accept-Language": "es" },
    });
    const html = await res.text();
    const m =
      html.match(/"channelId":"(UC[0-9A-Za-z_-]{20,})"/) ||
      html.match(/channel\/(UC[0-9A-Za-z_-]{20,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function isShort(id: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: "HEAD",
      redirect: "manual",
      next: { revalidate: REVALIDATE_SECONDS },
    });
    // A real Short responds 200 on the /shorts/ URL.
    // A normal video redirects (3xx) to the /watch page.
    return res.status === 200;
  } catch {
    return false; // on error, don't drop the video
  }
}

export async function getLatestVideos(limit = 3): Promise<YouTubeVideo[]> {
  const channelId = await resolveChannelId();
  if (!channelId) return [];

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    const xml = await res.text();

    const entries = xml.split("<entry>").slice(1);
    const parsed = entries.map((entry) => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "";
      const title = (entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
      return {
        id,
        title,
        publishedAt,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
      };
    }).filter((v) => v.id);

    // Filter out Shorts, newest first, take the requested amount.
    const longform: YouTubeVideo[] = [];
    for (const video of parsed) {
      if (longform.length >= limit) break;
      if (!(await isShort(video.id))) longform.push(video);
    }

    return longform;
  } catch {
    return [];
  }
}
