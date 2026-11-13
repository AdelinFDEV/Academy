import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BORRADORES, type GuiaBorrador } from "@/lib/guides";

/**
 * Los datos de /admin/acciones: lo que está construido y espera a que el admin
 * lo publique. Solo servidor, con la clave de servicio.
 *
 *  · Guías: los `BORRADORES` del código, con si el admin ya las ha publicado
 *    (tabla `guias_publicadas`).
 *  · Cursos: las filas de `cursos`, con su `published` y lo que les falta
 *    (función `acciones_cursos`).
 *
 * El foro no está aquí: tiene su propia sección.
 */

export type GuiaAccion = GuiaBorrador & { publicada: string | null };

export type CursoAccion = {
  slug: string;
  titulo: string;
  descripcion: string | null;
  published: boolean;
  updated_at: string;
  modulos: number;
  lecciones: number;
  vacias: number;
  preguntas: number;
};

/** Por qué un curso no se puede publicar todavía, o null si está completo. */
export function faltaAlCurso(c: Pick<CursoAccion, "lecciones" | "vacias" | "preguntas">): string | null {
  if (c.lecciones === 0) return "No tiene lecciones";
  if (c.vacias > 0) return `${c.vacias} de ${c.lecciones} lecciones están sin escribir`;
  if (c.preguntas === 0) return "No tiene preguntas de examen";
  return null;
}

export async function cargarAcciones() {
  const admin = createAdminClient();

  const [publicadas, cursos] = await Promise.all([
    admin.from("guias_publicadas").select("slug, publicada"),
    admin.rpc("acciones_cursos"),
  ]);

  if (publicadas.error) console.error("[acciones] guias_publicadas:", publicadas.error.code);
  if (cursos.error) console.error("[acciones] acciones_cursos:", cursos.error.code);

  const cuando = new Map(((publicadas.data ?? []) as { slug: string; publicada: string }[]).map((f) => [f.slug, f.publicada]));
  const guias: GuiaAccion[] = BORRADORES.map((b) => ({ ...b, publicada: cuando.get(b.slug) ?? null }));

  return {
    /** Falta ejecutar `scripts/create-acciones.sql`. */
    faltaSql: Boolean(publicadas.error || cursos.error),
    guias,
    cursos: (cursos.data ?? []) as CursoAccion[],
  };
}
