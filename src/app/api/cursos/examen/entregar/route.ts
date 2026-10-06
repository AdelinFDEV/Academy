import { NextResponse } from "next/server";
import { contextoAula } from "@/lib/cursos";
import { entregarIntento } from "@/lib/cursos-examen";

/**
 * Entregar un examen. La nota la calcula el servidor con las respuestas
 * correctas que solo él conoce; del navegador llegan únicamente las opciones
 * elegidas. Todas las preguntas son obligatorias.
 */
export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const { curso, intentoId, respuestas } = (body ?? {}) as { curso?: unknown; intentoId?: unknown; respuestas?: unknown };
  if (
    typeof curso !== "string" ||
    typeof intentoId !== "string" ||
    !respuestas || typeof respuestas !== "object" || Array.isArray(respuestas)
  ) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  const elegidas: Record<string, number> = {};
  for (const [id, valor] of Object.entries(respuestas as Record<string, unknown>)) {
    if (typeof valor === "number" && Number.isInteger(valor) && valor >= 0) elegidas[id] = valor;
  }

  const ctx = await contextoAula(curso);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const resultado = await entregarIntento(ctx.sesion, ctx.curso, intentoId, elegidas);
  if ("error" in resultado) return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  return NextResponse.json(resultado);
}
