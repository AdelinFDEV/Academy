import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { anunciarPendientes } from "@/lib/announce";

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

  // Publicar una entrada la anuncia en el canal al momento. anunciarPendientes
  // es idempotente (lleva su propio registro), así que reeditar o volver a
  // guardar una entrada ya anunciada no repite el aviso.
  let anunciada = false;
  if (patch.published === true) {
    const { data: post } = await supabase!.from("posts").select("slug").eq("id", id).maybeSingle();
    if (post?.slug) {
      try {
        const res = await anunciarPendientes(createAdminClient(), { soloEntrada: post.slug });
        anunciada = (res.entradas?.length ?? 0) > 0;
      } catch (err) {
        // El aviso es un extra: si falla, la entrada ya está publicada y eso
        // es lo que importa. El cron diario lo reintentará.
        console.error("[admin-posts] No se pudo anunciar la entrada:", err);
      }
    }
  }

  return NextResponse.json({ ok: true, anunciada });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { error: dbErr } = await supabase!.from("posts").delete().eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
