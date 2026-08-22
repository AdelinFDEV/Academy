import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveChatJoinRequest,
  declineChatJoinRequest,
  getChannelId,
  getCuentaUrl,
  sendTelegramMessage,
} from "@/lib/telegram";

// El webhook lo llama Telegram directamente: siempre en Node y sin caché.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;

type TelegramUser = { id: number; username?: string; first_name?: string };
type TelegramMessage = { from?: TelegramUser; text?: string };
type ChatJoinRequest = { chat: { id: number }; from: TelegramUser };
type TelegramUpdate = {
  message?: TelegramMessage;
  chat_join_request?: ChatJoinRequest;
};

/** /start <token>: vincula la cuenta de Telegram que escribe con el usuario
 *  de la Academy dueño de ese token (generado en /cuenta). */
async function handleStart(admin: Admin, message: TelegramMessage) {
  const from = message.from;
  if (!from) return;

  const token = (message.text ?? "").replace("/start", "").trim();
  if (!token) {
    await sendTelegramMessage(
      from.id,
      `Para vincular tu cuenta, entra en ${getCuentaUrl()} y pulsa «Conectar Telegram».`
    );
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
      `Este enlace ha caducado o ya se usó. Genera uno nuevo desde ${getCuentaUrl()}.`
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
      "Esta cuenta de Telegram ya está vinculada a otro usuario de la Academy."
    );
    return;
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

  await sendTelegramMessage(
    from.id,
    isPremium
      ? `✅ Cuenta vinculada. Ya eres Premium: entra en ${getCuentaUrl()} y usa el enlace de invitación del canal para solicitar entrada.`
      : `✅ Cuenta vinculada. Cuando te hagas Premium podrás solicitar entrada al canal privado desde ${getCuentaUrl()}.`
  );
}

/** chat_join_request: alguien ha pedido entrar al canal. Se aprueba solo si
 *  su Telegram está vinculado a un usuario Premium/admin de la Academy. */
async function handleJoinRequest(admin: Admin, req: ChatJoinRequest) {
  if (String(req.chat.id) !== String(getChannelId())) return; // otro chat: ignorar

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("telegram_user_id", req.from.id)
    .maybeSingle();

  const isPremium = !!profile && (profile.role === "premium" || profile.role === "admin");

  if (isPremium) {
    await approveChatJoinRequest(req.from.id);
    await sendTelegramMessage(req.from.id, "🎉 ¡Bienvenido! Tu solicitud ha sido aceptada.");
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
      ? "Tu solicitud ha sido rechazada: necesitas ser Premium. Hazte Premium en la Academy y vuelve a solicitar entrada."
      : `Tu solicitud ha sido rechazada: primero vincula tu cuenta de Telegram desde ${getCuentaUrl()}.`
  );
  await admin.from("telegram_access_log").insert({
    user_id: profile?.id ?? null,
    telegram_user_id: req.from.id,
    action: "declined",
    reason: profile ? "No premium" : "Sin vincular",
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const update = (await request.json()) as TelegramUpdate;
  const admin = createAdminClient();

  try {
    if (update.message?.text?.startsWith("/start")) {
      await handleStart(admin, update.message);
    } else if (update.chat_join_request) {
      await handleJoinRequest(admin, update.chat_join_request);
    }
  } catch (err) {
    // Telegram reintenta si no respondemos 200: registramos pero no fallamos
    // la petición para no entrar en un bucle de reintentos infinito.
    console.error("[telegram-webhook] Error procesando update:", err);
  }

  return NextResponse.json({ ok: true });
}
