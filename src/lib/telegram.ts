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

/**
 * El id de Telegram del ÚNICO dueño del bot, para comandos que no deben
 * seguir al rol de admin.
 *
 * Es distinto de "ser admin" a propósito: el rol se puede dar a más gente el
 * día de mañana (soporte, un socio), y eso son privilegios de gestión —
 * publicar noticias, publicar un vídeo. Esto es otra cosa: comandos que solo
 * tienen sentido para quien mantiene el código, y que no deberían aparecer ni
 * insinuarse a nadie más, admin o no.
 *
 * Falla CERRADO: si la variable no está puesta, nadie pasa la comprobación —
 * nunca se cae a "el primer admin que haya" ni a ningún otro supuesto.
 */
export function getOwnerTelegramId(): number | null {
  const raw = process.env.TELEGRAM_OWNER_ID;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
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

/**
 * El grupo de debate enlazado al canal Premium, si lo hay.
 *
 * ── Por qué esto existe ─────────────────────────────────────────────────────
 * Al convertir el Premium en comunidad, Telegram engancha al canal un grupo
 * aparte. Y ese grupo es OTRO chat, con SUS PROPIOS miembros: todo lo que se
 * publica en el canal se reenvía allí automáticamente, así que quien esté en
 * el grupo lee el Premium entero aunque no esté en el canal.
 *
 * O sea que expulsar del canal a quien deja de pagar ya no basta: si se queda
 * en el grupo, sigue leyéndolo todo. Por eso todo lo que da o quita acceso
 * tiene que hacerlo en los dos sitios.
 *
 * Se descubre solo desde el propio canal (`linked_chat_id`) en vez de por una
 * variable de entorno: así, el día que se enlace o se desenlace un grupo, el
 * bot se entera sin que nadie tenga que acordarse de tocar la configuración.
 */
let cacheGrupo: { valor: string | null; hasta: number } | null = null;

export async function getGrupoDebateId(): Promise<string | null> {
  // Un valor explícito manda siempre. Hace falta para las "Comunidades" de
  // Telegram (distinto de la "discusión enlazada" clásica): al convertir un
  // canal en comunidad puede quedar un linked_chat_id fantasma —de un grupo de
  // discusión que Telegram creó y abandonó en algún momento anterior— con el
  // chat real de la comunidad sin representarse en ningún campo consultable.
  // Se descubre una vez con /chatid dentro del chat real y se fija aquí.
  const explicito = process.env.TELEGRAM_COMMUNITY_CHAT_ID;
  if (explicito) return explicito;

  if (cacheGrupo && cacheGrupo.hasta > Date.now()) return cacheGrupo.valor;

  let valor: string | null = null;
  try {
    const chat = await callTelegramApi<{ linked_chat_id?: number }>("getChat", {
      chat_id: getChannelId(),
    });
    valor = chat.linked_chat_id ? String(chat.linked_chat_id) : null;
  } catch (err) {
    console.warn("[telegram] No se pudo consultar el grupo enlazado:", (err as Error).message);
    // Sin cachear el fallo: se reintenta a la siguiente.
    return cacheGrupo?.valor ?? null;
  }

  cacheGrupo = { valor, hasta: Date.now() + 5 * 60 * 1000 };
  return valor;
}

/** Los dos chats que forman el Premium: el canal y, si existe, su grupo. */
export async function chatsPremium(): Promise<string[]> {
  const grupo = await getGrupoDebateId();
  return grupo ? [getChannelId(), grupo] : [getChannelId()];
}

/** Acepta una solicitud de entrada (chat_join_request). Por defecto al canal;
 *  `chatId` sirve para aceptarla también en el grupo de debate. */
export async function approveChatJoinRequest(userId: number, chatId?: string | number) {
  await callTelegramApi("approveChatJoinRequest", {
    chat_id: chatId ?? getChannelId(),
    user_id: userId,
  });
}

/** Rechaza una solicitud de entrada. */
export async function declineChatJoinRequest(userId: number, chatId?: string | number) {
  await callTelegramApi("declineChatJoinRequest", {
    chat_id: chatId ?? getChannelId(),
    user_id: userId,
  });
}

/**
 * Expulsa a alguien del canal sin banearlo permanentemente: lo saca y le
 * levanta el baneo al instante. Así, si vuelve a ser Premium, puede solicitar
 * entrada de nuevo con el mismo enlace de invitación.
 */
export async function removeChannelMember(userId: number, chatId?: string | number) {
  const chat = chatId ?? getChannelId();
  await callTelegramApi("banChatMember", { chat_id: chat, user_id: userId });
  await callTelegramApi("unbanChatMember", { chat_id: chat, user_id: userId, only_if_banned: true });
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
  userId: number,
  chatId?: string | number
): Promise<"dentro" | "fuera" | "desconocido"> {
  try {
    const res = await callTelegramApi<{ status: string }>("getChatMember", {
      chat_id: chatId ?? getChannelId(),
      user_id: userId,
    });
    return ESTADOS_DENTRO.includes(res.status) ? "dentro" : "fuera";
  } catch {
    return "desconocido";
  }
}

/** ¿Hay que intentar expulsar a esta persona? Ante la duda, sí. */
export async function isChannelMember(userId: number, chatId?: string | number): Promise<boolean> {
  return (await getChannelMembership(userId, chatId)) !== "fuera";
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
  // Los DOS chats del Premium, no solo el canal. Desde que hay comunidad, el
  // grupo de debate recibe una copia de todo lo que se publica: dejar a
  // alguien dentro del grupo es dejarle el Premium entero abierto.
  const chats = await chatsPremium();

  let expulsadoDeAlguno = false;
  for (const chat of chats) {
    if (!(await isChannelMember(opts.telegramUserId, chat))) continue;

    try {
      await removeChannelMember(opts.telegramUserId, chat);
      expulsadoDeAlguno = true;
    } catch (err) {
      // Se sigue con el otro chat aunque este falle: sacarle de uno de los dos
      // es mejor que de ninguno, y el cron lo reintentará mañana.
      console.warn(
        "[telegram] No se pudo expulsar a",
        opts.telegramUserId,
        "de",
        chat,
        (err as Error).message
      );
    }
  }

  if (!expulsadoDeAlguno) return false;

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
export async function avisarAlAdmin(
  admin: SupabaseAdmin,
  texto: string,
  opciones?: { ignorarPausa?: boolean }
) {
  if (!opciones?.ignorarPausa && (await avisosPausados(admin))) return;
  const destino = await resolverChatAdmin(admin);
  if (!destino) return;
  await sendTelegramMessage(destino, texto);
}

/** Clave del interruptor de avisos en la tabla bot_ajustes. */
const CLAVE_PAUSA = "avisos_pausados";

/**
 * ¿Están los avisos automáticos en pausa?
 *
 * Solo afecta a lo que el bot manda por su cuenta —altas en los canales,
 * propuestas de noticias, entradas y vídeos nuevos—. NUNCA silencia los que
 * escribe una persona: el relé de soporte no pasa por aquí a propósito, porque
 * perder el mensaje de un cliente es mucho peor que recibir un aviso de más.
 *
 * Ante un error de base de datos se responde "no pausados": es preferible un
 * aviso que no querías a quedarte sin enterarte de nada sin saber por qué.
 */
export async function avisosPausados(admin: SupabaseAdmin): Promise<boolean> {
  const { data, error } = await admin
    .from("bot_ajustes")
    .select("valor")
    .eq("clave", CLAVE_PAUSA)
    .maybeSingle();

  if (error) {
    console.warn("[telegram] No se pudo leer el interruptor de avisos:", error.message);
    return false;
  }
  return data?.valor === "1";
}

/**
 * ¿Está en pausa la revisión diaria de noticias?
 *
 * Interruptor propio, separado de `avisos_pausados`: aquel calla TODO lo que
 * el bot manda por su cuenta (altas, entradas nuevas…), y aquí solo se quiere
 * parar el cron de noticias. Pausado desde el 04-10-2026 a petición del admin.
 * Para reactivarlo, la fila `noticias_pausadas` de `bot_ajustes` a "0".
 *
 * Mismo criterio ante un error que `avisosPausados`: se responde "no
 * pausadas", porque las noticias solo se PROPONEN al admin y nunca se
 * publican solas, así que un fallo no puede sacar nada al canal.
 */
export async function noticiasPausadas(admin: SupabaseAdmin): Promise<boolean> {
  const { data, error } = await admin
    .from("bot_ajustes")
    .select("valor")
    .eq("clave", "noticias_pausadas")
    .maybeSingle();

  if (error) {
    console.warn("[telegram] No se pudo leer el interruptor de noticias:", error.message);
    return false;
  }
  return data?.valor === "1";
}

/** Enciende o apaga los avisos automáticos. Devuelve si se pudo guardar. */
export async function pausarAvisos(admin: SupabaseAdmin, pausar: boolean): Promise<boolean> {
  const { error } = await admin
    .from("bot_ajustes")
    .upsert(
      { clave: CLAVE_PAUSA, valor: pausar ? "1" : "0", actualizado_en: new Date().toISOString() },
      { onConflict: "clave" }
    );

  if (error) {
    console.error("[telegram] No se pudo cambiar el interruptor de avisos:", error.message);
    return false;
  }
  return true;
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
  reply_markup: unknown,
  entidades?: unknown[]
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
  if (entidades?.length) cuerpo.append("caption_entities", JSON.stringify(entidades));
  cuerpo.append("photo", new Blob([datos], { type: tipo }), "portada");

  // No pasa por callTelegramApi: ese envía JSON, y una subida es multipart.
  const envio = await fetch(`${API_BASE}${getBotToken()}/sendPhoto`, {
    method: "POST",
    body: cuerpo,
  });
  const json = (await envio.json()) as {
    ok: boolean;
    description?: string;
    result?: { message_id: number };
  };
  if (!json.ok) throw new Error(json.description ?? `HTTP ${envio.status}`);
  return json.result?.message_id ?? null;
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

/**
 * Convierte **negrita** en estilo Markdown a entidades de Telegram y quita
 * los asteriscos del texto.
 *
 * Mismo motivo que mencionar(): entidades en vez de parse_mode. El texto en
 * negrita aquí lo escribe Gemini a partir de un artículo de fuera, y no hay
 * forma de garantizar que venga bien escapado para MarkdownV2 — un paréntesis
 * o un guion sueltos (normalísimos en una noticia) bastarían para que
 * Telegram rechace el mensaje entero. Con entidades no hay nada que escapar:
 * se calcula el hueco exacto y se manda como dato estructurado, no como texto
 * que Telegram tenga que interpretar.
 */
export function entidadesDeMarkdown(
  texto: string
): { texto: string; entidades: Array<{ type: string; offset: number; length: number }> } {
  const entidades: Array<{ type: string; offset: number; length: number }> = [];
  const regex = /\*\*([\s\S]+?)\*\*/g;
  let limpio = "";
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    limpio += texto.slice(ultimoIndice, match.index);
    // El offset se mide sobre el texto YA limpio (sin asteriscos): es el que
    // Telegram va a recibir y sobre el que tienen que calzar las entidades.
    entidades.push({ type: "bold", offset: limpio.length, length: match[1].length });
    limpio += match[1];
    ultimoIndice = match.index + match[0].length;
  }
  limpio += texto.slice(ultimoIndice);

  return { texto: limpio, entidades };
}

/**
 * ¿Admite este chat estas reacciones de emoji?
 *
 * Hace falta porque las reacciones NO se pueden configurar desde la API de
 * bots —`setChatAvailableReactions` no existe— así que el bot no puede darlas
 * por hechas: tiene que mirar cómo está el canal y adaptarse.
 *
 * Los tres estados que devuelve Telegram en `available_reactions`:
 *   · undefined            → están todas las de por defecto, así que sí.
 *   · []                   → reacciones desactivadas.
 *   · [{type:"paid"}, …]   → solo la de estrellas, que no sirve para votar.
 *   · [{type:"emoji", …}]  → la lista concreta que el dueño ha permitido.
 */
export async function admiteReacciones(
  chatId: string | number,
  emojis: string[]
): Promise<boolean> {
  try {
    const chat = await callTelegramApi<{
      available_reactions?: { type: string; emoji?: string }[];
    }>("getChat", { chat_id: chatId });

    const permitidas = chat.available_reactions;
    if (permitidas === undefined) return true; // todas las de por defecto

    const deEmoji = permitidas.filter((r) => r.type === "emoji").map((r) => r.emoji);
    return emojis.every((e) => deEmoji.includes(e));
  } catch (err) {
    // Ante la duda, no: se publica con los botones, que funcionan siempre.
    console.warn("[telegram] No se pudieron consultar las reacciones:", (err as Error).message);
    return false;
  }
}

/**
 * Cambia solo los botones de un mensaje ya publicado, sin tocar el texto.
 *
 * Es lo que hace falta para los votos de las noticias: al pulsar "alcista" hay
 * que repintar el marcador, y reescribir el mensaje entero volvería a mandar
 * el pie de foto (que Telegram rechaza si el mensaje es una foto).
 */
export async function editarBotones(
  chatId: string | number,
  messageId: number,
  botones: Boton[] | Boton[][]
): Promise<boolean> {
  try {
    await callTelegramApi("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: construirTeclado(botones),
    });
    return true;
  } catch (err) {
    const motivo = (err as Error).message;
    // Dos personas votando a la vez pueden dejar el teclado idéntico.
    if (motivo.includes("message is not modified")) return true;
    console.warn("[telegram] No se pudieron cambiar los botones:", motivo);
    return false;
  }
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
      const res = await callTelegramApi<{ message_id: number }>("sendPhoto", {
        chat_id: chatId,
        photo: opciones.imagen,
        // El pie de foto admite 1024 caracteres, frente a los 4096 del texto.
        caption: texto.slice(0, 1024),
        caption_entities: opciones?.entidades,
        reply_markup,
      });
      return res.message_id;
    } catch (err) {
      console.warn("[telegram] Telegram no pudo descargar la imagen:", (err as Error).message);
    }

    // 2) Descargarla nosotros y subir los bytes. Hace falta para los medios
    //    con Cloudflare delante: bloquean a los servidores de Telegram, que no
    //    mandan cabeceras de navegador, pero no a quien sí las manda.
    try {
      return await enviarFotoSubida(
        chatId,
        opciones.imagen,
        texto.slice(0, 1024),
        reply_markup,
        opciones?.entidades
      );
    } catch (err) {
      console.warn("[telegram] Tampoco se pudo subir la imagen:", (err as Error).message);
    }
  }

  const res = await callTelegramApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: texto,
    entities: opciones?.entidades,
    reply_markup,
    // El aviso ya lleva su propio botón; la tarjeta de enlace duplicaría todo.
    link_preview_options: { is_disabled: true },
  });
  return res.message_id;
}

/**
 * Reescribe un mensaje ya enviado y le quita los botones.
 *
 * Se usa al decidir sobre una noticia: sin esto, el mensaje se quedaría con
 * «Publicar / Descartar» puestos para siempre y no habría forma de saber, al
 * repasar el chat, cuáles ya se atendieron.
 */
export async function editarMensaje(
  chatId: number,
  messageId: number,
  texto: string,
  botones?: Boton[] | Boton[][]
): Promise<boolean> {
  try {
    await callTelegramApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: texto,
      // Sin botones no se manda reply_markup, y Telegram elimina el teclado
      // del mensaje: es justo lo que quieren los avisos de noticias, que se
      // reescriben para dejar constancia de lo ya decidido.
      reply_markup: construirTeclado(botones),
      link_preview_options: { is_disabled: true },
    });
    return true;
  } catch (err) {
    const motivo = (err as Error).message;
    // Pulsar dos veces el mismo botón deja el mensaje idéntico y Telegram lo
    // trata como error. No lo es: la pantalla que se pedía ya está puesta, así
    // que se cuenta como éxito para no reenviarla duplicada.
    if (motivo.includes("message is not modified")) return true;
    console.warn("[telegram] No se pudo reescribir el mensaje:", motivo);
    return false;
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
