import { createAdminClient } from "@/lib/supabase/admin";
import {
  admiteReacciones,
  editarBotones,
  sendChannelPost,
  sendTelegramMessageOrThrow,
  type Boton,
} from "@/lib/telegram";
import {
  FIRMA,
  LIMITE_PIE_DE_FOTO,
  mensajeDeNoticia,
  resumenExtractivo,
  resumirNoticia,
} from "@/lib/resumir";

type Admin = ReturnType<typeof createAdminClient>;

export const FUENTE = "CriptoNoticias";
const FEED = "https://www.criptonoticias.com/feed";

/**
 * Sin cabeceras de navegador el feed responde 403: hay un Cloudflare delante.
 * Se manda el juego completo que enviaría un navegador de verdad, porque desde
 * un centro de datos la comprobación es más estricta que desde una conexión
 * doméstica y con solo el User-Agent puede no bastar.
 */
const CABECERAS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml,application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

/** No se propone nada más viejo que esto: una noticia de cripto de hace dos
 *  días ya no es noticia. */
const HORAS_DE_VENTANA = 24;

/** Tope por lectura, para no llenarle el chat al admin de golpe. */
export const MAXIMO_POR_TANDA = 5;

export type NoticiaCruda = {
  titulo: string;
  enlace: string;
  resumen: string | null;
  publicada_en: string | null;
  imagen: string | null;
};

/**
 * Imagen de portada del artículo.
 *
 * El feed no la trae, así que se saca del og:image de la propia noticia. Se
 * lee por trozos y se corta en cuanto aparece: la etiqueta está en la cabecera
 * del documento, así que bastan unos pocos KB de los ~440 que pesa la página.
 */
type Portada = { imagen: string | null; resumen: string | null };

/**
 * Lee las etiquetas Open Graph de un artículo.
 *
 * @param viaLector pide la página a través de r.jina.ai en vez de directamente.
 *   Hace falta porque el artículo vive en el mismo dominio que el feed, así que
 *   el mismo Cloudflare lo bloquea desde el servidor. El lector admite
 *   `X-Return-Format: html`, que devuelve el documento tal cual — con sus
 *   etiquetas og:, que es justo lo que aquí se busca.
 */
async function leerOpenGraph(enlace: string, viaLector: boolean): Promise<Portada> {
  const vacio: Portada = { imagen: null, resumen: null };
  try {
    const res = await fetch(viaLector ? `https://r.jina.ai/${enlace}` : enlace, {
      headers: viaLector ? { "X-Return-Format": "html" } : CABECERAS,
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(viaLector ? 20_000 : 8000),
    });
    if (!res.ok || !res.body) return vacio;

    const lector = res.body.getReader();
    const dec = new TextDecoder();
    let acumulado = "";

    try {
      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += dec.decode(value, { stream: true });

        const imagen = acumulado.match(
          /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i
        );
        const resumen = acumulado.match(
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i
        );
        // Las dos etiquetas están juntas en la cabecera: en cuanto se tienen
        // ambas no hace falta seguir descargando el artículo entero.
        if (imagen && resumen) {
          return { imagen: imagen[1], resumen: decodificar(resumen[1]) };
        }

        // Las etiquetas og: viven en el <head>: si a los 150 KB no han
        // aparecido, no van a aparecer, y el documento entero pesa 400 KB.
        if (acumulado.length > 150_000) {
          return {
            imagen: imagen?.[1] ?? null,
            resumen: resumen ? decodificar(resumen[1]) : null,
          };
        }
      }
    } finally {
      await lector.cancel().catch(() => {});
    }
    return vacio;
  } catch {
    return vacio;
  }
}

/**
 * Portada de una noticia: primero por la vía directa y, si no da nada, a
 * través del lector. El orden importa — la directa es más rápida y no depende
 * de terceros, pero en producción casi siempre acabará usándose el lector.
 */
async function buscarPortada(enlace: string): Promise<Portada> {
  const directa = await leerOpenGraph(enlace, false);
  if (directa.imagen) return directa;

  const porLector = await leerOpenGraph(enlace, true);
  return {
    imagen: porLector.imagen ?? directa.imagen,
    resumen: porLector.resumen ?? directa.resumen,
  };
}

