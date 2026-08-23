// Fetches the latest long-form videos from the channel WITHOUT a YouTube API key.
//
// How it works:
//   1. Resolve the channel ID from the @handle (or use YOUTUBE_CHANNEL_ID env).
//   2. Read the public RSS feed of uploads (no key required).
//   3. The RSS feed has no duration, so we read it from the watch page
//      ("lengthSeconds" in the embedded player JSON) and drop anything under
//      MIN_DURATION_SECONDS — that excludes Shorts AND short normal videos.
//      (The old /shorts/<id> probe is gone: YouTube now answers 302 for
//      Shorts and normal videos alike, so it stopped detecting anything.)
//   4. A video whose duration can't be read is NOT shown — the requirement is
//      "no short videos ever"; durations are cached a day, so a transient
//      fetch failure only hides a video until the next revalidation.
//
// Results are cached/revalidated, so a new upload appears automatically.

const REVALIDATE_SECONDS = 1800; // 30 min
const MIN_DURATION_SECONDS = 300; // vídeos de menos de 5 min no se muestran en la home
const HANDLE = process.env.YOUTUBE_HANDLE || "AdelinBTC";
// youtube.com no es una API pensada para esto — si tarda, no debe bloquear
// la home entera. Cortamos cada llamada individual a los 2.5s.
const FETCH_TIMEOUT_MS = 2500;
// Las páginas /watch pesan ~1.2MB: con el timeout corto y varias en paralelo
// se abortaban todas. Van con su propio margen y en tandas pequeñas.
const WATCH_FETCH_TIMEOUT_MS = 8000;
const WATCH_CONCURRENCY = 4;

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

/**
 * ID del canal de AdelinBTC.
 *
 * Está escrito aquí a propósito. Antes se deducía raspando
 * youtube.com/@AdelinBTC, pero YouTube responde a esa página con un 302 vacío
 * cuando la petición sale de un centro de datos como los de Vercel: en
 * producción no se resolvía nunca, getLatestVideos se rendía antes de llegar
 * al RSS y ni la home mostraba vídeos ni el bot los anunciaba — todo ello sin
 * un solo error en los registros.
 *
 * El RSS, en cambio, sí responde con normalidad. Sólo hacía falta no depender
 * del raspado para llegar hasta él. Un id de canal no cambia nunca.
 */
const CHANNEL_ID_POR_DEFECTO = "UCdaEzt5YZUfBcOedOonfniw";

async function resolveChannelId(): Promise<string | null> {
  if (process.env.YOUTUBE_CHANNEL_ID) return process.env.YOUTUBE_CHANNEL_ID;
  try {
    const res = await fetch(`https://www.youtube.com/@${HANDLE}`, {
      next: { revalidate: 86400 }, // channel id never changes — cache a day
      headers: { "Accept-Language": "es" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const html = await res.text();
    const m =
      html.match(/"channelId":"(UC[0-9A-Za-z_-]{20,})"/) ||
      html.match(/channel\/(UC[0-9A-Za-z_-]{20,})/);
    // Si el raspado falla (lo habitual en producción), se sigue adelante con
    // el id conocido en vez de devolver null y quedarse sin vídeos.
    return m ? m[1] : CHANNEL_ID_POR_DEFECTO;
  } catch {
    return CHANNEL_ID_POR_DEFECTO;
  }
}

// La duración de un vídeo publicado no cambia — cache larga (1 día) para que
// los misses solo cuesten una vez por vídeo nuevo.
async function getDurationSeconds(id: string): Promise<number | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      next: { revalidate: 86400 },
      headers: { "Accept-Language": "es" },
      signal: AbortSignal.timeout(WATCH_FETCH_TIMEOUT_MS),
    });
    const html = await res.text();
    const m = html.match(/"lengthSeconds":"(\d+)"/);
    return m ? parseInt(m[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * @param sinCache salta la caché de 30 minutos del feed. Lo usa el botón de
 *   "Anunciar novedades": ahí se acaba de publicar el vídeo y servir una copia
 *   de hace media hora haría que el botón no encontrara nada, que es justo lo
 *   contrario de para lo que existe. La home sí usa la caché: no necesita ver
 *   un vídeo al segundo de subirlo y así no castiga a youtube.com.
 */
export async function getLatestVideos(limit = 3, sinCache = false): Promise<YouTubeVideo[]> {
  const channelId = await resolveChannelId();
  if (!channelId) return [];

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      {
        ...(sinCache
          ? { cache: "no-store" as const }
          : { next: { revalidate: REVALIDATE_SECONDS } }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
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

    // Keep only videos of MIN_DURATION_SECONDS or more, newest first.
    // Tandas pequeñas con corte anticipado: en cuanto hay `limit` vídeos
    // largos se deja de pedir a youtube.com. El orden (más nuevo primero)
    // se conserva porque las tandas recorren `parsed` en orden.
    const result: YouTubeVideo[] = [];
    for (let i = 0; i < parsed.length && result.length < limit; i += WATCH_CONCURRENCY) {
      const chunk = parsed.slice(i, i + WATCH_CONCURRENCY);
      const durations = await Promise.all(chunk.map((v) => getDurationSeconds(v.id)));
      for (let j = 0; j < chunk.length && result.length < limit; j++) {
        const d = durations[j];
        if (d != null && d >= MIN_DURATION_SECONDS) result.push(chunk[j]);
      }
    }
    return result;
  } catch {
    return [];
  }
}
