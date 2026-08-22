import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeChannelMember } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Red de seguridad además del webhook de Stripe: expulsa del canal a
 * cualquier usuario vinculado cuyo rol ya no sea premium/admin. Cubre el caso
 * de que el webhook de Stripe fallara o se perdiera un evento.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { data: stale, error } = await admin
    .from("profiles")
    .select("id, telegram_user_id")
    .not("telegram_user_id", "is", null)
    .not("role", "in", "(premium,admin)");

  if (error) {
    console.error("[telegram-sync] Error consultando perfiles:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let kicked = 0;
  for (const profile of stale ?? []) {
    if (!profile.telegram_user_id) continue;
    try {
      await removeChannelMember(profile.telegram_user_id);
      kicked++;
      await admin.from("telegram_access_log").insert({
        user_id: profile.id,
        telegram_user_id: profile.telegram_user_id,
        action: "kicked",
        reason: "Reconciliación periódica: rol no premium",
      });
    } catch (err) {
      console.warn("[telegram-sync] No se pudo expulsar a", profile.telegram_user_id, (err as Error).message);
    }
  }

  return NextResponse.json({ checked: stale?.length ?? 0, kicked });
}
