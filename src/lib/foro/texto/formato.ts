/**
 * El formato de los mensajes del foro (23-11-2026): negrita y listas.
 *
 * El mensaje se guarda como TEXTO PLANO; el formato son marcas que se
 * interpretan al pintar (`TextoForo`), nunca HTML:
 *   **así**   → negrita (dentro de una línea)
 *   - algo    → punto de una lista (también «• » y «* »)
 *   1. algo   → punto de una lista numerada (también «1) »)
 *
 * Lo comparten el pintado del hilo y los extractos, que las quitan.
 */

export const NEGRITA = /\*\*([^*\n]+?)\*\*/g;
export const PUNTO = /^[-•*]\s+/;
export const NUMERO = /^\d{1,3}[.)]\s+/;

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; numerada: boolean; puntos: string[] };

/** Un párrafo (separado por una línea en blanco) partido en texto y listas. */
export function bloquesDe(parrafo: string): Bloque[] {
  const bloques: Bloque[] = [];
  for (const linea of parrafo.split("\n")) {
    const numerada = NUMERO.test(linea);
    const punto = !numerada && PUNTO.test(linea);
    const ultimo = bloques[bloques.length - 1];
    if (numerada || punto) {
      const texto = linea.replace(numerada ? NUMERO : PUNTO, "");
      if (ultimo?.tipo === "lista" && ultimo.numerada === numerada) ultimo.puntos.push(texto);
      else bloques.push({ tipo: "lista", numerada, puntos: [texto] });
    } else if (ultimo?.tipo === "parrafo") {
      ultimo.texto += `\n${linea}`;
    } else {
      bloques.push({ tipo: "parrafo", texto: linea });
    }
  }
  // Las líneas vacías sueltas no hacen párrafos vacíos.
  return bloques.filter((b) => b.tipo === "lista" || b.texto.trim() !== "");
}

/** El texto sin las marcas, para extractos y descripciones. */
export function sinFormato(texto: string): string {
  return texto
    .split("\n")
    .map((l) => l.replace(NUMERO, "").replace(PUNTO, ""))
    .join("\n")
    .replace(NEGRITA, "$1");
}