/**
 * Cuerpo del artículo, limpio.
 *
 * Va por r.jina.ai porque el artículo vive tras el mismo Cloudflare que el
 * feed y desde Vercel la petición directa se rechaza. La clave está en el
 * selector: sin él el lector devuelve la página entera —menús, noticias
 * relacionadas, pie— y el resumen acabaría hablando de los enlaces del menú.
 * Con `div.content-inner` llega solo la nota, unos 2-3 KB.
 *
 * Devuelve null si no se puede leer: quien llama se queda sin resumen largo,
 * no sin noticia.
 */
export async function leerCuerpo(enlace: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${enlace}`, {
      headers: { "X-Target-Selector": "div.content-inner" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;

    const texto = await res.text();

    // El lector antepone una cabecera propia (Title:, URL Source:, Published
    // Time:) antes del contenido. Lo que interesa empieza tras la marca.
    const marca = texto.indexOf("Markdown Content:");
    const cuerpo = marca >= 0 ? texto.slice(marca + "Markdown Content:".length) : texto;

    return (
      cuerpo
        // Imágenes fuera y, de los enlaces, solo el texto: las URL en el
        // resumen no aportan nada y gastan tokens.
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        // El marcado se sustituye por un ESPACIO, no por nada. El HTML de
        // origen trae cosas como "respecto al<strong>supuesto", y quitando la
        // marca a secas salía "alsupuesto" — palabras pegadas por todo el
        // texto. Los espacios de más se limpian justo después.
        .replace(/\[([^\]]*)\]\([^)]*\)/g, " $1 ")
        .replace(/\*\*/g, " ")
        .replace(/[ \t]{2,}/g, " ")
        // Y el espacio que ese arreglo mete antes de un signo de puntuación
        // se vuelve a quitar: "falsas ." no lo escribe nadie.
        .replace(/ +([.,;:!?%)\]»])/g, "$1")
        .replace(/([(\[«]) +/g, "$1")
        .replace(/ +\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        // Tope de seguridad: una nota ronda los 3 KB. Si llega mucho más, o el
        // selector ha fallado o es un especial larguísimo.
        .slice(0, 12_000)
    );
  } catch (err) {
    console.warn("[noticias] No se pudo leer el cuerpo:", err instanceof Error ? err.message : err);
    return null;
  }
}

function decodificar(texto: string): string {
  return texto
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#039;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function sinEtiquetas(html: string): string {
  return decodificar(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/**
 * El resumen es el PRIMER párrafo de la descripción. El segundo es siempre
 * el relleno de WordPress ("La entrada ... se publicó primero en ..."), que
 * no aporta nada y ocuparía la mitad del mensaje.
 */
function extraerResumen(descripcion: string): string | null {
  const primerParrafo = descripcion.match(/<p>([\s\S]*?)<\/p>/);
  const texto = sinEtiquetas(primerParrafo ? primerParrafo[1] : descripcion);
  if (!texto || /se publicó primero en/i.test(texto)) return null;
  return texto.length > 280 ? `${texto.slice(0, 279)}…` : texto;
}

/** Parsea el RSS original (XML). */
function parsearXml(xml: string): NoticiaCruda[] {
  return xml
    .split("<item>")
    .slice(1)
    .map((item) => {
      const titulo = decodificar(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const enlace = decodificar(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
      const fecha = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
      const descripcion = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";

      const publicada = fecha ? new Date(fecha) : null;
      return {
        titulo,
        enlace,
        resumen: extraerResumen(descripcion),
        publicada_en: publicada && !isNaN(publicada.getTime()) ? publicada.toISOString() : null,
        imagen: null as string | null,
      };
    });
}

/**
 * Parsea la versión en texto que devuelve el lector de r.jina.ai.
 *
 * Cada noticia llega como un título enlazado en markdown y, dos líneas más
 * abajo, su fecha:
 *   ### [Titular](https://www.criptonoticias.com/...)
 *   [https://...](https://...)
 *   Sun, 23 Aug 2026 14:37:53 +0000
 *
 * No trae resumen, pero da igual: se saca del og:description del artículo, que
 * ya se descarga igualmente para la imagen.
 */
function parsearMarkdown(texto: string): NoticiaCruda[] {
  const bloques = texto.split(/^### /m).slice(1);

  return bloques.map((bloque) => {
    const cabecera = bloque.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const fecha = bloque.match(/^([A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4}[^\n]*)$/m)?.[1];
    const publicada = fecha ? new Date(fecha) : null;

    return {
      titulo: cabecera ? decodificar(cabecera[1]) : "",
      enlace: cabecera ? cabecera[2] : "",
      resumen: null,
      publicada_en: publicada && !isNaN(publicada.getTime()) ? publicada.toISOString() : null,
      imagen: null as string | null,
    };
  });
}

/**
 * Lee el feed y devuelve lo publicado dentro de la ventana, más nuevo primero.
 *
 * Se intenta primero la vía directa. CriptoNoticias tiene un Cloudflare
 * delante que responde 403 a las peticiones que salen de un centro de datos
 * —da igual las cabeceras que se manden—, así que en producción casi siempre
 * hará falta el respaldo: r.jina.ai, un lector público que sí puede leerla y
 * devuelve el contenido en texto.
 *
 * Se conserva la vía directa como primera opción a propósito: es la única que
 * no depende de un tercero, y el día que Cloudflare afloje volverá a usarse
 * sola sin tocar nada.
 */
export async function leerFeed(): Promise<NoticiaCruda[]> {
  const corte = Date.now() - HORAS_DE_VENTANA * 60 * 60 * 1000;
  let noticias: NoticiaCruda[] = [];
  let motivoDirecto = "";

  try {
    const res = await fetch(FEED, {
      headers: CABECERAS,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) noticias = parsearXml(await res.text());
    else motivoDirecto = `directo respondió ${res.status}`;
  } catch (err) {
    motivoDirecto = `directo falló: ${err instanceof Error ? err.message : "error"}`;
  }

  if (noticias.length === 0) {
    const res = await fetch(`https://r.jina.ai/${FEED}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      throw new Error(`${motivoDirecto}; el lector de respaldo respondió ${res.status}`);
    }
    noticias = parsearMarkdown(await res.text());
  }

  return noticias
    .filter((n) => n.titulo && n.enlace.includes("criptonoticias.com"))
    .filter((n) => !n.publicada_en || new Date(n.publicada_en).getTime() >= corte);
}

