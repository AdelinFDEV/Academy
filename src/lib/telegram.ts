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
 * Canal público gratuito. Se admite el @usuario además del id numérico porque
 * es público y Telegram lo acepta igual, así que no hace falta buscar el id.
 *
 * Devuelve null si no está configurado: sin canal free el anunciador sigue
 * funcionando, simplemente publica solo en el privado.
 */
export function getFreeChannelId(): string | null {
  return process.env.TELEGRAM_FREE_CHANNEL_ID || "-1003785109253";
}

/**
 * Enlace público al canal gratuito. Va por su propia variable y no se deduce
 * del id porque el id tiene que ser NUMÉRICO: es lo que Telegram envía en los
 * updates de altas y bajas, y si aquí se guardara el @usuario, lo registrado
 * por el webhook y lo consultado por el panel no casarían nunca.
 */
export function getFreeChannelUrl(): string {
  const usuario = (process.env.TELEGRAM_FREE_CHANNEL_USERNAME || "FreeAdelinBTC").replace(/^@/, "");
  return `https://t.me/${usuario}`;
}

/**
 * Chat al que llegan los mensajes de soporte. Opcional a propósito: si no se
 * define, quien llama lo resuelve desde la base de datos (el Telegram del
 * admin). Definirlo sirve para apuntar a un grupo y repartir el soporte entre
 * varias personas sin tocar código.
 */
/** Chat privado con Adelin (la persona, no el bot). El bot sirve para el relé
 *  de soporte; esto es para quien prefiere escribirle directamente. */
export function getAdminChatUrl(): string {
  const usuario = (process.env.TELEGRAM_ADMIN_USERNAME || "AdelinBTC").replace(/^@/, "");
  return `https://t.me/${usuario}`;
}

/**
 * Dónde caen los avisos de altas. Si se define, van a este chat en vez de al
 * privado del admin — pensado para el día en que el volumen moleste y prefieras
 * un canal de registro aparte, sin tocar código.
 */
export function getLogChatId(): string | null {
  return process.env.TELEGRAM_LOG_CHAT_ID || null;
}

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
 * Estado real de alguien respecto al canal, con "desconocido" explícito para
 * cuando Telegram no contesta.
 *
 * Los dos consumidores necesitan tratar esa duda al revés: al expulsar hay que
 * intentarlo igualmente (mejor sobrar que dejar dentro a quien no paga), pero
 * el panel de control no puede pintar "dentro" a quien no se ha podido
 * comprobar — sería un dato falso. Por eso el tri-estado se expone tal cual y
 * cada uno decide.
 */
export async function getChannelMembership(
  userId: number
): Promise<"dentro" | "fuera" | "desconocido"> {
  try {
    const res = await callTelegramApi<{ status: string }>("getChatMember", {
      chat_id: getChannelId(),
      user_id: userId,
    });
    return ESTADOS_DENTRO.includes(res.status) ? "dentro" : "fuera";
  } catch {
    return "desconocido";
  }
}

/** ¿Hay que intentar expulsar a esta persona? Ante la duda, sí. */
export async function isChannelMember(userId: number): Promise<boolean> {
  return (await getChannelMembership(userId)) !== "fuera";
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

/** Botón que abre una URL (web, canal, chat con Adelin). */
export type BotonEnlace = { text: string; url: string | null };

/** Botón que ejecuta algo en el propio chat sin sacar al usuario de Telegram.
 *  `data` viaja de vuelta en el callback_query y dice qué hay que hacer. */
export type BotonAccion = { text: string; data: string };

export type Boton = BotonEnlace | BotonAccion;

function esEnlace(boton: Boton): boton is BotonEnlace {
  return "url" in boton;
}

/**
 * Monta el teclado. Acepta una lista plana (un botón por fila) o filas
 * explícitas, para poder emparejar los botones de etiqueta corta y que el
 * menú no quede como una columna interminable.
 *
 * Descarta los botones de enlace sin URL: la API rechaza el mensaje ENTERO si
 * uno lleva la URL vacía, y como sendTelegramMessage se traga los errores, el
 * usuario se quedaría sin recibir nada. Mejor perder un botón que el mensaje.
 */
function construirTeclado(botones?: Boton[] | Boton[][]) {
  if (!botones?.length) return undefined;

  const filas: Boton[][] = Array.isArray(botones[0])
    ? (botones as Boton[][])
    : (botones as Boton[]).map((boton) => [boton]);

  const inline_keyboard = filas
    .map((fila) =>
      fila
        .filter((boton) => !esEnlace(boton) || !!boton.url)
        .map((boton) =>
          esEnlace(boton)
            ? { text: boton.text, url: boton.url as string }
            : { text: boton.text, callback_data: boton.data }
        )
    )
    .filter((fila) => fila.length > 0);

  return inline_keyboard.length ? { inline_keyboard } : undefined;
}

/** Envía un mensaje directo al usuario, opcionalmente con botones. Falla en
 *  silencio: puede no haber iniciado conversación con el bot o haberlo
 *  bloqueado, y no es un error crítico del flujo de aprobación/expulsión. */
export async function sendTelegramMessage(
  userId: number,
  text: string,
  botones?: Boton[] | Boton[][]
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
  botones?: Boton[] | Boton[][]
): Promise<number> {
  const res = await callTelegramApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: construirTeclado(botones),
  });
  return res.message_id;
}

