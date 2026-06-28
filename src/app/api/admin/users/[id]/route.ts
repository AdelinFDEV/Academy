import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { role } = await req.json();
  if (!["free", "premium"].includes(role)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }

  // El cambio de rol va con service_role: RLS sólo permite a un usuario tocar
  // su propia fila, y la GRANT por columnas reserva 'role' al backend.
  const admin = createAdminClient();
  const { error: dbErr } = await admin.from("profiles").update({ role }).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
