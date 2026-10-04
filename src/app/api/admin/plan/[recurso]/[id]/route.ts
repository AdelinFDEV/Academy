import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECURSOS, VALIDAR, esRecurso, fijarProgreso, marcarPublicada } from "@/lib/objetivosValidar";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ recurso: string; id: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

/** Edita un objetivo, una pieza o una nota. Se manda siempre la ficha entera. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso, id } = await params;
  if (!esRecurso(recurso) || !UUID.test(id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Petición vacía" }, { status: 400 });

  const v = VALIDAR[recurso](body as Record<string, unknown>);
  if (!v.datos) return NextResponse.json({ error: v.error }, { status: 400 });

  const admin = createAdminClient();
  const { error: dbErr } = await admin.from(RECURSOS[recurso]).update(v.datos).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  if (recurso === "pieza") await marcarPublicada(admin, id, v.datos);
  if (recurso === "objetivo" && v.datos.metrica === "manual" && body && typeof body === "object") {
    const progreso = Number((body as Record<string, unknown>).progreso_periodo);
    if (Number.isFinite(progreso) && progreso >= 0) await fijarProgreso(admin, id, () => progreso);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso, id } = await params;
  if (!esRecurso(recurso) || !UUID.test(id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { error: dbErr } = await createAdminClient().from(RECURSOS[recurso]).delete().eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
