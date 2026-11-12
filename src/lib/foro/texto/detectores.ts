import "server-only";
import { PALABRAS_BIP39 } from "./bip39";

/**
 * Los detectores de estafa (FORO.md §6.4). Lo que marcan SE RECHAZA EN EL
 * ACTO: no se guarda y el usuario ve qué tiene que quitar (decidido por el
 * admin el 12-11-2026; no hay cola de revisión).
 *
 * El criterio, que es lo difícil: en este foro la gente viene a PREGUNTAR por
 * estafas («me han escrito por Telegram ofreciendo un 10 % mensual, ¿es
 * fiable?»). Un detector que rechace la palabra «Telegram» o «10 % mensual»
 * deja sin poder preguntar justo a quien más lo necesita. Por eso cada uno
 * busca la OFERTA, no el tema: «escríbeme», «mi grupo de», «te garantizo»,
 * «envía a esta dirección». Hablar de algo pasa; proponerlo, no.
 *
 * Lo que se cuela por aquí lo recogen las otras capas: los enlaces fuera de
 * la lista blanca no entran, y los reportes ocultan el mensaje (§7).
 *
 * Reciben el texto en la forma de comparar (`paraComparar`): minúsculas, sin
 * tildes y sin letras de otros alfabetos. Cada rechazo se cuenta por detector
 * en `foro_rechazos`, sin el texto: ahí se ve cuál se pasa de estricto.
 */

export type Deteccion = { detector: string; mensaje: string };

type Detector = {
  id: string;
  mensaje: string;
  /** `t`: el texto sin los enlaces permitidos. `completo`: con ellos. */
  salta: (t: string, completo: string) => boolean;
};

// ── Frase semilla ───────────────────────────────────────────────────────────
// Doce o más palabras SEGUIDAS de la lista BIP-39 (inglés o español), sin nada
// entre ellas salvo espacios, comas, saltos o su número («1. abandon 2. …»).
// Una frase semilla tiene 12, 15, 18, 21 o 24. Con la lista real, una
// enumeración de monedas o un texto normal no llegan nunca a doce seguidas.
const RACHA_SEMILLA = 12;

function llevaFraseSemilla(t: string): boolean {
  const fichas = t.replace(/(?:^|\s)\d{1,2}\s*[.):-]?\s+/g, " ").split(/[\s,;|/-]+/);
  let racha = 0;
  for (const f of fichas) {
    if (f === "") continue;
    racha = PALABRAS_BIP39.has(f) ? racha + 1 : 0;
    if (racha >= RACHA_SEMILLA) return true;
  }
  return false;
}

// ── Piezas comunes ──────────────────────────────────────────────────────────

/** Dirección de Bitcoin, de Ethereum y compatibles, o de Tron. El texto llega
 *  en minúsculas, así que no se puede exigir el alfabeto base58 exacto. */
const DIRECCION = /\b(?:bc1[a-z0-9]{25,62}|[13][1-9a-z]{25,34}|0x[a-f0-9]{40}|t[1-9a-z]{33})\b/;
/** Pedir que envíen: imperativos y donaciones. «Envié a esta dirección y no llega» no salta. */
const PIDE_ENVIO =
  /\b(?:envia|enviad|enviame|envien|enviadme|manda|mandad|mandame|manden|transfiere|transferid|deposita|depositad|ingresa|ingresad|dona|donad|donacion|donaciones|donativo|send\s+(?:to|me|your)|deposit\s+to|donate|pagame|paguen)\b/;

const REDES = "whatsapp|whatsap|wasap|guasap|telegram|telegran|discord|signal|wechat|skype|messenger|instagram|insta|tiktok|snapchat|facebook|twitter";
const PRIVADO = "privado|priv|md|dm|interno|inbox|mensaje\\s+directo|mensaje\\s+privado";

