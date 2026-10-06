/**
 * Las reglas de un curso: qué está abierto, cómo se puntúa y cómo va el
 * cronograma del alumno.
 *
 * **Funciones puras, sin Supabase.** Las usan las páginas del aula para pintar
 * y las rutas de la API para decidir, y tienen que dar exactamente lo mismo en
 * los dos sitios: si la página enseña un examen abierto y la API lo rechaza, o
 * al revés, el bloqueo se rompe por algún lado. Por eso la regla vive aquí una
 * sola vez y nadie la reescribe con su propio `if`.
 *
 * Las reglas, acordadas con el admin el 06-10-2026:
 *  · Las lecciones de un módulo abierto se hacen en cualquier orden.
 *  · El examen de un módulo se abre al completar TODAS sus lecciones.
 *  · El módulo siguiente se abre al APROBAR ese examen (nota ≥ `nota_minima`).
 *  · Suspender obliga a esperar `ESPERA_TRAS_SUSPENSO_MS` antes de repetir.
 *  · El examen final se abre con todos los módulos aprobados.
 *  · Nota del certificado: 40 % media de los módulos + 60 % examen final.
 *  · El admin lo ve todo abierto y sin esperas, para revisar el curso.
 */

export const ESPERA_TRAS_SUSPENSO_MS = 24 * 60 * 60 * 1000;
export const PESO_MODULOS = 0.4;
export const PESO_FINAL = 0.6;

/** Lo que se estima que tarda un examen. Cuenta en el cronograma. */
export const MINUTOS_EXAMEN_MODULO = 15;
export const MINUTOS_EXAMEN_FINAL = 30;

// ── Tipos de entrada ──────────────────────────────────────────────────────

export interface LeccionBase {
  id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  minutos: number;
  orden: number;
}

export interface ModuloBase {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string | null;
  nota_minima: number;
  preguntas_examen: number;
  lecciones: LeccionBase[];
}

export interface IntentoBase {
  id: string;
  modulo_id: string | null;
  estado: "abierto" | "entregado";
  nota: number | null;
  aprobado: boolean | null;
  created_at: string;
  entregado_at: string | null;
}

// ── Estado del alumno ─────────────────────────────────────────────────────

export type EstadoExamen =
  /** Faltan lecciones (o, en el final, módulos). */
  | { tipo: "bloqueado" }
  /** Se puede empezar ya. */
  | { tipo: "disponible"; intentosPrevios: number }
  /** Empezado y sin entregar: se retoma con las mismas preguntas. */
  | { tipo: "abierto"; intentoId: string }
  /** Suspendió hace menos de 24 h. */
  | { tipo: "espera"; disponibleEn: Date; ultimaNota: number }
  /** Aprobado. La nota es la del intento que aprobó. */
  | { tipo: "aprobado"; nota: number; intentoId: string };

export interface EstadoModulo {
  modulo: ModuloBase;
  desbloqueado: boolean;
  hechas: number;
  examen: EstadoExamen;
}

export interface EstadoCurso {
  modulos: EstadoModulo[];
  final: EstadoExamen;
  leccionesTotales: number;
  leccionesHechas: number;
  /** 0-100: lecciones y exámenes aprobados, ponderados por su duración. */
  porcentaje: number;
  /** La primera lección abierta y sin hacer, o el examen que toca. */
  siguiente: Siguiente | null;
}

export type Siguiente =
  | { tipo: "leccion"; slug: string; titulo: string; moduloOrden: number }
  | { tipo: "examen"; moduloOrden: number; titulo: string }
  | { tipo: "final" };

// `aprobado` lo graba el servidor al corregir, con la nota mínima que tenía
// el módulo en ese momento: aquí no se vuelve a comparar con la nota.
function estadoExamen(
  intentos: IntentoBase[],
  abierto: boolean,
  sinEsperas: boolean,
  ahora: number,
): EstadoExamen {
  const aprobado = intentos.find((i) => i.estado === "entregado" && i.aprobado);
  if (aprobado) return { tipo: "aprobado", nota: Number(aprobado.nota), intentoId: aprobado.id };
  if (!abierto) return { tipo: "bloqueado" };

  const enCurso = intentos.find((i) => i.estado === "abierto");
  if (enCurso) return { tipo: "abierto", intentoId: enCurso.id };

  const entregados = intentos
    .filter((i) => i.estado === "entregado" && i.entregado_at)
    .sort((a, b) => Date.parse(b.entregado_at!) - Date.parse(a.entregado_at!));
  const ultimo = entregados[0];
  if (ultimo && !sinEsperas) {
    const disponible = Date.parse(ultimo.entregado_at!) + ESPERA_TRAS_SUSPENSO_MS;
    if (disponible > ahora) {
      return { tipo: "espera", disponibleEn: new Date(disponible), ultimaNota: Number(ultimo.nota ?? 0) };
    }
  }
  return { tipo: "disponible", intentosPrevios: entregados.length };
}

