import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveChatJoinRequest,
  declineChatJoinRequest,
  getAdminChatId,
  getChannelId,
  getChannelInviteLink,
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
type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  chat_join_request?: ChatJoinRequest;
};

/** Tope de mensajes por hora y usuario, para que nadie pueda inundar el
 *  Telegram del admin desde una cuenta Premium. */
const LIMITE_MENSAJES_HORA = 10;

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
 * Bienvenida de /start sin token: es la primera pantalla que ve alguien que
 * abre el bot, así que se adapta a quién escribe. A un desconocido hay que
 * presentarle el proyecto; a un Premium que ya está dentro, soltarle otra vez
 * el discurso de venta sobraría.
 */
async function enviarBienvenida(admin: Admin, from: TelegramUser) {
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, telegram_username")
    .eq("telegram_user_id", from.id)
    .maybeSingle();

  if (profile) {
    await refrescarUsername(admin, from.id, profile.telegram_username, from.username);
  }

  const nombre = profile?.full_name || from.first_name;
  const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";

  if (!profile) {
    await sendTelegramMessage(
      from.id,
      `${saludo} 👋 Bienvenido a AdelinBTC Academy.\n\n` +
        "Aquí aprendes cripto sin humo: guías interactivas, análisis y herramientas de trading.\n\n" +
        "Con Premium entras además al canal privado y puedes escribirme directamente por aquí. " +
        "Vincula tu cuenta y yo me encargo del resto: te doy acceso al canal en cuanto seas Premium.",
      [
        { text: "🔗 Vincular mi cuenta", url: getCuentaUrl() },
        { text: "💎 Hazte Premium", url: getPremiumUrl() },
        { text: "🌐 Ver la Academy", url: getSiteUrl() },
      ]
    );
    return;
  }

  const esPremium = profile.role === "premium" || profile.role === "admin";

  await sendTelegramMessage(
    from.id,
    esPremium
      ? `${saludo} 👋 Tu cuenta está vinculada y eres Premium.\n\n` +
        "Tienes el canal privado abierto, y si quieres preguntarme algo escríbeme por aquí: " +
        "te leo yo personalmente."
      : `${saludo} 👋 Tu cuenta ya está vinculada.\n\n` +
        "Con Premium entrarías al canal privado (te dejo pasar automáticamente) y podrías " +
        "escribirme directamente por aquí.",
    esPremium
      ? [
          { text: "🚀 Ir al canal", url: getChannelInviteLink() },
          { text: "🌐 Ver la Academy", url: getSiteUrl() },
        ]
      : [
          { text: "💎 Hazte Premium", url: getPremiumUrl() },
          { text: "🌐 Ver la Academy", url: getSiteUrl() },
        ]
  );
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
      "Este enlace ha caducado o ya se usó. Genera uno nuevo desde tu cuenta.",
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
      "Esta cuenta de Telegram ya está vinculada a otro usuario de la Academy. " +
        "Desvincúlala primero desde esa cuenta.",
      [{ text: "Ir a mi cuenta", url: getCuentaUrl() }]
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
      ? "✅ Cuenta vinculada. Ya eres Premium, así que puedes entrar al canal.\n\n" +
        "Y si quieres preguntarme algo, escríbeme por aquí: le llega directamente a Adelin."
      : "✅ Cuenta vinculada.\n\nCuando te hagas Premium tendrás acceso al canal privado y te dejaré entrar automáticamente.",
    isPremium
      ? [
          { text: "🚀 Entrar al canal", url: getChannelInviteLink() },
          { text: "Mi cuenta", url: getCuentaUrl() },
        ]
      : [{ text: "💎 Hazte Premium", url: getPremiumUrl() }]
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
      "🎉 ¡Bienvenido al canal Premium! Tu solicitud ha sido aceptada."
    );
    await admin.from("telegram_access_log").insert({
      user_id: profile.id,
      telegram_user_id: req.from.id,
      action: "approved",
    });
    return;
  }

  await declineChatJoinRequest(req.from.id);
  await sendTelegramMessage(
    req.from.id,
    profile
      ? "El canal es solo para miembros Premium. Hazte Premium y vuelve a solicitar entrada: te aceptaré al instante."
      : "Para entrar al canal necesitas vincular antes tu cuenta de Telegram con la Academy.",
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
      "Para escribirme necesitas vincular antes tu cuenta de la Academy.",
      [{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }]
    );
    return;
  }

  await refrescarUsername(admin, from.id, profile.telegram_username, from.username);

  const esPremium = profile.role === "premium" || profile.role === "admin";
  if (!esPremium) {
    await sendTelegramMessage(
      from.id,
      "Hablar conmigo por aquí es una de las ventajas Premium. " +
        "Hazte Premium y te leo personalmente.",
      [{ text: "💎 Hazte Premium", url: getPremiumUrl() }]
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

    await sendTelegramMessage(from.id, "✅ Mensaje enviado. Te respondo por aquí en cuanto pueda.");
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

    if (message?.text?.startsWith("/start")) {
      await handleStart(admin, message);
    } else if (update.chat_join_request) {
      await handleJoinRequest(admin, update.chat_join_request);
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
