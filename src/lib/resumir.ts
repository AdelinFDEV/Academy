/**
 * Reescritura de noticias con Claude, para publicarlas completas en Telegram.
 *
 * El canal publicaba título + og:description + un botón a CriptoNoticias. El
 * lector tenía que salir de Telegram para enterarse de algo. Ahora el bot lee
 * el artículo y redacta un resumen NUEVO: texto propio, no un recorte del de
 * otro, que es la diferencia entre resumir y republicar.
 *
 * ── Lo que NO puede hacer ───────────────────────────────────────────────────
 * Inventar. Es una fuente de noticias: un dato inventado no es un texto flojo,
 * es desinformación con la firma de la Academy debajo. Contra eso hay tres
 * cosas, y ninguna basta sola:
 *
 *   1. El prompt prohíbe explícitamente añadir nada que no esté en el artículo,
 *      y le dice qué hacer cuando un dato falta (omitirlo, no estimarlo).
 *   2. La salida es estructurada (Zod): campos fijos, sin sitio para florituras.
 *   3. Se comprueba después: si el modelo devuelve cifras que no aparecen en el
 *      original, el resumen se descarta (ver `cifrasInventadas`).
 *
 * Y por encima de todo eso sigue estando el admin, que lo lee entero antes de
 * que se publique nada.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

/** Modelo por defecto. Se puede cambiar por entorno sin tocar código. */
const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Forma del resumen. Los límites de longitud van en la descripción de cada
 * campo porque el mensaje tiene que caber en un pie de foto de Telegram, que
 * son 1024 caracteres contando emojis y saltos de línea.
 */
const EsquemaResumen = z.object({
  titular: z
    .string()
    .describe(
      "Titular propio, reescrito con tus palabras. Máximo 90 caracteres. " +
        "Sin comillas, sin punto final, sin mayúsculas sostenidas."
    ),
  entradilla: z
    .string()
    .describe(
      "Qué ha pasado, en 1 o 2 frases. Máximo 220 caracteres. " +
        "Lo esencial: quién, qué y cuándo."
    ),
  puntos: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe(
      "Los datos concretos de la noticia: cifras, fechas, nombres, decisiones. " +
        "Cada punto una frase de máximo 110 caracteres, sin viñeta ni guion delante."
    ),
  porqueImporta: z
    .string()
    .describe(
      "Por qué le importa a alguien que invierte en cripto, en una frase de máximo " +
        "160 caracteres. Solo consecuencias que se deduzcan del propio artículo. " +
        "Nunca una recomendación de comprar o vender."
    ),
});

export type ResumenNoticia = z.infer<typeof EsquemaResumen>;

const INSTRUCCIONES = `Eres el redactor de AdelinBTC Academy, un medio de criptomonedas en español.

Recibes un artículo de otro medio y escribes un resumen PROPIO para publicarlo en un canal de Telegram. El lector no va a poder abrir el artículo original: lo que escribas es todo lo que va a saber de esa noticia.

REGLA ABSOLUTA — no inventes nada:
- Solo puedes afirmar lo que aparece en el artículo. Ni un dato más.
- Si una cifra, fecha o nombre no está, se omite. NUNCA se estima, se redondea ni se deduce.
- No añadas contexto de mercado, precios ni antecedentes que no estén en el texto.
- Si el artículo dice que algo es un rumor, una acusación o algo no confirmado, tu resumen tiene que decirlo igual de claro.
- Si el artículo no da suficiente información para rellenar un campo, escribe lo poco que haya. Preferimos corto y cierto a completo e inventado.

CÓMO ESCRIBIR:
- En español de España, directo y sin humo. Frases cortas.
- Con tus propias palabras: reformula, no copies frases del original.
- Cita textualmente solo cuando sea una declaración de alguien, y entrecomillada.
- Nada de "según el medio", "el artículo señala" ni referencias a la fuente.
- Sin emojis: los pone la plantilla del mensaje.
- Nada de consejos de inversión, predicciones de precio ni "esto podría subir".`;

/**
 * Cliente perezoso: el módulo lo importa el webhook, que se carga en cada
 * update aunque no haya ninguna noticia que resumir. Sin clave no se construye
 * y no se rompe nada — simplemente no hay resumen.
 */
