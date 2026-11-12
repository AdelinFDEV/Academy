import "server-only";
import { z } from "zod";
import { llamar } from "../bd";
import { despublicar, olvidarListas, publicar, sincronizar } from "../imagenes/almacen";
import { LIMITES } from "../limites";
import type { ResultadoAccion } from "../peticion";
import { motivoParaNoParticipar } from "../permisos";
import { filtrar, type ClaseDeTexto } from "../texto/filtro";
import { slugDe } from "../texto/normalizar";
import { sonSuyasYListas } from "./imagenes";

/**
 * Publicar, editar y borrar: preguntas, respuestas y réplicas.
 *
 * Cada acción hace tres cosas y en este orden:
 *   1. comprueba que el usuario puede participar (antes que nada: a quien no
 *      es Premium no se le dice ni qué le rechazaría el filtro);
 *   2. pasa el texto por el filtro (`texto/filtro.ts`);
 *   3. llama a UNA función de Postgres, que lo vuelve a comprobar todo y hace
 *      el cambio entero o no hace nada.
 *
 * Los esquemas son `strictObject`: con un campo de más, la petición no vale.
 * Los máximos de los textos van holgados aquí a propósito (el filtro mide lo
 * que queda DESPUÉS de limpiar); lo que cortan es el abuso.
 */

const texto = (max: number) => z.string().min(1).max(max * 2);
const idPregunta = z.int().positive();
const idRespuesta = z.uuid();

/** Detectores que cuentan para el tope de 10 rechazos al día: los de estafa
 *  y de normas, no los de «te falta texto». */
const NO_CUENTAN = new Set(["largo", "sin_contenido", "mayusculas"]);

async function pasarFiltro(usuarioId: string, clase: ClaseDeTexto, entrada: { titulo?: string; cuerpo: string }) {
  const f = filtrar(clase, entrada);
  if (!f.ok && !NO_CUENTAN.has(f.detector)) {
    await llamar("foro_registrar_rechazo", { p_usuario: usuarioId, p_detector: f.detector });
  }
  return f;
}

// ── Preguntar ───────────────────────────────────────────────────────────────

export const esquemaPreguntar = z.strictObject({
  categoria: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(40),
  titulo: texto(LIMITES.titulo.max),
  cuerpo: texto(LIMITES.pregunta.max),
  imagenes: z.array(z.uuid()).max(LIMITES.imagenesPorPregunta).optional(),
});

export async function preguntar(usuarioId: string, d: z.infer<typeof esquemaPreguntar>): Promise<ResultadoAccion> {
  const motivo = await motivoParaNoParticipar(usuarioId);
  if (motivo) return { ok: false, error: motivo };

  const f = await pasarFiltro(usuarioId, "pregunta", { titulo: d.titulo, cuerpo: d.cuerpo });
  if (!f.ok) return { ok: false, error: "rechazado", mensaje: f.mensaje };

  // Las imágenes pasan al bucket público ANTES de crear la pregunta, y se
  // retiran si al final no se crea: así una pregunta publicada nunca apunta a
  // una imagen que no está. Solo se copian las que son suyas y están listas.
  const imagenes = d.imagenes ?? [];
  if (imagenes.length) {
    if (!(await sonSuyasYListas(usuarioId, imagenes))) return { ok: false, error: "imagen_no_valida" };
    if (!(await publicar(imagenes))) return { ok: false, error: "interno" };
  }

  const r = await llamar("foro_preguntar", {
    p_usuario: usuarioId,
    p_categoria: d.categoria,
    p_titulo: f.titulo,
    p_slug: slugDe(f.titulo ?? ""),
    p_cuerpo: f.cuerpo,
    p_huella: f.huella,
    p_imagenes: imagenes.length ? imagenes : null,
    p_tiene_enlaces: f.tieneEnlaces,
  });

  if (imagenes.length) {
    if (r.ok) await olvidarListas(imagenes);
    else await despublicar(imagenes);
  }
  return r;
}

// ── Responder y replicar ────────────────────────────────────────────────────

export const esquemaResponder = z.strictObject({
  pregunta: idPregunta,
  /** El mensaje al que se contesta. Sin él, es una respuesta a la pregunta. */
  a: idRespuesta.optional(),
  cuerpo: texto(LIMITES.respuesta.max),
});

export async function responder(usuarioId: string, d: z.infer<typeof esquemaResponder>): Promise<ResultadoAccion> {
  const motivo = await motivoParaNoParticipar(usuarioId);
  if (motivo) return { ok: false, error: motivo };

  const f = await pasarFiltro(usuarioId, d.a ? "replica" : "respuesta", { cuerpo: d.cuerpo });
  if (!f.ok) return { ok: false, error: "rechazado", mensaje: f.mensaje };

  return llamar("foro_responder", {
    p_usuario: usuarioId,
    p_pregunta: d.pregunta,
    p_a: d.a ?? null,
    p_cuerpo: f.cuerpo,
    p_huella: f.huella,
    p_tiene_enlaces: f.tieneEnlaces,
  });
}

// ── Editar lo propio (30 minutos) ───────────────────────────────────────────

export const esquemaEditar = z.strictObject({
  pregunta: idPregunta,
  /** Sin él, se edita la pregunta (y entonces hace falta el título). */
  respuesta: idRespuesta.optional(),
  /** Si lo editado es una réplica: decide qué límites se le aplican. */
  esReplica: z.boolean().optional(),
  titulo: texto(LIMITES.titulo.max).optional(),
  cuerpo: texto(LIMITES.pregunta.max),
});

export async function editar(usuarioId: string, d: z.infer<typeof esquemaEditar>): Promise<ResultadoAccion> {
  const motivo = await motivoParaNoParticipar(usuarioId);
  if (motivo) return { ok: false, error: motivo };

  // `esReplica` solo elige con qué vara mide el filtro. Si miente, la
  // restricción de la tabla (que sabe lo que es de verdad) rechaza el cambio.
  const clase: ClaseDeTexto = !d.respuesta ? "pregunta" : d.esReplica ? "replica" : "respuesta";
  if (clase === "pregunta" && !d.titulo) return { ok: false, error: "formato" };

  const f = await pasarFiltro(usuarioId, clase, { titulo: d.titulo, cuerpo: d.cuerpo });
  if (!f.ok) return { ok: false, error: "rechazado", mensaje: f.mensaje };

  return llamar("foro_editar", {
    p_usuario: usuarioId,
    p_pregunta: d.pregunta,
    p_respuesta: d.respuesta ?? null,
    p_titulo: f.titulo,
    p_cuerpo: f.cuerpo,
    p_huella: f.huella,
    p_tiene_enlaces: f.tieneEnlaces,
  });
}

// ── Borrar lo propio ────────────────────────────────────────────────────────

export const esquemaBorrar = z.strictObject({
  pregunta: idPregunta,
  respuesta: idRespuesta.optional(),
});

/** No pide ser Premium: es su contenido y puede retirarlo aunque ya no pague. */
export async function borrar(usuarioId: string, d: z.infer<typeof esquemaBorrar>): Promise<ResultadoAccion> {
  const r = await llamar("foro_borrar_propio", {
    p_usuario: usuarioId,
    p_pregunta: d.pregunta,
    p_respuesta: d.respuesta ?? null,
  });
  // Al borrar una pregunta, sus imágenes salen del bucket público.
  if (r.ok && !d.respuesta) await sincronizar(d.pregunta);
  return r;
}
