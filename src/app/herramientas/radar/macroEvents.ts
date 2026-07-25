// Eventos macro de EE. UU. de alto impacto para cripto: SOLO inflación (IPC,
// PCE, IPP) y tipos de interés (FOMC). Se conocen con antelación, así que se
// mantienen a mano aquí — sin depender de APIs de pago ni scraping frágil.
//
// ⚠️  MANTENIMIENTO: al cerrar el año, añadir el calendario del siguiente.
//   · FOMC: fechas oficiales de la Reserva Federal (decisión el 2.º día, 14:00 ET).
//     https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
//   · IPC (CPI): calendario del BLS (~2.ª semana del mes, 08:30 ET).
//     https://www.bls.gov/schedule/news_release/cpi.htm
//   · PCE (indicador preferido de la Fed): calendario del BEA (~fin de mes, 08:30 ET).
//     https://www.bea.gov/news/schedule
//   · IPP (PPI): calendario del BLS (cerca del IPC, 08:30 ET).
//     https://www.bls.gov/schedule/news_release/ppi.htm
//   Los eventos pasados se filtran solos: basta con ir añadiendo los nuevos.

export type MacroKind = "rates" | "inflation";
export type MacroSeries = "fomc" | "cpi" | "pce" | "ppi";

export interface MacroEvent {
  /** Fecha de la publicación/decisión en EE. UU. (YYYY-MM-DD). */
  date: string;
  /** Hora oficial de publicación, en horario del Este de EE. UU. */
  timeET: string;
  kind: MacroKind;
  series: MacroSeries;
  title: string;
  detail: string;
}