let cliente: Anthropic | null = null;
function obtenerCliente(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cliente) cliente = new Anthropic();
  return cliente;
}

export function hayResumidor(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Números de tres o más cifras, porcentajes y años. Son los datos que más
 *  daño hacen si se inventan, y los más fáciles de comprobar. */
function cifrasDe(texto: string): string[] {
  return (texto.match(/\d[\d.,]{2,}|\d+\s?%/g) ?? []).map((c) =>
    c.replace(/[.,\s]/g, "").replace("%", "")
  );
}

/**
 * ¿Ha metido el modelo alguna cifra que no está en el artículo?
 *
 * Es una red de seguridad tosca a propósito: no valida el sentido del texto,
 * solo que los números salgan de algún sitio. Un resumen bien escrito con una
 * cifra inventada es mucho peor que no publicar nada.
 */
export function cifrasInventadas(resumen: ResumenNoticia, original: string): string[] {
  const enOriginal = new Set(cifrasDe(original));
  const generado = [
    resumen.titular,
    resumen.entradilla,
    ...resumen.puntos,
    resumen.porqueImporta,
  ].join(" ");
  return cifrasDe(generado).filter((c) => !enOriginal.has(c));
}

/**
 * Resume un artículo. Devuelve null si no se puede (sin clave, sin cuerpo, la
 * API falla o el resultado no supera la comprobación de cifras) — quien llama
 * se queda entonces con el resumen corto de siempre.
 */
export async function resumirNoticia(
  titulo: string,
  cuerpo: string
): Promise<ResumenNoticia | null> {
  const anthropic = obtenerCliente();
  if (!anthropic) return null;

  // Un artículo de dos líneas no da para un resumen: casi siempre significa
  // que la extracción falló y lo que hay es un menú de navegación.
  if (cuerpo.trim().length < 400) {
    console.warn("[resumir] Cuerpo demasiado corto, no se resume:", cuerpo.length);
    return null;
  }

  try {
    const respuesta = await anthropic.messages.parse({
      model: MODELO,
      max_tokens: 4000,
      system: INSTRUCCIONES,
      // Tarea acotada y con la fuente delante: no hace falta pensar mucho, y
      // menos divagación es menos margen para adornar.
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: zodOutputFormat(EsquemaResumen),
      },
      messages: [
        {
          role: "user",
          content: `TITULAR ORIGINAL: ${titulo}\n\nARTÍCULO:\n${cuerpo}`,
        },
      ],
    });

    if (respuesta.stop_reason === "refusal") {
      console.warn("[resumir] El modelo declinó:", respuesta.stop_details);
      return null;
    }

    const resumen = respuesta.parsed_output;
    if (!resumen) {
      console.warn("[resumir] La respuesta no encajó en el esquema");
      return null;
    }

    const inventadas = cifrasInventadas(resumen, `${titulo}\n${cuerpo}`);
    if (inventadas.length > 0) {
      console.warn("[resumir] Cifras que no están en el original:", inventadas.join(", "));
      return null;
    }

    return resumen;
  } catch (err) {
    console.error("[resumir] Error llamando a la API:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── El mensaje que se publica ───────────────────────────────────────────────

/** Firma del canal. La noticia va sin enlace a la fuente, así que lo que se ve
 *  al pie es de quién es el texto que se está leyendo. */
export const FIRMA = "📊 AdelinBTC Academy";

/** Pie de foto de Telegram. Pasarse no da error: recorta y se come el final. */
export const LIMITE_PIE_DE_FOTO = 1024;

/** Monta el mensaje del canal a partir del resumen. */
export function mensajeDeNoticia(resumen: ResumenNoticia): string {
  const puntos = resumen.puntos.map((p) => `▫️ ${p}`).join("\n");
  return (
    `📰 ${resumen.titular}\n\n` +
    `${resumen.entradilla}\n\n` +
    `${puntos}\n\n` +
    `💡 ${resumen.porqueImporta}\n\n` +
    FIRMA
  );
}

// ── Resumen sin IA ──────────────────────────────────────────────────────────

/**
 * Resume recortando, sin modelo de por medio.
 *
 * Es lo único que se puede hacer sin una clave de API: resumir de verdad —
 * decidir qué sobra y reescribirlo— es precisamente lo que hace un modelo de
 * lenguaje, y no hay forma de programarlo. Así que aquí no se reescribe nada:
 * se eligen las mejores piezas del artículo y se recorta a lo que cabe.
 *
 * Lo que se aprovecha, por este orden:
 *   1. Los "hechos clave" que CriptoNoticias pone en viñetas al principio de
 *      sus notas. Son el resumen que ya han hecho ellos, y es bueno.
 *   2. Los primeros párrafos, que en cualquier noticia llevan lo esencial —
 *      la pirámide invertida: lo importante arriba.
 *
 * El corte respeta el final de una frase: un mensaje que acaba a media
 * palabra parece roto, y ya no hay enlace donde seguir leyendo.
 */
export function resumenExtractivo(titulo: string, cuerpo: string): string | null {
  const lineas = cuerpo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    // Restos del maquetado del medio que no son noticia.
    .filter((l) => !/^(publicidad|te puede interesar|lee también|síguenos)/i.test(l));

  const vinetas: string[] = [];
  const parrafos: string[] = [];

  for (const linea of lineas) {
    const esVineta = /^[*\-•]\s+/.test(linea);
    const limpia = linea.replace(/^[*\-•]\s+/, "").trim();
    if (!limpia) continue;

    if (esVineta) {
      // Las viñetas de "hechos clave" van al principio del artículo. Una
      // viñeta que aparece después de varios párrafos es otra cosa (una lista
      // dentro del texto) y no sirve como resumen.
      if (parrafos.length === 0 && limpia.length > 20) vinetas.push(limpia);
      continue;
    }
    // Los titulillos y las líneas sueltas no son párrafos.
    if (limpia.length >= 80) parrafos.push(limpia);
  }

  if (parrafos.length === 0 && vinetas.length === 0) return null;

  const cabecera = `📰 ${titulo}\n\n`;
  const pie = `\n\n${FIRMA}`;
  // Lo que queda para el cuerpo del mensaje, contando ya cabecera y firma.
  let espacio = LIMITE_PIE_DE_FOTO - cabecera.length - pie.length;

  const bloques: string[] = [];

  // Los hechos clave primero: son lo que el lector quiere de un vistazo.
  const puntos = vinetas.slice(0, 3).map((v) => `▫️ ${v}`);
  if (puntos.length > 0) {
    const bloque = puntos.join("\n");
    if (bloque.length + 2 <= espacio) {
      bloques.push(bloque);
      espacio -= bloque.length + 2;
    }
  }

  // Y después los párrafos que quepan enteros. Nunca medio párrafo: se para
  // en el último que entre completo.
  for (const parrafo of parrafos.slice(0, 3)) {
    if (parrafo.length + 2 > espacio) break;
    bloques.push(parrafo);
    espacio -= parrafo.length + 2;
  }

  // Si no ha entrado ni un párrafo, se mete el primero cortado por la última
  // frase que quepa: mejor eso que publicar solo el titular.
  if (bloques.length === 0 || (puntos.length > 0 && bloques.length === 1)) {
    const recortado = cortarPorFrase(parrafos[0] ?? "", espacio - 2);
    if (recortado) bloques.push(recortado);
  }

  if (bloques.length === 0) return null;
  return cabecera + bloques.join("\n\n") + pie;
}

/** Recorta un texto sin partir una frase. Devuelve null si no cabe ni la
 *  primera. */
function cortarPorFrase(texto: string, maximo: number): string | null {
  if (maximo <= 0 || !texto) return null;
  if (texto.length <= maximo) return texto;

  const trozo = texto.slice(0, maximo);
  const corte = Math.max(trozo.lastIndexOf(". "), trozo.lastIndexOf(".\n"));
  // Si el punto más cercano deja el texto en menos de la mitad, no merece la
  // pena: sale una sola frase suelta y descolgada.
  if (corte < maximo / 2) return null;
  return trozo.slice(0, corte + 1);
}
