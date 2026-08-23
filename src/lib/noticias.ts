import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessageOrThrow } from "@/lib/telegram";

type Admin = ReturnType<typeof createAdminClient>;

export const FUENTE = "CriptoNoticias";
const FEED = "https://www.criptonoticias.com/feed";

/** Sin cabeceras de navegador el feed responde 403. */
const CABECERAS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml,application/xml,text/xml,*/*",
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
async function buscarImagen(enlace: string): Promise<string | null> {
  try {
    const res = await fetch(enlace, {
      headers: CABECERAS,
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.body) return null;

    const lector = res.body.getReader();
    const dec = new TextDecoder();
    let acumulado = "";

    try {
      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += dec.decode(value, { stream: true });

        const m = acumulado.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
        if (m) return m[1];

        // Pasada la cabecera ya no va a aparecer: no merece la pena seguir
        // descargando el artículo entero.
        if (acumulado.length > 120_000) break;
      }
    } finally {
      await lector.cancel().catch(() => {});
    }
    return null;
  } catch {
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

/** Lee el feed y devuelve lo publicado dentro de la ventana, más nuevo primero. */
export async function leerFeed(): Promise<NoticiaCruda[]> {
  const res = await fetch(FEED, {
    headers: CABECERAS,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`El feed respondió ${res.status}`);

  const xml = await res.text();
  const corte = Date.now() - HORAS_DE_VENTANA * 60 * 60 * 1000;

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
    })
    .filter((n) => n.titulo && n.enlace)
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
      const imagen = await buscarImagen(n.enlace);
      if (!imagen) return;
      n.imagen = imagen;
      await admin.from("noticias").update({ imagen }).eq("id", n.id);
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
