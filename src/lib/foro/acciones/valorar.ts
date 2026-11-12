import "server-only";
import { z } from "zod";
import { llamar } from "../bd";
import { sincronizar } from "../imagenes/almacen";
import { ETIQUETA_IDS, LIMITES, MOTIVO_REPORTE_IDS } from "../limites";
import type { ResultadoAccion } from "../peticion";
import { limpiar } from "../texto/normalizar";

/**
 * Valorar lo de otros: me gusta, etiquetas, respuesta ganadora y reportes.
 *
 * Aquí no hay texto que filtrar (salvo el detalle de un reporte, que solo lee
 * el admin), así que cada acción es una llamada a su función de Postgres. El
 * permiso —Premium, sin sanción, que no sea lo propio, los topes del día— lo
 * comprueba la función dentro de su transacción.
 */

const idPregunta = z.int().positive();
const idRespuesta = z.uuid();

export const esquemaMeGusta = z.strictObject({ respuesta: idRespuesta, poner: z.boolean() });

export function meGusta(usuarioId: string, d: z.infer<typeof esquemaMeGusta>): Promise<ResultadoAccion> {
  return llamar("foro_me_gusta", { p_usuario: usuarioId, p_respuesta: d.respuesta, p_poner: d.poner });
}

export const esquemaEtiquetar = z.strictObject({
  pregunta: idPregunta,
  tipo: z.enum(ETIQUETA_IDS),
  poner: z.boolean(),
});

export function etiquetar(usuarioId: string, d: z.infer<typeof esquemaEtiquetar>): Promise<ResultadoAccion> {
  return llamar("foro_etiquetar", {
    p_usuario: usuarioId,
    p_pregunta: d.pregunta,
    p_tipo: d.tipo,
    p_poner: d.poner,
  });
}

export const esquemaGanadora = z.strictObject({ pregunta: idPregunta, respuesta: idRespuesta });

export function elegirGanadora(usuarioId: string, d: z.infer<typeof esquemaGanadora>): Promise<ResultadoAccion> {
  return llamar("foro_elegir_ganadora", {
    p_usuario: usuarioId,
    p_pregunta: d.pregunta,
    p_respuesta: d.respuesta,
  });
}

export const esquemaReportar = z.strictObject({
  pregunta: idPregunta,
  /** Sin él, se reporta la pregunta. */
  respuesta: idRespuesta.optional(),
  motivo: z.enum(MOTIVO_REPORTE_IDS),
  detalle: z.string().max(LIMITES.detalleReporte.max * 2).optional(),
});

export async function reportar(usuarioId: string, d: z.infer<typeof esquemaReportar>): Promise<ResultadoAccion> {
  // El detalle solo lo lee el admin, y como texto plano: se limpia y se
  // recorta, pero no pasa por los detectores (reportar una estafa obliga a
  // citarla).
  const detalle = Array.from(limpiar(d.detalle ?? "")).slice(0, LIMITES.detalleReporte.max).join("");
  const r = await llamar("foro_reportar", {
    p_usuario: usuarioId,
    p_pregunta: d.pregunta,
    p_respuesta: d.respuesta ?? null,
    p_motivo: d.motivo,
    p_detalle: detalle,
  });
  if (!r.ok) return r;
  // Si este reporte ha ocultado una pregunta, sus imágenes salen ya del
  // bucket público: lo oculto no puede seguir sirviéndose ni un minuto.
  if (r.datos.oculto === true && !d.respuesta) await sincronizar(d.pregunta);
  // Quien reporta no tiene por qué saber si su reporte fue el que lo ocultó.
  return { ok: true, datos: {} };
}