export function estadoCurso(
  modulos: ModuloBase[],
  completadas: Set<string>,
  intentos: IntentoBase[],
  { esAdmin = false, ahora = Date.now() }: { esAdmin?: boolean; ahora?: number } = {},
): EstadoCurso {
  const ordenados = [...modulos].sort((a, b) => a.orden - b.orden);
  const estados: EstadoModulo[] = [];
  let anteriorAprobado = true;

  for (const modulo of ordenados) {
    const desbloqueado = esAdmin || anteriorAprobado;
    const hechas = modulo.lecciones.filter((l) => completadas.has(l.id)).length;
    const todasHechas = hechas === modulo.lecciones.length;
    const examen = estadoExamen(
      intentos.filter((i) => i.modulo_id === modulo.id),
      esAdmin || (desbloqueado && todasHechas),
      esAdmin,
      ahora,
    );
    estados.push({ modulo, desbloqueado, hechas, examen });
    anteriorAprobado = examen.tipo === "aprobado";
  }

  const todosAprobados = estados.every((e) => e.examen.tipo === "aprobado");
  const final = estadoExamen(
    intentos.filter((i) => i.modulo_id === null),
    esAdmin || todosAprobados,
    esAdmin,
    ahora,
  );

  const leccionesTotales = estados.reduce((t, e) => t + e.modulo.lecciones.length, 0);
  const leccionesHechas = estados.reduce((t, e) => t + e.hechas, 0);

  const total = minutosTotales(ordenados);
  const hecho = minutosHechos(estados, final, completadas);
  const porcentaje = total ? Math.min(100, Math.round((hecho / total) * 100)) : 0;

  return { modulos: estados, final, leccionesTotales, leccionesHechas, porcentaje, siguiente: siguientePaso(estados, final, completadas) };
}

function siguientePaso(estados: EstadoModulo[], final: EstadoExamen, completadas: Set<string>): Siguiente | null {
  for (const e of estados) {
    if (!e.desbloqueado) break;
    const pendiente = [...e.modulo.lecciones].sort((a, b) => a.orden - b.orden).find((l) => !completadas.has(l.id));
    if (pendiente) return { tipo: "leccion", slug: pendiente.slug, titulo: pendiente.titulo, moduloOrden: e.modulo.orden };
    if (e.examen.tipo !== "aprobado") return { tipo: "examen", moduloOrden: e.modulo.orden, titulo: e.modulo.titulo };
  }
  if (final.tipo !== "aprobado" && final.tipo !== "bloqueado") return { tipo: "final" };
  return null;
}

/** ¿Puede el alumno abrir esta lección? La misma regla para la página y la API. */
export function leccionAbierta(estado: EstadoCurso, leccionId: string): boolean {
  return estado.modulos.some((e) => e.desbloqueado && e.modulo.lecciones.some((l) => l.id === leccionId));
}

// ── Puntuación ────────────────────────────────────────────────────────────

/**
 * Nota de 0 a 10. Cada acierto suma 1 y cada fallo resta `1 / (opciones − 1)`,
 * de modo que contestar al azar da de media un 0 sea cual sea el número de
 * opciones de cada pregunta. Nunca baja de 0. Todas las preguntas tienen que
 * venir contestadas: quien llama lo comprueba antes.
 */
export function puntuar(
  preguntas: { id: string; opciones: number; correcta: number }[],
  respuestas: Record<string, number>,
): { nota: number; aciertos: number; fallos: number } {
  let puntos = 0;
  let aciertos = 0;
  let fallos = 0;
  for (const p of preguntas) {
    if (respuestas[p.id] === p.correcta) {
      puntos += 1;
      aciertos += 1;
    } else {
      puntos -= 1 / Math.max(1, p.opciones - 1);
      fallos += 1;
    }
  }
  const nota = preguntas.length ? Math.max(0, (puntos / preguntas.length) * 10) : 0;
  return { nota: Math.round(nota * 100) / 100, aciertos, fallos };
}

