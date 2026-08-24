import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { avisosPausados } from "@/lib/telegram";
import { HORA_RUTINA, enviarRutina, horaEnRumania } from "@/lib/rutina";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * La rutina diaria del admin, a las 21:00 hora de Rumanía.
 *
 * ── Por qué el cron corre a las 18 Y a las 19 UTC ───────────────────────────
 * Los crons de Vercel se programan en UTC, y Rumanía cambia de hora dos veces
 * al año: 21:00 de allí son las 18:00 UTC en verano y las 19:00 UTC en invierno.
 * Programar una sola hora significaría llegar una hora tarde (o pronto) medio
 * año. Así que se dispara en las dos y aquí dentro se comprueba qué hora es
 * DE VERDAD en Rumanía: la ejecución que no toca se va sin hacer nada.
 *
 * Y aunque las dos coincidieran, no habría mensaje doble: la fila del día en
 * rutina_diaria tiene la fecha como clave primaria, así que la segunda choca
 * contra la clave y `enviarRutina` no manda nada.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron-rutina] Falta CRON_SECRET");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hora = horaEnRumania();
  if (hora !== HORA_RUTINA) {
    return NextResponse.json({ ok: true, omitida: `en Rumanía son las ${hora}:00` });
  }

  const admin = createAdminClient();

  // El botón de STOP para esto también: es lo primero que se espera de él.
  if (await avisosPausados(admin)) {
    return NextResponse.json({ ok: true, omitida: "avisos pausados" });
  }

  const resultado = await enviarRutina(admin);
  return NextResponse.json({ ok: true, ...resultado });
}
