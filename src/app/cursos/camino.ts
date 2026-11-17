import type { EstadoCurso, EstadoExamen, ModuloBase } from "@/lib/cursos-progreso";

/**
 * EL CAMINO de un curso (estilo «Cuaderno de estudio», 17-11-2026): las
 * paradas que pintan la ficha (`/cursos/<slug>`) y la tarjeta del catálogo.
 * Referencia: «El camino de un curso» en disenos/sistema.html.
 *
 *   módulo → examen del módulo → módulo → … → examen final → certificado
 *
 * Cada parada tiene un estado de nodo, con el significado del sistema:
 *  · `hecho`   (menta): lecciones del módulo completadas, o examen aprobado.
 *  · `actual`  (naranja que late): por donde va el alumno. Sin progreso, el
 *    primer módulo: «empieza aquí».
 *  · `abierto` : se puede hacer ya, pero no es lo siguiente (el admin, que lo
 *    ve todo abierto, o un examen ya disponible).
 *  · `espera`  : examen suspendido; se repite pasadas 24 h.
 *  · `bloq`    (gris; los exámenes siguen lila): aún no se abre.
 *
 * No decide nada: traduce `estadoCurso()` (cursos-progreso.ts), la misma regla
 * que usa el aula. Si cambia una regla, cambia allí y esto la sigue.
 */

export type EstadoNodo = "hecho" | "actual" | "abierto" | "espera" | "bloq";

export interface ParadaExamen {
  nodo: EstadoNodo;
  /** La nota con la que se aprobó. */
  nota: number | null;
  /** Suspendido: cuándo se puede repetir y la nota que sacó. */
  espera: { disponibleEn: Date; ultimaNota: number } | null;
}

export interface ParadaModulo {
  modulo: ModuloBase;
  nodo: EstadoNodo;
  /** Lecciones completadas. `null` sin progreso. */
  hechas: number | null;
  examen: ParadaExamen;
}

export interface Camino {
  conProgreso: boolean;
  modulos: ParadaModulo[];
  final: ParadaExamen;
  meta: "hecho" | "bloq";
}

function paradaExamen(e: EstadoExamen, esLoSiguiente: boolean): ParadaExamen {
  if (e.tipo === "aprobado") return { nodo: "hecho", nota: e.nota, espera: null };
  // La espera va antes que «lo siguiente»: un examen suspendido sigue siendo
  // el siguiente paso, pero hoy no se puede hacer.
  if (e.tipo === "espera") return { nodo: "espera", nota: null, espera: { disponibleEn: e.disponibleEn, ultimaNota: e.ultimaNota } };
  if (esLoSiguiente) return { nodo: "actual", nota: null, espera: null };
  if (e.tipo === "disponible" || e.tipo === "abierto") return { nodo: "abierto", nota: null, espera: null };
  return { nodo: "bloq", nota: null, espera: null };
}

const SIN_HACER: ParadaExamen = { nodo: "bloq", nota: null, espera: null };

/**
 * Las paradas del camino. Sin `progreso` (sin sesión o sin empezar), el camino
 * del curso tal cual: el primer módulo late y el resto espera.
 */
export function caminoDe(modulos: ModuloBase[], progreso: EstadoCurso | null, conCertificado: boolean): Camino {
  if (!progreso) {
    return {
      conProgreso: false,
      modulos: modulos.map((m, i) => ({ modulo: m, nodo: i === 0 ? "actual" : "bloq", hechas: null, examen: SIN_HACER })),
      final: SIN_HACER,
      meta: conCertificado ? "hecho" : "bloq",
    };
  }

  const sig = progreso.siguiente;
  const porId = new Map(progreso.modulos.map((e) => [e.modulo.id, e]));

  return {
    conProgreso: true,
    modulos: modulos.map((m) => {
      const e = porId.get(m.id);
      if (!e) return { modulo: m, nodo: "bloq", hechas: 0, examen: SIN_HACER };
      const todas = m.lecciones.length > 0 && e.hechas === m.lecciones.length;
      const leccionSiguiente = sig?.tipo === "leccion" && sig.moduloOrden === m.orden;
      const examenSiguiente = sig?.tipo === "examen" && sig.moduloOrden === m.orden;
      const nodo: EstadoNodo = todas || e.examen.tipo === "aprobado"
        ? "hecho"
        : leccionSiguiente
          ? "actual"
          : e.desbloqueado
            ? "abierto"
            : "bloq";
      return { modulo: m, nodo, hechas: e.hechas, examen: paradaExamen(e.examen, examenSiguiente) };
    }),
    final: paradaExamen(progreso.final, sig?.tipo === "final"),
    meta: conCertificado ? "hecho" : "bloq",
  };
}

/** «18 de noviembre, 14:30», en hora de España. Formatea desde la fecha, sin releer texto. */
export function cuandoRepetir(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(d);
}

/** «5», «7,5»: la nota mínima tal como la escribe la ficha. */
export function notaCorta(n: number): string {
  return String(n).replace(".", ",");
}
