import { NextResponse } from "next/server";
import { contextoAula } from "@/lib/cursos";
import { abrirIntento, claveDesdeTexto, estadoDeExamen } from "@/lib/cursos-examen";

/**
 * Empezar un examen: sortea las preguntas y abre el intento. Si ya había uno
 * abierto devuelve ese, con las mismas preguntas — recargar no vuelve a sortear.
 * Las preguntas salen SIN la respuesta correcta.
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const { curso, examen } = (body ?? {}) as { curso?: unknown; examen?: unknown };
  const clave = typeof examen === "string" || typeof examen === "number" ? claveDesdeTexto(String(examen)) : null;
  if (typeof curso !== "string" || !clave) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  const ctx = await contextoAula(curso);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.datos.inscripcion) return NextResponse.json({ error: "Elige tu ritmo antes de empezar." }, { status: 409 });

  const estado = estadoDeExamen(ctx.estado, clave);
  if (!estado) return NextResponse.json({ error: "Ese examen no existe." }, { status: 404 });
  if (estado.tipo === "bloqueado") {
    return NextResponse.json({ error: "Este examen todavía está bloqueado." }, { status: 403 });
  }
  if (estado.tipo === "aprobado") return NextResponse.json({ error: "Este examen ya está aprobado." }, { status: 409 });
  if (estado.tipo === "espera") {
    return NextResponse.json({ error: "Tienes que esperar 24 horas desde el último intento.", disponibleEn: estado.disponibleEn }, { status: 429 });
  }

  const resultado = await abrirIntento(ctx.sesion, ctx.curso, clave);
  if ("error" in resultado) return NextResponse.json({ error: resultado.error }, { status: 500 });
  return NextResponse.json(resultado);
}
