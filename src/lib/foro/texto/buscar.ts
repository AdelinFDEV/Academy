import "server-only";

/**
 * Las palabras de una búsqueda en el foro (23-11-2026).
 *
 * Lo que escribe el usuario NUNCA llega a la base de datos como texto libre:
 * aquí se convierte en una lista corta de palabras sueltas, en minúsculas,
 * sin tildes y solo con letras y números. La función `foro_buscar` las recibe
 * como datos (un `text[]`) y las compara con `position`: no hay comodines ni
 * SQL que se pueda colar en una búsqueda.
 */

/** Lo más largo que se acepta en la caja de búsqueda. */
export const CONSULTA_MAX = 80;
/** Palabras que se buscan como mucho. */
const PALABRAS_MAX = 8;

/**
 * Palabras que no distinguen una pregunta de otra. Solo se quitan al buscar
 * preguntas PARECIDAS a un título; en el buscador se respeta lo que se pide.
 */
const VACIAS = new Set(
  ("a al algo alguien alguna alguno ante antes aqui asi aun aunque bien cada casi como con contra cual cuando " +
    "cuanto de del desde donde dos el ella ellas ellos en entre era es esa ese eso esta estan estar este esto " +
    "estoy fue ha hace hacer hacia han hasta hay he la las le les lo los mas me mi mis mucho muy nada ni no nos " +
    "o os otra otro para pero poco por porque puede puedo que quien se segun ser si sin sobre son su sus tambien " +
    "tan te tengo tiene todo todos tu tus un una uno unos y ya yo saber hola ayuda duda pregunta gracias favor " +
    "alguien sabe necesito quiero quisiera").split(" "),
);

/** Minúsculas y sin tildes: la misma forma que `foro__plano` en la base de datos. */
export function plano(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Lo que se enseña de vuelta en la caja: sin saltos, recortado. */
export function consultaLimpia(bruto: unknown): string {
  if (typeof bruto !== "string") return "";
  return Array.from(bruto.replace(/\s+/g, " ").trim()).slice(0, CONSULTA_MAX).join("");
}

/**
 * Las palabras que se buscan. `significativas`: sin las palabras vacías y de
 * tres letras o más (para comparar títulos); si no, de dos o más.
 */
export function palabrasDe(consulta: string, { significativas = false }: { significativas?: boolean } = {}): string[] {
  const minimo = significativas ? 3 : 2;
  const unicas = new Set<string>();
  for (const p of plano(consulta).split(/[^a-z0-9]+/)) {
    if (p.length < minimo || p.length > 40) continue;
    if (significativas && VACIAS.has(p)) continue;
    unicas.add(p);
    if (unicas.size >= PALABRAS_MAX) break;
  }
  return Array.from(unicas);
}

/**
 * Un título partido en trozos, con lo que coincide con la búsqueda marcado.
 * Se compara letra a letra en su forma plana para que «tributacion» marque
 * «Tributación» sin mover ningún índice.
 */
export function marcar(titulo: string, palabras: string[]): { texto: string; marca: boolean }[] {
  const letras = Array.from(titulo);
  // Cada letra, a UNA letra plana: así los índices de las dos formas coinciden.
  const llano = letras.map((l) => plano(l).slice(0, 1) || l).join("");
  const marcada = new Array<boolean>(letras.length).fill(false);
  for (const p of palabras) {
    let en = llano.indexOf(p);
    while (en !== -1) {
      for (let i = en; i < en + p.length && i < marcada.length; i++) marcada[i] = true;
      en = llano.indexOf(p, en + p.length);
    }
  }
  const trozos: { texto: string; marca: boolean }[] = [];
  for (let i = 0; i < letras.length; i++) {
    const ultimo = trozos[trozos.length - 1];
    if (ultimo && ultimo.marca === marcada[i]) ultimo.texto += letras[i];
    else trozos.push({ texto: letras[i], marca: marcada[i] });
  }
  return trozos;
}
