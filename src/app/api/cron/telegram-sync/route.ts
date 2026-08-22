import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeChannelAccess } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Red de seguridad además del webhook de Stripe: expulsa del canal a
 * cualquier usuario vinculado cuyo rol ya no sea premium/admin. Cubre el caso
 * de que el webhook de Stripe fallara o se perdiera un evento.
 */
export async function GET(request: NextRequest) {
  // Obligatorio, no opcional: sin secreto este endpoint queda expuesto a
  // cualquiera que acierte la ruta y pueda dispararlo a voluntad.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[telegram-sync] Falta CRON_SECRET");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

  // revokeChannelAccess comprueba antes si la persona está realmente dentro,
  // así que los usuarios gratuitos que vincularon Telegram pero nunca entraron
  // al canal no generan ni llamada de expulsión ni registro: sin eso, cada
  // ejecución diaria repetía un "kicked" falso por cada uno de ellos.
  let kicked = 0;
  for (const profile of stale ?? []) {
    if (!profile.telegram_user_id) continue;
    const expulsado = await revokeChannelAccess(admin, {
      userId: profile.id,
      telegramUserId: profile.telegram_user_id,
      reason: "Reconciliación periódica: rol no premium",
    });
    if (expulsado) kicked++;
  }

  return NextResponse.json({ checked: stale?.length ?? 0, kicked });
}
