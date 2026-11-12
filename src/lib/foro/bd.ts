import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * La única puerta del foro a la base de datos (FORO.md §6.0).
 *
 * Las tablas `foro_*` no tienen policies ni permisos para el navegador: solo
 * entra la clave de servicio, y solo desde aquí. `acciones/` escribe llamando
 * a UNA función de Postgres con `llamar`; `datos/` lee con `bd()`.
 *
 * `npm run check` falla si un archivo de fuera de `src/lib/foro/` nombra una
 * tabla o una función del foro.
 */

export function bd() {
  return createAdminClient();
}

/** Lo que devuelve cualquier función `foro_*`: ok con sus datos, o un código de error. */
export type Respuesta = { ok: true; datos: Record<string, unknown> } | { ok: false; error: string };

/**
 * Llama a una función atómica del foro y normaliza su respuesta.
 *
 * Si Postgres falla (un interbloqueo entre dos peticiones, una restricción que
 * nadie previó), devuelve `interno` y apunta en el registro del servidor el
 * nombre de la función y el código del error. Nunca el texto del mensaje ni
 * los argumentos: llevan lo que escribió el usuario.
 */
export async function llamar(funcion: string, args: Record<string, unknown>): Promise<Respuesta> {
  const { data, error } = await bd().rpc(funcion, args);
  if (error) {
    console.error(`[foro] ${funcion} falló: ${error.code ?? "sin código"}`);
    return { ok: false, error: "interno" };
  }
  const r: unknown = data;
  if (!r || typeof r !== "object" || Array.isArray(r)) {
    console.error(`[foro] ${funcion} devolvió algo inesperado`);
    return { ok: false, error: "interno" };
  }
  const { ok, error: codigo, ...datos } = r as Record<string, unknown>;
  if (ok === true) return { ok: true, datos };
  return { ok: false, error: typeof codigo === "string" ? codigo : "interno" };
}
