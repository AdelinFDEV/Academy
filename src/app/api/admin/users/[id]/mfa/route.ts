import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Soporte de recuperación: si un usuario pierde el dispositivo con su app de
// autenticación, Supabase TOTP no tiene códigos de respaldo — la única salida
// es que un admin le borre el factor para que pueda volver a entrar solo con
// contraseña y reactivar el 2FA si quiere.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const admin = createAdminClient();
  const { data, error: listErr } = await admin.auth.admin.mfa.listFactors({ userId: id });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 400 });

  for (const factor of data.factors) {
    const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: id });
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, removed: data.factors.length });
}
