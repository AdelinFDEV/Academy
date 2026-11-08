import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contextoAula } from "@/lib/cursos";

/**
 * Rehacer un curso ya aprobado, para mejorar la nota (08-11-2026, pedido por el
 * admin).
 *
 * Borra el progreso del alumno en ESE curso —lecciones completadas e intentos
 * de examen— y reinicia la fecha de su cronograma, así que los módulos vuelven
 * a abrirse de uno en uno. El certificado NO se toca: sigue siendo suyo, con su
 * código y su nota, hasta que apruebe otra vez el examen final. Entonces se
 * sobrescribe con la nota nueva (aunque sea más baja) y conserva el mismo
 * código (ver `emitirCertificado` en src/lib/cursos-examen.ts).
 *
 * Solo para quien ya tiene el certificado: rehacer un curso a medias no tiene
 * sentido y borraría su avance por error.
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const { curso } = (body ?? {}) as { curso?: unknown };
  if (typeof curso !== "string") return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const ctx = await contextoAula(curso);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.datos.certificado) {
    return NextResponse.json({ error: "Solo puedes rehacer un curso que ya has aprobado." }, { status: 409 });
  }

  const db = createAdminClient();
  const userId = ctx.sesion.userId;
  const cursoId = ctx.curso.curso.id;
  const lecciones = ctx.curso.modulos.flatMap((m) => m.lecciones.map((l) => l.id));

  const [intentos, progreso, inscripcion] = await Promise.all([
    db.from("curso_intentos").delete().eq("user_id", userId).eq("curso_id", cursoId),
    lecciones.length
      ? db.from("curso_progreso").delete().eq("user_id", userId).in("leccion_id", lecciones)
      : Promise.resolve({ error: null }),
    // El cronograma vuelve a contar desde hoy; el ritmo elegido se conserva.
    db.from("curso_inscripciones").update({ created_at: new Date().toISOString() }).eq("user_id", userId).eq("curso_id", cursoId),
  ]);

  const fallo = intentos.error ?? progreso.error ?? inscripcion.error;
  if (fallo) {
    console.error("[cursos/rehacer]", fallo.message);
    return NextResponse.json({ error: "No se pudo reiniciar el curso. Inténtalo otra vez." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