/**
 * Guarda las que no estuvieran ya y devuelve solo las nuevas.
 *
 * La deduplicación la hace el índice único sobre `enlace`, no una consulta
 * previa: así dos lecturas simultáneas no pueden colar la misma noticia dos
 * veces. Un conflicto no es un error, es que ya la teníamos.
 */
export async function guardarNuevas(admin: Admin): Promise<
  { id: number; titulo: string; resumen: string | null; enlace: string; imagen: string | null }[]
> {
  const crudas = await leerFeed();
  if (crudas.length === 0) return [];

  const { data, error } = await admin
    .from("noticias")
    .upsert(
      crudas.map((n) => ({ ...n, fuente: FUENTE })),
      { onConflict: "enlace", ignoreDuplicates: true }
    )
    .select("id, titulo, resumen, enlace, imagen");

  if (error) {
    console.error("[noticias] Error guardando:", error.message);
    return [];
  }

  // upsert con ignoreDuplicates devuelve solo las filas realmente insertadas.
  const nuevas = (data ?? []).slice(0, MAXIMO_POR_TANDA);

  // La imagen se busca solo para las que de verdad son nuevas: hacerlo en el
  // parseo del feed significaría descargar un artículo por noticia en cada
  // lectura, aunque ya las conociéramos todas.
  await Promise.all(
    nuevas.map(async (n) => {
      const { imagen, resumen } = await buscarPortada(n.enlace);
      // El resumen solo se rellena si falta: cuando el feed llega por la vía
      // directa ya lo trae, y el del propio medio es mejor que el og:description.
      const parche: Record<string, string> = {};
      if (imagen) { n.imagen = imagen; parche.imagen = imagen; }
      if (resumen && !n.resumen) { n.resumen = resumen; parche.resumen = resumen; }
      if (Object.keys(parche).length === 0) return;
      await admin.from("noticias").update(parche).eq("id", n.id);
    })
  );

  return nuevas;
}

/**
 * Propone una noticia al admin con los dos botones de decisión.
 *
 * El callback_data de Telegram no admite más de 64 bytes, así que no cabe el
 * enlace: viaja solo el id de la fila y el resto se busca al decidir.
 */
