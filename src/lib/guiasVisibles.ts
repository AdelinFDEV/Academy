import "server-only";
import { cache } from "react";
import { createAdminClientOpcional } from "@/lib/supabase/admin";
import { BORRADORES, GUIDES, type GuiaBorrador, type GuideMeta } from "@/lib/guides";

/**
 * Qué guías ve el público. Solo servidor.
 *
 * Una guía es pública si está en `GUIDES`, o si está en `BORRADORES` y el admin
 * la ha publicado desde /admin/acciones (su slug está en `guias_publicadas`).
 *
 * Mientras `BORRADORES` esté vacío esto no consulta nada: no cuesta ni una
 * lectura a la web de siempre. Y si la tabla no existe o falla, se entiende
 * que no hay nada publicado: un borrador nunca se enseña por un error.
 */

/** Slug → cuándo se publicó, de los borradores ya publicados por el admin. */
export const borradoresPublicados = cache(async (): Promise<Map<string, string>> => {
  const mapa = new Map<string, string>();
  if (BORRADORES.length === 0) return mapa;
  const admin = createAdminClientOpcional();
  if (!admin) return mapa;
  const { data, error } = await admin.from("guias_publicadas").select("slug, publicada");
  if (error) {
    console.error("[guias] No se pudo leer guias_publicadas:", error.code);
    return mapa;
  }
  for (const f of (data ?? []) as { slug: string; publicada: string }[]) mapa.set(f.slug, f.publicada);
  return mapa;
});

/** Las guías públicas, de la más antigua a la más nueva (como `GUIDES`). */
export async function guiasVisibles(): Promise<GuideMeta[]> {
  if (BORRADORES.length === 0) return GUIDES;
  const publicados = await borradoresPublicados();
  const nuevas = BORRADORES.filter((b) => publicados.has(b.slug)).sort((a, b) =>
    (publicados.get(a.slug) ?? "").localeCompare(publicados.get(b.slug) ?? ""),
  );
  return [...GUIDES, ...nuevas];
}

/** Las mismas, de la más nueva a la más antigua: el orden de cualquier listado. */
export async function guiasVisiblesRecientes(): Promise<GuideMeta[]> {
  return [...(await guiasVisibles())].reverse();
}

/** El borrador con ese slug que el admin aún NO ha publicado, o null. */
export async function borradorSinPublicar(slug: string): Promise<GuiaBorrador | null> {
  const borrador = BORRADORES.find((b) => b.slug === slug);
  if (!borrador) return null;
  return (await borradoresPublicados()).has(slug) ? null : borrador;
}
