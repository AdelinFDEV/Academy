import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import type { Boton } from "@/lib/telegram";
import { FUENTE, guardarNuevas, proponerNoticia } from "@/lib/noticias";
import {
  answerCallbackQuery,
  editarMensaje,
  sendChannelPost,
  approveChatJoinRequest,
  declineChatJoinRequest,
  getAdminChatId,
  getAdminChatUrl,
  getChannelId,
  getChannelInviteLink,
  getChannelMemberCount,
  getFreeChannelId,
  getLogChatId,
  mencionar,
  getCuentaUrl,
  getPremiumUrl,
  getSiteUrl,
  revokeChannelAccess,
  sendTelegramMessage,
  sendTelegramMessageOrThrow,
} from "@/lib/telegram";

// El webhook lo llama Telegram directamente: siempre en Node y sin caché.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;

type TelegramUser = { id: number; username?: string; first_name?: string };
type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  from?: TelegramUser;
  text?: string;
  reply_to_message?: { message_id: number };
};
type ChatJoinRequest = { chat: { id: number }; from: TelegramUser };
type CallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: { message_id: number; chat: { id: number } };
};
/** Alta o baja de alguien en un canal. Telegram NO envía este tipo de update
 *  salvo que se pida a mano en allowed_updates (ver telegram-doctor.mjs). */
type ChatMemberUpdated = {
  chat: { id: number; title?: string };
  old_chat_member: { status: string };
  new_chat_member: { status: string; user: TelegramUser };
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  chat_join_request?: ChatJoinRequest;
  callback_query?: CallbackQuery;
  chat_member?: ChatMemberUpdated;
};

/** Perfil con lo que necesita el menú y la ficha de estado. */
type PerfilBot = {
  role: string | null;
  full_name: string | null;
  telegram_username: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean | null;
  premium_since: string | null;
};

const CAMPOS_PERFIL_BOT =
  "role, full_name, telegram_username, subscription_status, " +
  "subscription_current_period_end, subscription_cancel_at_period_end, premium_since";

/** Tope de mensajes por hora y usuario, para que nadie pueda inundar el
 *  Telegram del admin desde una cuenta Premium. */
const LIMITE_MENSAJES_HORA = 10;

/** Comandos reservados al admin. Al añadir uno nuevo, basta con listarlo aquí
 *  para que quede protegido. */
const COMANDOS_DE_ADMIN = ["/noticias"];

/**
 * ¿Es admin quien escribe?
 *
 * Se comprueba contra el ROL en la base de datos, no contra el id del chat.
 * La diferencia importa: comparar el chat sólo funciona en el privado, y si
 * mañana el soporte se mueve a un grupo, cualquiera de ese grupo heredaría los
 * permisos. El rol es de la persona y va con ella.
 */
async function esAdmin(admin: Admin, telegramUserId: number): Promise<boolean> {
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  return data?.role === "admin";
}

/**
 * Telegram deja cambiar el @ cuando uno quiera, así que el que guardamos al
 * vincular se queda obsoleto sin que nos enteremos — y es justo el dato con el
 * que identificas a alguien cuando te escribe. Se refresca al vuelo en cada
 * interacción, que es cuando sale gratis: el perfil ya está cargado.
 */
