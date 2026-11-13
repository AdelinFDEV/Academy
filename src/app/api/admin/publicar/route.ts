import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { BORRADORES } from "@/lib/guides";
import { faltaAlCurso, type CursoAccion } from "@/lib/acciones";

export const runtime = "nodejs";

/**
 * Publica una guía o un curso, o lo devuelve a borrador. Solo el admin, desde
 * /admin/acciones.
 *
 *  · Guía: apunta (o borra) su slug en `guias_publicadas`. Solo vale para las
 *    que están en `BORRADORES`: las de `GUIDES` ya son públicas por código.
 *  · Curso: cambia `cursos.published`. No se publica uno con lecciones vacías.
 *
 * Al terminar se refrescan las páginas que listan lo publicado y el sitemap.
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let cuerpo: { tipo?: unknown; slug?: unknown; publicar?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  }
  const { tipo, slug, publicar } = cuerpo;
  if ((tipo !== "guia" && tipo !== "curso") || typeof slug !== "string" || typeof publicar !== "boolean") {
    return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (tipo === "guia") {
    if (!BORRADORES.some((b) => b.slug === slug)) {
      return NextResponse.json({ error: "Esa guía no está entre los borradores." }, { status: 404 });
    }
    const { error: fallo } = publicar
      ? await admin.from("guias_publicadas").upsert({ slug }, { onConflict: "slug", ignoreDuplicates: true })
      : await admin.from("guias_publicadas").delete().eq("slug", slug);
    if (fallo) {
      console.error("[publicar] guía:", fallo.code);
      return NextResponse.json({ error: "No se pudo guardar. ¿Está ejecutado scripts/create-acciones.sql?" }, { status: 500 });
    }
    revalidatePath(`/guias/${slug}`);
    revalidatePath("/guias");
  } else {
    if (publicar) {
      const { data, error: fallo } = await admin.rpc("acciones_cursos");
      if (fallo) return NextResponse.json({ error: "No se pudo comprobar el curso." }, { status: 500 });
      const curso = ((data ?? []) as CursoAccion[]).find((c) => c.slug === slug);
      if (!curso) return NextResponse.json({ error: "Ese curso no existe." }, { status: 404 });
      const falta = faltaAlCurso(curso);
      if (falta) return NextResponse.json({ error: `No se puede publicar: ${falta.toLowerCase()}.` }, { status: 409 });
    }
    const { data: cambiado, error: fallo } = await admin
      .from("cursos")
      .update({ published: publicar, updated_at: new Date().toISOString() })
      .eq("slug", slug)
      .select("slug");
    if (fallo) {
      console.error("[publicar] curso:", fallo.code);
      return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
    }
    if (!cambiado?.length) return NextResponse.json({ error: "Ese curso no existe." }, { status: 404 });
    revalidatePath(`/cursos/${slug}`);
    revalidatePath("/cursos");
  }

  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/acciones");

  return NextResponse.json({ ok: true });
}
