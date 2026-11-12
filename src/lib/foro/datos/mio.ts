import "server-only";
import { bd } from "../bd";
import { ETIQUETA_IDS, type EtiquetaId } from "../limites";
import type { ResultadoAccion } from "../peticion";
import { accesoAlForo, motivoParaNoParticipar } from "../permisos";
import type { AvisoForo, MioEnHilo } from "../tipos";

/**
 * Lo PERSONAL de quien mira: qué ha hecho en un hilo y sus avisos.
 *
 * Se pide aparte de la página y nunca se cachea (FORO.md §6.0, regla 5): la
 * página de un hilo es la misma para todos. Todas las consultas filtran por
 * el usuario DE LA SESIÓN, que llega como argumento desde `peticion.ts`;
 * ninguna acepta el id de otra persona.
 *
 * Cada lectura devuelve un tipo de `tipos.ts` construido campo a campo.
 */

const esEtiqueta = (t: unknown): t is EtiquetaId => ETIQUETA_IDS.includes(t as EtiquetaId);

/** Lo que el usuario ha hecho en un hilo publicado. */
export async function mioEnHilo(usuarioId: string, parametros: URLSearchParams): Promise<ResultadoAccion> {
  const preguntaId = Number(parametros.get("pregunta"));
  if (!Number.isSafeInteger(preguntaId) || preguntaId <= 0) return { ok: false, error: "formato" };

  // Con el foro cerrado, para quien no es admin no existe nada.
  if (!(await accesoAlForo(usuarioId)).visible) return { ok: false, error: "no_existe" };

  const cliente = bd();
  const { data: pregunta } = await cliente
    .from("foro_preguntas")
    .select("id, autor_id, estado")
    .eq("id", preguntaId)
    .maybeSingle();
  // Un hilo oculto responde igual que uno que no existe.
  if (!pregunta || pregunta.estado !== "publicada") return { ok: false, error: "no_existe" };

  const { data: respuestas } = await cliente
    .from("foro_respuestas")
    .select("id, autor_id")
    .eq("pregunta_id", preguntaId)
    .eq("estado", "publicada");
  const idsDelHilo = (respuestas ?? []).map((r) => String(r.id));

  const [motivo, gustas, etiquetas, reportes] = await Promise.all([
    motivoParaNoParticipar(usuarioId),
    idsDelHilo.length
      ? cliente.from("foro_me_gusta").select("respuesta_id").eq("usuario_id", usuarioId).in("respuesta_id", idsDelHilo)
      : Promise.resolve({ data: [] as { respuesta_id: string }[] }),
    cliente.from("foro_etiquetas").select("tipo").eq("usuario_id", usuarioId).eq("pregunta_id", preguntaId),
    cliente.from("foro_reportes").select("respuesta_id").eq("usuario_id", usuarioId).eq("pregunta_id", preguntaId),
  ]);

  const mio: MioEnHilo = {
    puede: motivo === null,
    motivo,
    esAutorDeLaPregunta: pregunta.autor_id === usuarioId,
    meGusta: (gustas.data ?? []).map((g) => String(g.respuesta_id)),
    etiquetas: (etiquetas.data ?? []).map((e) => e.tipo).filter(esEtiqueta),
    mios: (respuestas ?? []).filter((r) => r.autor_id === usuarioId).map((r) => String(r.id)),
    reportados: (reportes.data ?? []).map((r) => (r.respuesta_id ? String(r.respuesta_id) : "pregunta")),
  };
  return { ok: true, datos: mio };
}

/** Los avisos del usuario, los más recientes primero, y cuántos tiene sin leer. */
export async function misAvisos(usuarioId: string): Promise<ResultadoAccion> {
  const cliente = bd();
  const { data: filas } = await cliente
    .from("foro_avisos")
    .select("id, tipo, cuantos, leido, motivo, actualizado_at, pregunta_id, respuesta_id")
    .eq("destinatario", usuarioId)
    .order("actualizado_at", { ascending: false })
    .limit(50);

  const idsHilos = Array.from(new Set((filas ?? []).map((f) => f.pregunta_id).filter((x) => x != null)));
  // Solo se enlaza a hilos que siguen publicados: de uno oculto no sale ni el título.
  const { data: hilos } = idsHilos.length
    ? await cliente.from("foro_preguntas").select("id, slug, titulo").in("id", idsHilos).eq("estado", "publicada")
    : { data: [] as { id: number; slug: string; titulo: string }[] };
  const porId = new Map((hilos ?? []).map((h) => [Number(h.id), h]));

  const avisos: AvisoForo[] = (filas ?? []).map((f) => {
    const h = f.pregunta_id != null ? porId.get(Number(f.pregunta_id)) : undefined;
    return {
      id: String(f.id),
      tipo: String(f.tipo),
      cuantos: Number(f.cuantos),
      leido: Boolean(f.leido),
      motivo: String(f.motivo ?? ""),
      fecha: String(f.actualizado_at),
      hilo: h ? { id: Number(h.id), slug: String(h.slug), titulo: String(h.titulo) } : null,
      respuestaId: f.respuesta_id ? String(f.respuesta_id) : null,
    };
  });
  return { ok: true, datos: { avisos, sinLeer: avisos.filter((a) => !a.leido).length } };
}
