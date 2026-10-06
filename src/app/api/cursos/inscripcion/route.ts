import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contextoAula } from "@/lib/cursos";

/**
 * Apuntarse a un curso, o cambiar el ritmo. El ritmo son los minutos por
 * semana que el alumno quiere dedicarle: con ellos se calcula su cronograma.
 * Cambiarlo no borra nada; la fecha de inicio se conserva.
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const { curso, minutosSemana } = (body ?? {}) as { curso?: unknown; minutosSemana?: unknown };
  if (typeof curso !== "string" || typeof minutosSemana !== "number" || !Number.isInteger(minutosSemana)) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }
  if (minutosSemana < 30 || minutosSemana > 1200) {
    return NextResponse.json({ error: "El ritmo tiene que estar entre 30 minutos y 20 horas por semana." }, { status: 400 });
  }

  const ctx = await contextoAula(curso);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { error } = await createAdminClient()
    .from("curso_inscripciones")
    .upsert(
      { user_id: ctx.sesion.userId, curso_id: ctx.curso.curso.id, minutos_semana: minutosSemana },
      { onConflict: "user_id,curso_id" },
    );
  if (error) {
    console.error("[cursos/inscripcion]", error.message);
    return NextResponse.json({ error: "No se pudo guardar el ritmo." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
