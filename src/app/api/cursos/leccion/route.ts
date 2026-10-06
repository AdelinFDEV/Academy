import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contextoAula } from "@/lib/cursos";
import { leccionAbierta } from "@/lib/cursos-progreso";

/**
 * Marcar una lección como completada.
 *
 * Comprueba que la lección está en un módulo DESBLOQUEADO con la misma regla
 * que la página (`leccionAbierta`). Sin esto bastaría un `fetch` desde la
 * consola para completar el módulo 7 sin haber aprobado el 6, y su examen se
 * abriría solo.
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const { curso, leccion } = (body ?? {}) as { curso?: unknown; leccion?: unknown };
  if (typeof curso !== "string" || typeof leccion !== "string") {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  const ctx = await contextoAula(curso);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.datos.inscripcion) return NextResponse.json({ error: "Elige tu ritmo antes de empezar." }, { status: 409 });

  const objetivo = ctx.curso.modulos.flatMap((m) => m.lecciones).find((l) => l.slug === leccion);
  if (!objetivo) return NextResponse.json({ error: "Esa lección no es de este curso." }, { status: 404 });
  if (!leccionAbierta(ctx.estado, objetivo.id)) {
    return NextResponse.json({ error: "Esta lección sigue bloqueada: aprueba antes el examen del módulo anterior." }, { status: 403 });
  }

  const { error } = await createAdminClient()
    .from("curso_progreso")
    .upsert({ user_id: ctx.sesion.userId, leccion_id: objetivo.id }, { onConflict: "user_id,leccion_id", ignoreDuplicates: true });
  if (error) {
    console.error("[cursos/leccion]", error.message);
    return NextResponse.json({ error: "No se pudo guardar el progreso." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
