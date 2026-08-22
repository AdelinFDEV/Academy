import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLinkToken, getBotUsername } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Genera un token de un solo uso y devuelve el deep-link de Telegram
 *  (t.me/bot?start=token) para vincular la cuenta que ha iniciado sesión. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let botUsername: string;
  try {
    botUsername = getBotUsername();
  } catch (err) {
    console.error("[telegram-link]", (err as Error).message);
    return NextResponse.json({ error: "Telegram no está configurado" }, { status: 500 });
  }

  const admin = createAdminClient();
  const token = generateLinkToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Limpia tokens previos sin usar del mismo usuario para no acumular basura.
  await admin.from("telegram_link_tokens").delete().eq("user_id", user.id).is("used_at", null);

  const { error } = await admin.from("telegram_link_tokens").insert({
    token,
    user_id: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[telegram-link] Error creando token:", error.message);
    return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 });
  }

  return NextResponse.json({ deepLink: `https://t.me/${botUsername}?start=${token}` });
}
