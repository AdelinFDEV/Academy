import crypto from "crypto";

const API_BASE = "https://api.telegram.org/bot";

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

/** URL de la página de cuenta, para enlazarla en los mensajes del bot.
 *  Como texto plano ("/cuenta") Telegram lo pinta como comando pulsable
 *  y el bot no tiene handler para él, así que aquí siempre va la URL completa. */
export function getCuentaUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://adelinacademy.com";
  return `${siteUrl}/cuenta`;
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

/** Envía un mensaje directo al usuario. Falla en silencio: puede no haber
 *  iniciado conversación con el bot o haberlo bloqueado, y no es un error
 *  crítico del flujo de aprobación/expulsión. */
export async function sendTelegramMessage(userId: number, text: string) {
  try {
    await callTelegramApi("sendMessage", { chat_id: userId, text });
  } catch (err) {
    console.warn("[telegram] No se pudo enviar mensaje a", userId, (err as Error).message);
  }
}

/** Token aleatorio de un solo uso para el deep-link de vinculación. */
export function generateLinkToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
