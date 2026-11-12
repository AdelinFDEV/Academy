import "server-only";
import { bd } from "../bd";
import { ETIQUETA_IDS, logrosDelForo, nivelDe, type EtiquetaId } from "../limites";
import type { ResultadoAccion } from "../peticion";
import { accesoAlForo, motivoParaNoParticipar } from "../permisos";
import type { AvisoForo, LoMio, MensajeMio, MioEnHilo } from "../tipos";

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
  const { avisos, sinLeer } = await leerAvisos(usuarioId);
  return { ok: true, datos: { avisos, sinLeer } };
}

async function leerAvisos(usuarioId: string): Promise<{ avisos: AvisoForo[]; sinLeer: number }> {
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
  return { avisos, sinLeer: avisos.filter((a) => !a.leido).length };
}

const extracto = (texto: unknown) => {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  return t.length > 140 ? `${t.slice(0, 140).replace(/\s+\S*$/, "")}…` : t;
};

/**
 * Todo lo del usuario en el foro, para su página `/foro/mio`: su reputación,
 * sus avisos, sus sanciones en vigor y sus mensajes con su estado (también
 * los ocultos y los retirados, con el motivo: es lo único que ve él y nadie
 * más). Lo llama la página, con el usuario de la sesión.
 */
export async function loMio(usuarioId: string): Promise<LoMio> {
  const cliente = bd();
  const ahora = new Date().toISOString();
  const mesActual = `${ahora.slice(0, 8)}01`;

  const [perfil, reputacion, sancionesFilas, preguntas, respuestas, avisos] = await Promise.all([
    cliente.from("profiles").select("alias").eq("id", usuarioId).maybeSingle(),
    cliente.from("foro_reputacion").select("puntos, puntos_mes, mes, ganadoras, gracias, respuestas, fuera_del_ranking").eq("usuario_id", usuarioId).maybeSingle(),
    cliente.from("foro_sanciones").select("tipo, hasta, motivo, creada_at").eq("usuario_id", usuarioId).is("levantada_at", null).order("creada_at", { ascending: false }).limit(20),
    cliente.from("foro_preguntas").select("id, slug, titulo, cuerpo, estado, creada_at").eq("autor_id", usuarioId).neq("estado", "borrada").order("creada_at", { ascending: false }).limit(50),
    cliente.from("foro_respuestas").select("id, pregunta_id, padre_id, cuerpo, estado, creada_at").eq("autor_id", usuarioId).neq("estado", "borrada").order("creada_at", { ascending: false }).limit(50),
    leerAvisos(usuarioId),
  ]);

  // Los títulos de los hilos donde ha respondido, y el motivo de lo que tenga oculto.
  const idsHilos = Array.from(new Set((respuestas.data ?? []).map((r) => Number(r.pregunta_id))));
  const hayOcultos = [...(preguntas.data ?? []), ...(respuestas.data ?? [])].some((m) => m.estado === "oculta");
  const [hilos, registro] = await Promise.all([
    idsHilos.length
      ? cliente.from("foro_preguntas").select("id, slug, titulo, estado").in("id", idsHilos)
      : Promise.resolve({ data: [] as { id: number; slug: string; titulo: string; estado: string }[] }),
    hayOcultos
      ? cliente.from("foro_moderacion").select("pregunta_id, respuesta_id, motivo, creado_at").eq("usuario_id", usuarioId).in("accion", ["ocultar", "ocultar_auto"]).order("creado_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as { pregunta_id: number | null; respuesta_id: string | null; motivo: string }[] }),
  ]);
  const hiloDe = new Map((hilos.data ?? []).map((h) => [Number(h.id), h]));
  // El registro viene del más reciente al más antiguo: el primero que aparece manda.
  const motivoDe = new Map<string, string>();
  for (const m of registro.data ?? []) {
    const clave = m.respuesta_id ? `r:${m.respuesta_id}` : `p:${m.pregunta_id}`;
    if (!motivoDe.has(clave)) motivoDe.set(clave, String(m.motivo ?? ""));
  }

  const mensajes: MensajeMio[] = [
    ...(preguntas.data ?? []).map((p): MensajeMio => ({
      preguntaId: Number(p.id),
      respuestaId: null,
      clase: "pregunta",
      titulo: String(p.titulo),
      slug: String(p.slug),
      extracto: extracto(p.cuerpo),
      estado: String(p.estado),
      motivo: p.estado === "oculta" ? (motivoDe.get(`p:${p.id}`) ?? "") : "",
      fecha: String(p.creada_at),
    })),
    ...(respuestas.data ?? []).flatMap((r): MensajeMio[] => {
      const h = hiloDe.get(Number(r.pregunta_id));
      // Si el hilo ya no se puede ver, tampoco se enlaza desde aquí.
      if (!h || h.estado !== "publicada") return [];
      return [{
        preguntaId: Number(r.pregunta_id),
        respuestaId: String(r.id),
        clase: r.padre_id ? "replica" : "respuesta",
        titulo: String(h.titulo),
        slug: String(h.slug),
        extracto: extracto(r.cuerpo),
        estado: String(r.estado),
        motivo: r.estado === "oculta" ? (motivoDe.get(`r:${r.id}`) ?? "") : "",
        fecha: String(r.creada_at),
      }];
    }),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const rep = reputacion.data;
  const puntos = Math.max(0, Number(rep?.puntos ?? 0));
  const ganadoras = Number(rep?.ganadoras ?? 0);
  const gracias = Number(rep?.gracias ?? 0);

  return {
    alias: typeof perfil.data?.alias === "string" ? perfil.data.alias : null,
    puntos,
    puntosDelMes: rep && String(rep.mes) === mesActual ? Math.max(0, Number(rep.puntos_mes)) : 0,
    nivel: nivelDe(puntos),
    ganadoras,
    gracias,
    logros: logrosDelForo({ puntos, ganadoras, gracias, respuestas: Number(rep?.respuestas ?? 0) }),
    fueraDelRanking: Boolean(rep?.fuera_del_ranking),
    sanciones: (sancionesFilas.data ?? [])
      .filter((s) => s.tipo === "expulsion" || (s.tipo === "suspension" && typeof s.hasta === "string" && s.hasta > ahora))
      .map((s) => ({ tipo: String(s.tipo), hasta: typeof s.hasta === "string" ? s.hasta : null, motivo: String(s.motivo), fecha: String(s.creada_at) })),
    avisos: avisos.avisos,
    sinLeer: avisos.sinLeer,
    mensajes,
  };
}
