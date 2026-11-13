import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mantenimientoDelForo } from "@/lib/foro/acciones/mantenimiento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lo que /privacidad promete: la estadística de uso se borra a los 400 días. */
const DIAS_VISITAS = 400;

/**
 * El cron diario (04:00 UTC, ver vercel.json). Dos tareas, independientes: si
 * una falla, la otra sigue, y la salida lo dice.
 *
 *  · El mantenimiento del foro: recalcula contadores y puntos desde sus filas,
 *    avisa a quien puede elegir ganadora, purga lo caducado y limpia las
 *    imágenes que no se usaron (FORO.md §9.2 y §13).
 *  · Borrar las visitas de más de 400 días (tabla `visitas`) y los códigos
 *    caducados del admin (`visitas_excluidas`).
 *
 * Hasta el 13-11-2026 también hacía la foto diaria de YouTube y copiaba los
 * cobros de Stripe al libro de dinero; las dos eran solo para /admin/objetivos
 * y se borraron con él.
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

  const foro = await mantenimientoDelForo().catch((err) => {
    console.error("[cron-diario] Error en el mantenimiento del foro:", err instanceof Error ? err.name : "desconocido");
    return null;
  });

  const limite = new Date(Date.now() - DIAS_VISITAS * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await createAdminClient()
    .from("visitas")
    .delete({ count: "exact" })
    .lt("creada", limite);
  if (error) console.error("[cron-diario] Error borrando visitas antiguas:", error.code);

  // Los códigos del admin apuntados para no contarlo: cambian cada día, así que
  // a los dos días ya no sirven para nada.
  const caducadas = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { error: errExcluidas } = await createAdminClient().from("visitas_excluidas").delete().lt("creada", caducadas);
  if (errExcluidas) console.error("[cron-diario] Error purgando visitas_excluidas:", errExcluidas.code);

  return NextResponse.json({ foro, visitasBorradas: error ? null : count });
}
