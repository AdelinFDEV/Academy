/**
 * Formateo de fechas visibles, siempre en la zona horaria de España.
 *
 * **El problema que resuelve.** `new Date(x).toLocaleDateString("es-ES", …)` sin
 * `timeZone` no formatea en España: formatea en la zona de **la máquina que
 * renderiza**. En el servidor eso es UTC; en un componente de cliente, la zona
 * del visitante. Resultado: una entrada publicada a las 00:30 hora española sale
 * con la fecha del día anterior para media Europa, y con dos fechas distintas
 * según quién mire.
 *
 * Se detectó el 31-08-2026 comparando el HTML de las entradas entre una máquina
 * en Rumanía y el servidor: «26 de julio» aquí, «25 de julio» allí. Es primo
 * hermano del fallo del Radar que ya documenta `AGENTS.md`, aunque menos grave:
 * aquí se pasa el instante correcto y solo se le dice mal la zona en la que
 * mostrarlo, mientras que allí la fecha se releía desde texto.
 *
 * Fijar `timeZone` la ancla a España, que es donde está el público del sitio, y
 * la hace idéntica para todo el mundo.
 */

/** Zona del público del sitio. Se aplica a toda fecha que ve un visitante. */
export const ZONA = "Europe/Madrid";

/** «31 de agosto de 2026» — para la cabecera de una entrada. */
export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
  });
}

/** «31 ago 2026» — para listados y tarjetas, donde el espacio manda. */
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ZONA,
  });
}
