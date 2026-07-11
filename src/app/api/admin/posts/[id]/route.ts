import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Solo estos campos se pueden editar vía la API. Evita la asignación masiva:
// aunque la ruta sea de admin, no queremos que el body pueda tocar `id`,
// `created_at`, contadores base ni cualquier columna futura por accidente.
const EDITABLE_POST_FIELDS = [
  "title",
  "slug",
  "content",
  "excerpt",
  "cover_image",
  "category_id",
  "is_premium",
  "is_featured",
  "published",
  "seo_title",
  "meta_description",
  "focus_keyword",
  "youtube_url",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const field of EDITABLE_POST_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) patch[field] = body[field];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400 });
  }

  const { error: dbErr } = await supabase!.from("posts").update(patch).eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { error: dbErr } = await supabase!.from("posts").delete().eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
