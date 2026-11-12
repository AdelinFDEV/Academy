import "server-only";
import { llamar } from "../bd";
import { limpiarHuerfanas } from "../imagenes/almacen";

/**
 * Lo que hace el cron cada día por el foro (FORO.md §9.2, §10.1, §11 y §13).
 * Lo llama `/api/cron/diario`, que ya ha comprobado el `CRON_SECRET`.
 *
 *  · `foro_mantenimiento()`: recalcula contadores y puntos desde sus filas (y
 *    apunta en el registro si algo no cuadraba), avisa a quien ya puede elegir
 *    ganadora y purga lo caducado.
 *  · La limpieza de las imágenes que se subieron y no llegaron a una pregunta.
 *
 * Cada parte es independiente: si una falla, la otra se hace igual.
 */
export async function mantenimientoDelForo(): Promise<Record<string, unknown>> {
  const base = await llamar("foro_mantenimiento", {});
  const imagenes = await limpiarHuerfanas().catch(() => null);
  return { base: base.ok ? base.datos : { error: base.error }, imagenes };
}