export const MACRO_EVENTS: MacroEvent[] = [
  // ── Tipos de interés — decisiones del FOMC (Reserva Federal) 2026 ──
  { date: "2026-01-28", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de enero de la Reserva Federal" },
  { date: "2026-03-18", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de marzo · con proyecciones económicas (dot plot)" },
  { date: "2026-04-29", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de abril de la Reserva Federal" },
  { date: "2026-06-17", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de junio · con proyecciones económicas (dot plot)" },
  { date: "2026-07-29", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de julio de la Reserva Federal" },
  { date: "2026-09-16", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de septiembre · con proyecciones económicas (dot plot)" },
  { date: "2026-10-28", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de octubre de la Reserva Federal" },
  { date: "2026-12-09", timeET: "14:00 ET", kind: "rates", series: "fomc", title: "Decisión de tipos de interés (FOMC)", detail: "Reunión de diciembre · con proyecciones económicas (dot plot)" },

  // ── Inflación — IPC (CPI) de EE. UU. 2026 ──
  { date: "2026-07-14", timeET: "08:30 ET", kind: "inflation", series: "cpi", title: "IPC de EE. UU. (inflación)", detail: "Dato de junio de 2026" },
  { date: "2026-08-12", timeET: "08:30 ET", kind: "inflation", series: "cpi", title: "IPC de EE. UU. (inflación)", detail: "Dato de julio de 2026" },
  { date: "2026-09-09", timeET: "08:30 ET", kind: "inflation", series: "cpi", title: "IPC de EE. UU. (inflación)", detail: "Dato de agosto de 2026" },
  { date: "2026-10-14", timeET: "08:30 ET", kind: "inflation", series: "cpi", title: "IPC de EE. UU. (inflación)", detail: "Dato de septiembre de 2026" },
  { date: "2026-11-12", timeET: "08:30 ET", kind: "inflation", series: "cpi", title: "IPC de EE. UU. (inflación)", detail: "Dato de octubre de 2026" },
  { date: "2026-12-10", timeET: "08:30 ET", kind: "inflation", series: "cpi", title: "IPC de EE. UU. (inflación)", detail: "Dato de noviembre de 2026" },

  // ── Inflación — PCE, el indicador preferido de la Reserva Federal (BEA) 2026 ──
  { date: "2026-07-30", timeET: "08:30 ET", kind: "inflation", series: "pce", title: "PCE de EE. UU. (inflación de la Fed)", detail: "Indicador preferido de la Fed · dato de junio de 2026" },
  { date: "2026-08-26", timeET: "08:30 ET", kind: "inflation", series: "pce", title: "PCE de EE. UU. (inflación de la Fed)", detail: "Indicador preferido de la Fed · dato de julio de 2026" },
  { date: "2026-09-30", timeET: "08:30 ET", kind: "inflation", series: "pce", title: "PCE de EE. UU. (inflación de la Fed)", detail: "Indicador preferido de la Fed · dato de agosto de 2026" },
  { date: "2026-10-29", timeET: "08:30 ET", kind: "inflation", series: "pce", title: "PCE de EE. UU. (inflación de la Fed)", detail: "Indicador preferido de la Fed · dato de septiembre de 2026" },
  { date: "2026-11-25", timeET: "08:30 ET", kind: "inflation", series: "pce", title: "PCE de EE. UU. (inflación de la Fed)", detail: "Indicador preferido de la Fed · dato de octubre de 2026" },
  { date: "2026-12-23", timeET: "08:30 ET", kind: "inflation", series: "pce", title: "PCE de EE. UU. (inflación de la Fed)", detail: "Indicador preferido de la Fed · dato de noviembre de 2026" },

  // ── Inflación — IPP (precios de producción / PPI, inflación mayorista) del BLS 2026 ──
  { date: "2026-08-13", timeET: "08:30 ET", kind: "inflation", series: "ppi", title: "IPP de EE. UU. (precios de producción)", detail: "Inflación mayorista · dato de julio de 2026" },
  { date: "2026-09-10", timeET: "08:30 ET", kind: "inflation", series: "ppi", title: "IPP de EE. UU. (precios de producción)", detail: "Inflación mayorista · dato de agosto de 2026" },
  { date: "2026-10-15", timeET: "08:30 ET", kind: "inflation", series: "ppi", title: "IPP de EE. UU. (precios de producción)", detail: "Inflación mayorista · dato de septiembre de 2026" },
  { date: "2026-11-13", timeET: "08:30 ET", kind: "inflation", series: "ppi", title: "IPP de EE. UU. (precios de producción)", detail: "Inflación mayorista · dato de octubre de 2026" },
  { date: "2026-12-15", timeET: "08:30 ET", kind: "inflation", series: "ppi", title: "IPP de EE. UU. (precios de producción)", detail: "Inflación mayorista · dato de noviembre de 2026" },
];

// Explicación breve de cada dato — fuente única para la mini-sección educativa
// del Radar. `highlight` marca el PCE como el de mayor peso para la Fed.
export interface SeriesInfo {
  short: string;
  name: string;
  what: string;
  why: string;
  highlight?: boolean;
}

export const SERIES_INFO: Record<MacroSeries, SeriesInfo> = {
  fomc: {
    short: "FOMC",
    name: "Decisión de tipos de la Fed",
    what: "La reunión del comité de la Reserva Federal donde se fija el tipo de interés oficial de EE. UU.",
    why: "Los tipos marcan el precio del dinero. Cuando suben, los activos de riesgo como cripto suelen sufrir; cuando bajan, tienden a subir. Es el evento macro que más mueve el mercado.",
  },
  cpi: {
    short: "IPC",
    name: "Índice de Precios al Consumo (CPI)",
    what: "Mide cuánto suben los precios que paga el consumidor (la cesta de la compra) respecto al año anterior.",
    why: "Es el termómetro de inflación más seguido. Si sale más alto de lo esperado, la Fed tiende a mantener los tipos altos (presión para cripto); si baja, da alivio al mercado.",
  },
  pce: {
    short: "PCE",
    name: "Gasto en Consumo Personal (PCE)",
    what: "Otra medida de la inflación del consumo, calculada por el BEA. La versión subyacente (core) excluye alimentos y energía.",
    why: "Es el indicador de inflación PREFERIDO de la Reserva Federal: es el que usa para su objetivo del 2%. Por eso pesa aún más que el IPC en las decisiones de tipos.",
    highlight: true,
  },
  ppi: {
    short: "IPP",
    name: "Índice de Precios de Producción (PPI)",
    what: "Mide la inflación mayorista: los precios que reciben las fábricas y productores, antes de llegar a la tienda.",
    why: "Se adelanta al IPC y al PCE (lo que sube en fábrica acaba en el consumidor), así que ayuda a anticipar hacia dónde va la inflación.",
  },
};
