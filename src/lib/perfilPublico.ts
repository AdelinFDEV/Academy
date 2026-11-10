/**
 * El perfil público: lo que el foro enseñará de cada autor (ver FORO.md).
 *
 * Dos piezas, alias y foto. Ninguna de las dos es el nombre de la cuenta ni
 * el email: esos son datos personales y no salen nunca en el foro.
 *
 * Este archivo lo leen el navegador (para avisar mientras se escribe) y el
 * servidor (para decidir de verdad). La regla vive en un solo sitio para que
 * los dos digan lo mismo; la que manda es la del servidor, en /api/perfil.
 */

/**
 * Las fotos de perfil. Las crea el admin: el usuario no sube fotos propias
 * (TAREAS.md, tarea 3), y eso quita la moderación de imágenes y el Storage.
 *
 * Mientras no estén hechas, `src` es null y se pinta una baldosa de reserva
 * con su color y su icono. Cuando lleguen, se guardan en `public/avatares/`
 * como WebP de ~256 px (o SVG, como las de ahora) y se pone aquí su ruta:
 * nada más cambia.
 *
 * ⚠️ El `id` es lo que se guarda en `profiles.avatar`: no se renombra nunca,
 * o los que la eligieron se quedan sin foto. Para quitar una, se borra de la
 * lista y quien la tuviera vuelve a su inicial.
 */
export type VarianteAvatar = {
  id: string;
  nombre: string;
  /** Ruta de la imagen en `public/`, o null mientras no exista. */
  src: string | null;
  /** Colores de la baldosa de reserva (y del borde cuando haya imagen). */
  color: string;
  color2: string;
  icono: "bitcoin" | "grafica" | "escudo" | "diamante";
};

export const AVATARES: readonly VarianteAvatar[] = [
  // Los cuatro personajes del mercado: el toro que sube, el oso que se ha
  // dormido esperando, la ballena con su moneda y el que se va «to the moon».
  { id: "toro",       nombre: "Toro",       src: "/avatares/toro.svg",       color: "#ff6b2b", color2: "#ffb07a", icono: "bitcoin" },
  { id: "oso",        nombre: "Oso",        src: "/avatares/oso.svg",        color: "#2f7cf6", color2: "#8ec2ff", icono: "grafica" },
  { id: "ballena",    nombre: "Ballena",    src: "/avatares/ballena.svg",    color: "#16a37f", color2: "#7fe3c3", icono: "escudo" },
  { id: "astronauta", nombre: "Astronauta", src: "/avatares/astronauta.svg", color: "#5b3fb5", color2: "#1e1747", icono: "diamante" },
];

/**
 * La foto real del admin (10-11-2026, pedido suyo): la única foto personalizada
 * de la web. **No está en `AVATARES` a propósito**, así que no sale en el
 * selector de nadie; el editor solo la enseña al admin, y /api/perfil rechaza
 * guardarla a cualquier otro rol. La usa también el bloque «Escríbeme por
 * Instagram» de la portada.
 */
export const AVATAR_ADMIN: VarianteAvatar = {
  id: "adelin",
  nombre: "Tu foto",
  src: "/avatares/adelin.webp",
  color: "#ff6b2b",
  color2: "#ffb07a",
  icono: "bitcoin",
};

export function avatarPorId(id: string | null | undefined): VarianteAvatar | null {
  if (!id) return null;
  if (id === AVATAR_ADMIN.id) return AVATAR_ADMIN;
  return AVATARES.find((a) => a.id === id) ?? null;
}

// ── El alias ────────────────────────────────────────────────────────────────

export const ALIAS_MIN = 3;
export const ALIAS_MAX = 20;
/** Días entre un cambio de alias y el siguiente. El primero es libre. */
export const ALIAS_DIAS_ENTRE_CAMBIOS = 30;

/**
 * Empieza por letra; luego letras sin tilde, números, `_` y `.`. Sin tildes
 * ni otros alfabetos a propósito: con ellos «Adelín» o una «а» cirílica
 * pasarían por el admin a la vista y no al filtro. La misma expresión está en
 * la restricción de la tabla (`scripts/create-perfil-publico.sql`).
 */
const FORMATO = /^[A-Za-z][A-Za-z0-9_.]{2,19}$/;


// ── El esqueleto de un alias ────────────────────────────────────────────────
//
// Para comparar no se mira el alias tal cual, sino su «esqueleto»: lo que se
// LEE a simple vista. Así «AdeIin» (con i mayúscula), «4d3l1n», «Ade_l.in» o
// «Adelyn» se quedan en lo mismo que «Adelin», y una lista de palabras no se
// esquiva cambiando una letra por un número.

