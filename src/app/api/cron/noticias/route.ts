import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardarNuevas, proponerNoticia } from "@/lib/noticias";
import { avisosPausados, getAdminChatId, getLogChatId } from "@/lib/telegram";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lee el feed de noticias y propone al admin las que sean nuevas, con los
 * botones de publicar o descartar.
 *
 * Corre cada hora. No hace falta más: las noticias no envejecen en minutos, y
 * si alguna vez hay prisa está el comando /noticias, que lee al momento.
 *
 * Nunca publica nada por su cuenta — eso es deliberado. En cripto salen
 * titulares alarmistas y bulos a diario, y el criterio del admin en medio es
 * lo que separa este canal de un agregador automático.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron-noticias] Falta CRON_SECRET");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // El interruptor de STOP también para esto: son propuestas que manda el bot
  // por su cuenta, justo lo que uno quiere callar cuando pulsa "parar avisos".
  // El comando /noticias sigue funcionando igual: eso lo pide el admin.
  if (await avisosPausados(admin)) {
    return NextResponse.json({ ok: true, omitida: "avisos pausados" });
  }

  // Mismo destino que los avisos de altas: el chat de registro si existe y,
  // si no, el privado del admin.
  let destino = getLogChatId() ? Number(getLogChatId()) : getAdminChatId();
  if (!destino) {
    const { data } = await admin
      .from("profiles")
      .select("telegram_user_id")
      .eq("role", "admin")
      .not("telegram_user_id", "is", null)
      .order("telegram_linked_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    destino = (data?.telegram_user_id as number | null) ?? null;
  }

  if (!destino) {
    console.error("[cron-noticias] Sin chat de admin al que proponer");
    return NextResponse.json({ error: "Sin destino" }, { status: 500 });
  }

  let propuestas = 0;
  try {
    const nuevas = await guardarNuevas(admin);
    for (const noticia of nuevas) {
      await proponerNoticia(admin, destino, noticia);
      propuestas++;
    }
  } catch (err) {
    console.error("[cron-noticias] Error:", err);
    return NextResponse.json({ error: "Error leyendo el feed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, propuestas });
}