export async function proponerNoticia(
  admin: Admin,
  chatId: number,
  noticia: { id: number; titulo: string; resumen: string | null; enlace: string }
) {
  // Se redacta ANTES de proponerla: lo que el admin lee es, palabra por
  // palabra, lo que va a salir en el canal si pulsa publicar. Proponer una
  // cosa y publicar otra sería aprobar a ciegas.
  const { texto: publicable, via } = await redactarResumen(admin, noticia);

  // Cada vía se etiqueta para que el admin sepa de qué se fía al aprobar: un
  // texto redactado y uno recortado del original no merecen la misma lectura.
  const etiqueta: Record<ViaResumen, string> = {
    ia: "✍️ redactada",
    recorte: "✂️ recortada del original",
    titular: "⚠️ solo el titular — no he podido leer el artículo",
  };

  const texto =
    `📰 ${FUENTE.toUpperCase()} · ${etiqueta[via]}\n\n` +
    "──────────────\n" +
    `${publicable}\n` +
    "──────────────\n\n" +
    "Esto es literalmente lo que se publicará.";

  const messageId = await sendTelegramMessageOrThrow(chatId, texto, [
    [{ text: "✍️ La escribo yo", data: `n:mio:${noticia.id}` }],
    [
      { text: "✅ Publicar", data: `n:ok:${noticia.id}` },
      { text: "❌ Descartar", data: `n:no:${noticia.id}` },
    ],
  ]);

  await admin.from("noticias").update({ mensaje_admin_id: messageId }).eq("id", noticia.id);
}

// ── Votación toro / oso ─────────────────────────────────────────────────────

/**
 * Por qué botones y no reacciones de Telegram.
 *
 * Un bot solo puede poner UNA reacción por mensaje (las dos requieren cuenta
 * premium), y encima el catálogo de reacciones de Telegram es cerrado: 🐂 y 🐻
 * no están en él. Con botones se consiguen las dos cosas que se buscaban —el
 * lector opina de un toque y el marcador se ve en el propio mensaje— y además
 * el voto queda en nuestra base de datos, así que se puede mirar qué noticias
 * mueven a la gente y hacia qué lado.
 */
/**
 * Las reacciones que se buscan en el canal para votar una noticia.
 *
 * 🔥 y 💩 y no 🐂 y 🐻 porque el catálogo de reacciones de Telegram es cerrado
 * y el toro y el oso no están en él (`REACTION_INVALID`). Tampoco ✅ ni ❌.
 * Estas dos sí existen y en cripto se entienden solas.
 */
export const REACCIONES_NOTICIA = ["🔥", "💩"];

export type Voto = "toro" | "oso";

export function esVoto(valor: string): valor is Voto {
  return valor === "toro" || valor === "oso";
}

export type Marcador = { toro: number; oso: number };

/** Los dos botones con su marcador. Se recalculan enteros en cada voto: son
 *  dos números, y así nunca se desincronizan de la tabla. */
export function botonesVoto(id: number, marcador: Marcador): Boton[][] {
  return [
    [
      { text: `🐂 Alcista · ${marcador.toro}`, data: `nv:${id}:toro` },
      { text: `🐻 Bajista · ${marcador.oso}`, data: `nv:${id}:oso` },
    ],
  ];
}

export async function contarVotos(admin: Admin, id: number): Promise<Marcador> {
  const { data } = await admin.from("noticia_votos").select("voto").eq("noticia_id", id);
  const votos = (data ?? []) as { voto: string }[];
  return {
    toro: votos.filter((v) => v.voto === "toro").length,
    oso: votos.filter((v) => v.voto === "oso").length,
  };
}

/**
 * Registra (o cambia) el voto de alguien y repinta el marcador.
 *
 * Votar dos veces lo mismo retira el voto: es lo que espera cualquiera que
 * haya pulsado un "me gusta" alguna vez, y evita que un dedo suelto deje un
 * voto que no se quería.
 */
export async function votarNoticia(
  admin: Admin,
  id: number,
  telegramUserId: number,
  voto: Voto
): Promise<{ marcador: Marcador; aviso: string } | null> {
  const { data: noticia } = await admin
    .from("noticias")
    .select("id, mensaje_canal_id, canal_chat_id")
    .eq("id", id)
    .maybeSingle();
  if (!noticia) return null;

  const { data: previo } = await admin
    .from("noticia_votos")
    .select("voto")
    .eq("noticia_id", id)
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  let aviso: string;
  if (previo?.voto === voto) {
    await admin
      .from("noticia_votos")
      .delete()
      .eq("noticia_id", id)
      .eq("telegram_user_id", telegramUserId);
    aviso = "Voto retirado";
  } else {
    await admin
      .from("noticia_votos")
      .upsert(
        { noticia_id: id, telegram_user_id: telegramUserId, voto },
        { onConflict: "noticia_id,telegram_user_id" }
      );
    aviso = voto === "toro" ? "🐂 Alcista, anotado" : "🐻 Bajista, anotado";
  }

  const marcador = await contarVotos(admin, id);

  if (noticia.mensaje_canal_id && noticia.canal_chat_id) {
    await editarBotones(
      noticia.canal_chat_id as string,
      Number(noticia.mensaje_canal_id),
      botonesVoto(id, marcador)
    );
  }

  return { marcador, aviso };
}