async function refrescarUsername(
  admin: Admin,
  telegramUserId: number,
  guardado: string | null,
  actual: string | undefined
) {
  const nuevo = actual ?? null;
  if (nuevo === guardado) return;
  await admin
    .from("profiles")
    .update({ telegram_username: nuevo })
    .eq("telegram_user_id", telegramUserId);
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function diasHasta(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Botonera principal. Cambia según el plan para que nadie vea botones que no
 *  le sirven: al Premium no se le ofrece pagar, al free no se le ofrece el
 *  canal al que no puede entrar. */
function menuPara(perfil: PerfilBot | null): Boton[][] {
  const esPremium = perfil?.role === "premium" || perfil?.role === "admin";

  if (!perfil) {
    return [
      [{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }],
      [{ text: "💎 Hazte Premium", url: getPremiumUrl() }],
      [
        { text: "💬 Hablar con Adelin", url: getAdminChatUrl() },
        { text: "🌐 La Academy", url: getSiteUrl() },
      ],
    ];
  }

  if (!esPremium) {
    return [
      [{ text: "💎 Hazte Premium", url: getPremiumUrl() }],
      [{ text: "📊 Ver mi estado", data: "estado" }],
      [
        { text: "💬 Hablar con Adelin", url: getAdminChatUrl() },
        { text: "🌐 La Academy", url: getSiteUrl() },
      ],
    ];
  }

  return [
    [{ text: "🚀 Entrar al canal", url: getChannelInviteLink() }],
    [{ text: "📊 Ver mi Premium", data: "estado" }],
    [{ text: "💬 Hablar con Adelin", url: getAdminChatUrl() }],
    [
      { text: "⚙️ Mi suscripción", url: getCuentaUrl() },
      { text: "🌐 La Academy", url: getSiteUrl() },
    ],
  ];
}

/** Ficha de estado: se resuelve dentro de Telegram, sin mandar a nadie a la
 *  web sólo para ver cuánto le queda. */
function fichaEstado(perfil: PerfilBot | null): string {
  if (!perfil) {
    return (
      "🔍 Todavía no tienes la cuenta vinculada, así que no puedo contarte nada de tu plan.\n\n" +
      "Vincúlala y aquí verás tu Premium, lo que te queda y el acceso al canal."
    );
  }

  if (perfil.role === "admin") {
    return "👑 Eres administrador.\n\nAcceso completo y permanente, sin suscripción de por medio.";
  }

  if (perfil.role !== "premium") {
    return (
      "🆓 Ahora mismo estás en el plan gratuito.\n\n" +
      "Con Premium entras al canal privado, desbloqueas todas las guías y las herramientas de trading."
    );
  }

  const fin = perfil.subscription_current_period_end;
  const cancelada = !!perfil.subscription_cancel_at_period_end;
  const lineas = ["💎 *Tu Premium*", ""];

  if (cancelada) {
    lineas.push("⚠️ Cancelada — no se renovará");
  } else {
    lineas.push("✅ Activa y al día");
  }

  if (fin) {
    const dias = diasHasta(fin);
    lineas.push(`${cancelada ? "📅 Acceso hasta el" : "🔄 Se renueva el"} ${formatearFecha(fin)}`);
    lineas.push(`⏳ Te ${dias === 1 ? "queda 1 día" : `quedan ${dias} días`}`);
  }

  if (perfil.premium_since) {
    lineas.push(`🗓 Miembro desde el ${formatearFecha(perfil.premium_since)}`);
  }

  if (cancelada) {
    lineas.push("", "Cuando termine saldrás del canal automáticamente. Aún estás a tiempo de reactivar 👇");
  }

  // El asterisco del título es literal: no usamos parse_mode para no tener que
  // escapar lo que escriben los usuarios, así que se quita.
  return lineas.join("\n").replace(/\*/g, "");
}

async function enviarMenu(admin: Admin, chatId: number, from: TelegramUser, encabezado?: string) {
  const { data } = await admin
    .from("profiles")
    .select(CAMPOS_PERFIL_BOT)
    .eq("telegram_user_id", from.id)
    .maybeSingle();

  const perfil = (data as PerfilBot | null) ?? null;
  if (perfil) {
    await refrescarUsername(admin, from.id, perfil.telegram_username, from.username);
  }

  const nombre = perfil?.full_name || from.first_name;
  const esPremium = perfil?.role === "premium" || perfil?.role === "admin";

  let texto: string;
  if (encabezado) {
    texto = encabezado;
  } else if (!perfil) {
    texto =
      `¡Hola${nombre ? `, ${nombre}` : ""}! 👋\n\n` +
      "Bienvenido a *AdelinBTC Academy* 🚀\n\n" +
      "Aquí se aprende cripto sin humo: guías interactivas 📚, análisis 📈 y herramientas de trading 🛠\n\n" +
      "Vincula tu cuenta y me encargo de todo: te abro el canal privado en cuanto seas Premium 🔓\n\n" +
      "¿Por dónde empezamos?";
  } else if (esPremium) {
    texto =
      `¡Hola${nombre ? `, ${nombre}` : ""}! 👋\n\n` +
      "Eres Premium 💎 Tienes el canal privado abierto y a mí al otro lado.\n\n" +
      "Escríbeme por aquí lo que necesites — te leo yo, en persona 👇";
  } else {
    texto =
      `¡Hola${nombre ? `, ${nombre}` : ""}! 👋\n\n` +
      "Tu cuenta ya está vinculada ✅\n\n" +
      "Te falta el paso bueno: con Premium 💎 entras al canal privado (te abro yo la puerta, " +
      "automáticamente) y puedes escribirme cuando quieras.";
  }

  await sendTelegramMessage(chatId, texto.replace(/\*/g, ""), menuPara(perfil));
}

/** Bienvenida de /start sin token. Es la primera pantalla que ve alguien al
 *  abrir el bot, y el menú ya se adapta a quién escribe. */
async function enviarBienvenida(admin: Admin, from: TelegramUser) {
  await enviarMenu(admin, from.id, from);
}

/** Pulsación de un botón de acción. */
async function handleCallback(admin: Admin, query: CallbackQuery) {
  // Siempre primero: corta el reloj de carga del botón en el móvil.
  await answerCallbackQuery(query.id);

  const chatId = query.message?.chat.id ?? query.from.id;

  if (query.data === "estado") {
    const { data } = await admin
      .from("profiles")
      .select(CAMPOS_PERFIL_BOT)
      .eq("telegram_user_id", query.from.id)
      .maybeSingle();

    const perfil = (data as PerfilBot | null) ?? null;
    await sendTelegramMessage(chatId, fichaEstado(perfil), menuPara(perfil));
    return;
  }

  const noticia = query.data?.match(/^n:(ok|no):(\d+)$/);
  if (noticia) {
    await decidirNoticia(admin, query, noticia[1] === "ok", Number(noticia[2]));
    return;
  }

  if (query.data === "menu") {
    await enviarMenu(admin, chatId, query.from);
  }
}

/** /start <token>: vincula la cuenta de Telegram que escribe con el usuario
 *  de la Academy dueño de ese token (generado en /cuenta). */
async function handleStart(admin: Admin, message: TelegramMessage) {
  const from = message.from;
  if (!from) return;

  const token = (message.text ?? "").replace("/start", "").trim();
  if (!token) {
    await enviarBienvenida(admin, from);
    return;
  }

  const { data: linkRow } = await admin
    .from("telegram_link_tokens")
    .select("token, user_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!linkRow || linkRow.used_at || new Date(linkRow.expires_at) < new Date()) {
    await sendTelegramMessage(
      from.id,
      "⏰ Este enlace ya ha caducado (duran 15 minutos) o se usó antes.\n\n" +
        "No pasa nada, genera uno nuevo y lo intentamos otra vez 👇",
      [{ text: "🔗 Generar enlace nuevo", url: getCuentaUrl() }]
    );
    return;
  }

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("telegram_user_id", from.id)
    .maybeSingle();

  if (existing && existing.id !== linkRow.user_id) {
    await sendTelegramMessage(
      from.id,
      "🔒 Este Telegram ya está vinculado a otra cuenta de la Academy.\n\n" +
        "Entra en esa cuenta y desvincúlalo primero, y luego lo conectamos aquí 👇",
      [{ text: "⚙️ Ir a mi cuenta", url: getCuentaUrl() }]
    );
    return;
  }

  // Si este perfil ya tenía OTRA cuenta de Telegram vinculada, hay que sacarla
  // del canal antes de sustituirla: en cuanto se sobrescribe el
  // telegram_user_id, esa cuenta antigua queda dentro del canal y sin rastro
  // en la base de datos, así que ni el cron ni una baja de Stripe podrían
  // llegar nunca a expulsarla.
  const { data: perfilActual } = await admin
    .from("profiles")
    .select("telegram_user_id")
    .eq("id", linkRow.user_id)
    .maybeSingle();

  const anterior = perfilActual?.telegram_user_id as number | null | undefined;
  if (anterior && anterior !== from.id) {
    await revokeChannelAccess(admin, {
      userId: linkRow.user_id,
      telegramUserId: anterior,
      reason: "Reemplazada por otra cuenta de Telegram",
    });
  }

  await admin
    .from("profiles")
    .update({
      telegram_user_id: from.id,
      telegram_username: from.username ?? null,
      telegram_linked_at: new Date().toISOString(),
    })
    .eq("id", linkRow.user_id);

  await admin
    .from("telegram_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  await admin.from("telegram_access_log").insert({
    user_id: linkRow.user_id,
    telegram_user_id: from.id,
    action: "linked",
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", linkRow.user_id)
    .single();
  const isPremium = profile?.role === "premium" || profile?.role === "admin";

  // Al Premium le damos el enlace del canal aquí mismo: antes el mensaje lo
  // mandaba de vuelta a la web a buscarlo, un salto de más justo en el momento
  // en que ya lo tenía todo listo para entrar.
  await sendTelegramMessage(
    from.id,
    isPremium
      ? "🎉 ¡Listo! Cuenta vinculada.\n\n" +
        "Eres Premium 💎, así que el canal privado ya te está esperando 👇\n\n" +
        "Y cualquier duda, escríbeme por aquí: me llega a mí directamente."
      : "✅ ¡Cuenta vinculada!\n\n" +
        "Ya está todo listo por mi parte. En cuanto te hagas Premium 💎 te abro " +
        "el canal privado automáticamente — no tendrás que hacer nada más.",
    isPremium
      ? [
          [{ text: "🚀 Entrar al canal", url: getChannelInviteLink() }],
          [
            { text: "📊 Mi Premium", data: "estado" },
            { text: "💬 Hablar con Adelin", url: getAdminChatUrl() },
          ],
        ]
      : [
          [{ text: "💎 Hazte Premium", url: getPremiumUrl() }],
          [{ text: "📊 Ver mi estado", data: "estado" }],
        ]
  );
}

/** chat_join_request: alguien ha pedido entrar al canal. Se aprueba solo si
 *  su Telegram está vinculado a un usuario Premium/admin de la Academy. */
async function handleJoinRequest(admin: Admin, req: ChatJoinRequest) {
  if (String(req.chat.id) !== String(getChannelId())) return; // otro chat: ignorar

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, telegram_username")
    .eq("telegram_user_id", req.from.id)
    .maybeSingle();

  if (profile) {
    await refrescarUsername(admin, req.from.id, profile.telegram_username, req.from.username);
  }

  const isPremium = !!profile && (profile.role === "premium" || profile.role === "admin");

  if (isPremium) {
    await approveChatJoinRequest(req.from.id);
    await sendTelegramMessage(
      req.from.id,
      "🎉 ¡Dentro! Bienvenido al canal Premium.\n\n" +
        "Aquí van los análisis, avisos y todo lo que no publico fuera. " +
        "Ponte cómodo 🚀",
      [
        { text: "📊 Mi Premium", data: "estado" },
        { text: "💬 Hablar con Adelin", url: getAdminChatUrl() },
      ]
    );
    await admin.from("telegram_access_log").insert({
      user_id: profile.id,
      telegram_user_id: req.from.id,
      action: "approved",
    });

    // El aviso del Premium se manda aquí y no desde chat_member porque en este
    // punto sí sabemos quién es en la Academy: su nombre real y su plan.
    const { data: datos } = await admin
      .from("profiles")
      .select("full_name, premium_since")
      .eq("id", profile.id)
      .maybeSingle();

    // Bienvenida pública en el canal, mencionándole. Aquí sí va al canal y no
    // por privado: son pocos, pagan, y ver entrar gente nueva es parte de lo
    // que hace que una comunidad de pago se sienta viva.
    await bienvenidaPremiumEnCanal(req.from, (datos?.full_name as string | null) ?? null);

    const total = await getChannelMemberCount();
    const nombre = datos?.full_name || comoSeLlama(req.from);
    const esAdmin = profile.role === "admin";

    await avisarAlAdmin(
      admin,
      `${alAzar(CELEBRACIONES_PREMIUM)}\n\n` +
        `${nombre}${datos?.full_name && req.from.username ? ` (@${req.from.username})` : ""} ` +
        `acaba de entrar al canal Premium.\n\n` +
        (esAdmin ? "👑 Es un admin, así que la caja no suena.\n" : `💶 +${PREMIUM_PRICE_EUR}€/mes\n`) +
        (total !== null ? `👥 Ya sois ${total} dentro.` : "")
    );
    return;
  }

  await declineChatJoinRequest(req.from.id);
  await sendTelegramMessage(
    req.from.id,
    profile
      ? "🔒 El canal es solo para miembros Premium.\n\n" +
        "Hazte Premium 💎 y vuelve a pedir entrada: te acepto al instante, automáticamente."
      : "🔗 Antes de entrar al canal necesito que vincules tu cuenta de la Academy con este Telegram.\n\n" +
        "Es un minuto y solo se hace una vez 👇",
    profile
      ? [{ text: "💎 Hazte Premium", url: getPremiumUrl() }]
      : [{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }]
  );
  await admin.from("telegram_access_log").insert({
    user_id: profile?.id ?? null,
    telegram_user_id: req.from.id,
    action: "declined",
    reason: profile ? "No premium" : "Sin vincular",
  });
}

/**
 * Chat del admin al que van los mensajes de soporte. Preferimos la variable de
 * entorno (permite usar un grupo con varios moderadores) y, si no está, se
 * busca el Telegram del admin: como ya lo tiene vinculado para su propio
 * acceso al canal, el relé funciona sin configurar nada extra.
 */
async function resolverChatAdmin(admin: Admin): Promise<number | null> {
  const porEntorno = getAdminChatId();
  if (porEntorno) return porEntorno;

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

/** El admin ha decidido sobre una noticia. */
async function decidirNoticia(
  admin: Admin,
  query: CallbackQuery,
  aceptada: boolean,
  id: number
) {
  const chatId = query.message?.chat.id ?? query.from.id;

  const { data: noticia } = await admin
    .from("noticias")
    .select("titulo, resumen, enlace, estado, imagen")
    .eq("id", id)
    .maybeSingle();

  if (!noticia) {
    await sendTelegramMessage(chatId, "No encuentro esa noticia.");
    return;
  }

  // Doble pulsación (o el mensaje viejo de otra tanda): no se vuelve a publicar.
  if (noticia.estado !== "pendiente") {
    if (query.message) {
      await editarMensaje(
        chatId,
        query.message.message_id,
        `📰 ${FUENTE.toUpperCase()} · ya estaba ${noticia.estado}\n\n${noticia.titulo}`
      );
    }
    return;
  }

  let resultado = "❌ Descartada";

  if (aceptada) {
    const canal = getFreeChannelId();
    try {
      if (!canal) throw new Error("Sin canal free configurado");
      await sendChannelPost(
        `📰 ${noticia.titulo}` + (noticia.resumen ? `\n\n${noticia.resumen}` : ""),
        { chatId: canal, imagen: noticia.imagen, botones: [{ text: `📖 Leer en ${FUENTE}`, url: noticia.enlace }] }
      );
      resultado = "✅ Publicada en el canal";
    } catch (err) {
      console.error("[telegram-webhook] No se pudo publicar la noticia:", err);
      // No se marca como publicada si no salió: así se puede reintentar.
      if (query.message) {
        await editarMensaje(
          chatId,
          query.message.message_id,
          `📰 ${FUENTE.toUpperCase()} · ⚠️ no se pudo publicar\n\n${noticia.titulo}`
        );
      }
      return;
    }
  }

  await admin
    .from("noticias")
    .update({
      estado: aceptada ? "publicada" : "descartada",
      decidida_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (query.message) {
    await editarMensaje(
      chatId,
      query.message.message_id,
      `📰 ${FUENTE.toUpperCase()} · ${resultado}\n\n${noticia.titulo}`
    );
  }
}

/**
 * Bienvenida por privado a quien entra al canal GRATUITO.
 *
 * Va por privado y no al canal a propósito: en un canal no existen los avisos
 * de "se unió fulano", así que cada bienvenida sería una publicación más que
 * ven todos y queda en el historial. Con unas pocas altas al día el canal se
 * convertiría en un tablón de bienvenidas.
 *
 * OJO: Telegram prohíbe a los bots escribir a quien no haya iniciado
 * conversación con ellos. A quien entra por el enlace público sin haber
 * hablado nunca con el bot, esto NO le llega — y no hay forma de evitarlo.
 * Se registra para poder medir a cuántos alcanza de verdad.
 */
async function bienvenidaPrivadaFree(quien: TelegramUser) {
  const nombre = quien.first_name || "¡Hola!";
  const texto =
    `🎉 ¡Bienvenido, ${nombre}!\n\n` +
    "Te acabas de unir a la comunidad de AdelinBTC 🚀\n\n" +
    "Aquí vas a encontrar:\n\n" +
    "📰 Las noticias que de verdad mueven el mercado\n" +
    "🎥 Mis vídeos nada más salir\n" +
    "📚 Guías interactivas y herramientas gratuitas\n" +
    "💡 Análisis sin humo, en cristiano\n\n" +
    "Ponte cómodo, que esto acaba de empezar 🔥\n\n" +
    "¿Alguna duda? Pulsa abajo y hablamos 👇";

  try {
    await sendTelegramMessageOrThrow(quien.id, texto, [
      [{ text: "💬 Hablar con Adelin", url: getAdminChatUrl() }],
      [
        { text: "💎 Hazte Premium", url: getPremiumUrl() },
        { text: "🌐 La Academy", url: getSiteUrl() },
      ],
    ]);
    return true;
  } catch {
    // Lo normal si nunca ha hablado con el bot. No es un fallo que arreglar.
    return false;
  }
}

/**
 * Bienvenida pública en el canal PREMIUM, mencionando a quien entra.
 *
 * Aquí sí va al canal: son pocos, pagan, y ver que entra gente nueva es parte
 * de lo que hace que una comunidad de pago se sienta viva.
 */
async function bienvenidaPremiumEnCanal(quien: TelegramUser, nombreReal: string | null) {
  const nombre = nombreReal || quien.first_name || "un nuevo miembro";
  const texto =
    `🎉 ¡Dentro, ${nombre}! 🎉\n\n` +
    "Bienvenido al canal Premium de AdelinBTC 💎\n\n" +
    "Aquí van los análisis, mis entradas en spot y todo lo que no publico fuera.\n\n" +
    "Ponte cómodo — y si tienes cualquier duda, escríbeme cuando quieras 🔥";

  try {
    await sendChannelPost(texto, {
      entidades: mencionar(texto, nombre, quien.id),
      botones: [{ text: "🌐 La Academy", url: getSiteUrl() }],
    });
  } catch (err) {
    console.warn("[telegram-webhook] No se pudo dar la bienvenida en el canal:", err);
  }
}

/** Cómo se refiere el aviso a alguien: su nombre y, si lo tiene, su @. */
function comoSeLlama(u: TelegramUser): string {
  const nombre = u.first_name || "Alguien";
  return u.username ? `${nombre} (@${u.username})` : nombre;
}

/** Manda un aviso al admin. Va al chat de registro si está configurado y, si
 *  no, al privado del propio admin. */
async function avisarAlAdmin(admin: Admin, texto: string) {
  const destino = getLogChatId() ?? (await resolverChatAdmin(admin));
  if (!destino) return;
  try {
    await sendTelegramMessageOrThrow(
      typeof destino === "string" ? (destino as unknown as number) : destino,
      texto
    );
  } catch (err) {
    console.warn("[telegram-webhook] No se pudo avisar al admin:", (err as Error).message);
  }
}

// Se rotan para que el aviso no se vuelva un ruido idéntico cada vez.
const CELEBRACIONES_PREMIUM = [
  "💰💸🤑 ¡SUENA LA CAJA REGISTRADORA!",
  "🤑💰💵 ¡OTRO QUE SE SUBE AL BARCO!",
  "💵💰🎉 ¡NUEVO PREMIUM EN LA CASA!",
  "🤑🔥💰 ¡MÁS LEÑA A LA HOGUERA!",
];

const BIENVENIDAS_FREE = [
  "👋 Alguien nuevo se ha asomado al canal free.",
  "🙌 Uno más en el canal gratuito.",
  "👀 Nueva cara por el canal free.",
  "✨ Se ha unido alguien al canal gratuito.",
];

function alAzar(opciones: string[]): string {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

/**
 * Alta o baja en un canal.
 *
 * Solo se atiende el canal gratuito: en el Premium la entrada pasa antes por
 * handleJoinRequest, que ya avisa con el contexto del perfil (mucho mejor que
 * lo poco que trae este update). Sin este filtro, cada alta Premium generaría
 * dos avisos.
 */
async function handleChatMember(admin: Admin, upd: ChatMemberUpdated) {
  let esPremium = false;
  try {
    esPremium = String(upd.chat.id) === String(getChannelId());
  } catch {
    // Sin canal configurado no podemos distinguirlos: mejor no avisar.
    return;
  }
  if (esPremium) return;

  const antes = upd.old_chat_member.status;
  const ahora = upd.new_chat_member.status;
  const dentro = ["member", "restricted", "administrator", "creator"];
  const fuera = ["left", "kicked"];

  const entra = fuera.includes(antes) && dentro.includes(ahora);
  const sale = dentro.includes(antes) && fuera.includes(ahora);
  if (!entra && !sale) return;

  const quien = upd.new_chat_member.user;

  // Se registra SIEMPRE, altas y bajas: la API de bots no guarda histórico
  // ninguno, así que lo que no se apunte aquí no se puede recuperar después.
  await admin.from("telegram_channel_events").insert({
    chat_id: String(upd.chat.id),
    telegram_user_id: quien.id,
    username: quien.username ?? null,
    nombre: quien.first_name ?? null,
    action: entra ? "join" : "leave",
  });

  // Del aviso solo interesan las altas: notificar cada baja sería deprimente
  // y no accionable.
  if (!entra) return;

  const entregada = await bienvenidaPrivadaFree(quien);

  const total = await getChannelMemberCount(upd.chat.id);
  const cuantos = total !== null ? `\n\nYa sois ${total} en el canal.` : "";
  // Se indica si la bienvenida llegó: si no, es que nunca ha hablado con el
  // bot, y Telegram no permite escribirle primero.
  const aviso = entregada ? "\n✅ Bienvenida enviada por privado." : "\n📭 No he podido escribirle (no ha abierto el bot).";

  await avisarAlAdmin(
    admin,
    `${alAzar(BIENVENIDAS_FREE)}\n\n${comoSeLlama(quien)}${cuantos}${aviso}`
  );
}

/** Mensaje de un usuario al admin. Reservado a Premium: es una de las ventajas
 *  de la suscripción, así que a los demás se les invita en vez de ignorarlos. */
async function handleSupportMessage(
  admin: Admin,
  message: TelegramMessage,
  chatAdmin: number | null
) {
  const from = message.from;
  if (!from) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, full_name, telegram_username")
    .eq("telegram_user_id", from.id)
    .maybeSingle();

  if (!profile) {
    await sendTelegramMessage(
      from.id,
      "👋 ¡Hola! Para poder atenderte necesito saber quién eres.\n\n" +
        "Vincula tu cuenta de la Academy y hablamos 👇",
      [
        [{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }],
        [{ text: "💬 Hablar con Adelin", url: getAdminChatUrl() }],
      ]
    );
    return;
  }

  await refrescarUsername(admin, from.id, profile.telegram_username, from.username);

  const esPremium = profile.role === "premium" || profile.role === "admin";
  if (!esPremium) {
    await sendTelegramMessage(
      from.id,
      "💬 Que te lea por aquí es una de las ventajas Premium.\n\n" +
        "Aun así no te quedas colgado: pulsa el botón y me escribes directamente 👇",
      [
        // Sin esto, un usuario free que escribía al bot recibía solo un
        // argumentario de venta y ninguna forma de contactar. Ahora tiene la
        // puerta abierta, y el relé sigue siendo la ventaja de quien paga.
        [{ text: "💬 Hablar con Adelin", url: getAdminChatUrl() }],
        [{ text: "💎 Hazte Premium", url: getPremiumUrl() }],
      ]
    );
    return;
  }

  if (!message.text) {
    await sendTelegramMessage(
      from.id,
      "De momento solo puedo leer mensajes de texto. Escríbeme tu consulta y te llegará igual."
    );
    return;
  }

  if (!chatAdmin) {
    console.error("[telegram-webhook] Sin chat de admin: mensaje de soporte descartado");
    await sendTelegramMessage(
      from.id,
      "Ahora mismo no puedo entregar tu mensaje. Inténtalo más tarde."
    );
    return;
  }

  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("telegram_support_threads")
    .select("id", { count: "exact", head: true })
    .eq("telegram_user_id", from.id)
    .gte("created_at", desde);

  if ((count ?? 0) >= LIMITE_MENSAJES_HORA) {
    await sendTelegramMessage(
      from.id,
      "Has enviado bastantes mensajes seguidos. Espera un rato y sigue contándome."
    );
    return;
  }

  const nombre = profile.full_name || from.first_name || "Sin nombre";
  const alias = from.username ? ` (@${from.username})` : "";
  const plan = profile.role === "admin" ? "Admin" : "Premium";

  try {
    // Se envía como mensaje propio en vez de reenviarlo con forwardMessage
    // porque así podemos añadir quién escribe y su plan, que es justo lo que
    // hace falta para contestar con contexto.
    const messageId = await sendTelegramMessageOrThrow(
      chatAdmin,
      `💬 ${nombre}${alias} · ${plan}\n\n${message.text}\n\n↩️ Responde a este mensaje para contestarle.`
    );

    // Sin esta fila el admin recibe el mensaje pero no hay forma de saber a
    // quién contestar al responderlo, así que un fallo aquí no puede pasar
    // callado: se le avisa en el momento, que es cuando puede hacer algo.
    const { error: hiloErr } = await admin.from("telegram_support_threads").insert({
      admin_message_id: messageId,
      user_id: profile.id,
      telegram_user_id: from.id,
    });

    if (hiloErr) {
      console.error("[telegram-webhook] No se pudo guardar el hilo de soporte:", hiloErr.message);
      await sendTelegramMessage(
        chatAdmin,
        `⚠️ No he podido guardar el hilo de ${nombre}${alias}, así que responderle citando el ` +
          `mensaje no funcionará. Escríbele tú directamente.`
      );
    }

    await sendTelegramMessage(
      from.id,
      "✅ Mensaje enviado a Adelin. Te responde por aquí en cuanto pueda 👌"
    );
  } catch (err) {
    console.error("[telegram-webhook] No se pudo reenviar el mensaje de soporte:", err);
    await sendTelegramMessage(
      from.id,
      "No he podido entregar tu mensaje. Vuelve a intentarlo en unos minutos."
    );
  }
}

/** El admin contesta citando uno de los mensajes que le reenvió el bot. */
async function handleAdminReply(admin: Admin, message: TelegramMessage) {
  const citado = message.reply_to_message?.message_id;
  if (!citado || !message.text) return;

  const { data: hilo } = await admin
    .from("telegram_support_threads")
    .select("telegram_user_id")
    .eq("admin_message_id", citado)
    .maybeSingle();

  if (!hilo) {
    await sendTelegramMessage(
      message.chat.id,
      "No sé de quién es ese mensaje. Responde citando uno de los que te reenvío yo."
    );
    return;
  }

  try {
    await sendTelegramMessageOrThrow(
      hilo.telegram_user_id as number,
      `💬 Respuesta de AdelinBTC:\n\n${message.text}`
    );
    await sendTelegramMessage(message.chat.id, "✅ Enviado.");
  } catch (err) {
    // Lo más habitual: el usuario ha bloqueado al bot. Merece la pena decirlo,
    // porque si no el admin se queda creyendo que ha contestado.
    await sendTelegramMessage(
      message.chat.id,
      `No se ha podido entregar: ${err instanceof Error ? err.message : "error desconocido"}`
    );
  }
}

export async function POST(request: NextRequest) {
  // El secreto es obligatorio, no opcional: sin él este endpoint acepta
  // cualquier update falsificado, y un /start inventado permitiría vincular
  // una cuenta de Telegram cualquiera a un usuario cualquiera. Si falta la
  // variable, se cierra la puerta en vez de dejarla abierta.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[telegram-webhook] Falta TELEGRAM_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }
  if (request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const admin = createAdminClient();

  // Idempotencia: Telegram reintenta el mismo update si tardamos en responder,
  // y sin esto un reintento reenviaría el mensaje al admin por duplicado.
  if (typeof update.update_id === "number") {
    const { error } = await admin
      .from("telegram_events")
      .insert({ update_id: update.update_id });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      // Cualquier otro fallo no debe impedir atender el mensaje: preferimos
      // arriesgarnos a un duplicado antes que perder el update entero.
      console.error("[telegram-webhook] Error registrando update:", error.message);
    }
  }

  try {
    const message = update.message;
    // Telegram añade el @bot a los comandos en grupos: /menu@MiBot.
    const comando = message?.text?.startsWith("/")
      ? message.text.split(/[\s@]/)[0].toLowerCase()
      : null;

    if (update.callback_query) {
      await handleCallback(admin, update.callback_query);
    } else if (comando === "/start") {
      await handleStart(admin, message as TelegramMessage);
    } else if (message?.from && (comando === "/menu" || comando === "/ayuda")) {
      await enviarMenu(admin, message.chat.id, message.from);
    } else if (message?.from && COMANDOS_DE_ADMIN.includes(comando ?? "")) {
      // Herramientas de trabajo, no funciones del bot para los usuarios: a
      // quien no sea admin se le responde con el menú normal, sin dar pistas
      // de que existen.
      if (!(await esAdmin(admin, message.from.id))) {
        await enviarMenu(admin, message.chat.id, message.from);
      } else if (comando === "/noticias") {
        // Con su propio catch: el de más abajo registra y devuelve 200, así
        // que un fallo aquí dejaba el comando sin responder absolutamente
        // nada y no había forma de saber por qué desde Telegram.
        try {
          const nuevas = await guardarNuevas(admin);
          if (nuevas.length === 0) {
            await sendTelegramMessage(message.chat.id, "📰 Sin noticias nuevas por ahora.");
          } else {
            for (const n of nuevas) await proponerNoticia(admin, message.chat.id, n);
          }
        } catch (err) {
          console.error("[telegram-webhook] /noticias falló:", err);
          await sendTelegramMessage(
            message.chat.id,
            `⚠️ No he podido traer las noticias.\n\n${err instanceof Error ? err.message : "Error desconocido"}`
          );
        }
      }
    } else if (message?.from && comando === "/estado") {
      const { data } = await admin
        .from("profiles")
        .select(CAMPOS_PERFIL_BOT)
        .eq("telegram_user_id", message.from.id)
        .maybeSingle();
      const perfil = (data as PerfilBot | null) ?? null;
      await sendTelegramMessage(message.chat.id, fichaEstado(perfil), menuPara(perfil));
    } else if (update.chat_join_request) {
      await handleJoinRequest(admin, update.chat_join_request);
    } else if (update.chat_member) {
      await handleChatMember(admin, update.chat_member);
    } else if (message?.from && comando) {
      // Comando que no existe. Sin esto acababa en el relé de soporte y te
      // llegaba un "/help" suelto como si fuera una consulta.
      await enviarMenu(
        admin,
        message.chat.id,
        message.from,
        "No conozco ese comando 🤔 Esto es lo que sí puedo hacer:"
      );
    } else if (message) {
      // Texto libre: o es el admin contestando, o alguien escribiéndole.
      const chatAdmin = await resolverChatAdmin(admin);
      if (chatAdmin && message.chat.id === chatAdmin) {
        if (message.reply_to_message) {
          await handleAdminReply(admin, message);
        } else {
          await sendTelegramMessage(
            chatAdmin,
            "Para contestar a alguien, responde citando su mensaje."
          );
        }
      } else {
        await handleSupportMessage(admin, message, chatAdmin);
      }
    }
  } catch (err) {
    // Telegram reintenta si no respondemos 200: registramos pero no fallamos
    // la petición para no entrar en un bucle de reintentos infinito.
    console.error("[telegram-webhook] Error procesando update:", err);
  }

  return NextResponse.json({ ok: true });
}
