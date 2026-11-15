import { NextResponse } from "next/server";
import { BORRADORES } from "@/lib/guides";
import { borradoresPublicados } from "@/lib/guiasVisibles";

export const runtime = "nodejs";

/** Lo que el buscador necesita de una guía. Nada de `consulta` ni `auditada`. */
export interface GuiaBuscador {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  color: string;
  tags: string[];
}

/**
 * Los borradores que el admin YA ha publicado desde /admin/acciones, para el
 * buscador de guías (`GuideSearch`).
 *
 * El buscador es de cliente y lee `GUIDES`, así que una guía recién publicada
 * no salía en él hasta ascenderla a mano en la siguiente sesión. Esto la
 * añade desde el minuto en que se pulsa el botón.
 *
 * Solo devuelve lo publicado: un borrador sin publicar nunca sale de aquí, ni
 * su título. De la más nueva a la más antigua, como cualquier listado.
 */
export async function GET() {
  const publicados = await borradoresPublicados();
  const guias: GuiaBuscador[] = BORRADORES.filter((b) => publicados.has(b.slug))
    .sort((a, b) => (publicados.get(b.slug) ?? "").localeCompare(publicados.get(a.slug) ?? ""))
    .map(({ slug, title, shortTitle, description, color, tags }) => ({
      slug, title, shortTitle, description, color, tags,
    }));

  return NextResponse.json(guias, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
