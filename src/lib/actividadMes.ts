import type { createAdminClient } from "@/lib/supabase/admin";
import { GUIDES } from "@/lib/guides";
import { medianocheRumania } from "@/lib/objetivos";
import { SEGUNDOS_SHORT, getSubidasEntre, type VideoSubido } from "@/lib/youtube";

/**
 * El resumen mensual de actividad de /admin/objetivos/crecimiento: todo lo
 * que se publicó en un mes (hora de Rumanía). Solo servidor.
 *
 * - Vídeos: de la API de YouTube, todos los subidos (largos y Shorts), con
 *   título y duración. Sin clave o si falla, ninguno, y el panel lo dice.
 * - Guías: las de GUIDES con `publicada` dentro del mes.
 *
 * Hasta el 05-11-2026 los dos salían también de los avisos del bot de Telegram
 * (`content_announcements`), que se retiró con todo Telegram.
 */

type Admin = ReturnType<typeof createAdminClient>;

export type Publicacion = { titulo: string; enlace: string; fecha: string };

export type ActividadMes = {
  mes: string;
  /** `short`: 3 minutos o menos. Se calcula aquí para que el cliente no importe youtube.ts. */
  videos: (VideoSubido & { short: boolean })[];
  /** De dónde salen los vídeos: la API, o ninguno si falta su clave. */
  fuenteVideos: "api" | "sin-api";
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

function videosDe(admin: Admin, mes: string): Promise<{ videos: VideoSubido[]; fuente: "api" | "sin-api" }> {
  const { desde, hasta } = limites(mes);
  return subidasEntre(admin, desde, hasta);
}

/**
 * Lo subido a YouTube entre dos instantes, del más nuevo al más antiguo, con
 * su fecha real de publicación. Lo usan este resumen, el calendario y los
 * objetivos de vídeos. Sin YOUTUBE_API_KEY (o si la API falla) no hay otra
 * fuente: devuelve la lista vacía y `sin-api`, para que el panel lo diga.
 * Recibe `admin` aunque ya no lo use, para no cambiar a quien la llama.
 */
export async function subidasEntre(_admin: Admin, desde: Date, hasta: Date): Promise<{ videos: VideoSubido[]; fuente: "api" | "sin-api" }> {
  const api = await getSubidasEntre(desde, hasta);
  return api ? { videos: api, fuente: "api" } : { videos: [], fuente: "sin-api" };
}

/** Las guías de GUIDES con `publicada` dentro del mes, de la más nueva a la más antigua. */
function guiasDe(mes: string): Publicacion[] {
  const { desde, hasta } = limites(mes);
  return GUIDES.filter((g) => {
    if (!g.publicada) return false;
    const t = medianocheRumania(g.publicada).getTime();
    return t >= desde.getTime() && t < hasta.getTime();
  })
    .map((g) => ({ titulo: g.title, enlace: `/guias/${g.slug}`, fecha: medianocheRumania(g.publicada as string).toISOString() }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function cargarActividadMes(admin: Admin, mes: string): Promise<ActividadMes> {
  const [a, m] = mes.split("-").map(Number);
  const mesAnterior = new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7);
  const [videos, videosAnt] = await Promise.all([videosDe(admin, mes), videosDe(admin, mesAnterior)]);
  const guias = guiasDe(mes);
  const guiasAnt = guiasDe(mesAnterior);
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