const DETECTORES: Detector[] = [
  {
    id: "frase_semilla",
    mensaje:
      "El mensaje lleva lo que parece una frase semilla. No la publiques nunca, ni la tuya ni la de nadie: quien la lea puede vaciar esa cartera.",
    salta: llevaFraseSemilla,
  },
  {
    id: "clave_privada",
    mensaje:
      "El mensaje lleva lo que parece una clave privada. No la publiques nunca: da control total sobre los fondos. Si es el identificador de una transacción, pega mejor su enlace en un explorador (mempool.space, etherscan.io…).",
    // 64 hexadecimales (con o sin 0x), WIF de Bitcoin o una clave extendida.
    // Un identificador de transacción tiene la misma forma que una clave: por
    // eso se mira el texto SIN los enlaces permitidos, y el mensaje lo explica.
    salta: (t) =>
      new RegExp("(?:^|[^a-f0-9])(?:0x)?[a-f0-9]{64}(?:[^a-f0-9]|$)").test(t) ||
      /\b(?:5[1-9a-z]{50}|[kl][1-9a-z]{51})\b/.test(t) ||
      /\b[xyz]prv[1-9a-z]{80,}/.test(t),
  },
  {
    id: "direccion_pidiendo",
    mensaje: "No se puede publicar una dirección de cartera pidiendo que envíen fondos a ella.",
    salta: (t) => DIRECCION.test(t) && PIDE_ENVIO.test(t),
  },
  {
    id: "contacto_privado",
    mensaje:
      "No se puede pedir ni ofrecer contacto fuera del foro (por privado, WhatsApp, Telegram, Discord…). Así empiezan casi todas las estafas: lo que se responde, se responde aquí, a la vista de todos.",
    salta: (t, completo) =>
      // Enlaces y atajos a un chat.
      /\b(?:t\.me|telegram\.me|wa\.me|chat\.whatsapp\.com|discord\.gg|discord\.com\/invite|bit\.ly|tinyurl\.com)\b/.test(completo) ||
      // «mi telegram», «nuestro grupo de whatsapp», «mi usuario de discord».
      new RegExp(`\\b(?:mi|mis|nuestro|nuestra|este|esta)\\s+(?:(?:grupo|canal|numero|usuario|user|perfil|cuenta|servidor|comunidad|chat)\\s+(?:de\\s+|en\\s+)?)?(?:${REDES})\\b`).test(t) ||
      // «únete al grupo», «entra en el canal».
      /\b(?:unete|unanse|unios|entra|entrad|entren|sigueme|siganme|seguidme|apuntate|apuntense)\s+(?:a|al|en|a\s+mi|a\s+nuestro|en\s+mi|en\s+el|a\s+este|en\s+este)?\s*(?:grupo|canal|servidor|comunidad|chat)\b/.test(t) ||
      // «escríbeme», «háblame», «contáctame», «mándame un mensaje».
      /\b(?:escribeme|escribanme|escribidme|hablame|hablenme|habladme|contactame|contactenme|contactadme|agregame|agreguenme|agregadme|buscame\s+(?:en|por)|mandame\s+(?:un\s+)?(?:mensaje|md|dm|privado)|enviame\s+(?:un\s+)?(?:mensaje|md|dm|privado)|dm\s+me|pm\s+me|message\s+me|contact\s+me|text\s+me)\b/.test(t) ||
      // «te escribo por privado», «hablamos por DM», «lo vemos por interno».
      new RegExp(`\\b(?:te|os|les|le|lo|la)\\s+(?:escribo|hablo|mando|envio|paso|cuento|explico|ayudo|enseno|digo|comento)\\s+(?:\\w+\\s+){0,3}(?:por|al|en|via)\\s+(?:${PRIVADO}|${REDES})\\b`).test(t) ||
      new RegExp(`\\b(?:hablamos|hablemos|seguimos|sigamos|lo\\s+vemos|lo\\s+hablamos|te\\s+cuento|te\\s+explico|mas\\s+info|mas\\s+informacion|informacion|info)\\s+(?:por|al|en|via)\\s+(?:${PRIVADO}|${REDES})\\b`).test(t),
  },
  {
    id: "telefono",
    mensaje: "No publiques números de teléfono, ni el tuyo ni el de nadie.",
    // Con prefijo internacional, o un móvil español (9 cifras que empiezan por
    // 6 o 7). Nueve cifras a secas no bastan: «100000000 sats» es un bitcoin.
    salta: (t) =>
      new RegExp("(?:^|[^\\w.,])(?:\\+|00)[1-9]\\d(?:[\\s.-]?\\d){7,12}(?!\\d)").test(t) ||
      new RegExp(
        "(?:^|[^\\d.,+-])[67]\\d{2}[\\s.-]?\\d{3}[\\s.-]?\\d{3}(?![\\d.,]*\\d)(?!\\s*(?:sats?|satoshis?|btc|eth|usdt?|usdc|eur|euros?|dolares|pesos|€|\\$|%))",
      ).test(t),
  },
  {
    id: "email",
    mensaje: "No publiques direcciones de correo, ni la tuya ni la de nadie.",
    salta: (t) =>
      /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\sarroba\s)\s*[a-z0-9-]+\s*(?:\.|\(dot\)|\[dot\]|\spunto\s)\s*(?:com|net|org|es|io|me|info|eu|co|live|mail)\b/.test(t),
  },
  {
    id: "referido",
    mensaje: "No se pueden publicar códigos ni enlaces de referido o de invitación.",
    salta: (t, completo) =>
      // Quien lo OFRECE: «usa mi código», «regístrate con mi enlace».
      /\b(?:usa|usad|usen|utiliza|utilizad|pon|poned|mete|introduce)\s+(?:mi|el|este|nuestro)\s+(?:codigo|enlace|link|cupon)\b/.test(t) ||
      /\b(?:registrate|registraos|registrense|date\s+de\s+alta|apuntate|entra|entrad)\s+(?:con|desde|por|en|usando)\s+(?:mi|este|el\s+siguiente|nuestro)\s+(?:codigo|enlace|link)\b/.test(t) ||
      /\b(?:mi|nuestro)\s+(?:codigo|enlace|link|cupon)\s+de\s+(?:referido|referidos|invitacion|afiliado|afiliados|descuento|promo|promocion|registro|bienvenida)\b/.test(t) ||
      /\b(?:con|usando)\s+mi\s+(?:codigo|enlace|link|cupon)\b/.test(t) ||
      /\b(?:invite|referral|promo|coupon)\s+code\s*[:=]/.test(t) ||
      // Un enlace que ya lleva el código dentro, aunque sea a un dominio permitido.
      /[?&](?:ref|refid|referral|referrer|invite|invitecode|aff|affiliate|code|r)=[^&\s]+/.test(completo),
  },
  {
    id: "promesa_rentabilidad",
    mensaje:
      "El mensaje ofrece o garantiza una ganancia. Nadie puede garantizarla, y prometerla es la marca de una estafa. Si lo que quieres es preguntar por una oferta así, cuéntala con otras palabras («me ofrecen…», «¿es fiable…?»).",
    salta: (t) =>
      // Quien PROMETE, en primera persona o en imperativo.
      /\b(?:garantizo|garantizamos|te\s+garantizo|te\s+aseguro|os\s+aseguro|aseguramos|ofrezco|ofrecemos|te\s+ofrezco)\s+(?:\w+\s+){0,4}(?:rentabilidad|ganancia|ganancias|beneficio|beneficios|retorno|retornos|ingresos|intereses|profit|\d+\s?%|x\s?\d+)/.test(t) ||
      /\b(?:gana|ganad|ganaras|ganareis|consigue|conseguid|obten|obtened|obtendras|genera|generad|cobra)\s+(?:hasta\s+|un\s+|mas\s+de\s+)?(?:\d+[\d.,]*\s?(?:%|€|\$|euros|dolares|usd|usdt|btc)|x\s?\d+|dinero|ingresos\s+pasivos)/.test(t) ||
      /\b(?:duplica|duplico|duplicamos|multiplica|multiplico|multiplicamos|triplica|triplico)\s+(?:tu|tus|vuestro|vuestros)\s+(?:dinero|capital|inversion|bitcoin|bitcoins|btc|cripto|criptos|ahorros|fondos)\b/.test(t) ||
      /\b(?:gestiono|gestionamos|administro|administramos|invierto|invertimos|opero|operamos|muevo|trabajo)\s+(?:tu|tus|vuestro|vuestros)\s+(?:dinero|capital|cuenta|fondos|cripto|criptos|ahorros|bitcoin|btc)\b/.test(t) ||
      /\b(?:senales|signals)\s+(?:vip|premium|de\s+pago|privadas?|exclusivas?)\b/.test(t) ||
      /\b(?:guaranteed\s+(?:profit|profits|returns?|income)|risk[\s-]?free\s+(?:profit|returns?|investment)|double\s+your\s+(?:money|bitcoin|btc|crypto))\b/.test(t) ||
      /\b(?:inversion|oportunidad|rentabilidad|ganancia|ganancias)\s+(?:100\s?%\s+)?(?:segura|seguras|garantizada|garantizadas|asegurada|aseguradas)\s*,?\s*(?:escribe|escribeme|contacta|contactame|unete|entra|apuntate|invierte\s+ya|invierte\s+ahora)/.test(t),
  },
  {
    id: "suplanta_admin",
    mensaje: "No te presentes como AdelinBTC, como soporte ni como parte del equipo de la academia o de un exchange.",
    salta: (t) =>
      /\b(?:soy|somos)\s+(?:el\s+|la\s+|del\s+|de\s+|parte\s+del\s+|un\s+|una\s+)?(?:admin|administrador|administradora|moderador|moderadora|soporte|staff|adelin|adelinbtc)\b/.test(t) ||
      /\b(?:soy|somos)\s+(?:del\s+|de\s+|el\s+|parte\s+del\s+)?(?:equipo|soporte|servicio\s+tecnico|departamento)\s+(?:oficial\s+)?(?:de|del)\s+(?:adelin|adelinbtc|la\s+academia|binance|coinbase|kraken|metamask|ledger|trezor|bybit|bitget|bit2me)\b/.test(t),
  },
];

/**
 * La primera detección, o null si el texto pasa.
 * @param sinEnlaces el texto, en la forma de comparar, sin los enlaces permitidos
 * @param completo   el mismo texto, con ellos
 */
export function detectar(sinEnlaces: string, completo: string): Deteccion | null {
  for (const d of DETECTORES) {
    if (d.salta(sinEnlaces, completo)) return { detector: d.id, mensaje: d.mensaje };
  }
  return null;
}
