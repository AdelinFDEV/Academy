import "server-only";
import { z } from "zod";
import { llamar } from "../bd";
import type { ResultadoAccion } from "../peticion";

/**
 * Lo que el usuario hace con lo suyo y que no es publicar: aceptar las normas
 * de la comunidad y marcar sus avisos como leídos.
 */

export const esquemaNormas = z.strictObject({ version: z.int().positive() });

/** Se guarda la versión aceptada: si las normas cambian, se vuelven a aceptar. */
export function aceptarNormas(usuarioId: string, d: z.infer<typeof esquemaNormas>): Promise<ResultadoAccion> {
  return llamar("foro_aceptar_normas", { p_usuario: usuarioId, p_version: d.version });
}

export const esquemaLeerAvisos = z.strictObject({
  /** Sin lista, se marcan todos. */
  ids: z.array(z.uuid()).max(200).optional(),
});

/** Solo los SUYOS: la función filtra por el usuario de la sesión, no por la lista. */
export function leerAvisos(usuarioId: string, d: z.infer<typeof esquemaLeerAvisos>): Promise<ResultadoAccion> {
  return llamar("foro_leer_avisos", { p_usuario: usuarioId, p_ids: d.ids ?? null });
}