/** Lo que se parece a una letra se convierte en esa letra. */
const PARECIDOS: Record<string, string> = {
  "0": "o", "1": "i", "2": "z", "3": "e", "4": "a", "5": "s", "6": "g", "7": "t", "8": "b", "9": "g",
  // `l` e `i` son la misma raya en muchas tipografías («AdeIin»), y la `y`
  // suena igual: las tres cuentan como `i`.
  l: "i", y: "i",
  // Mismo sonido en español.
  k: "c", q: "c",
  // La `v` se usa como `u` para esquivar filtros («Fvck»).
  v: "u", w: "u",
};

function esqueleto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[_.]/g, "")
    .replace(/[0-9a-z]/g, (c) => PARECIDOS[c] ?? c);
}

/** El esqueleto con las letras repetidas en una: «Addeliiin» → «adein». */
function compacto(texto: string): string {
  return esqueleto(texto).replace(/(.)\1+/g, "$1");
}

/** Cuántas letras hay que cambiar, poner o quitar para pasar de `a` a `b`. */
function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

/** ¿Hay un trozo de `texto` a una letra (o menos) de `objetivo`? */
function contieneParecido(texto: string, objetivo: string): boolean {
  for (let largo = objetivo.length - 1; largo <= objetivo.length + 1; largo++) {
    for (let i = 0; i + largo <= texto.length; i++) {
      if (distancia(texto.slice(i, i + largo), objetivo) <= 1) return true;
    }
  }
  return false;
}

// ── 1 · Suplantar a AdelinBTC ───────────────────────────────────────────────
//
// Decidido por el admin el 06-11-2026: TERMINANTEMENTE PROHIBIDO cualquier
// alias que se parezca a Adelin, AdelinBTC, AdelinYT… ni con números, ni con
// letras cambiadas, ni con algo delante o detrás. En un foro de cripto, quien
// se hace pasar por el creador es el que acaba pidiendo dinero «por privado».
//
// Tres redes, de más fina a más gruesa:
//  1. el esqueleto compacto contiene «adein» (Adelin, Adel1n, AdeIin, Addelinn,
//     Adelyn, xAdelinBTCx…);
//  2. algún trozo del esqueleto está a UNA letra de «adeiin» (Adelim, Edelin,
//     Adelinn, Adeli_n…);
//  3. empieza por «adei» o «adein» y lleva detrás btc, yt, oficial o similar
//     (Adel_btc, AdeYT…).
// Bloquea también algún nombre real («Adelina»): es el precio de que no se
// cuele ninguno parecido, y lo ha pedido así el admin.

const NOMBRE = "adelin";

/** Lo que se pone detrás para parecer oficial («Adel_btc», «AdeYT»). En
 *  esqueleto compacto, como el alias con el que se comparan. */
const COLETILLAS = ["btc", "bitcoin", "yt", "youtube", "tube", "oficial", "official", "real", "tv", "crypto", "cripto"]
  .map((x) => compacto(x));

function pareceAdelin(alias: string): boolean {
  // La `h` no suena: «Adhelin» se lee igual. Solo aquí: en los tacos
  // haría falta («bitch» sin h es «bitc», y vetaría «BitcoinMaxi»).
  const e = esqueleto(alias).replace(/h/g, "");
  const c = compacto(alias).replace(/h/g, "");
  if (c.includes(compacto(NOMBRE))) return true;
  if (contieneParecido(e, esqueleto(NOMBRE))) return true;
  if (COLETILLAS.some((x) => c.startsWith("ade" + x) || c.startsWith("adei" + x) || c.startsWith("adein" + x))) return true;
  return false;
}

// ── 2 · Parecer de la academia, de un exchange o de un sorteo ───────────────
//
// Aquí basta con que contenga la palabra (ya en esqueleto): son palabras
// largas que no esconde ninguna otra normal.

const OFICIALES = [
  "admin", "academy", "academia", "soporte", "support", "moderador", "moderacion",
  "moderator", "staff", "oficial", "official", "sistema", "system", "premium",
  "binance", "coinbase", "kraken", "bitget", "bybit", "metamask", "ledger", "trezor",
  "airdrop", "giveaway", "sorteo", "regalo", "inversion", "invest", "profit", "ganancias",
].map(esqueleto);

// ── 3 · Palabras malsonantes ────────────────────────────────────────────────
//
// Decidido por el admin el 06-11-2026: nada malsonante en español (y lo
// básico en inglés). El problema de estas listas son las palabras normales
// que esconden un taco: «reputación» lleva «puta», «computadora» lleva
// «puta», «diputado» lleva «puta»... Por eso, antes de buscar, se BORRAN del
// alias las palabras inocentes de `INOCENTES`; lo que queda se compara con
// `MALSONANTES`. Si alguien se queja de un falso positivo, se añade su palabra
// a `INOCENTES`, no se quita el taco de la lista.

