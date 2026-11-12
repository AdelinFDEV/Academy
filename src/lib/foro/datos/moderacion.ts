import "server-only";
import { bd } from "../bd";
import type {
  AlertaDeVotos, AutorEnModeracion, EntradaRegistro, MensajeModerado, PanelModeracion, SancionForo,
} from "../tipos";

/**
 * Todo lo que enseña `/admin/foro` (FORO.md §7), en una sola lectura.
 *
 * Solo la llama la página del panel, DESPUÉS de comprobar con `sesionAdmin`
 * que quien mira es admin. Devuelve un `PanelModeracion` construido campo a
 * campo: ni aquí salen ids de usuario al navegador. Los ids de usuario se
 * usan dentro de esta función para cruzar tablas, y se quedan en ella.
 */

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;
/** A partir de cuántos votos de una persona a otra en una semana se avisa. */
const UMBRAL_DE_ALERTA = 8;

type FilaPregunta = { id: number; slug: string; titulo: string; cuerpo: string; estado: string; autor_id: string | null; creada_at: string };
type FilaRespuesta = { id: string; pregunta_id: number; padre_id: string | null; cuerpo: string; estado: string; autor_id: string | null; creada_at: string };

export async function panelDeModeracion(): Promise<PanelModeracion> {
  const cliente = bd();
  const haceUnaSemana = new Date(Date.now() - SIETE_DIAS).toISOString();
  const ahora = new Date().toISOString();

  const [ajustes, reportes, preguntasOcultas, respuestasOcultas, sancionesFilas, registroFilas, votos, cPreguntas, cRespuestas, cParticipantes] =
    await Promise.all([
      cliente.from("foro_ajustes").select("modo").maybeSingle(),
      cliente
        .from("foro_reportes")
        .select("pregunta_id, respuesta_id, motivo, detalle, creado_at")
        .eq("estado", "abierto")
        .order("creado_at", { ascending: true })
        .limit(400),
      cliente.from("foro_preguntas").select("id").eq("estado", "oculta").limit(100),
      cliente.from("foro_respuestas").select("id").eq("estado", "oculta").limit(100),
      cliente
        .from("foro_sanciones")
        .select("id, usuario_id, tipo, hasta, motivo, creada_at")
        .is("levantada_at", null)
        .order("creada_at", { ascending: false })
        .limit(200),
      cliente
        .from("foro_moderacion")
        .select("id, actor_id, accion, pregunta_id, usuario_id, motivo, creado_at")
        .order("creado_at", { ascending: false })
        .limit(80),
      cliente
        .from("foro_puntos")
        .select("usuario_id, origen_id")
        .in("motivo", ["me_gusta", "gracias", "interesante", "yo_tambien"])
        .gt("puntos", 0)
        .not("origen_id", "is", null)
        .gt("creado_at", haceUnaSemana)
        .limit(3000),
      cliente.from("foro_preguntas").select("id", { count: "exact", head: true }).eq("estado", "publicada"),
      cliente.from("foro_respuestas").select("id", { count: "exact", head: true }).eq("estado", "publicada"),
      cliente.from("foro_reputacion").select("usuario_id", { count: "exact", head: true }),
    ]);

  // ── Qué mensajes hay que enseñar: los reportados y los ocultos ──
  const filasReportes = reportes.data ?? [];
  const idsRespuestas = new Set<string>();
  const idsPreguntas = new Set<number>();
  for (const r of filasReportes) {
    if (r.respuesta_id) idsRespuestas.add(String(r.respuesta_id));
    else idsPreguntas.add(Number(r.pregunta_id));
  }
  for (const p of preguntasOcultas.data ?? []) idsPreguntas.add(Number(p.id));
  for (const r of respuestasOcultas.data ?? []) idsRespuestas.add(String(r.id));

  const { data: respuestasData } = idsRespuestas.size
    ? await cliente
        .from("foro_respuestas")
        .select("id, pregunta_id, padre_id, cuerpo, estado, autor_id, creada_at")
        .in("id", Array.from(idsRespuestas))
    : { data: [] };
  const respuestas = (respuestasData ?? []) as FilaRespuesta[];

  // Las preguntas de esos mensajes, las de las respuestas (para el título del
  // hilo) y las que nombra el registro.
  const idsHilos = new Set<number>(idsPreguntas);
  for (const r of respuestas) idsHilos.add(Number(r.pregunta_id));
  for (const m of registroFilas.data ?? []) if (m.pregunta_id != null) idsHilos.add(Number(m.pregunta_id));
  const { data: preguntasData } = idsHilos.size
    ? await cliente
        .from("foro_preguntas")
        .select("id, slug, titulo, cuerpo, estado, autor_id, creada_at")
        .in("id", Array.from(idsHilos))
    : { data: [] };
  const preguntas = new Map(((preguntasData ?? []) as FilaPregunta[]).map((p) => [Number(p.id), p]));

  // ── Quién es cada uno: alias, puntos, historial ──
  const idsUsuarios = new Set<string>();
  const apuntar = (id: unknown) => { if (typeof id === "string" && id) idsUsuarios.add(id); };
  for (const p of preguntas.values()) apuntar(p.autor_id);
  for (const r of respuestas) apuntar(r.autor_id);
  for (const s of sancionesFilas.data ?? []) apuntar(s.usuario_id);
  for (const m of registroFilas.data ?? []) { apuntar(m.actor_id); apuntar(m.usuario_id); }
  for (const v of votos.data ?? []) { apuntar(v.usuario_id); apuntar(v.origen_id); }
  const usuarios = Array.from(idsUsuarios);

  const [perfiles, reputaciones, historialSanciones, historialRetirados, imagenes] = usuarios.length
    ? await Promise.all([
        cliente.from("profiles").select("id, alias").in("id", usuarios),
        cliente.from("foro_reputacion").select("usuario_id, puntos, primera_actividad_at").in("usuario_id", usuarios),
        cliente.from("foro_sanciones").select("usuario_id").in("usuario_id", usuarios).limit(2000),
        cliente.from("foro_moderacion").select("usuario_id").in("usuario_id", usuarios).in("accion", ["ocultar", "borrar"]).limit(2000),
        idsPreguntas.size
          ? cliente.from("foro_imagenes").select("pregunta_id").in("pregunta_id", Array.from(idsPreguntas)).neq("estado", "borrada")
          : Promise.resolve({ data: [] as { pregunta_id: number }[] }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] as { pregunta_id: number }[] }];

  const alias = new Map((perfiles.data ?? []).map((p) => [String(p.id), typeof p.alias === "string" ? p.alias : null]));
  const reputacion = new Map((reputaciones.data ?? []).map((r) => [String(r.usuario_id), r]));
  const cuenta = (filas: { usuario_id: unknown }[] | null) => {
    const m = new Map<string, number>();
    for (const f of filas ?? []) m.set(String(f.usuario_id), (m.get(String(f.usuario_id)) ?? 0) + 1);
    return m;
  };
  const nSanciones = cuenta(historialSanciones.data);
  const nRetirados = cuenta(historialRetirados.data);
  const nImagenes = new Map<number, number>();
  for (const i of imagenes.data ?? []) nImagenes.set(Number(i.pregunta_id), (nImagenes.get(Number(i.pregunta_id)) ?? 0) + 1);

  const autorDe = (id: string | null): AutorEnModeracion => {
    const rep = id ? reputacion.get(id) : undefined;
    return {
      alias: id ? (alias.get(id) ?? null) : null,
      puntos: Math.max(0, Number(rep?.puntos ?? 0)),
      sanciones: id ? (nSanciones.get(id) ?? 0) : 0,
      retirados: id ? (nRetirados.get(id) ?? 0) : 0,
      nuevo: rep ? Date.now() - new Date(String(rep.primera_actividad_at)).getTime() < SIETE_DIAS : true,
    };
  };

  // ── Los mensajes, con sus reportes abiertos ──
  const reportesDe = (preguntaId: number, respuestaId: string | null) =>
    filasReportes
      .filter((r) => Number(r.pregunta_id) === preguntaId && (r.respuesta_id ? String(r.respuesta_id) : null) === respuestaId)
      .map((r) => ({ motivo: String(r.motivo), detalle: String(r.detalle ?? ""), fecha: String(r.creado_at) }));

  const mensajes: MensajeModerado[] = [];
  for (const id of idsPreguntas) {
    const p = preguntas.get(id);
    if (!p) continue;
    mensajes.push({
      clave: `p:${id}`,
      preguntaId: id,
      respuestaId: null,
      clase: "pregunta",
      hilo: { slug: p.slug, titulo: p.titulo },
      texto: p.cuerpo,
      estado: p.estado,
      fecha: p.creada_at,
      imagenes: nImagenes.get(id) ?? 0,
      autor: autorDe(p.autor_id),
      reportes: reportesDe(id, null),
    });
  }
  for (const r of respuestas) {
    const p = preguntas.get(Number(r.pregunta_id));
    if (!p) continue;
    mensajes.push({
      clave: `r:${r.id}`,
      preguntaId: Number(r.pregunta_id),
      respuestaId: String(r.id),
      clase: r.padre_id ? "replica" : "respuesta",
      hilo: { slug: p.slug, titulo: p.titulo },
      texto: r.cuerpo,
      estado: r.estado,
      fecha: r.creada_at,
      imagenes: 0,
      autor: autorDe(r.autor_id),
      reportes: reportesDe(Number(r.pregunta_id), String(r.id)),
    });
  }

  // La cola: lo que tiene reportes abiertos. «Estafa» primero, luego lo más reportado.
  const peso = (m: MensajeModerado) => (m.reportes.some((r) => r.motivo === "estafa") ? 1000 : 0) + m.reportes.length;
  const cola = mensajes.filter((m) => m.reportes.length > 0 && m.estado !== "borrada").sort((a, b) => peso(b) - peso(a));
  const ocultos = mensajes.filter((m) => m.reportes.length === 0 && m.estado === "oculta");

  // ── Sanciones que siguen contando: expulsiones, suspensiones sin vencer y avisos del último mes ──
  const haceUnMes = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sanciones: SancionForo[] = (sancionesFilas.data ?? [])
    .filter((s) =>
      s.tipo === "expulsion" ||
      (s.tipo === "suspension" && typeof s.hasta === "string" && s.hasta > ahora) ||
      (s.tipo === "aviso" && new Date(String(s.creada_at)).getTime() > haceUnMes))
    .map((s) => ({
      id: String(s.id),
      alias: alias.get(String(s.usuario_id)) ?? null,
      tipo: String(s.tipo),
      hasta: typeof s.hasta === "string" ? s.hasta : null,
      motivo: String(s.motivo),
      fecha: String(s.creada_at),
    }));

  const registro: EntradaRegistro[] = (registroFilas.data ?? []).map((m) => {
    const p = m.pregunta_id != null ? preguntas.get(Number(m.pregunta_id)) : undefined;
    return {
      id: Number(m.id),
      fecha: String(m.creado_at),
      actor: m.actor_id ? (alias.get(String(m.actor_id)) ?? "Cuenta eliminada") : "Sistema",
      accion: String(m.accion),
      motivo: String(m.motivo ?? ""),
      hilo: p ? { id: Number(p.id), titulo: p.titulo } : null,
      sobre: m.usuario_id ? (alias.get(String(m.usuario_id)) ?? "Cuenta eliminada") : null,
    };
  });

  // ── Alertas: muchos votos de una misma persona a otra en una semana ──
  const pares = new Map<string, number>();
  for (const v of votos.data ?? []) {
    const k = `${String(v.origen_id)}>${String(v.usuario_id)}`;
    pares.set(k, (pares.get(k) ?? 0) + 1);
  }
  const alertas: AlertaDeVotos[] = Array.from(pares.entries())
    .filter(([, n]) => n >= UMBRAL_DE_ALERTA)
    .map(([k, n]) => {
      const [de, a] = k.split(">");
      return { de: alias.get(de) ?? "Cuenta eliminada", a: alias.get(a) ?? "Cuenta eliminada", votos: n };
    })
    .sort((x, y) => y.votos - x.votos)
    .slice(0, 20);

  return {
    modo: typeof ajustes.data?.modo === "string" ? ajustes.data.modo : "cerrado",
    cifras: {
      preguntas: cPreguntas.count ?? 0,
      respuestas: cRespuestas.count ?? 0,
      reportesAbiertos: filasReportes.length,
      ocultos: (preguntasOcultas.data ?? []).length + (respuestasOcultas.data ?? []).length,
      participantes: cParticipantes.count ?? 0,
    },
    cola,
    ocultos,
    sanciones,
    registro,
    alertas,
  };
}
