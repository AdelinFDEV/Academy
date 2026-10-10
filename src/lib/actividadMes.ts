import type { createAdminClient } from "@/lib/supabase/admin";
import { GUIDES } from "@/lib/guides";
import { medianocheRumania } from "@/lib/objetivos";
import { SEGUNDOS_SHORT, getSubidasEntre, type VideoSubido } from "@/lib/youtube";

/**
 * El resumen mensual de actividad de /admin/objetivos/crecimiento: todo lo
 * que se publicó en un mes (hora de Rumanía). Solo servidor.
 *
 * - Vídeos: de la API de YouTube, todos los subidos (largos y Shorts), con
 *   título y duración. Sin clave o si falla, los que anunció el bot (solo
 *   largos y sin título).
 * - Guías: las que anunció el bot ese mes (`content_announcements`), con su
 *   ficha de GUIDES. Las guías son código, no filas: no tienen otra fecha.
 */

type Admin = ReturnType<typeof createAdminClient>;

export type Publicacion = { titulo: string; enlace: string; fecha: string; premium: boolean };

export type ActividadMes = {
  mes: string;
  /** `short`: 3 minutos o menos. Se calcula aquí para que el cliente no importe youtube.ts. */
  videos: (VideoSubido & { short: boolean })[];
  /** De dónde salen los vídeos: la API (completos) o los anuncios del bot (solo largos, sin título). */
  fuenteVideos: "api" | "anuncios";
  guias: Publicacion[];
  anterior: { mes: string; largos: number; shorts: number; guias: number };
};

/** Primer instante del mes y del siguiente, en Rumanía. */
function limites(mes: string): { desde: Date; hasta: Date } {
  const [a, m] = mes.split("-").map(Number);
  const siguiente = new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 7);
  return { desde: medianocheRumania(`${mes}-01`), hasta: medianocheRumania(`${siguiente}-01`) };
}

export function esShort(v: VideoSubido): boolean {
  return v.segundos !== null && v.segundos <= SEGUNDOS_SHORT;
}

function videosDe(admin: Admin, mes: string): Promise<{ videos: VideoSubido[]; fuente: "api" | "anuncios" }> {
  const { desde, hasta } = limites(mes);
  return subidasEntre(admin, desde, hasta);
}

/**
 * Lo subido a YouTube entre dos instantes, del más nuevo al más antiguo. Con
 * la API, todo (largos y Shorts) con su fecha real de publicación; sin ella,
 * lo que anunció el bot, con la fecha del anuncio. Lo usan este resumen y el
 * calendario.
 */
export async function subidasEntre(admin: Admin, desde: Date, hasta: Date): Promise<{ videos: VideoSubido[]; fuente: "api" | "anuncios" }> {
  const api = await getSubidasEntre(desde, hasta);
  if (api) return { videos: api, fuente: "api" };
  const { data } = await admin
    .from("content_announcements")
    .select("ref, announced_at")
    .eq("kind", "video")
    .gte("announced_at", desde.toISOString())
    .lt("announced_at", hasta.toISOString())
    .order("announced_at", { ascending: false });
  return {
    fuente: "anuncios",
    videos: (data ?? []).map((v) => ({
      id: v.ref,
      title: "Vídeo de YouTube",
      publishedAt: v.announced_at,
      thumbnail: `https://i.ytimg.com/vi/${v.ref}/mqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${v.ref}`,
      segundos: null,
      vistas: null,
      likes: null,
    })),
  };
}

async function guiasDe(admin: Admin, mes: string): Promise<Publicacion[]> {
  const { desde, hasta } = limites(mes);
  const { data } = await admin
    .from("content_announcements")
    .select("ref, announced_at")
    .eq("kind", "guia")
    .gte("announced_at", desde.toISOString())
    .lt("announced_at", hasta.toISOString())
    .order("announced_at", { ascending: false });
  return (data ?? []).map((g) => {
    const guia = GUIDES.find((x) => x.slug === g.ref);
    return { titulo: guia?.title ?? g.ref, enlace: `/guias/${g.ref}`, fecha: g.announced_at, premium: guia?.type === "premium" };
  });
}

export async function cargarActividadMes(admin: Admin, mes: string): Promise<ActividadMes> {
  const [a, m] = mes.split("-").map(Number);
  const mesAnterior = new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7);
  const [videos, guias, videosAnt, guiasAnt] = await Promise.all([
    videosDe(admin, mes),
    guiasDe(admin, mes),
    videosDe(admin, mesAnterior),
    guiasDe(admin, mesAnterior),
  ]);
  return {
    mes,
    videos: videos.videos.map((v) => ({ ...v, short: esShort(v) })),
    fuenteVideos: videos.fuente,
    guias,
    anterior: {
      mes: mesAnterior,
      largos: videosAnt.videos.filter((v) => !esShort(v)).length,
      shorts: videosAnt.videos.filter(esShort).length,
      guias: guiasAnt.length,
    },
  };
}
