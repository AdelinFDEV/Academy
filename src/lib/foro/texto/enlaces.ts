import "server-only";

/**
 * Los enlaces de un mensaje (FORO.md §6.4): solo a dominios de una lista
 * blanca. Un enlace es la forma más corta de sacar a alguien del foro hacia
 * una estafa, así que aquí lo que no está permitido expresamente, no entra.
 *
 * Se compara el DOMINIO EXACTO después de pasar la URL por `new URL()`, nunca
 * con «contiene» o «termina en»: `youtube.com.estafa.io` contiene
 * `youtube.com`, y `xn--…` puede dibujar las mismas letras que otro dominio.
 */

/** Dominios permitidos, sin `www.`. Para añadir uno: aquí, y solo aquí. */
export const DOMINIOS_PERMITIDOS: readonly string[] = [
  "adelinacademy.com",
  // Vídeo
  "youtube.com",
  "youtu.be",
  // Exploradores de bloques
  "mempool.space",
  "blockstream.info",
  "blockchair.com",
  "etherscan.io",
  "solscan.io",
  "bscscan.com",
  "arbiscan.io",
  "basescan.org",
  "polygonscan.com",
  "tronscan.org",
  // Webs oficiales y de referencia
  "bitcoin.org",
  "ethereum.org",
  "coingecko.com",
  "coinmarketcap.com",
  // Organismos
  "agenciatributaria.gob.es",
  "sede.agenciatributaria.gob.es",
  "boe.es",
  "cnmv.es",
  "bde.es",
  "europa.eu",
  "eur-lex.europa.eu",
];

/**
 * Algo con pinta de enlace: con protocolo, con `www.`, o un dominio a secas
 * con una terminación conocida («entra en estafa.com»). Lo tercero importa:
 * sin ello, bastaría con no escribir el `https://`.
 */
const TLD =
  "com|net|org|io|es|eu|info|xyz|app|co|me|gg|ly|to|cc|ai|finance|exchange|money|fund|pro|site|online|" +
  "top|club|vip|live|link|click|shop|store|tech|dev|cloud|space|world|network|capital|trade|trading|" +
  "crypto|eth|sol|bit|ru|cn|tk|ml|ga|cf|pw|ws|biz|us|uk|de|fr|it|pt|mx|ar|cl|pe|ro|gob|edu|tv|news|blog";
const ENLACE = new RegExp(
  "(?:[a-z][a-z0-9+.-]*:\\/\\/[^\\s<>\"']+)" + // con protocolo, el que sea
    "|(?:www\\.[^\\s<>\"']+)" +
    `|(?:(?<![a-z0-9@._-])(?:[a-z0-9-]+\\.)+(?:${TLD})(?![a-z0-9-])(?:\\/[^\\s<>"']*)?)`,
  "gi",
);

export type EnlaceHallado = { texto: string; url: string | null; permitido: boolean };

/** Quita la puntuación que cierra la frase, que no es parte del enlace. */
const sinColaDeFrase = (t: string) => t.replace(/[.,;:!?)\]»”’'"]+$/, "");

/** Busca todo lo que parezca un enlace y dice si se puede publicar. */
export function buscarEnlaces(texto: string): EnlaceHallado[] {
  const hallados: EnlaceHallado[] = [];
  for (const m of texto.matchAll(ENLACE)) {
    const bruto = sinColaDeFrase(m[0]);
    if (!bruto) continue;
    hallados.push(analizar(bruto));
  }
  return hallados;
}

function analizar(bruto: string): EnlaceHallado {
  const conProtocolo = /^[a-z][a-z0-9+.-]*:\/\//i.test(bruto) ? bruto : `https://${bruto}`;
  let url: URL;
  try {
    url = new URL(conProtocolo);
  } catch {
    return { texto: bruto, url: null, permitido: false };
  }
  const dominio = url.hostname.toLowerCase().replace(/^www\./, "");
  const permitido =
    url.protocol === "https:" &&
    url.username === "" &&
    url.password === "" &&
    url.port === "" &&
    // `new URL` ya convierte a punycode: un dominio con letras de otro
    // alfabeto llega aquí como `xn--…` y no está en la lista.
    !dominio.includes("xn--") &&
    DOMINIOS_PERMITIDOS.includes(dominio);
  return { texto: bruto, url: permitido ? url.toString() : null, permitido };
}
