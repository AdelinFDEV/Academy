import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import {
  FUENTE,
  MAXIMO_POR_TANDA,
  guardarNuevas,
  noticiaEsperandoTexto,
  pedirTextoAlAdmin,
  pendientesSinProponer,
  proponerNoticia,
  publicarNoticia,
  publicarTextoPropio,
  votarNoticia,
  type Voto,
} from "@/lib/noticias";
import {
  CAMPOS_PERFIL_BOT,
  bienvenidaCanalFree,
  COMANDOS_PUBLICOS,
  menuPara,
  pantalla,
  tienePremium,
  type PerfilBot,
} from "@/lib/bot-menu";
import { alternarTarea, enviarRutina, esTarea } from "@/lib/rutina";
import { publicarVideoConcreto, videoYaAnunciado } from "@/lib/announce";
import { getLatestVideos } from "@/lib/youtube";
import {
  answerCallbackQuery,
  avisarAlAdmin,
  escribirYAvisar,
  resolverChatAdmin,
  editarMensaje,
  sendChannelPost,
  approveChatJoinRequest,
  declineChatJoinRequest,
  getAdminChatUrl,
  getChannelId,
  getChannelInviteLink,
  chatsPremium,
  getChannelMemberCount,
  getFreeChannelId,
  getFreeChannelUrl,
  getOwnerTelegramId,
  mencionar,
  pausarAvisos,
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
// El comando /noticias redacta cada noticia antes de proponerla, y eso son
// decenas de segundos. El resto de updates responden en milisegundos.
export const maxDuration = 60;

type Admin = ReturnType<typeof createAdminClient>;

type TelegramUser = { id: number; username?: string; first_name?: string };
type TelegramMessage = {
  message_id: number;
  chat: { id: number; type?: string };
  from?: TelegramUser;
  text?: string;
  /** El formato que le dio quien escribe (negritas, cursivas, enlaces). Se
   *  reenvía tal cual al publicar lo que redacta el admin. */
  entities?: unknown[];
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

/** Tope de mensajes por hora y usuario, para que nadie pueda inundar el
 *  Telegram del admin desde una cuenta Premium. */
const LIMITE_MENSAJES_HORA = 10;

/** Comandos reservados al admin. Al añadir uno nuevo, basta con listarlo aquí
 *  para que quede protegido: a quien no sea admin se le responde con el menú
 *  normal, sin darle ninguna pista de que el comando existe. */
const COMANDOS_DE_ADMIN = ["/noticias", "/rutina", "/stop", "/arrancar", "/video"];

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

/**
 * Carga el perfil de quien interactúa a partir de su id de Telegram.
 *
 * SIEMPRE se lee de la base de datos en el momento, nunca del mensaje: lo que
 * llega de Telegram dice quién es (el id lo pone Telegram, no el usuario) pero
 * jamás qué plan tiene. Así, un mensaje viejo guardado en el chat por alguien
 * que ya dejó de ser Premium se repinta con lo que le corresponde hoy.
 */
async function cargarPerfil(admin: Admin, telegramUserId: number): Promise<PerfilBot | null> {
  const { data } = await admin
    .from("profiles")
    .select(CAMPOS_PERFIL_BOT)
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  return (data as PerfilBot | null) ?? null;
}

/**
 * Pinta una pantalla del menú.
 *
 * Si viene de pulsar un botón (`messageId`), se reescribe el mensaje en su
 * sitio en vez de mandar uno nuevo: navegar por el menú no debería llenar el
 * chat de menús. Si la reescritura falla —mensaje demasiado viejo, borrado por
 * el usuario— se envía uno nuevo, para no dejar la pulsación sin respuesta.
 */
async function mostrarPantalla(
  admin: Admin,
  chatId: number,
  from: TelegramUser,
  id: string,
  messageId?: number
) {
  const perfil = await cargarPerfil(admin, from.id);
  if (perfil) {
    await refrescarUsername(admin, from.id, perfil.telegram_username, from.username);
  }

  const nombre = perfil?.full_name || from.first_name || null;
  // Un identificador desconocido (mensaje de una versión anterior del bot)
  // cae en el inicio en vez de quedarse mudo.
  const vista = pantalla(id, perfil, nombre) ?? pantalla("m:inicio", perfil, nombre)!;

  if (messageId !== undefined) {
    const reescrito = await editarMensaje(chatId, messageId, vista.texto, vista.botones);
    if (reescrito) return;
  }
  await sendTelegramMessage(chatId, vista.texto, vista.botones);
}

/**
 * Menú principal como mensaje nuevo, con un encabezado opcional que sustituye
 * al saludo (se usa cuando hay algo que explicar antes: un comando que no
 * existe, por ejemplo).
 */
async function enviarMenu(admin: Admin, chatId: number, from: TelegramUser, encabezado?: string) {
  if (!encabezado) {
    await mostrarPantalla(admin, chatId, from, "m:inicio");
    return;
  }

  const perfil = await cargarPerfil(admin, from.id);
  if (perfil) {
    await refrescarUsername(admin, from.id, perfil.telegram_username, from.username);
  }
  await sendTelegramMessage(chatId, encabezado, menuPara(perfil));
}

/** Bienvenida de /start sin token. Es la primera pantalla que ve alguien al
 *  abrir el bot, y el menú ya se adapta a quién escribe. */
async function enviarBienvenida(admin: Admin, from: TelegramUser) {
  await enviarMenu(admin, from.id, from);
}

/**
 * Pulsación de un botón de acción.
 *
 * OJO con answerCallbackQuery: solo admite UNA respuesta por pulsación, y la
 * segunda falla. Por eso el voto se atiende antes de la respuesta genérica —
 * necesita contestar con texto propio, y si ya se hubiera contestado en vacío
 * el aviso emergente no llegaría nunca.
 */
async function handleCallback(admin: Admin, query: CallbackQuery) {
  const data = query.data ?? "";

  // Voto toro/oso en una noticia del canal. Abierto a cualquiera: es el canal
  // gratuito y de eso se trata. Lo único que hace es contar.
  const voto = data.match(/^nv:(\d+):(toro|oso)$/);
  if (voto) {
    const resultado = await votarNoticia(admin, Number(voto[1]), query.from.id, voto[2] as Voto);
    // El aviso emergente es toda la confirmación que recibe quien vota desde
    // un canal, donde el marcador tarda un instante en repintarse.
    await answerCallbackQuery(query.id, resultado?.aviso ?? "Esa noticia ya no está");
    return;
  }

  // Corta el reloj de carga del botón en el móvil.
  await answerCallbackQuery(query.id);

  const chatId = query.message?.chat.id ?? query.from.id;

  // Decisiones sobre noticias: son del admin y no pintan menú.
  const noticia = data.match(/^n:(ok|no):(\d+)$/);
  if (noticia) {
    await decidirNoticia(admin, query, noticia[1] === "ok", Number(noticia[2]));
    return;
  }

  // "La escribo yo": el bot le pasa el enlace y se queda esperando su texto.
  const aMano = data.match(/^n:mio:(\d+)$/);
  if (aMano) {
    await handleEscribirloYo(admin, query, Number(aMano[1]));
    return;
  }

  // Botón de "Publicar en el canal" de /video: solo del admin.
  const video = data.match(/^v:pub:([\w-]{11})$/);
  if (video) {
    await handleVideoPublicar(admin, query, video[1]);
    return;
  }

  // Botones de la rutina diaria: solo del admin.
  if (data.startsWith("r:")) {
    await handleRutinaCallback(admin, query, data);
    return;
  }

  // "estado" y "menu" a secas son los botones de la versión anterior del bot.
  // Siguen vivos en los chats de quien los recibió, así que se traducen en vez
  // de dejarlos sin respuesta.
  const id = data === "estado" ? "m:estado" : data === "menu" || !data ? "m:inicio" : data;

  await mostrarPantalla(admin, chatId, query.from, id, query.message?.message_id);
}

/**
 * Botones de la rutina diaria (marcar tareas, parar y arrancar los avisos).
 *
 * PRIMERA LÍNEA DE SEGURIDAD: el rol se comprueba en la base de datos contra
 * el id de quien pulsa, que lo pone Telegram y no se puede falsificar desde el
 * cliente. A quien no sea admin no se le contesta nada — ni un error, ni un
 * menú: así ni siquiera confirma que estos botones existan.
 *
 * En la práctica un usuario normal no puede llegar aquí (Telegram quita los
 * botones de acción al reenviar un mensaje), pero eso es un detalle de la
 * plataforma y no algo en lo que se pueda confiar.
 */
async function handleRutinaCallback(admin: Admin, query: CallbackQuery, data: string) {
  if (!(await esAdmin(admin, query.from.id))) return;

  const chatId = query.message?.chat.id ?? query.from.id;

  if (data === "r:stop" || data === "r:go") {
    await cambiarAvisos(admin, chatId, data === "r:stop");
    return;
  }

  if (data === "r:hoy") {
    // Siempre al privado del admin (destinoRutina), nunca al chat desde el que
    // se pulsó: la rutina es personal y no debe acabar en un grupo por error.
    await enviarRutina(admin, { forzar: true });
    return;
  }

  // Formato fijo: r:t:AAAA-MM-DD:tarea. Lo que no encaje se ignora, y la tarea
  // se valida además contra la lista cerrada de esTarea().
  const marca = data.match(/^r:t:(\d{4}-\d{2}-\d{2}):([a-z]+)$/);
  if (!marca || !esTarea(marca[2])) return;

  const resultado = await alternarTarea(admin, marca[1], marca[2], chatId);
  if (!resultado.ok && resultado.aviso) {
    await sendTelegramMessage(chatId, `⚠️ ${resultado.aviso}`);
  }
}

/** Enciende o apaga los avisos automáticos y lo confirma por escrito, para que
 *  nunca haya duda de en qué estado quedó el bot. */
async function cambiarAvisos(admin: Admin, chatId: number, pausar: boolean) {
  if (!(await pausarAvisos(admin, pausar))) {
    await sendTelegramMessage(
      chatId,
      "⚠️ No he podido cambiar el interruptor.\n\n" +
        "Los avisos siguen como estaban. Inténtalo otra vez en un momento."
    );
    return;
  }

  if (pausar) {
    await sendTelegramMessage(
      chatId,
      "🔕 Avisos en pausa\n\n" +
        "A partir de ahora no te mando nada por mi cuenta:\n\n" +
        "🔇 Altas y bajas en los canales\n" +
        "🔇 Propuestas de noticias\n" +
        "🔇 La rutina diaria de las 6:00\n\n" +
        "Lo que SÍ te sigue llegando:\n\n" +
        "💬 Los mensajes de los usuarios Premium — eso no lo paro nunca, no quiero " +
        "que pierdas a nadie por un interruptor.\n\n" +
        "Y el bot sigue trabajando igual: abre y cierra el canal solo, y las bajas se " +
        "siguen registrando. Solo he bajado el volumen.\n\n" +
        "Cuando quieras volver, /arrancar 👇",
      [[{ text: "🔔 Volver a los avisos", data: "r:go" }]]
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    "🔔 Avisos activados\n\n" +
      "Ya te vuelvo a contar todo:\n\n" +
      "🔊 Altas y bajas en los canales\n" +
      "🔊 Propuestas de noticias\n" +
      "🔊 La rutina diaria de las 6:00\n\n" +
      "Lo que pasó mientras estabas en silencio no se recupera — no te lo voy a " +
      "amontonar de golpe. Empezamos desde ahora.\n\n" +
      "Para volver a pararlos, /stop 👇",
    [
      [{ text: "📋 Ver mi rutina de hoy", data: "r:hoy" }],
      [{ text: "🔕 Parar los avisos", data: "r:stop" }],
    ]
  );
}

/**
 * Alguien llega por un enlace del tipo t.me/AdelinBTC_Bot?start=ig
 *
 * ── Por qué esto importa más de lo que parece ───────────────────────────────
 * Telegram no deja a un bot escribir a quien no le ha hablado antes. Por eso
 * la bienvenida de quien entra al canal por su cuenta no le llega, y hay que
 * dejarla apuntada esperando a que algún día interactúe.
 *
 * Este enlace le da la vuelta al embudo: primero se abre el BOT, se pulsa
 * INICIAR —y esa pulsación ya es la conversación que Telegram exige— y desde
 * ahí se entra al canal. Todo el que llegue así queda localizable para
 * siempre: bienvenidas, avisos de Premium, respuestas... todo funciona.
 *
 * De paso, la etiqueta del enlace dice de dónde viene cada uno, que es lo más
 * cerca que se puede estar de saber qué canal de captación funciona.
 */
async function bienvenidaDesdeEnlace(admin: Admin, from: TelegramUser, origen: string) {
  // Lo que llega en un /start lo escribe quien quiera: se normaliza a una
  // etiqueta corta y sin sorpresas antes de guardarla.
  const etiqueta = origen.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) || "desconocido";

  await admin.from("telegram_access_log").insert({
    telegram_user_id: from.id,
    action: "start",
    reason: etiqueta,
  });

  const perfil = await cargarPerfil(admin, from.id);
  const nombre = perfil?.full_name || from.first_name || null;

  // A quien ya es Premium no se le manda al canal gratuito: se le enseña su
  // menú, que ya lleva el canal que le toca.
  if (tienePremium(perfil)) {
    await mostrarPantalla(admin, from.id, from, "m:inicio");
    return;
  }

  await sendTelegramMessage(
    from.id,
    `¡Hola${nombre ? `, ${nombre}` : ""}! 👋\n\n` +
      "Bienvenido a AdelinBTC Academy 🚀\n\n" +
      "Aquí se aprende cripto sin humo:\n" +
      "📰 Las noticias que de verdad mueven el mercado\n" +
      "🎥 Mis vídeos nada más salir\n" +
      "📚 Guías interactivas y herramientas gratuitas\n\n" +
      "Empieza por el canal gratuito — se entra en un toque y no cuesta nada 👇",
    [
      [{ text: "📣 Entrar al canal gratuito", url: getFreeChannelUrl() }],
      [{ text: "💎 Qué incluye Premium", data: "m:premium" }],
      [
        { text: "🎁 Lo que ya tienes gratis", data: "m:gratis" },
        { text: "🌐 La Academy", url: getSiteUrl() },
      ],
      [{ text: "💬 Hablar con Adelin", url: getAdminChatUrl() }],
    ]
  );
}

/** /start <token>: vincula la cuenta de Telegram que escribe con el usuario
 *  de la Academy dueño de ese token (generado en /cuenta). */
async function handleStart(admin: Admin, message: TelegramMessage) {
  const from = message.from;
  if (!from) return;

  const carga = (message.text ?? "").replace("/start", "").trim();
  if (!carga) {
    await enviarBienvenida(admin, from);
    return;
  }

  // Los tokens de vinculación son 48 caracteres hex (generateLinkToken). Todo
  // lo demás que venga en un /start es una etiqueta de origen: los enlaces
  // t.me/AdelinBTC_Bot?start=ig, ?start=yt, ?start=canal… que se reparten por
  // fuera. Sin esta distinción, un ?start=ig contestaba "este enlace ha
  // caducado", que no hay nada más desconcertante como primer mensaje.
  if (!/^[0-9a-f]{48}$/.test(carga)) {
    await bienvenidaDesdeEnlace(admin, from, carga);
    return;
  }

  const token = carga;
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
  const isPremium = tienePremium(profile);

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
            { text: "📊 Mi Premium", data: "m:estado" },
            { text: "💬 Hablar con Adelin", url: getAdminChatUrl() },
          ],
        ]
      : [
          [{ text: "💎 Hazte Premium", url: getPremiumUrl() }],
          [{ text: "📊 Ver mi estado", data: "m:estado" }],
        ]
  );
}

