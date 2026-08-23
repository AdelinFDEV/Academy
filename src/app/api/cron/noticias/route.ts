import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAXIMO_POR_TANDA, guardarNuevas, pendientesSinProponer, proponerNoticia } from "@/lib/noticias";
import { avisosPausados, getAdminChatId, getLogChatId } from "@/lib/telegram";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Redactar las noticias lleva su tiempo: leer cada articulo y pasarlo por
// Claude son unos 30 segundos. Con el limite por defecto la tanda se cortaba.
export const maxDuration = 60;

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
    await guardarNuevas(admin);

    // Se leen de la tabla y no del retorno de guardarNuevas: así entran también
    // las que se guardaron en tandas anteriores y se quedaron sin proponer por
    // el tope. Sin esto, un día con ocho noticias perdía tres para siempre.
    const nuevas = await pendientesSinProponer(admin, MAXIMO_POR_TANDA);

    // En paralelo, no en serie: cada propuesta descarga el artículo y lo manda
    // a redactar, que son unos 30 segundos. Cinco seguidas se comerían el
    // límite de ejecución de Vercel y la tanda se cortaría a la mitad.
    const resultados = await Promise.allSettled(
      nuevas.map((noticia, i) =>
        proponerNoticia(admin, destino, noticia, { n: i + 1, total: nuevas.length })
      )
    );
    propuestas = resultados.filter((r) => r.status === "fulfilled").length;
    for (const r of resultados) {
      if (r.status === "rejected") console.error("[cron-noticias] Propuesta fallida:", r.reason);
    }
  } catch (err) {
    console.error("[cron-noticias] Error:", err);
    return NextResponse.json({ error: "Error leyendo el feed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, propuestas });
}
