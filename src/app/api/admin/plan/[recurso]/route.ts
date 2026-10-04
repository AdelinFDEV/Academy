import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECURSOS, VALIDAR, esRecurso, fijarProgreso, marcarPublicada } from "@/lib/objetivosValidar";

export const dynamic = "force-dynamic";

/**
 * Crea un objetivo, una pieza del plan de contenido o una nota del diario.
 *
 * Solo el admin. Las tablas no tienen ninguna policy (scripts/create-objetivos.sql),
 * así que se escribe con la clave de servicio DESPUÉS de comprobar el rol.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ recurso: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso } = await params;
  if (!esRecurso(recurso)) return NextResponse.json({ error: "Recurso desconocido" }, { status: 404 });

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Petición vacía" }, { status: 400 });

  const v = VALIDAR[recurso](body as Record<string, unknown>);
  if (!v.datos) return NextResponse.json({ error: v.error }, { status: 400 });

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from(RECURSOS[recurso])
    .insert(v.datos)
    .select("id")
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  if (recurso === "pieza") await marcarPublicada(admin, data.id, v.datos);
  await guardarProgreso(admin, recurso, data.id, body as Record<string, unknown>);
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

/** «Llevo en este periodo» al crear un objetivo manual. */
async function guardarProgreso(
  admin: ReturnType<typeof createAdminClient>,
  recurso: string,
  id: string,
  body: Record<string, unknown>
) {
  if (recurso !== "objetivo" || body.metrica !== "manual") return;
  const progreso = Number(body.progreso_periodo);
  if (Number.isFinite(progreso) && progreso > 0) await fijarProgreso(admin, id, () => progreso);
}
