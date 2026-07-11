import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  // Solo nombre y slug: evita que el body inserte columnas arbitrarias.
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!name || !slug) {
    return NextResponse.json({ error: "Nombre y slug son obligatorios" }, { status: 400 });
  }

  const { error: dbErr } = await supabase!.from("categories").insert({ name, slug });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
