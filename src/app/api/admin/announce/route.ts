import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { anunciarPendientes } from "@/lib/announce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anuncia en el canal lo que esté pendiente, sin esperar al cron.
 *
 * Existe sobre todo por las guías: llegan con un despliegue de código, así que
 * no hay ningún evento en base de datos que las dispare. Publicas la guía y
 * llamas aquí. Las entradas ya se anuncian solas al publicarlas.
 *
 * Es idempotente: llamarlo dos veces no repite ningún aviso.
 */
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  // sinCache: quien pulsa el botón acaba de publicar algo y espera verlo salir
  // ya. El cron diario sí usa la caché, que para él no supone ninguna prisa.
  const resultado = await anunciarPendientes(createAdminClient(), { sinCache: true });

  const total =
    (resultado.guias?.length ?? 0) +
    (resultado.entradas?.length ?? 0) +
    (resultado.videos?.length ?? 0);

  return NextResponse.json({ ok: true, total, ...resultado });
}