/** 40 % la media de los módulos + 60 % el final, con dos decimales. */
export function notaCertificado(notasModulos: number[], notaFinal: number) {
  const media = notasModulos.length ? notasModulos.reduce((t, n) => t + n, 0) / notasModulos.length : 0;
  const final = PESO_MODULOS * media + PESO_FINAL * notaFinal;
  return {
    notaModulos: Math.round(media * 100) / 100,
    notaFinal: Math.round(final * 100) / 100,
  };
}

/** «7,45». Las notas se escriben con coma, como en un boletín español. */
export function formatoNota(nota: number): string {
  return nota.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

// ── Cronograma ────────────────────────────────────────────────────────────

const DIA_MS = 24 * 60 * 60 * 1000;

export function minutosTotales(modulos: ModuloBase[]): number {
  const lecciones = modulos.reduce((t, m) => t + m.lecciones.reduce((s, l) => s + l.minutos, 0), 0);
  return lecciones + modulos.length * MINUTOS_EXAMEN_MODULO + MINUTOS_EXAMEN_FINAL;
}

/**
 * Minutos ya hechos: las lecciones completadas —por id, no por posición, que
 * dentro de un módulo se hacen en cualquier orden— más los exámenes aprobados.
 */
function minutosHechos(estados: EstadoModulo[], final: EstadoExamen, completadas: Set<string>): number {
  const lecciones = estados.reduce(
    (t, e) => t + e.modulo.lecciones.filter((l) => completadas.has(l.id)).reduce((s, l) => s + l.minutos, 0),
    0,
  );
  const examenes = estados.filter((e) => e.examen.tipo === "aprobado").length * MINUTOS_EXAMEN_MODULO;
  return lecciones + examenes + (final.tipo === "aprobado" ? MINUTOS_EXAMEN_FINAL : 0);
}

export interface Cronograma {
  minutosTotales: number;
  minutosHechos: number;
  minutosRestantes: number;
  /** Positivo: va adelantado. Negativo: va retrasado. En días. */
  desfaseDias: number;
  finPlaneado: Date;
  /** Con su ritmo real si ya lleva una semana; con el elegido si no. */
  finEstimado: Date;
  /** Fecha prevista para terminar cada módulo (examen incluido), por orden. */
  hitos: { moduloOrden: number; fecha: Date }[];
}

export function cronograma(
  modulos: ModuloBase[],
  completadas: Set<string>,
  estado: EstadoCurso,
  { inicio, minutosSemana, ahora = Date.now() }: { inicio: string; minutosSemana: number; ahora?: number },
): Cronograma {
  const ordenados = [...modulos].sort((a, b) => a.orden - b.orden);
  const porDia = minutosSemana / 7;
  const t0 = Date.parse(inicio);

  const total = minutosTotales(ordenados);
  const hecho = minutosHechos(estado.modulos, estado.final, completadas);
  const restantes = Math.max(0, total - hecho);

  const dias = Math.max(0, (ahora - t0) / DIA_MS);
  const previsto = Math.min(total, dias * porDia);
  const desfaseDias = Math.round((hecho - previsto) / porDia);

  // Con menos de una semana el ritmo real dice poco: un buen primer día
  // proyectaría un final irreal. A partir de ahí manda lo que hace de verdad.
  const ritmoReal = dias >= 7 && hecho > 0 ? hecho / dias : porDia;
  const finEstimado = new Date(ahora + (restantes / ritmoReal) * DIA_MS);
  const finPlaneado = new Date(t0 + (total / porDia) * DIA_MS);

  let acumulado = 0;
  const hitos = ordenados.map((m) => {
    acumulado += m.lecciones.reduce((s, l) => s + l.minutos, 0) + MINUTOS_EXAMEN_MODULO;
    return { moduloOrden: m.orden, fecha: new Date(t0 + (acumulado / porDia) * DIA_MS) };
  });

  return { minutosTotales: total, minutosHechos: hecho, minutosRestantes: restantes, desfaseDias, finPlaneado, finEstimado, hitos };
}

/** «3 h 20 min», «45 min». */
export function duracion(minutos: number): string {
  const redondo = Math.round(minutos);
  const h = Math.floor(redondo / 60);
  const m = redondo % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** «12 de noviembre de 2026». Formatea desde la fecha, sin releer texto. */
export function fechaLarga(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(d);
}
