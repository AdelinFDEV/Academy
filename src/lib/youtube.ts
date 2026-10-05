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

/** Convierte la duración ISO 8601 de la API oficial (PT11M54S) a segundos. */
function iso8601ASegundos(duracion: string): number | null {
  const m = duracion.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
}

/**
 * Duraciones de varios vídeos con la API oficial: UNA sola petición para
 * todos, y la respuesta son unos cientos de bytes.
 *
 * Solo se usa si hay YOUTUBE_API_KEY. Merece mucho la pena ponerla: la cuota
 * gratuita (10.000 unidades al día) sobra de largo para esto, porque cada
 * consulta cuesta 1 unidad independientemente de cuántos vídeos lleve.
 */
async function duracionesPorApi(ids: string[]): Promise<Map<string, number> | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  try {
    const url =
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails` +
      `&id=${ids.join(",")}&key=${key}`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      items?: { id: string; contentDetails?: { duration?: string } }[];
    };

    const mapa = new Map<string, number>();
    for (const item of json.items ?? []) {
      const segundos = iso8601ASegundos(item.contentDetails?.duration ?? "");
      if (segundos !== null) mapa.set(item.id, segundos);
    }
    return mapa;
  } catch {
    return null;
  }
}

/**
 * Duración leyendo la página del vídeo, cuando no hay clave de API.
 *
 * Se lee el cuerpo por trozos y se corta en cuanto aparece el dato, en vez de
 * descargar el documento entero: la página pesa 1,2 MB y "lengthSeconds" está
 * pasada la mitad, así que esperar al final significaba descargar casi el
 * doble de lo necesario — y con varias en paralelo era la vía rápida a agotar
 * el tiempo límite en un servidor sin ancho de banda de sobra.
 */
async function duracionRaspando(id: string): Promise<number | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      next: { revalidate: 86400 },
      headers: {
        "Accept-Language": "es",
        // Sin cabecera de navegador, YouTube trata la petición de forma
        // distinta y a veces devuelve una página sin los datos del reproductor.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(WATCH_FETCH_TIMEOUT_MS),
    });

    if (!res.body) return null;

    const lector = res.body.getReader();
    const decodificador = new TextDecoder();
    let acumulado = "";

    try {
      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += decodificador.decode(value, { stream: true });

        const m = acumulado.match(/"lengthSeconds":"(\d+)"/);
        if (m) return parseInt(m[1], 10);

        // No hace falta guardar todo lo leído: basta con conservar el final
        // por si el dato quedó partido entre dos trozos.
        if (acumulado.length > 200_000) acumulado = acumulado.slice(-1000);
      }
    } finally {
      await lector.cancel().catch(() => {});
    }
    return null;
  } catch {
    return null;
  }
}

/** Duraciones de un lote de vídeos, por la vía que esté disponible. */
async function getDuraciones(ids: string[]): Promise<Map<string, number>> {
  const porApi = await duracionesPorApi(ids);
  if (porApi) return porApi;

  const mapa = new Map<string, number>();
  for (let i = 0; i < ids.length; i += WATCH_CONCURRENCY) {
    const lote = ids.slice(i, i + WATCH_CONCURRENCY);
    const resultados = await Promise.all(lote.map((id) => duracionRaspando(id)));
    lote.forEach((id, j) => {
      const d = resultados[j];
      if (d !== null) mapa.set(id, d);
    });
  }
  return mapa;
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

    // Solo los vídeos de MIN_DURATION_SECONDS o más, del más nuevo al más
    // antiguo. Se miran los primeros candidatos y no el feed entero: con
    // pedir el doble del límite sobra para descartar algún Short.
    const candidatos = parsed.slice(0, Math.max(limit * 2, 6));
    const duraciones = await getDuraciones(candidatos.map((v) => v.id));

    if (duraciones.size === 0 && candidatos.length > 0) {
      // Que no se pueda leer NINGUNA duración no es que no haya vídeos: es que
      // algo falla al consultarlas. Sin este aviso el fallo era invisible —
      // la home simplemente aparecía sin vídeos y nadie sabía por qué.
      console.error(
        "[youtube] No se pudo leer la duración de ningún vídeo. " +
          "Define YOUTUBE_API_KEY para dejar de depender del raspado."
      );
    }

    return candidatos
      .filter((v) => (duraciones.get(v.id) ?? 0) >= MIN_DURATION_SECONDS)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Suscriptores del canal, con la API oficial. Sin YOUTUBE_API_KEY, null.
 *
 * YouTube redondea la cifra pública (1.234 sale como 1.230 a partir de mil),
 * así que sirve para ver la tendencia, no para contar de uno en uno. Lo usa la
 * foto diaria de /admin/objetivos (fotografiarYoutube).
 */
export async function getSubscriberCount(): Promise<number | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const channelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID_POR_DEFECTO;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`,
      { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: { statistics?: { subscriberCount?: string } }[] };
    const total = Number(json.items?.[0]?.statistics?.subscriberCount);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

export interface VideoSubido extends YouTubeVideo {
  /** Duración en segundos; null si no se pudo leer. */
  segundos: number | null;
}

/** Hasta este tamaño cuenta como Short (YouTube los admite de hasta 3 minutos). */
export const SEGUNDOS_SHORT = 180;

/**
 * Todo lo subido al canal entre dos instantes —vídeos largos y Shorts—, con
 * título y duración. Lo usa el resumen mensual de /admin/objetivos/crecimiento.
 *
 * Recorre la lista de subidas del canal (playlistItems, de la más nueva a la
 * más antigua) hasta pasar `desde`, y pide las duraciones en una sola
 * consulta por cada 50 vídeos. Cuesta 1 unidad de cuota por página: un mes
 * normal son 2 o 3 unidades de las 10.000 diarias.
 *
 * Sin YOUTUBE_API_KEY, o si la API falla, devuelve null: quien llama decide
 * qué enseñar en su lugar.
 */
export async function getSubidasEntre(desde: Date, hasta: Date): Promise<VideoSubido[] | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const channelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID_POR_DEFECTO;
  // La lista de subidas de un canal es su id con «UU» en vez de «UC».
  const subidas = `UU${channelId.slice(2)}`;

  try {
    const encontrados: YouTubeVideo[] = [];
    let pagina: string | undefined;
    for (let vuelta = 0; vuelta < 12; vuelta++) {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50` +
        `&playlistId=${subidas}&key=${key}${pagina ? `&pageToken=${pagina}` : ""}`;
      const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(WATCH_FETCH_TIMEOUT_MS) });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        nextPageToken?: string;
        items?: {
          snippet?: { title?: string; thumbnails?: { medium?: { url?: string }; high?: { url?: string } } };
          contentDetails?: { videoId?: string; videoPublishedAt?: string };
        }[];
      };
      let pasado = false;
      for (const item of json.items ?? []) {
        const id = item.contentDetails?.videoId;
        const publicado = item.contentDetails?.videoPublishedAt;
        // Los privados o programados aún no tienen fecha de publicación.
        if (!id || !publicado) continue;
        const t = Date.parse(publicado);
        if (t < desde.getTime()) {
          pasado = true;
          continue;
        }
        if (t >= hasta.getTime()) continue;
        encontrados.push({
          id,
          title: item.snippet?.title ?? "",
          publishedAt: publicado,
          thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        });
      }
      pagina = json.nextPageToken;
      if (pasado || !pagina) break;
    }

    const duraciones = new Map<string, number>();
    for (let i = 0; i < encontrados.length; i += 50) {
      const lote = await duracionesPorApi(encontrados.slice(i, i + 50).map((v) => v.id));
      for (const [id, s] of lote ?? []) duraciones.set(id, s);
    }
    return encontrados
      .map((v) => ({ ...v, segundos: duraciones.get(v.id) ?? null }))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  } catch {
    return null;
  }
}
