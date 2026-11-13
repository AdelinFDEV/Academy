import { createHash } from "crypto";

/**
 * La medición propia de visitas (tabla `visitas`, panel /admin). Solo servidor.
 *
 * Sin cookies ni almacenamiento en el navegador, y sin guardar la IP: con la
 * IP, el navegador y una sal que cambia cada día se calcula `visitante`, un
 * código de 16 caracteres que cuenta visitantes únicos de un día y no permite
 * seguir a nadie de un día a otro. Lo demás que se guarda es grueso: país,
 * tipo de dispositivo, sistema operativo y de dónde llegó.
 */

const DIA_RUMANIA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" });

/** Robots, rastreadores y herramientas: no son visitas. */
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|embedly|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|monitor|uptime/i;

export function esBot(ua: string): boolean {
  return !ua || BOT.test(ua);
}

export function codigoVisitante(ip: string, ua: string, ahora = Date.now()): string {
  const dia = DIA_RUMANIA.format(ahora);
  // La sal no se guarda en ningún sitio: sale de un secreto del servidor y del
  // día. Al cambiar el día, los códigos de ayer ya no se pueden recalcular.
  const secreto = process.env.ANALITICA_SAL || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`${dia}|${secreto}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

export function dispositivoDe(ua: string): "movil" | "tablet" | "escritorio" {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "movil";
  return "escritorio";
}

export function sistemaDe(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Otro";
}

/** Canal de llegada a partir del UTM (si lo hay) y del sitio de procedencia. */
export function canalDe(host: string | null, utmSource: string | null): string {
  const fuente = (utmSource ?? "").toLowerCase();
  if (fuente) {
    if (/^(ig|instagram)/.test(fuente)) return "Instagram";
    if (/^(yt|youtube)/.test(fuente)) return "YouTube";
    if (/^google/.test(fuente)) return "Google";
    if (/^(tiktok|tt)/.test(fuente)) return "TikTok";
    if (/^(x|twitter)$/.test(fuente)) return "X";
    if (/^(email|newsletter|correo)/.test(fuente)) return "Email";
    return "Campañas";
  }
  if (!host) return "Directo";
  const h = host.toLowerCase();
  if (/(^|\.)google\./.test(h)) return "Google";
  if (/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.|ecosia\.org|yandex\.|search\.brave\.com|qwant\.com|startpage\.com)/.test(h)) return "Otros buscadores";
  if (/(^|\.)instagram\.com$/.test(h)) return "Instagram";
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(h)) return "YouTube";
  if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(h)) return "Asistentes IA";
  if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(h)) return "X";
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(h)) return "Facebook";
  if (/(^|\.)tiktok\.com$/.test(h)) return "TikTok";
  if (/(^|\.)(t\.me|telegram\.org|whatsapp\.com|wa\.me)$/.test(h)) return "Mensajería";
  return "Otras webs";
}

/** Texto corto y limpio, o null. */
export function corto(valor: unknown, max: number): string | null {
  if (typeof valor !== "string") return null;
  const limpio = Array.from(valor).filter((c) => c.charCodeAt(0) >= 32).join("").trim();
  return limpio ? limpio.slice(0, max) : null;
}
