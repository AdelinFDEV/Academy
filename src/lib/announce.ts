import { createAdminClient } from "@/lib/supabase/admin";
import { GUIDES_NEWEST_FIRST } from "@/lib/guides";
import { getLatestVideos } from "@/lib/youtube";
import { getFreeChannelId, getSiteUrl, sendChannelPost } from "@/lib/telegram";

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

/** Versión para el canal gratuito de algo que solo está dentro de Premium.
 *  No lleva el contenido, lleva el motivo para suscribirse. */
function plantillaAnzuelo(tipo: "guía" | "entrada", titulo: string) {
  return (
    `🔒 NUEVA ${tipo === "guía" ? "GUÍA" : "ENTRADA"} PREMIUM\n\n` +
    `${titulo}\n\n` +
    "Está dentro de Premium, junto al canal privado y el resto de herramientas."
  );
}

/**
 * A qué canales va cada cosa.
 *
 * La regla nace de una idea simple: un canal de pago lleno de lo mismo que hay
 * gratis deja de sentirse como algo de pago. Así que el contenido gratuito va
 * solo al canal free, y lo Premium va completo al canal privado y como reclamo
 * al gratuito — que es justo donde está quien todavía no ha pagado.
 *
 * Duplicar el aviso gratuito en ambos canales tampoco ayudaría: mucha gente
 * está en los dos y recibiría el mismo mensaje dos veces.
 */
async function publicarSegunPlan(opciones: {
  esPremium: boolean;
  tipo: "guía" | "entrada";
  titulo: string;
  texto: string;
  imagen?: string | null;
  url: string;
  etiquetaBoton: string;
}) {
  const canalFree = getFreeChannelId();

  if (!opciones.esPremium) {
    // Gratuito: solo al canal free. Si no hay canal free configurado, se
    // publica en el privado para no perder el aviso.
    await sendChannelPost(opciones.texto, {
      imagen: opciones.imagen,
      botones: [{ text: opciones.etiquetaBoton, url: opciones.url }],
      chatId: canalFree ?? undefined,
    });
    return;
  }

  // Premium: el aviso completo al canal privado…
  await sendChannelPost(opciones.texto, {
    imagen: opciones.imagen,
    botones: [{ text: opciones.etiquetaBoton, url: opciones.url }],
  });

  // …y el reclamo al gratuito. Que falle este no debe dar el aviso por
  // perdido: el importante, el de los que pagan, ya salió.
  if (canalFree) {
    try {
      await sendChannelPost(plantillaAnzuelo(opciones.tipo, opciones.titulo), {
        imagen: opciones.imagen,
        botones: [{ text: "💎 Ver qué incluye Premium", url: `${getSiteUrl()}/premium` }],
        chatId: canalFree,
      });
    } catch (err) {
      console.error("[announce] Falló el reclamo en el canal free:", err);
    }
  }
}

// ── Anunciadores ─────────────────────────────────────────────────────────────

async function anunciarGuias(admin: Admin): Promise<string[]> {
  const anunciadas: string[] = [];

  for (const guia of GUIDES_NEWEST_FIRST) {
    if (anunciadas.length >= MAXIMO_POR_EJECUCION) break;
    if (await yaAnunciado(admin, "guia", guia.slug)) continue;
    if (!(await marcar(admin, "guia", guia.slug))) continue;

    try {
      await publicarSegunPlan({
        esPremium: guia.type === "premium",
        tipo: "guía",
        titulo: guia.title,
        texto: plantillaGuia(guia),
        url: `${getSiteUrl()}/guias/${guia.slug}`,
        etiquetaBoton: "📖 Abrir la guía",
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
      await publicarSegunPlan({
        esPremium: !!post.is_premium,
        tipo: "entrada",
        titulo: post.title,
        texto: plantillaEntrada(post),
        imagen: post.cover_image,
        url: `${getSiteUrl()}/post/${post.slug}`,
        etiquetaBoton: "📰 Leer ahora",
      });
      anunciadas.push(post.slug);
    } catch (err) {
      console.error(`[announce] Falló el aviso de la entrada ${post.slug}:`, err);
    }
  }

  return anunciadas;
}

async function anunciarVideos(admin: Admin, sinCache: boolean): Promise<string[]> {
  // Sin caché cuando lo lanza el botón del panel: si no, un vídeo recién
  // publicado podría no aparecer hasta media hora después.
  const videos = await getLatestVideos(3, sinCache);
  const anunciados: string[] = [];

  for (const video of videos) {
    if (anunciados.length >= MAXIMO_POR_EJECUCION) break;
    if (!esReciente(video.publishedAt)) continue;
    if (await yaAnunciado(admin, "video", video.id)) continue;
    if (!(await marcar(admin, "video", video.id))) continue;

    try {
      // Los vídeos de YouTube son públicos: su sitio es el canal gratuito.
      await sendChannelPost(plantillaVideo(video), {
        imagen: video.thumbnail,
        botones: [{ text: "▶️ Ver en YouTube", url: video.url }],
        chatId: getFreeChannelId() ?? undefined,
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
  opciones?: { soloEntrada?: string; sinCache?: boolean }
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
    anunciarVideos(admin, !!opciones?.sinCache).catch((err) => {
      console.error("[announce] Vídeos:", err);
      return [] as string[];
    }),
  ]);

  return { guias, entradas, videos };
}
