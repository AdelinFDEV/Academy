import "server-only";
import { createHash } from "node:crypto";

/**
 * Normalizar el texto de un usuario ANTES de validarlo, contarlo o guardarlo
 * (FORO.md §6.4). Sin esto, una palabra vetada se esquiva con un carácter
 * invisible en medio, y un límite de 150 caracteres se llena de nada.
 *
 * Hay DOS formas, y no se mezclan:
 *   · `limpiar`      → lo que se GUARDA y se enseña. Conserva tildes, eñes,
 *                      mayúsculas y emojis; solo quita lo que no se ve.
 *   · `paraComparar` → lo que LEEN los filtros. Agresiva: sin tildes, en
 *                      minúsculas y con las letras de otros alfabetos pasadas
 *                      a la latina. Nunca se guarda ni se enseña.
 *
 * Las expresiones con `\p{…}` se construyen con `new RegExp` y no como
 * literales: el `target` del proyecto es ES2017 y no las admite escritas.
 */

/** Controles, ancho cero, dirección del texto, guion blando y «etiquetas» invisibles. */
const INVISIBLES = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u00AD\\u034F\\u061C" +
    "\\u115F\\u1160\\u17B4\\u17B5\\u180E\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u206F" +
    "\\u3164\\uFEFF\\uFFA0\\uFFF9-\\uFFFB]|[\\u{E0000}-\\u{E007F}]",
  "gu",
);
/** Todos los espacios raros (de no separación, tipográficos, ideográfico) son un espacio. */
const ESPACIOS = new RegExp("[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]", "g");
/** Separadores de línea y de párrafo de Unicode, y el «siguiente línea». */
const SALTOS_RAROS = new RegExp("[\u2028\u2029\u0085]", "g");
/** Más de dos marcas combinadas seguidas es texto «zalgo», que se sale de su línea. */
const ZALGO = new RegExp("(\\p{M}{2})\\p{M}+", "gu");
const MARCAS = new RegExp("\\p{M}+", "gu");

/** El texto tal como se guarda. `unaLinea` es para el título. */
export function limpiar(bruto: string, { unaLinea = false }: { unaLinea?: boolean } = {}): string {
  let t = bruto.normalize("NFC").replace(/\r\n?/g, "\n").replace(SALTOS_RAROS, "\n");
  t = t.replace(INVISIBLES, "").replace(ESPACIOS, " ").replace(ZALGO, "$1");
  if (unaLinea) t = t.replace(/\n+/g, " ");
  return t
    .split("\n")
    .map((linea) => linea.replace(/ {2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Letras de otros alfabetos que se ven igual que una latina. No es una tabla
 * completa de confusables: son las que de verdad se usan para colar «еstafa»
 * (con «е» cirílica) por un filtro que busca «estafa».
 */
const PARECIDAS: Record<string, string> = {
  // Cirílico
  а: "a", в: "b", е: "e", к: "k", м: "m", н: "h", о: "o", р: "p", с: "c", т: "t", у: "y", х: "x",
  і: "i", ј: "j", ѕ: "s", ԁ: "d", һ: "h", ӏ: "l", ё: "e", ї: "i",
  // Griego
  α: "a", β: "b", ε: "e", ι: "i", κ: "k", ν: "v", ο: "o", ρ: "p", τ: "t", υ: "u", χ: "x",
};
const PARECIDAS_RE = new RegExp(`[${Object.keys(PARECIDAS).join("")}]`, "g");

/**
 * La forma que leen los filtros: NFKC (deshace el ancho completo «ｅｓｔａｆａ»
 * y las letras de fantasía), minúsculas, sin tildes y con las letras parecidas
 * de otros alfabetos pasadas a la latina.
 */
export function paraComparar(texto: string): string {
  return limpiar(texto)
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(MARCAS, "")
    .replace(PARECIDAS_RE, (c) => PARECIDAS[c] ?? c);
}

/**
 * Huella de un texto: sha-256 de sus letras y números en la forma de comparar.
 * Dos mensajes que solo cambian en espacios, signos o mayúsculas dan la misma.
 */
export function huella(...partes: string[]): string {
  const base = partes
    .map((p) => paraComparar(p).replace(/[^a-z0-9]+/g, " ").trim())
    .join("\n");
  return createHash("sha256").update(base, "utf8").digest("hex");
}

/** El trozo de URL de una pregunta: solo a-z, 0-9 y guiones, como exige la tabla. */
export function slugDe(titulo: string): string {
  const s = paraComparar(titulo)
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || "pregunta";
}

/** Cuántos caracteres ve una persona (un emoji cuenta uno, no dos). */
export function largo(texto: string): number {
  return Array.from(texto).length;
}
