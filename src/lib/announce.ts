import { createAdminClient } from "@/lib/supabase/admin";
import { GUIDES_NEWEST_FIRST } from "@/lib/guides";
import { getLatestVideos } from "@/lib/youtube";
import { getSiteUrl, sendChannelPost } from "@/lib/telegram";

type Admin = ReturnType<typeof createAdminClient>;

type Tipo = "guia" | "entrada" | "video";

/**
 * Cuánto hacia atrás se mira. Es la red de seguridad contra el aviso masivo:
 * si algún día se vacía content_announcements, sin esta ventana el anunciador
 * publicaría de golpe el histórico entero en el canal.
 *
 * No aplica a las guías, que no tienen fecha en su registro y van sembradas
 * explícitamente en el SQL.
 */
const DIAS_DE_VENTANA = 3;

/** Nunca más de esto por ejecución, por si algo se descuadra. */
const MAXIMO_POR_EJECUCION = 5;

async function yaAnunciado(admin: Admin, kind: Tipo, ref: string): Promise<boolean> {
  const { data } = await admin
    .from("content_announcements")
    .select("id")
    .eq("kind", kind)
    .eq("ref", ref)
    .maybeSingle();
  return !!data;
}

/**
 * Marca ANTES de publicar, no después. Si se hiciera al revés y fallara el
 * marcado, el aviso se repetiría en cada ejecución; así, en el peor caso, se
 * pierde un aviso — que molesta mucho menos que el canal repitiéndose.
 */
async function marcar(admin: Admin, kind: Tipo, ref: string): Promise<boolean> {
  const { error } = await admin.from("content_announcements").insert({ kind, ref });
  if (error) {
    // 23505 = otra ejecución simultánea se nos adelantó. No es un fallo.
    if (error.code !== "23505") {
      console.error(`[announce] No se pudo marcar ${kind}/${ref}:`, error.message);
    }
    return false;
  }
  return true;
}

function esReciente(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const edad = Date.now() - new Date(iso).getTime();
  return edad >= 0 && edad <= DIAS_DE_VENTANA * 24 * 60 * 60 * 1000;
}

// ── Plantillas ───────────────────────────────────────────────────────────────
// Una por tipo, deliberadamente cortas: en el canal se leen de un vistazo y el
// botón se lleva el clic. El pie de foto corta a 1024 caracteres, así que los
// textos largos (descripciones de guía, extractos) van recortados.

function recortar(texto: string, maximo: number): string {
  const limpio = texto.trim();
  return limpio.length <= maximo ? limpio : `${limpio.slice(0, maximo - 1).trimEnd()}…`;
}

function plantillaGuia(guia: (typeof GUIDES_NEWEST_FIRST)[number]) {
  const candado = guia.type === "premium" ? " 🔒" : "";
  return (
    `📚 NUEVA GUÍA INTERACTIVA${candado}\n\n` +
    `${guia.title}\n\n` +
    `${recortar(guia.description, 300)}\n\n` +
    `⏱ ${guia.readTime}  ·  🎯 ${guia.difficulty}  ·  🏅 ${guia.badge}`
  );
}

function plantillaEntrada(post: { title: string; excerpt: string | null; is_premium: boolean | null }) {
  const candado = post.is_premium ? " 🔒" : "";
  const extracto = post.excerpt ? `\n\n${recortar(post.excerpt, 350)}` : "";
  return `📝 NUEVA ENTRADA${candado}\n\n${post.title}${extracto}`;
}

function plantillaVideo(video: { title: string }) {
  return `🎥 NUEVO VÍDEO EN YOUTUBE\n\n${video.title}`;
}

// ── Anunciadores ─────────────────────────────────────────────────────────────

