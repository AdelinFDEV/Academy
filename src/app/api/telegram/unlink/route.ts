import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeChannelMember } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Desvincula la cuenta de Telegram del usuario y, si estaba dentro del
 *  canal, lo expulsa (ya no hay forma de gestionar su acceso sin el vínculo). */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("telegram_user_id")
    .eq("id", user.id)
    .single();

  const telegramUserId = profile?.telegram_user_id as number | null | undefined;

  const { error } = await admin
    .from("profiles")
    .update({ telegram_user_id: null, telegram_username: null, telegram_linked_at: null })
    .eq("id", user.id);

  if (error) {
    console.error("[telegram-unlink] Error actualizando perfil:", error.message);
    return NextResponse.json({ error: "No se pudo desvincular" }, { status: 500 });
  }

  if (telegramUserId) {
    try {
      await removeChannelMember(telegramUserId);
    } catch (err) {
      console.warn("[telegram-unlink] No se pudo expulsar del canal:", (err as Error).message);
    }
    await admin.from("telegram_access_log").insert({
      user_id: user.id,
      telegram_user_id: telegramUserId,
      action: "unlinked",
    });
  }

  return NextResponse.json({ ok: true });
}
