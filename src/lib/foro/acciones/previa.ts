import "server-only";
import { z } from "zod";
import { aliasQueExisten } from "../datos/hilos";
import { LIMITES } from "../limites";
import type { ResultadoAccion } from "../peticion";
import { candidatosDeMencion, estructuraDe } from "../texto/formato";
import { limpiar } from "../texto/normalizar";

/**
 * La vista previa de un mensaje antes de publicarlo (23-11-2026).
 *
 * Devuelve la MISMA estructura que pintará el hilo (`estructuraDe`), hecha
 * con el texto ya limpio: lo que se ve en la vista previa es exactamente lo
 * que saldrá, con sus negritas, sus listas, sus enlaces permitidos y sus
 * menciones a alias que existen.
 *
 * No guarda nada y no pasa el filtro de estafas: eso ocurre al publicar, que
 * es cuando cuenta (y cuando un rechazo se apunta). Devuelve estructura,
 * nunca HTML.
 */
export const esquemaVistaPrevia = z.strictObject({
  cuerpo: z.string().max(LIMITES.pregunta.max * 2),
});

export async function vistaPrevia(_usuarioId: string, d: z.infer<typeof esquemaVistaPrevia>): Promise<ResultadoAccion> {
  const cuerpo = limpiar(d.cuerpo);
  const alias = await aliasQueExisten(candidatosDeMencion(cuerpo));
  return { ok: true, datos: { bloques: estructuraDe(cuerpo, alias) } };
}