async function anunciarGuias(admin: Admin): Promise<string[]> {
  const anunciadas: string[] = [];

  for (const guia of GUIDES_NEWEST_FIRST) {
    if (anunciadas.length >= MAXIMO_POR_EJECUCION) break;
    if (await yaAnunciado(admin, "guia", guia.slug)) continue;
    if (!(await marcar(admin, "guia", guia.slug))) continue;

    try {
      await sendChannelPost(plantillaGuia(guia), {
        botones: [{ text: "📖 Abrir la guía", url: `${getSiteUrl()}/guias/${guia.slug}` }],
      });
      anunciadas.push(guia.slug);
    } catch (err) {
      console.error(`[announce] Falló el aviso de la guía ${guia.slug}:`, err);
    }
  }

  return anunciadas;
}

async function anunciarEntradas(admin: Admin, soloSlug?: string): Promise<string[]> {
  let consulta = admin
    .from("posts")
    .select("slug, title, excerpt, cover_image, is_premium, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (soloSlug) consulta = consulta.eq("slug", soloSlug);

  const { data: posts, error } = await consulta;
  if (error) {
    console.error("[announce] Error leyendo entradas:", error.message);
    return [];
  }

  const anunciadas: string[] = [];
  for (const post of posts ?? []) {
    if (anunciadas.length >= MAXIMO_POR_EJECUCION) break;
    // Al publicar desde el panel se pide una entrada concreta y se anuncia sin
    // mirar la fecha: puede ser un borrador viejo que se publica hoy.
    if (!soloSlug && !esReciente(post.created_at)) continue;
    if (await yaAnunciado(admin, "entrada", post.slug)) continue;
    if (!(await marcar(admin, "entrada", post.slug))) continue;

    try {
      await sendChannelPost(plantillaEntrada(post), {
        imagen: post.cover_image,
        botones: [{ text: "📰 Leer ahora", url: `${getSiteUrl()}/post/${post.slug}` }],
      });
      anunciadas.push(post.slug);
    } catch (err) {
      console.error(`[announce] Falló el aviso de la entrada ${post.slug}:`, err);
    }
  }

  return anunciadas;
}

async function anunciarVideos(admin: Admin): Promise<string[]> {
  const videos = await getLatestVideos(3);
  const anunciados: string[] = [];

  for (const video of videos) {
    if (anunciados.length >= MAXIMO_POR_EJECUCION) break;
    if (!esReciente(video.publishedAt)) continue;
    if (await yaAnunciado(admin, "video", video.id)) continue;
    if (!(await marcar(admin, "video", video.id))) continue;

    try {
      await sendChannelPost(plantillaVideo(video), {
        imagen: video.thumbnail,
        botones: [{ text: "▶️ Ver en YouTube", url: video.url }],
      });
      anunciados.push(video.id);
    } catch (err) {
      console.error(`[announce] Falló el aviso del vídeo ${video.id}:`, err);
    }
  }

  return anunciados;
}

/**
 * Publica en el canal todo lo que sea nuevo y no se haya anunciado ya.
 *
 * Es idempotente por diseño, así que se puede llamar desde donde haga falta
 * sin coordinar nada: el cron diario, el momento de publicar una entrada, o el
 * botón del panel. Cada tipo va por su cuenta — que YouTube no responda no
 * puede impedir que se anuncie una entrada.
 */
export async function anunciarPendientes(
  admin: Admin,
  opciones?: { soloEntrada?: string }
) {
  if (opciones?.soloEntrada) {
    return { entradas: await anunciarEntradas(admin, opciones.soloEntrada) };
  }

  const [guias, entradas, videos] = await Promise.all([
    anunciarGuias(admin).catch((err) => {
      console.error("[announce] Guías:", err);
      return [] as string[];
    }),
    anunciarEntradas(admin).catch((err) => {
      console.error("[announce] Entradas:", err);
      return [] as string[];
    }),
    anunciarVideos(admin).catch((err) => {
      console.error("[announce] Vídeos:", err);
      return [] as string[];
    }),
  ]);

  return { guias, entradas, videos };
}
