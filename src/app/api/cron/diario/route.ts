import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fotografiarYoutube } from "@/lib/objetivosServidor";
import { sincronizarCobrosStripe } from "@/lib/cobrosStripe";
import { limpiarHuerfanas } from "@/lib/foro/imagenes/almacen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * El cron diario (04:00 UTC, ver vercel.json).
 *
 * Nace el 05-11-2026 al retirar Telegram: estas dos tareas iban dentro del cron
 * del bot (`telegram-sync`), que se borró con todo lo demás de Telegram, y no
 * tienen nada que ver con él.
 *
 *  · La foto diaria de suscriptores de YouTube, de la que salen la gráfica de
 *    Crecimiento y los objetivos de nivel de /admin/objetivos.
 *  · La red de seguridad de los cobros de Stripe: el webhook ya los copia al
 *    momento; esto recoge lo que se le escapara (un webhook fallido, un
 *    reembolso hecho desde el panel de Stripe) en el último mes.
 *  · La limpieza de las imágenes del foro que se subieron y no se usaron
 *    (FORO.md §6.6), desde el 12-11-2026.
 *
 * Cada tarea es independiente: si una falla, la otra sigue, y la salida lo dice.
 */
export async function GET(request: NextRequest) {
  // Obligatorio, no opcional: sin secreto este endpoint queda expuesto a
  // cualquiera que acierte la ruta y pueda dispararlo a voluntad.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron-diario] Falta CRON_SECRET");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Sin YOUTUBE_API_KEY devuelve null y no pasa nada.
  const youtube = await fotografiarYoutube(admin).catch((err) => {
    console.error("[cron-diario] Error fotografiando YouTube:", err);
    return null;
  });

  const cobros = await sincronizarCobrosStripe(admin);

  // Las imágenes del foro que se subieron y nunca llegaron a una pregunta.
  const foroImagenes = await limpiarHuerfanas().catch((err) => {
    console.error("[cron-diario] Error limpiando imágenes del foro:", err instanceof Error ? err.name : "desconocido");
    return null;
  });

  return NextResponse.json({ youtube, cobros, foroImagenes });
}
