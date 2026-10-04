import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fijarProgreso } from "@/lib/objetivosValidar";

export const dynamic = "force-dynamic";

/**
 * El botón +1 (y −1) de los objetivos manuales: suma al periodo actual sin
 * abrir el formulario. Solo admin; solo objetivos.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ recurso: string; id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso, id } = await params;
  if (recurso !== "objetivo" || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body: unknown = await req.json().catch(() => null);
  const delta = Number((body as { delta?: unknown } | null)?.delta ?? 1);
  if (!Number.isFinite(delta) || Math.abs(delta) > 1000) {
    return NextResponse.json({ error: "Cantidad no válida" }, { status: 400 });
  }

  const fallo = await fijarProgreso(createAdminClient(), id, (actual) => actual + delta);
  if (fallo) return NextResponse.json({ error: fallo }, { status: 400 });
  return NextResponse.json({ ok: true });
}
