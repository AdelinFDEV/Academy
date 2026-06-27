import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { error: dbErr } = await supabase!.from("comments").update({ approved: true }).eq("approved", false);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