// ── Redacción y publicación ─────────────────────────────────────────────────

/**
 * Genera el resumen propio de una noticia y lo guarda.
 *
 * Se hace al proponerla, no al publicarla, por dos razones: el admin lee
 * exactamente el texto que va a salir antes de decir que sí, y la pulsación
 * de "Publicar" responde al instante en vez de quedarse pensando.
 */
export type ViaResumen = "ia" | "recorte" | "titular";

export async function redactarResumen(
  admin: Admin,
  noticia: { id: number; titulo: string; resumen: string | null; enlace: string }
): Promise<{ texto: string; via: ViaResumen }> {
  const cuerpo = await leerCuerpo(noticia.enlace);

  if (cuerpo) {
    // 1. Con clave de API: se redacta un texto nuevo. Es la buena.
    const resumen = await resumirNoticia(noticia.titulo, cuerpo);
    if (resumen) {
      const texto = mensajeDeNoticia(resumen);
      await guardarTexto(admin, noticia.id, {
        resumen_ia: JSON.stringify(resumen),
        texto_canal: texto,
      });
      return { texto, via: "ia" };
    }

    // 2. Sin clave: se recorta el propio artículo. No reescribe nada, elige.
    const recorte = resumenExtractivo(noticia.titulo, cuerpo);
    if (recorte) {
      await guardarTexto(admin, noticia.id, { texto_canal: recorte });
      return { texto: recorte, via: "recorte" };
    }
  }

  // 3. Si no se ha podido ni leer el artículo, queda el titular y la
  //    entradilla del feed. Es un mensaje pobre, y por eso la propuesta avisa.
  const texto = [`📰 ${noticia.titulo}`, noticia.resumen, FIRMA]
    .filter(Boolean)
    .join("\n\n");
  await guardarTexto(admin, noticia.id, { texto_canal: texto });
  return { texto, via: "titular" };
}

function guardarTexto(admin: Admin, id: number, campos: Record<string, string>) {
  return admin.from("noticias").update(campos).eq("id", id);
}

/**
 * Publica la noticia en el canal gratuito.
 *
 * Con resumen propio va el texto completo y NINGÚN enlace a la fuente: la
 * noticia entera se lee dentro de Telegram, que es de lo que se trataba. Sin
 * resumen se cae al comportamiento de siempre —titular, entradilla corta y
 * botón para leerla en el medio—, porque publicar cuatro líneas sueltas sin
 * forma de ampliar sería peor que enlazar.
 */
export async function publicarNoticia(
  admin: Admin,
  noticia: {
    id: number;
    titulo: string;
    resumen: string | null;
    enlace: string;
    imagen: string | null;
    texto_canal?: unknown;
  },
  chatId: string
): Promise<void> {
  // El texto se montó al proponerla y quedó guardado: publicar es mandar
  // exactamente lo que el admin leyó y aprobó, sin recalcular nada.
  const texto =
    (typeof noticia.texto_canal === "string" && noticia.texto_canal) ||
    [`📰 ${noticia.titulo}`, noticia.resumen, FIRMA].filter(Boolean).join("\n\n");

  // El pie de foto se queda en 1024 caracteres y Telegram recorta sin avisar.
  // Antes que publicar un resumen cortado a media frase, se va sin imagen: el
  // texto tiene 4096 de margen y es lo que de verdad importa aquí.
  const cabeEnLaFoto = texto.length <= LIMITE_PIE_DE_FOTO;
  if (!cabeEnLaFoto && noticia.imagen) {
    console.warn(`[noticias] Texto de ${texto.length} caracteres: se publica sin imagen`);
  }

  // Si el canal tiene 🔥 y 💩 como reacciones, la gente vota con ellas y los
  // botones sobran: dos formas de opinar sobre lo mismo reparten los votos y
  // ensucian el mensaje. Si no las tiene, van los botones, que funcionan
  // siempre. Se comprueba en cada publicación, así que el día que se activen
  // en Telegram el cambio es automático y no hay que tocar nada aquí.
  const conReacciones = await admiteReacciones(chatId, REACCIONES_NOTICIA);

  const messageId = await sendChannelPost(texto, {
    chatId,
    imagen: cabeEnLaFoto ? noticia.imagen : null,
    botones: conReacciones ? undefined : botonesVoto(noticia.id, { toro: 0, oso: 0 }),
  });

  // Sin estos dos datos los botones funcionan pero el marcador no se puede
  // repintar, así que se quedaría clavado en 0 para siempre.
  if (messageId) {
    await admin
      .from("noticias")
      .update({ mensaje_canal_id: messageId, canal_chat_id: chatId })
      .eq("id", noticia.id);
  }
}

