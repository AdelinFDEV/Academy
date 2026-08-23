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
