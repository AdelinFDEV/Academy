import crypto from "crypto";
import type { createAdminClient } from "@/lib/supabase/admin";

const API_BASE = "https://api.telegram.org/bot";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Falta TELEGRAM_BOT_TOKEN en el entorno.");
  return token;
}

export function getChannelId(): string {
  const id = process.env.TELEGRAM_CHANNEL_ID;
  if (!id) throw new Error("Falta TELEGRAM_CHANNEL_ID en el entorno.");
  return id;
}

export function getBotUsername(): string {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  if (!username) throw new Error("Falta TELEGRAM_BOT_USERNAME en el entorno.");
  return username;
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://adelinacademy.com").replace(/\/$/, "");
}

/** URL de la página de cuenta, para enlazarla en los mensajes del bot.
 *  Como texto plano ("/cuenta") Telegram lo pinta como comando pulsable
 *  y el bot no tiene handler para él, así que aquí siempre va la URL completa. */
export function getCuentaUrl(): string {
  return `${getSiteUrl()}/cuenta`;
}

export function getPremiumUrl(): string {
  return `${getSiteUrl()}/premium`;
}

/** El enlace de invitación es opcional: si no está configurado devolvemos
 *  null en vez de lanzar, para poder omitir el botón sin romper el mensaje. */
export function getChannelInviteLink(): string | null {
  return process.env.TELEGRAM_CHANNEL_INVITE_LINK || null;
}

/**
 * Chat al que llegan los mensajes de soporte. Opcional a propósito: si no se
 * define, quien llama lo resuelve desde la base de datos (el Telegram del
 * admin). Definirlo sirve para apuntar a un grupo y repartir el soporte entre
 * varias personas sin tocar código.
 */
export function getAdminChatId(): number | null {
  const raw = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

type TelegramApiResponse<T> = { ok: true; result: T } | { ok: false; description?: string };

async function callTelegramApi<T = unknown>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const token = getBotToken();
  const res = await fetch(`${API_BASE}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = (await res.json()) as TelegramApiResponse<T>;
  if (!json.ok) {
    throw new Error(`[telegram] ${method} falló: ${json.description ?? res.status}`);
  }
  return json.result;
}

/** Acepta una solicitud de entrada al canal (chat_join_request). */
export async function approveChatJoinRequest(userId: number) {
  await callTelegramApi("approveChatJoinRequest", { chat_id: getChannelId(), user_id: userId });
}

/** Rechaza una solicitud de entrada al canal. */
export async function declineChatJoinRequest(userId: number) {
  await callTelegramApi("declineChatJoinRequest", { chat_id: getChannelId(), user_id: userId });
}

/**
 * Expulsa a alguien del canal sin banearlo permanentemente: lo saca y le
 * levanta el baneo al instante. Así, si vuelve a ser Premium, puede solicitar
 * entrada de nuevo con el mismo enlace de invitación.
 */
export async function removeChannelMember(userId: number) {
  const chatId = getChannelId();
  await callTelegramApi("banChatMember", { chat_id: chatId, user_id: userId });
  await callTelegramApi("unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true });
}

/** Estados de getChatMember que significan "está dentro del canal". */
const ESTADOS_DENTRO = ["creator", "administrator", "member", "restricted"];

/**
 * ¿Está esta persona dentro del canal? Si la consulta falla devolvemos `true`
 * a propósito: ante la duda preferimos intentar la expulsión (fail-safe hacia
 * cerrar el acceso) antes que dar por hecho que ya no está.
 */
export async function isChannelMember(userId: number): Promise<boolean> {
  try {
    const res = await callTelegramApi<{ status: string }>("getChatMember", {
      chat_id: getChannelId(),
      user_id: userId,
    });
    return ESTADOS_DENTRO.includes(res.status);
  } catch {
    return true;
  }
}

/**
 * Único camino para retirar el acceso al canal: comprueba, expulsa y registra.
 *
 * Está centralizado porque hay cinco sitios que dan de baja a alguien (webhook
 * de Stripe, desvinculación, cron, borrado de cuenta y cambio de rol desde el
 * panel) y cada uno que lo hiciera por su cuenta era un sitio más donde olvidar
 * la expulsión o el registro. Si no está en el canal no hace nada: así el cron
 * diario deja de gastar llamadas y de escribir un "kicked" falso cada día por
 * cada usuario gratuito que un día vinculó Telegram.
 */
export async function revokeChannelAccess(
  admin: SupabaseAdmin,
  opts: { userId: string | null; telegramUserId: number; reason: string }
): Promise<boolean> {
  if (!(await isChannelMember(opts.telegramUserId))) return false;

  try {
    await removeChannelMember(opts.telegramUserId);
  } catch (err) {
    console.warn(
      "[telegram] No se pudo expulsar a",
      opts.telegramUserId,
      (err as Error).message
    );
    return false;
  }

  await admin.from("telegram_access_log").insert({
    user_id: opts.userId,
    telegram_user_id: opts.telegramUserId,
    action: "kicked",
    reason: opts.reason,
  });
  return true;
}

/** Botón que abre una URL. Es el único tipo que usamos: no requiere guardar
 *  estado ni responder a callbacks, así que no puede quedarse "colgado". */
export type BotonEnlace = { text: string; url: string | null };

/**
 * Convierte los botones al formato de Telegram, descartando los que no tengan
 * URL. Ese filtro importa: la API rechaza el mensaje entero si un botón lleva
 * una URL vacía, y como sendTelegramMessage traga los errores, el usuario se
 * quedaría sin recibir nada — peor que quedarse sin el botón.
 */
function construirTeclado(botones?: BotonEnlace[]) {
  const validos = (botones ?? []).filter((b): b is { text: string; url: string } => !!b.url);
  if (!validos.length) return undefined;
  // Uno por fila: las etiquetas en español son largas y en móvil se cortan.
  return { inline_keyboard: validos.map((b) => [{ text: b.text, url: b.url }]) };
}

/** Envía un mensaje directo al usuario, opcionalmente con botones. Falla en
 *  silencio: puede no haber iniciado conversación con el bot o haberlo
 *  bloqueado, y no es un error crítico del flujo de aprobación/expulsión. */
export async function sendTelegramMessage(
  userId: number,
  text: string,
  botones?: BotonEnlace[]
) {
  try {
    await sendTelegramMessageOrThrow(userId, text, botones);
  } catch (err) {
    console.warn("[telegram] No se pudo enviar mensaje a", userId, (err as Error).message);
  }
}

/**
 * Igual que sendTelegramMessage, pero devuelve el message_id y propaga el
 * error en vez de tragárselo.
 *
 * Se usa cuando el envío ES la operación, no un aviso secundario: en el relé
 * de soporte hay que saber si el mensaje llegó (para poder avisar a quien
 * escribe de que no se entregó) y con qué id quedó (para saber a quién
 * pertenece cuando el admin responda citándolo).
 */
export async function sendTelegramMessageOrThrow(
  chatId: number,
  text: string,
  botones?: BotonEnlace[]
): Promise<number> {
  const res = await callTelegramApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: construirTeclado(botones),
  });
  return res.message_id;
}

/** Token aleatorio de un solo uso para el deep-link de vinculación. */
export function generateLinkToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