// ── Escribirla a mano ───────────────────────────────────────────────────────

/**
 * El admin pide escribir él la noticia.
 *
 * Sin clave de API esta es la mejor vía y no un apaño: el texto lo escribe una
 * persona, así que ni hay que recortar el trabajo de otro medio ni hay nada
 * que pueda inventarse un modelo. El bot solo maqueta y publica.
 *
 * El enlace al original va SOLO aquí, en el privado del admin, para poder
 * leerlo antes de escribir. Al canal no llega nunca.
 */
export async function pedirTextoAlAdmin(
  admin: Admin,
  chatId: number,
  noticia: { id: number; titulo: string; enlace: string }
) {
  const messageId = await sendTelegramMessageOrThrow(
    chatId,
    `✍️ Escríbela tú\n\n` +
      `${noticia.titulo}\n\n` +
      `📖 Léela aquí:\n${noticia.enlace}\n\n` +
      "Cuando la tengas, **responde a este mensaje** con tu texto y la publico tal cual.\n\n" +
      "• Los saltos de línea se respetan, así que separa los párrafos como quieras\n" +
      "• Negritas y cursivas también se mantienen\n" +
      "• La firma y la imagen las pongo yo\n" +
      "• Si te arrepientes, ignóralo y descártala"
  );

  await admin
    .from("noticias")
    .update({ mensaje_peticion_id: messageId })
    .eq("id", noticia.id);
}

/**
 * ¿Es esta respuesta el texto de una noticia que el admin pidió escribir?
 *
 * Se busca por el id del mensaje citado, que es lo que ata sin ambigüedad la
 * respuesta con la noticia. Devuelve null si no lo es, y entonces quien llama
 * sigue con lo suyo (el relé de soporte).
 */
export async function noticiaEsperandoTexto(admin: Admin, mensajeCitado: number) {
  const { data } = await admin
    .from("noticias")
    .select("id, titulo, resumen, enlace, imagen, estado")
    .eq("mensaje_peticion_id", mensajeCitado)
    .maybeSingle();
  return data ?? null;
}

/**
 * Publica el texto que ha escrito el admin.
 *
 * `entidades` son el formato de SU mensaje (negritas, cursivas, enlaces) tal
 * como lo manda Telegram. Se reenvían intactas y por eso la firma va DETRÁS y
 * nunca delante: las entidades traen posiciones absolutas dentro del texto, y
 * anteponer una sola letra las descolocaría todas.
 */
export async function publicarTextoPropio(
  admin: Admin,
  noticia: { id: number; imagen: string | null },
  texto: string,
  entidades: unknown[] | undefined,
  chatId: string
): Promise<{ ok: boolean; conImagen: boolean }> {
  const completo = `${texto.trimEnd()}\n\n${FIRMA}`;
  const cabeEnLaFoto = completo.length <= LIMITE_PIE_DE_FOTO;
  const conReacciones = await admiteReacciones(chatId, REACCIONES_NOTICIA);

  const messageId = await sendChannelPost(completo, {
    chatId,
    imagen: cabeEnLaFoto ? noticia.imagen : null,
    entidades,
    botones: conReacciones ? undefined : botonesVoto(noticia.id, { toro: 0, oso: 0 }),
  });

  await admin
    .from("noticias")
    .update({
      estado: "publicada",
      decidida_en: new Date().toISOString(),
      texto_canal: completo,
      mensaje_canal_id: messageId,
      canal_chat_id: chatId,
      // Se limpia para que una respuesta posterior al mismo mensaje no vuelva
      // a publicarla: sin esto, citar dos veces publicaría dos veces.
      mensaje_peticion_id: null,
    })
    .eq("id", noticia.id);

  return { ok: true, conImagen: cabeEnLaFoto && !!noticia.imagen };
}