const MALSONANTES = [
  // Español
  "puta", "puto", "puton", "putita", "putero", "hijoputa", "hdp", "polla", "pollon", "gilipoyas",
  "mierda", "joder", "jodete", "follar", "follador", "cabron", "cabrona", "maricon", "marica",
  "zorra", "zorrita", "conyo", "conio", "chocho", "verga", "pene", "pinga", "picha",
  "cojon", "cojones", "huevon", "pendejo", "pendeja", "culero", "culiao", "ojete", "mamon", "mamada",
  "chupamela", "pajero", "pajillero", "corrida", "teta", "tetas", "tetona", "bollera",
  "malparido", "subnormal", "retrasado", "mongolo", "imbecil", "idiota", "estupido",
  "capullo", "soplapollas", "comemierda", "cagar", "cagon", "meado", "furcia", "ramera", "guarra",
  "perra", "chingar", "chingada", "boludo", "pelotudo", "sexo", "porno", "xxx",
  "violador", "nazi", "hitler", "negrata", "sudaca",
  // Inglés, lo básico
  "fuck", "shit", "bitch", "whore", "slut", "cunt", "dick", "cock", "pussy", "nigga", "nigger",
  "fag", "porn", "sex", "anal", "rape",
].map(esqueleto);

const INOCENTES = [
  "reputacion", "reputado", "computa", "computadora", "computo", "disputa", "disputo",
  "diputado", "diputada", "imputa", "imputo", "amputa", "deputy",
  "repollo", "pollo", "polluelo", "pollito", "apollo", "pollock",
  "pinguino", "tetanos", "tetris", "tetra", "penelope", "peneira",
  "sexto", "sexta", "essex", "sussex", "analisis", "analista", "analytic", "canal", "banal",
  "dickens", "hitchcock", "peacock", "cockpit", "scrape", "grape", "drape", "fagot",
  "shitake", "mamonde",
].map(esqueleto);

/**
 * ¿Hay una malsonante que NO forme parte de una palabra inocente?
 *
 * No se borran las inocentes y luego se busca, porque «pollón» lleva dentro
 * «pollo» y desaparecería con ella. Se mira cada aparición de cada taco y
 * solo se perdona si una inocente la cubre ENTERA.
 */
function hayTacoSuelto(texto: string, tacos: string[], inocentes: string[]): boolean {
  const cubierto = new Array<boolean>(texto.length).fill(false);
  for (const ok of inocentes) {
    for (let k = texto.indexOf(ok); k !== -1; k = texto.indexOf(ok, k + 1)) {
      for (let x = k; x < k + ok.length; x++) cubierto[x] = true;
    }
  }
  for (const m of tacos) {
    for (let k = texto.indexOf(m); k !== -1; k = texto.indexOf(m, k + 1)) {
      for (let x = k; x < k + m.length; x++) if (!cubierto[x]) return true;
    }
  }
  return false;
}

/** Las letras repetidas, en una: «pooolla» → «pola». */
const unaVez = (t: string) => t.replace(/(.)\1+/g, "$1");

function esMalsonante(alias: string): boolean {
  const e = esqueleto(alias);
  return hayTacoSuelto(e, MALSONANTES, INOCENTES)
    // «xxx» se queda en «x» al juntar letras, y vetaría cualquier alias con
    // una x («BitcoinMaxi»): en esta segunda pasada solo cuentan los tacos que
    // siguen teniendo al menos tres letras.
    || hayTacoSuelto(unaVez(e), MALSONANTES.map(unaVez).filter((m) => m.length >= 3), INOCENTES.map(unaVez));
}

/**
 * null si vale; si no, el motivo en una frase, para enseñárselo al usuario.
 *
 * `esAdmin` solo salta la regla de no parecerse a AdelinBTC: es su nombre.
 * Las demás valen también para él.
 */
export function problemaDelAlias(bruto: string, { esAdmin = false }: { esAdmin?: boolean } = {}): string | null {
  const alias = bruto.trim();
  if (alias.length < ALIAS_MIN) return `Tiene que tener al menos ${ALIAS_MIN} caracteres.`;
  if (alias.length > ALIAS_MAX) return `Como mucho ${ALIAS_MAX} caracteres.`;
  if (!/^[A-Za-z]/.test(alias)) return "Tiene que empezar por una letra.";
  if (!FORMATO.test(alias)) return "Solo letras sin tilde, números, guion bajo (_) y punto.";
  if (/[_.]{2}/.test(alias)) return "No pongas dos símbolos seguidos.";
  if (/[_.]$/.test(alias)) return "No puede terminar en un símbolo.";
  if (!esAdmin && pareceAdelin(alias)) {
    return "Ese alias se parece demasiado al de AdelinBTC. Elige otro que no se pueda confundir.";
  }
  const e = esqueleto(alias);
  if (OFICIALES.some((v) => e.includes(v))) {
    return "Ese alias no está permitido: no puede parecer de la academia, de un exchange o de un sorteo.";
  }
  if (esMalsonante(alias)) return "Ese alias lleva una palabra que no está permitida.";
  return null;
}
