import "server-only";
import { notFound, redirect } from "next/navigation";
import { contextoAula, type ContextoAula } from "@/lib/cursos";

/**
 * La puerta de todas las páginas del aula. Sin sesión, al login (y de vuelta
 * aquí); sin Premium, a la ficha pública del curso, que explica qué hay dentro
 * y cómo se accede; si el curso no existe, 404.
 *
 * El middleware (`src/proxy.ts`) ya manda al login a quien llega sin sesión a
 * `/aula`. Esto lo repite a propósito: si alguien toca el matcher, el aula no
 * se queda abierta.
 */
export async function exigirAula(slug: string, ruta: string): Promise<ContextoAula> {
  const ctx = await contextoAula(slug);
  if ("error" in ctx) {
    if (ctx.status === 401) redirect(`/login?next=${encodeURIComponent(ruta)}`);
    if (ctx.status === 403) redirect(`/cursos/${slug}`);
    notFound();
  }
  return ctx;
}
