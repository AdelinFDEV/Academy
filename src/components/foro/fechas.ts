/**
 * Las fechas del foro, siempre en hora de Madrid (el público es español) y
 * escritas con `Intl`, que da el mismo texto en el servidor y en el navegador.
 */
const CORTA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" });
const LARGA = new Intl.DateTimeFormat("es-ES", {
  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
});

/** «12 nov 2026». */
export const fechaCorta = (iso: string) => CORTA.format(new Date(iso));
/** «12 de noviembre de 2026, 18:30», para el atributo `title`. */
export const fechaLarga = (iso: string) => LARGA.format(new Date(iso));