/**
 * Chat del admin: el de registro si está configurado y, si no, el Telegram del
 * primer admin que lo tenga vinculado.
 *
 * Vive aquí y no en el webhook porque lo necesitan también los procesos
 * programados, que no pasan por él.
 */
export async function resolverChatAdmin(admin: SupabaseAdmin): Promise<number | null> {
  const porEntorno = getLogChatId() ?? process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (porEntorno) {
    const id = Number(porEntorno);
    if (Number.isFinite(id)) return id;
  }

  const { data } = await admin
    .from("profiles")
    .select("telegram_user_id")
    .eq("role", "admin")
    .not("telegram_user_id", "is", null)
    .order("telegram_linked_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.telegram_user_id as number | null) ?? null;
}

/** Manda un aviso al admin. Si no hay a quién, no hace nada. */
export async function avisarAlAdmin(admin: SupabaseAdmin, texto: string) {
  const destino = await resolverChatAdmin(admin);
  if (!destino) return;
  await sendTelegramMessage(destino, texto);
}

/**
 * Escribe por privado a alguien y avisa al admin de si se pudo o no.
 *
 * Telegram prohíbe a los bots escribir a quien nunca haya iniciado
 * conversación con ellos, así que estos envíos fallan a menudo y en silencio.
 * Centralizarlo aquí es lo que hace que el admin se entere de a quién alcanza
 * de verdad, en vez de dar por hecho que todos reciben sus mensajes.
 */
export async function escribirYAvisar(
  admin: SupabaseAdmin,
  destinatario: { id: number; nombre: string },
  texto: string,
  opciones?: { botones?: Boton[] | Boton[][]; motivo?: string }
): Promise<boolean> {
  const coletilla = opciones?.motivo ? ` — ${opciones.motivo}` : "";
  try {
    await sendTelegramMessageOrThrow(destinatario.id, texto, opciones?.botones);
    await avisarAlAdmin(admin, `✅ Pude mandarle un privado a ${destinatario.nombre}${coletilla}`);
    return true;
  } catch (err) {
    await avisarAlAdmin(
      admin,
      `📭 No pude mandarle un privado a ${destinatario.nombre}${coletilla}\n\n` +
        `Motivo: ${err instanceof Error ? err.message : "desconocido"}`
    );
    return false;
  }
}

/** Límite de Telegram para una foto por URL o subida: 10 MB. */
const MAXIMO_FOTO = 10 * 1024 * 1024;

/**
 * Descarga la imagen y se la sube a Telegram como archivo.
 *
 * Se manda el juego de cabeceras de un navegador, incluido el Referer del
 * propio medio: los sitios con Cloudflare delante sirven la imagen a quien
 * parece un lector normal y la niegan a los servidores de Telegram, que piden
 * la URL a pelo.
 */
async function enviarFotoSubida(
  chatId: string | number,
  url: string,
  caption: string,
  reply_markup: unknown
) {
  const origen = new URL(url).origin;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: `${origen}/`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`la imagen respondió ${res.status}`);

  const datos = await res.arrayBuffer();
  if (datos.byteLength === 0) throw new Error("la imagen vino vacía");
  if (datos.byteLength > MAXIMO_FOTO) throw new Error("la imagen supera los 10 MB");

  const tipo = res.headers.get("content-type") ?? "image/jpeg";
  const cuerpo = new FormData();
  cuerpo.append("chat_id", String(chatId));
  cuerpo.append("caption", caption);
  if (reply_markup) cuerpo.append("reply_markup", JSON.stringify(reply_markup));
  cuerpo.append("photo", new Blob([datos], { type: tipo }), "portada");

  // No pasa por callTelegramApi: ese envía JSON, y una subida es multipart.
  const envio = await fetch(`${API_BASE}${getBotToken()}/sendPhoto`, {
    method: "POST",
    body: cuerpo,
  });
  const json = (await envio.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(json.description ?? `HTTP ${envio.status}`);
}

/**
 * Cuántos miembros tiene el canal. Es la única forma de auditar el canal
 * "desde fuera": la API de bots no permite listar los miembros de un canal,
 * así que comparar este número con los premium vinculados es lo más cerca que
 * se puede estar de detectar a alguien aprobado a mano.
 */
export async function getChannelMemberCount(chatId?: string | number): Promise<number | null> {
  try {
    return await callTelegramApi<number>("getChatMemberCount", {
      chat_id: chatId ?? getChannelId(),
    });
  } catch (err) {
    console.warn("[telegram] No se pudo contar los miembros:", (err as Error).message);
    return null;
  }
}

/**
 * Publica en el canal privado. Si hay imagen va como foto con pie de texto,
 * que es lo que hace que el aviso se vea en el feed en lugar de pasar
 * desapercibido entre mensajes.
 *
 * Si el envío con foto falla (URL rota, imagen demasiado grande, formato que
 * Telegram no traga) se reintenta como texto: mejor un aviso sin imagen que
 * ningún aviso.
 */
/**
 * Menciona a alguien enlazando su nombre a su perfil.
 *
 * Se usa una entidad `text_mention` en vez de parse_mode a propósito: el
 * nombre lo elige el usuario y puede llevar `<`, `&` o guiones bajos, que en
 * HTML o Markdown romperían el mensaje entero. Con entidades no hay nada que
 * escapar. Y funciona aunque no tenga @usuario.
 */
export function mencionar(texto: string, nombre: string, userId: number) {
  // String.length ya cuenta en unidades UTF-16, que es justo lo que pide
  // Telegram para los desplazamientos.
  const offset = texto.indexOf(nombre);
  if (offset < 0) return undefined;
  return [{ type: "text_mention", offset, length: nombre.length, user: { id: userId } }];
}

export async function sendChannelPost(
  texto: string,
  opciones?: {
    imagen?: string | null;
    botones?: Boton[] | Boton[][];
    /** Canal de destino. Por defecto el privado de Premium. */
    chatId?: string;
    /** Entidades del mensaje, p. ej. una mención construida con mencionar(). */
    entidades?: unknown[];
  }
) {
  const chatId = opciones?.chatId ?? getChannelId();
  const reply_markup = construirTeclado(opciones?.botones);

  if (opciones?.imagen) {
    // 1) Que la descargue Telegram: es lo barato, y funciona con la mayoría.
    try {
      await callTelegramApi("sendPhoto", {
        chat_id: chatId,
        photo: opciones.imagen,
        // El pie de foto admite 1024 caracteres, frente a los 4096 del texto.
        caption: texto.slice(0, 1024),
        reply_markup,
      });
      return;
    } catch (err) {
      console.warn("[telegram] Telegram no pudo descargar la imagen:", (err as Error).message);
    }

    // 2) Descargarla nosotros y subir los bytes. Hace falta para los medios
    //    con Cloudflare delante: bloquean a los servidores de Telegram, que no
    //    mandan cabeceras de navegador, pero no a quien sí las manda.
    try {
      await enviarFotoSubida(chatId, opciones.imagen, texto.slice(0, 1024), reply_markup);
      return;
    } catch (err) {
      console.warn("[telegram] Tampoco se pudo subir la imagen:", (err as Error).message);
    }
  }

  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text: texto,
    entities: opciones?.entidades,
    reply_markup,
    // El aviso ya lleva su propio botón; la tarjeta de enlace duplicaría todo.
    link_preview_options: { is_disabled: true },
  });
}

/**
 * Reescribe un mensaje ya enviado y le quita los botones.
 *
 * Se usa al decidir sobre una noticia: sin esto, el mensaje se quedaría con
 * «Publicar / Descartar» puestos para siempre y no habría forma de saber, al
 * repasar el chat, cuáles ya se atendieron.
 */
export async function editarMensaje(chatId: number, messageId: number, texto: string) {
  try {
    await callTelegramApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: texto,
      // Sin reply_markup, Telegram elimina el teclado del mensaje.
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.warn("[telegram] No se pudo reescribir el mensaje:", (err as Error).message);
  }
}

/**
 * Responde a la pulsación de un botón de acción. Hay que llamarlo SIEMPRE,
 * aunque sea sin texto: si no, el botón se queda girando en el móvil del
 * usuario hasta que Telegram se cansa de esperar.
 */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text,
    });
  } catch (err) {
    console.warn("[telegram] No se pudo responder al botón:", (err as Error).message);
  }
}

/** Token aleatorio de un solo uso para el deep-link de vinculación. */
export function generateLinkToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
