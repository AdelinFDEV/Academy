import "server-only";

import type { BloqueForo, TrozoForo } from "../tipos";
import { buscarEnlaces } from "./enlaces";

/**
 * El formato de los mensajes del foro (23-11-2026): negrita, listas, enlaces
 * permitidos y menciones.
 *
 * El mensaje se guarda como TEXTO PLANO. Aquí se convierte en una ESTRUCTURA
 * (`BloqueForo[]`, de `tipos.ts`) que el navegador pinta con elementos de
 * React (`TextoBloques`); nunca en HTML. Las marcas:
 *   **así**   → negrita (dentro de una línea)
 *   - algo    → punto de una lista (también «• » y «* »)
 *   1. algo   → punto de una lista numerada (también «1) »)
 *   @alias    → mención, solo si ese alias existe (lo dice quien llama)
 * y los enlaces, solo a los dominios de la lista blanca (`enlaces.ts`), que
 * se vuelven a comprobar AL PINTAR: si un dominio sale de la lista, deja de
 * ser enlace en todos los mensajes viejos sin tocar la base de datos.
 *
 * Lo comparten el hilo (`TextoForo`), la vista previa del formulario y los
 * extractos, que quitan las marcas (`sinFormato`).
 */

const NEGRITA = /\*\*([^*\n]+?)\*\*/g;
const PUNTO = /^[-•*]\s+/;
const NUMERO = /^\d{1,3}[.)]\s+/;

/**
 * Una mención: «@» que no va pegada a una palabra (un correo no lo es) y
 * detrás un alias con la forma de `perfilPublico.ts`. La puntuación del final
 * de la frase no es parte del alias.
 */
const MENCION = /(?<![A-Za-z0-9_.@/])@([A-Za-z][A-Za-z0-9_.]*)/g;
const ALIAS = /^[A-Za-z][A-Za-z0-9_.]{2,19}$/;

/** Menciones que se avisan en un mensaje, como mucho. */
export const MENCIONES_MAX = 5;

function aliasDe(bruto: string): string | null {
  const alias = bruto.replace(/[_.]+$/, "");
  return ALIAS.test(alias) ? alias : null;
}

/** Los alias que un texto PARECE mencionar, en minúsculas y sin repetir. */
export function candidatosDeMencion(texto: string, max = 200): string[] {
  const hallados = new Set<string>();
  for (const m of texto.matchAll(MENCION)) {
    const alias = aliasDe(m[1]);
    if (alias) hallados.add(alias.toLowerCase());
    if (hallados.size >= max) break;
  }
  return Array.from(hallados);
}

// ── De texto a estructura ───────────────────────────────────────────────────

/** Las menciones de un trozo de texto sin enlaces. */
function conMenciones(texto: string, validos: ReadonlySet<string>, negrita: boolean): TrozoForo[] {
  const trozos: TrozoForo[] = [];
  let desde = 0;
  for (const m of texto.matchAll(MENCION)) {
    const alias = aliasDe(m[1]);
    if (!alias || !validos.has(alias.toLowerCase())) continue;
    const en = m.index ?? 0;
    if (en > desde) trozos.push({ tipo: "texto", texto: texto.slice(desde, en), negrita });
    trozos.push({ tipo: "mencion", texto: `@${alias}`, negrita });
    desde = en + 1 + alias.length;
  }
  if (desde < texto.length) trozos.push({ tipo: "texto", texto: texto.slice(desde), negrita });
  return trozos;
}

/** Los enlaces permitidos y las menciones de un trozo de texto. */
function conEnlaces(texto: string, validos: ReadonlySet<string>, negrita: boolean): TrozoForo[] {
  const trozos: TrozoForo[] = [];
  let resto = texto;
  for (const enlace of buscarEnlaces(texto)) {
    const en = resto.indexOf(enlace.texto);
    if (en === -1) continue;
    if (en > 0) trozos.push(...conMenciones(resto.slice(0, en), validos, negrita));
    // Solo https y solo si sigue en la lista blanca; si no, se queda en texto.
    if (enlace.permitido && enlace.url?.startsWith("https://")) {
      trozos.push({ tipo: "enlace", texto: enlace.texto, url: enlace.url, negrita });
    } else {
      trozos.push({ tipo: "texto", texto: enlace.texto, negrita });
    }
    resto = resto.slice(en + enlace.texto.length);
  }
  if (resto) trozos.push(...conMenciones(resto, validos, negrita));
  return trozos;
}

/** Una línea (o un párrafo) partida en trozos: texto, negrita, enlaces y menciones. */
function enLinea(texto: string, validos: ReadonlySet<string>): TrozoForo[] {
  const trozos: TrozoForo[] = [];
  let desde = 0;
  for (const m of texto.matchAll(NEGRITA)) {
    const en = m.index ?? 0;
    if (en > desde) trozos.push(...conEnlaces(texto.slice(desde, en), validos, false));
    trozos.push(...conEnlaces(m[1], validos, true));
    desde = en + m[0].length;
  }
  if (desde < texto.length) trozos.push(...conEnlaces(texto.slice(desde), validos, false));
  return trozos;
}

/**
 * El texto de un mensaje convertido en bloques listos para pintar.
 * `aliasValidos`: los alias (en minúsculas) que existen de verdad; solo esos
 * se pintan como mención.
 */
export function estructuraDe(texto: string, aliasValidos: Iterable<string> = []): BloqueForo[] {
  const validos = new Set(aliasValidos);
  const bloques: BloqueForo[] = [];

  for (const parrafo of texto.split(/\n{2,}/)) {
    // Líneas seguidas del mismo tipo se juntan: texto con texto, puntos con puntos.
    let texto_: string[] = [];
    let lista: { numerada: boolean; puntos: string[] } | null = null;
    const cerrar = () => {
      if (texto_.length) {
        const junto = texto_.join("\n");
        if (junto.trim() !== "") bloques.push({ tipo: "parrafo", trozos: enLinea(junto, validos) });
        texto_ = [];
      }
      if (lista) {
        bloques.push({ tipo: "lista", numerada: lista.numerada, puntos: lista.puntos.map((p) => enLinea(p, validos)) });
        lista = null;
      }
    };

    for (const linea of parrafo.split("\n")) {
      const numerada = NUMERO.test(linea);
      const punto = !numerada && PUNTO.test(linea);
      if (numerada || punto) {
        const contenido = linea.replace(numerada ? NUMERO : PUNTO, "");
        if (texto_.length) cerrar();
        const abierta = lista as { numerada: boolean; puntos: string[] } | null;
        if (abierta && abierta.numerada === numerada) abierta.puntos.push(contenido);
        else {
          cerrar();
          lista = { numerada, puntos: [contenido] };
        }
      } else {
        if (lista) cerrar();
        texto_.push(linea);
      }
    }
    cerrar();
  }
  return bloques;
}

/** El texto sin las marcas, para extractos, descripciones y datos estructurados. */
export function sinFormato(texto: string): string {
  return texto
    .split("\n")
    .map((l) => l.replace(NUMERO, "").replace(PUNTO, ""))
    .join("\n")
    .replace(NEGRITA, "$1");
}
