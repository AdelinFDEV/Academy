import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessageOrThrow } from "@/lib/telegram";

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
  noticia: { id: number; titulo: string; resumen: string | null }
) {
  const texto =
    `📰 ${FUENTE.toUpperCase()}\n\n${noticia.titulo}` +
    (noticia.resumen ? `\n\n${noticia.resumen}` : "");

  const messageId = await sendTelegramMessageOrThrow(chatId, texto, [
    [
      { text: "✅ Publicar", data: `n:ok:${noticia.id}` },
      { text: "❌ Descartar", data: `n:no:${noticia.id}` },
    ],
  ]);

  await admin.from("noticias").update({ mensaje_admin_id: messageId }).eq("id", noticia.id);
}