/**
 * chat_join_request: alguien ha pedido entrar. Se aprueba solo si su Telegram
 * está vinculado a un usuario Premium/admin de la Academy.
 *
 * Vale tanto para el canal como para el grupo de debate de la comunidad: son
 * dos chats distintos, con dos listas de miembros distintas, y en el grupo se
 * lee lo mismo que en el canal. Cualquier solicitud de otro chat se ignora.
 */
async function handleJoinRequest(admin: Admin, req: ChatJoinRequest) {
  const premium = await chatsPremium();
  const chatId = String(req.chat.id);
  if (!premium.includes(chatId)) return; // otro chat: ignorar

  const esElGrupo = chatId !== String(getChannelId());

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, telegram_username")
    .eq("telegram_user_id", req.from.id)
    .maybeSingle();

  if (profile) {
    await refrescarUsername(admin, req.from.id, profile.telegram_username, req.from.username);
  }

  const isPremium = !!profile && tienePremium(profile);

  if (isPremium) {
    await approveChatJoinRequest(req.from.id, chatId);
    await sendTelegramMessage(
      req.from.id,
      esElGrupo
        ? "🎉 ¡Dentro del chat de la comunidad!\n\n" +
          "Aquí se habla: dudas, ideas y lo que surja. Preséntate cuando quieras 🚀"
        : "🎉 ¡Dentro! Bienvenido al canal Premium.\n\n" +
          "Aquí van los análisis, avisos y todo lo que no publico fuera. " +
          "Ponte cómodo 🚀",
      [
        { text: "📊 Mi Premium", data: "m:estado" },
        { text: "💬 Hablar con Adelin", url: getAdminChatUrl() },
      ]
    );
    await admin.from("telegram_access_log").insert({
      user_id: profile.id,
      telegram_user_id: req.from.id,
      action: "approved",
      reason: esElGrupo ? "Chat de la comunidad" : null,
    });

    // La fiesta —bienvenida pública y aviso de caja— es solo la primera vez,
    // al entrar al canal. Repetirla al entrar al chat sería anunciar dos veces
    // a la misma persona por el mismo pago.
    if (esElGrupo) return;

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

  await declineChatJoinRequest(req.from.id, chatId);
  await sendTelegramMessage(
    req.from.id,
    profile
      ? `🔒 ${esElGrupo ? "El chat de la comunidad es" : "El canal es"} solo para miembros Premium.\n\n` +
        "Hazte Premium 💎 y vuelve a pedir entrada: te acepto al instante, automáticamente."
      : "🔗 Antes de entrar necesito que vincules tu cuenta de la Academy con este Telegram.\n\n" +
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
 * El admin quiere escribir él la noticia.
 *
 * Solo para admins, como el resto de lo que toca noticias: quien pulse esto
 * sin serlo no recibe nada, ni siquiera un error.
 */
async function handleEscribirloYo(admin: Admin, query: CallbackQuery, id: number) {
  if (!(await esAdmin(admin, query.from.id))) return;

  const chatId = query.message?.chat.id ?? query.from.id;

  const { data: noticia } = await admin
    .from("noticias")
    .select("id, titulo, enlace, estado")
    .eq("id", id)
    .maybeSingle();

  if (!noticia) {
    await sendTelegramMessage(chatId, "No encuentro esa noticia.");
    return;
  }
  if (noticia.estado !== "pendiente") {
    await sendTelegramMessage(chatId, `Esa noticia ya estaba ${noticia.estado}.`);
    return;
  }

  await pedirTextoAlAdmin(admin, chatId, noticia);
}

/**
 * El admin responde con el texto de una noticia que pidió escribir él.
 *
 * Devuelve true si la respuesta era eso, para que quien llama no siga tratando
 * el mensaje como una contestación de soporte.
 */
async function handleTextoDeNoticia(admin: Admin, message: TelegramMessage): Promise<boolean> {
  const citado = message.reply_to_message?.message_id;
  if (!citado || !message.text) return false;

  const noticia = await noticiaEsperandoTexto(admin, citado);
  if (!noticia) return false;

  const chatId = message.chat.id;

  if (noticia.estado !== "pendiente") {
    await sendTelegramMessage(chatId, `Esa noticia ya estaba ${noticia.estado}, no la he tocado.`);
    return true;
  }

  const canal = getFreeChannelId();
  if (!canal) {
    await sendTelegramMessage(chatId, "⚠️ No hay canal gratuito configurado, no puedo publicar.");
    return true;
  }

  try {
    const { conImagen } = await publicarTextoPropio(
      admin,
      noticia,
      message.text,
      message.entities,
      canal
    );
    await sendTelegramMessage(
      chatId,
      `✅ Publicada con tu texto${conImagen ? " y la imagen del artículo" : " (sin imagen: no cabía en el pie de foto)"}.`
    );
  } catch (err) {
    console.error("[telegram-webhook] No se pudo publicar el texto propio:", err);
    await sendTelegramMessage(
      chatId,
      `⚠️ No he podido publicarla.\n\n${err instanceof Error ? err.message : "Error desconocido"}\n\n` +
        "Tu texto sigue ahí arriba: vuelve a responder al mismo mensaje y lo reintento."
    );
  }
  return true;
}

/**
 * /gombos — lista los comandos de admin que existen ahora mismo.
 *
 * Lee COMANDOS_DE_ADMIN en vez de traer la lista escrita a mano: así nunca se
 * desincroniza cuando se añade uno nuevo — es lo mismo que ya le pasó al
 * texto de /ayuda antes de que se generase de COMANDOS_PUBLICOS.
 */
async function handleGombos(chatId: number) {
  const descripciones: Record<string, string> = {
    "/noticias": "Buscar noticias nuevas y proponerlas",
    "/video": "Ver el último vídeo de YouTube y publicarlo",
    "/rutina": "Tu rutina de hoy, fuera de las 6:00",
    "/stop": "Parar todos los avisos automáticos",
    "/arrancar": "Reanudarlos",
  };

  const lineas = COMANDOS_DE_ADMIN.map(
    (c) => `${c} — ${descripciones[c] ?? "(sin descripción)"}`
  );

  await sendTelegramMessage(
    chatId,
    "🔐 Comandos de admin\n\n" +
      `${lineas.join("\n")}\n\n` +
      "Ninguno de estos aparece en el botón «/» de nadie: se responden solo si el rol " +
      "es admin, y este mensaje solo se responde a ti."
  );
}

/**
 * /video — enseña el último subido al canal de YouTube y ofrece publicarlo.
 *
 * No hace falta ninguna clave de API: getLatestVideos() lee el feed RSS
 * público del canal, que YouTube ofrece sin autenticación. Se pide sin caché
 * (el segundo argumento) para que un vídeo recién subido aparezca al momento,
 * no hasta que expiren los 30 minutos de la home.
 */
async function handleVideoUltimo(admin: Admin, chatId: number) {
  const [video] = await getLatestVideos(1, true);
  if (!video) {
    await sendTelegramMessage(
      chatId,
      "🎥 No he encontrado ningún vídeo.\n\n" +
        "Puede que YouTube esté tardando en responder — inténtalo de nuevo en un momento."
    );
    return;
  }

  const publicado = await videoYaAnunciado(admin, video.id);
  const fecha = new Date(video.publishedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });

  await sendTelegramMessage(
    chatId,
    `🎥 Tu último vídeo\n\n${video.title}\n\n📅 Subido el ${fecha}` +
      (publicado
        ? "\n\n✅ Ya está publicado en el canal free."
        : "\n\n¿Lo publico en el canal free, con miniatura y enlace?"),
    publicado
      ? [{ text: "▶️ Ver en YouTube", url: video.url }]
      : [
          [{ text: "📣 Publicar en el canal", data: `v:pub:${video.id}` }],
          [{ text: "▶️ Ver en YouTube", url: video.url }],
        ]
  );
}

/** Botón "Publicar en el canal" de /video. Se relee el feed en vez de fiarse
 *  de lo que viajó en el callback: así siempre se publica lo que YouTube dice
 *  ahora mismo, no una copia de hace un rato. */
async function handleVideoPublicar(admin: Admin, query: CallbackQuery, id: string) {
  if (!(await esAdmin(admin, query.from.id))) return;

  const chatId = query.message?.chat.id ?? query.from.id;
  const [video] = await getLatestVideos(1, true);

  if (!video || video.id !== id) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Ese ya no es el último vídeo del canal — pide /video otra vez para ver el actual."
    );
    return;
  }

  const resultado = await publicarVideoConcreto(admin, video);
  await sendTelegramMessage(
    chatId,
    resultado.ok
      ? `✅ Publicado en el canal free.\n\n${video.title}`
      : `⚠️ No se ha publicado.\n\n${resultado.motivo}`
  );
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
    .select("id, titulo, resumen, enlace, estado, imagen, texto_canal")
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
      // Manda el texto que ya se guardó al proponerla: lo que se publica es,
      // palabra por palabra, lo que se acaba de aprobar.
      await publicarNoticia(admin, noticia, canal);
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
 * hablado nunca con el bot, esto NO le llega en el momento — y no hay forma de
 * evitarlo. Lo que sí se puede es no perderlo: si falla, se apunta como
 * pendiente y se entrega en cuanto esa persona hable con el bot, aunque sean
 * días después (ver entregarBienvenidaPendiente).
 */
async function bienvenidaPrivadaFree(admin: Admin, quien: TelegramUser) {
  const vista = bienvenidaCanalFree(quien);
  return escribirYAvisar(admin, { id: quien.id, nombre: comoSeLlama(quien) }, vista.texto, {
    botones: vista.botones,
    motivo: "bienvenida al canal gratuito",
  });
}

/** Cuánto se guarda una bienvenida sin entregar. Pasado ese plazo deja de
 *  tener sentido darle la bienvenida a algo que hizo hace tres semanas. */
const DIAS_BIENVENIDA_PENDIENTE = 14;

/**
 * Apunta una bienvenida que no se pudo entregar.
 *
 * Upsert por telegram_user_id: si alguien se va y vuelve a entrar, se refresca
 * la fila que ya había en vez de acumular duplicados.
 */
async function apuntarBienvenidaPendiente(admin: Admin, quien: TelegramUser, chatId: number) {
  const { error } = await admin.from("telegram_bienvenidas_pendientes").upsert(
    {
      telegram_user_id: quien.id,
      nombre: quien.first_name ?? null,
      username: quien.username ?? null,
      chat_id: String(chatId),
      creada_en: new Date().toISOString(),
      intentos: 1,
      ultimo_error: "No había hablado nunca con el bot",
    },
    { onConflict: "telegram_user_id" }
  );
  if (error) console.error("[telegram-webhook] No se pudo apuntar la bienvenida:", error.message);
}

/**
 * Entrega la bienvenida que se quedó pendiente, si la hay.
 *
 * Se llama en CADA interacción de un usuario con el bot, porque ese es
 * justamente el momento en que Telegram empieza a permitir escribirle: hasta
 * que no habla él, cualquier reintento programado fallaría igual. Por eso no
 * hay un cron que lo reintente — no serviría de nada.
 *
 * El aviso al admin se manda solo cuando SE CONSIGUE. Un reintento fallido no
 * dice nada nuevo (ya avisó el del día del alta) y llenaría el chat.
 */
async function entregarBienvenidaPendiente(admin: Admin, quien: TelegramUser) {
  const { data } = await admin
    .from("telegram_bienvenidas_pendientes")
    .select("telegram_user_id, nombre, username, creada_en, intentos")
    .eq("telegram_user_id", quien.id)
    .maybeSingle();

  if (!data) return;

  const borrar = () =>
    admin.from("telegram_bienvenidas_pendientes").delete().eq("telegram_user_id", quien.id);

  const dias = (Date.now() - new Date(data.creada_en as string).getTime()) / (24 * 60 * 60 * 1000);
  if (dias > DIAS_BIENVENIDA_PENDIENTE) {
    await borrar();
    return;
  }

  // El texto cambia según lo que haya tardado: a los cuatro días, un "te
  // acabas de unir" delata que el mensaje está enlatado.
  const vista = bienvenidaCanalFree(quien, dias);

  try {
    await sendTelegramMessageOrThrow(quien.id, vista.texto, vista.botones);
  } catch (err) {
    // Sigue sin poder escribirle: se deja apuntada y se reintenta la próxima
    // vez. No se avisa al admin — no hay nada nuevo que contarle.
    await admin
      .from("telegram_bienvenidas_pendientes")
      .update({
        intentos: (data.intentos as number) + 1,
        ultimo_error: err instanceof Error ? err.message : "error desconocido",
      })
      .eq("telegram_user_id", quien.id);
    return;
  }

  await borrar();

  const cuando =
    dias < 1
      ? "hoy mismo"
      : dias < 2
        ? "ayer"
        : `hace ${Math.floor(dias)} días`;

  await avisarAlAdmin(
    admin,
    `✅ Por fin le ha llegado la bienvenida a ${comoSeLlama(quien)}\n\n` +
      `Se unió al canal free ${cuando} y hasta ahora no había hablado conmigo, ` +
      `así que Telegram no me dejaba escribirle. Acaba de hacerlo y se la he entregado.`
  );
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
  // Solo se atiende el canal GRATUITO, y se comprueba por lo que es y no por
  // lo que no es. Antes se daba por free todo lo que no fuera el canal
  // Premium, y al aparecer el grupo de debate de la comunidad sus altas se
  // habrían contado como altas del canal gratuito: estadísticas falsas y una
  // bienvenida equivocada a gente que acaba de entrar al chat de pago.
  const free = getFreeChannelId();
  if (!free || String(upd.chat.id) !== String(free)) return;

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

  const total = await getChannelMemberCount(upd.chat.id);
  const cuantos = total !== null ? `\n\nYa sois ${total} en el canal.` : "";

  await avisarAlAdmin(admin, `${alAzar(BIENVENIDAS_FREE)}\n\n${comoSeLlama(quien)}${cuantos}`);

  // El resultado del privado lo cuenta escribirYAvisar en su propio mensaje,
  // así que aquí ya no hace falta repetirlo. Lo que sí hace falta es no
  // rendirse: si no se pudo entregar, queda apuntada para el día que hable.
  const entregada = await bienvenidaPrivadaFree(admin, quien);
  if (!entregada) await apuntarBienvenidaPendiente(admin, quien, upd.chat.id);
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

  const esPremium = tienePremium(profile);
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

  // Antes que nada: ¿es el texto de una noticia que pidió escribir él? Va
  // primero porque si no, ese texto acabaría en el relé de soporte intentando
  // enviarse a un usuario que no existe.
  if (await handleTextoDeNoticia(admin, message)) return;

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

    // Que alguien nos hable es la ÚNICA señal de que Telegram ya nos deja
    // escribirle. Es el momento exacto de soltar la bienvenida que se quedó
    // sin entregar el día que entró al canal — normalmente no hay ninguna, así
    // que esto es una consulta por clave primaria y se acabó.
    const quienHabla = update.callback_query?.from ?? message?.from;
    if (quienHabla) await entregarBienvenidaPendiente(admin, quienHabla);

    if (update.callback_query) {
      await handleCallback(admin, update.callback_query);
    } else if (comando === "/chatid") {
      // Herramienta de diagnóstico: la API de bots no tiene ningún método para
      // listar en qué chats está metido el bot, así que cuando hace falta
      // saber el id de un chat concreto (el chat de una comunidad, un grupo
      // nuevo) no queda otra que preguntárselo al propio chat. Solo el dueño,
      // igual que /gombos: no es información sensible, pero tampoco hace
      // falta ofrecérsela a nadie más.
      if (message?.from?.id === getOwnerTelegramId()) {
        await sendTelegramMessage(
          message.chat.id,
          `🆔 Este chat\n\nid: ${message.chat.id}\ntipo: ${message.chat.type ?? "?"}`
        );
      }
    } else if (comando === "/gombos") {
      // Fuera de COMANDOS_DE_ADMIN y de esAdmin() a propósito: esto no sigue
      // al ROL, sigue a la PERSONA. Ver getOwnerTelegramId().
      if (message?.from && message.from.id === getOwnerTelegramId()) {
        await handleGombos(message.chat.id);
      } else if (message?.from) {
        // Ni una pista de que el comando existe: se responde igual que a
        // cualquier comando desconocido.
        await enviarMenu(
          admin,
          message.chat.id,
          message.from,
          "No conozco ese comando 🤔 Esto es lo que sí puedo hacer:"
        );
      }
    } else if (comando === "/start") {
      await handleStart(admin, message as TelegramMessage);
    } else if (
      message?.from &&
      comando &&
      Object.prototype.hasOwnProperty.call(COMANDOS_PUBLICOS, comando)
    ) {
      // Cada comando del menú es un atajo a su pantalla: /premium, /precio,
      // /cancelar, /faq… La correspondencia vive en bot-menu.ts, junto a las
      // pantallas, para que añadir una sea tocar un archivo y no dos.
      await mostrarPantalla(admin, message.chat.id, message.from, COMANDOS_PUBLICOS[comando]);
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
          await guardarNuevas(admin);
          // Se leen de la tabla, no del retorno de guardarNuevas: así entran
          // también las que se quedaron sin proponer en una tanda anterior.
          const nuevas = await pendientesSinProponer(admin, MAXIMO_POR_TANDA);
          if (nuevas.length === 0) {
            await sendTelegramMessage(message.chat.id, "📰 Sin noticias nuevas por ahora.");
          } else {
            for (let i = 0; i < nuevas.length; i++) {
              await proponerNoticia(admin, message.chat.id, nuevas[i], { n: i + 1, total: nuevas.length });
            }
          }
        } catch (err) {
          console.error("[telegram-webhook] /noticias falló:", err);
          await sendTelegramMessage(
            message.chat.id,
            `⚠️ No he podido traer las noticias.\n\n${err instanceof Error ? err.message : "Error desconocido"}`
          );
        }
      } else if (comando === "/video") {
        await handleVideoUltimo(admin, message.chat.id);
      } else if (comando === "/rutina") {
        const resultado = await enviarRutina(admin, { forzar: true });
        if (!resultado.enviada) {
          await sendTelegramMessage(
            message.chat.id,
            `⚠️ No he podido montar la rutina.\n\n${resultado.motivo ?? "Error desconocido"}`
          );
        }
      } else if (comando === "/stop" || comando === "/arrancar") {
        await cambiarAvisos(admin, message.chat.id, comando === "/stop");
      }
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
