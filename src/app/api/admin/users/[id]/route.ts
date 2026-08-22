import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeChannelAccess } from "@/lib/telegram";

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
  const { data: perfil } = await admin
    .from("profiles")
    .select("telegram_user_id")
    .eq("id", id)
    .maybeSingle();

  const { error: dbErr } = await admin.from("profiles").update({ role }).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });

  // Quitar el premium a mano tiene que sacar del canal en el momento. Antes
  // sólo lo pillaba el cron diario, así que quien perdía el acceso desde aquí
  // seguía dentro del canal Premium hasta 24 horas más.
  const telegramUserId = perfil?.telegram_user_id as number | null | undefined;
  if (role === "free" && telegramUserId) {
    await revokeChannelAccess(admin, {
      userId: id,
      telegramUserId,
      reason: "Rol cambiado a free desde el panel de admin",
    });
  }

  return NextResponse.json({ ok: true });
}
