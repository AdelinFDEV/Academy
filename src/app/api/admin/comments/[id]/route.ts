import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { error: dbErr } = await supabase!.from("comments").update({ approved: true }).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { error: dbErr } = await supabase!.from("comments").delete().eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
