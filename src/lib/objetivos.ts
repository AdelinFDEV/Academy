/**
 * Objetivos, plan de contenido y diario del negocio (/admin/objetivos).
 *
 * Este archivo es PURO —tipos, etiquetas, fechas, periodos y ritmo— porque lo
 * importan también los componentes de cliente. Lo que consulta la base de
 * datos vive en objetivosServidor.ts.
 *
 * Las tablas son solo del admin y solo se tocan desde el servidor con la clave
 * de servicio: ver scripts/create-objetivos.sql.
 */

/**
 * Cómo se mide cada objetivo. Las de `flujo` se cuentan dentro del periodo
 * («4 vídeos este mes»); las de `nivel` son un total que se quiere alcanzar
 * («llegar a 500 miembros»), y su avance se mide desde donde empezó el periodo.
 */
export const METRICAS = {
  manual: { texto: "Lo cuento yo", emoji: "✍️", grupo: "yo", tipo: "flujo", ayuda: "Para lo que la web no puede medir: grabar, entrenar, llamar a alguien… Lo sumas tú con el botón +1." },
  entradas: { texto: "Entradas publicadas", emoji: "📝", grupo: "auto", tipo: "flujo", ayuda: "Cuenta sola las entradas que publicas en la web dentro del periodo." },
  videos: { texto: "Vídeos de YouTube", emoji: "🎬", grupo: "auto", tipo: "flujo", ayuda: "Cuenta solos los vídeos largos que el bot anuncia en el canal." },
  registros: { texto: "Registros nuevos", emoji: "👤", grupo: "auto", tipo: "flujo", ayuda: "Cuenta sola las cuentas nuevas en la web, sin administradores." },
  premium: { texto: "Altas Premium", emoji: "👑", grupo: "auto", tipo: "flujo", ayuda: "Cuenta sola la gente que se hace Premium dentro del periodo." },
  ingresos: { texto: "Ingresos Premium", emoji: "💶", grupo: "auto", tipo: "flujo", ayuda: "Euros estimados como en la pestaña Premium: una cuota mensual por suscriptor." },
  miembros_telegram: { texto: "Miembros en Telegram", emoji: "📣", grupo: "auto", tipo: "nivel", ayuda: "Un total a alcanzar en el canal gratuito. Sale de la foto diaria de las 04:00." },
  suscriptores_youtube: { texto: "Suscriptores de YouTube", emoji: "▶️", grupo: "auto", tipo: "nivel", ayuda: "Un total a alcanzar. Se fotografía cada día a las 04:00 con la clave de YouTube." },
} as const;
export type Metrica = keyof typeof METRICAS;

export const REPETICIONES = { no: "Una sola vez", semanal: "Cada semana", mensual: "Cada mes" } as const;
export const REPETICION_EMOJI = { no: "🎯", semanal: "🔁", mensual: "📅" } as const;
export type Repeticion = keyof typeof REPETICIONES;

export const CANALES = { youtube: "YouTube", web: "Web", telegram: "Telegram" } as const;
export type Canal = keyof typeof CANALES;
export const CANAL_EMOJI = { youtube: "▶️", web: "🌐", telegram: "✈️" } as const;

export const TIPOS = {
  video: "Vídeo",
  short: "Short",
  entrada: "Entrada",
  guia: "Guía",
  publicacion: "Publicación",
} as const;
export type Tipo = keyof typeof TIPOS;
export const TIPO_EMOJI = { video: "🎬", short: "⚡", entrada: "📝", guia: "📚", publicacion: "📣" } as const;

/** En orden: es el camino que recorre una pieza hasta salir. */
export const ESTADOS = {
  idea: "Idea",
  guion: "Guion",
  grabado: "Grabado",
  editado: "Editado",
  programado: "Programado",
  publicado: "Publicado",
} as const;
export type Estado = keyof typeof ESTADOS;
export const ESTADO_EMOJI = { idea: "💡", guion: "✍️", grabado: "🎙️", editado: "✂️", programado: "⏰", publicado: "✅" } as const;

export const ANIMOS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"] as const;
/** Pedidos expresamente por el admin para el diario: solo en /admin/objetivos, nunca en la web pública. */
export const ANIMO_EMOJI = ["😞", "😕", "😐", "🙂", "😄"] as const;

/**
 * La palabra que matiza el ánimo. Opcional, y separada de la cifra a propósito:
 * la cifra se promedia, la emoción se cuenta. Un 2 «cansado» y un 2 «frustrado»
 * piden cosas distintas.
 */
export const EMOCIONES = {
  ilusionado: "Ilusionado",
  motivado: "Motivado",
  orgulloso: "Orgulloso",
  tranquilo: "Tranquilo",
  agradecido: "Agradecido",
  cansado: "Cansado",
  estresado: "Estresado",
  inseguro: "Inseguro",
  frustrado: "Frustrado",
  desmotivado: "Desmotivado",
} as const;
export type Emocion = keyof typeof EMOCIONES;
export const EMOCION_EMOJI: Record<Emocion, string> = {
  ilusionado: "✨", motivado: "🔥", orgulloso: "🏆", tranquilo: "😌", agradecido: "🙏",
  cansado: "😴", estresado: "😰", inseguro: "🤔", frustrado: "😤", desmotivado: "🫠",
};

export type Objetivo = {
  id: string;
  titulo: string;
  metrica: Metrica;
  meta: number;
  repeticion: Repeticion;
  desde: string;
  /** Vacío solo en los que se repiten: sin fin. */
  hasta: string | null;
  notas: string | null;
  archivado: boolean;
};

export type Pieza = {
  id: string;
  fecha: string | null;
  canal: Canal;
  tipo: Tipo;
  titulo: string;
  estado: Estado;
  enlace: string | null;
  notas: string | null;
};

export type Nota = {
  id: string;
  fecha: string;
  texto: string;
  animo: number | null;
  emocion: Emocion | null;
  objetivo_id: string | null;
  ancla: boolean;
  created_at: string;
};

/** Cómo va un objetivo respecto al ritmo que necesita. */
export type Ritmo = "cumplido" | "adelantado" | "en-ritmo" | "retrasado" | "fallido" | "pendiente";

/** Un tramo de tiempo de un objetivo: el único si no se repite, o una semana o un mes. */
export type Periodo = { desde: string; hasta: string };

/** Un periodo ya cerrado, con lo que se consiguió. */
export type PeriodoCerrado = Periodo & { valor: number; cumplido: boolean };

export type ObjetivoConProgreso = Objetivo & {
  /** El periodo que se está midiendo ahora (o el último, si el objetivo ya acabó). */
  periodo: Periodo;
  actual: number;
  /** En las de nivel, el valor con que empezó el periodo; en las de flujo, 0. */
  base: number;
  /** Lo que debería llevar hoy si avanzara a ritmo constante. */
  esperado: number;
  ritmo: Ritmo;
  /** Periodos anteriores ya cerrados, del más antiguo al más reciente (hasta 6). */
  historial: PeriodoCerrado[];
};

const DIA = 24 * 60 * 60 * 1000;

/**
 * El día "AAAA-MM-DD" en que cae un instante, en la hora de RUMANÍA.
 *
 * No en UTC: entre las 00:00 y las 03:00 de Rumanía, UTC todavía va por el día
 * anterior, y el diario se escribe sobre todo de noche. Con UTC, una nota de
 * la una de la madrugada se guardaba con la fecha de ayer y rompía la racha.
 *
 * `formatToParts` y no `new Date(x.toLocaleString(…))`, que relee la fecha en
 * la zona de la máquina (CODIGO.md). «en-CA» da directamente AAAA-MM-DD.
 */
export function diaRumania(instante: Date | string | number = Date.now()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instante));
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

/**
 * El instante en que empieza el día `fecha` en Rumanía (UTC+2 en invierno,
 * UTC+3 en verano). El cambio de hora es de madrugada, nunca a medianoche, así
 * que basta con leer el desfase de ese mismo día.
 */
export function medianocheRumania(fecha: string): Date {
  const aprox = Date.parse(`${fecha}T00:00:00Z`);
  const desfase = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Bucharest", timeZoneName: "shortOffset" })
    .formatToParts(new Date(aprox))
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT+2";
  const horas = Number(desfase.replace("GMT", "") || "0");
  return new Date(aprox - horas * 60 * 60 * 1000);
}

/** "AAAA-MM-DD" de hoy, en la hora de Rumanía. */
export function hoyISO(ahora = Date.now()): string {
  return diaRumania(ahora);
}

export function sumarDiasISO(fecha: string, dias: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * DIA).toISOString().slice(0, 10);
}

/** Inicio y fin del periodo como instantes UTC, de medianoche a medianoche de Rumanía. */
export function instantes(p: Periodo): { ini: string; fin: string } {
  return {
    ini: medianocheRumania(p.desde).toISOString(),
    fin: medianocheRumania(sumarDiasISO(p.hasta, 1)).toISOString(),
  };
}

/** La semana (lunes a domingo) o el mes natural que contiene `fecha`. */
function periodoQueContiene(fecha: string, repeticion: "semanal" | "mensual"): Periodo {
  if (repeticion === "mensual") {
    const [a, m] = fecha.split("-").map(Number);
    return {
      desde: `${fecha.slice(0, 7)}-01`,
      hasta: new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10),
    };
  }
  const diaSemana = (new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7; // lunes = 0
  const lunes = sumarDiasISO(fecha, -diaSemana);
  return { desde: lunes, hasta: sumarDiasISO(lunes, 6) };
}

/**
 * El periodo que se mide ahora y los anteriores ya cerrados (hasta `cuantos`).
 *
 * - Una sola vez: su único periodo; sin historial.
 * - Que se repite: la semana o el mes de hoy, sin empezar antes del de `desde`
 *   ni pasar del de `hasta` si lo tiene. Antes de empezar, el primero; una vez
 *   acabado, el último.
 */
export function periodosDe(o: Objetivo, hoy: string, cuantos = 6): { actual: Periodo; anteriores: Periodo[] } {
  if (o.repeticion === "no") {
    return { actual: { desde: o.desde, hasta: o.hasta ?? o.desde }, anteriores: [] };
  }
  const primero = periodoQueContiene(o.desde, o.repeticion);
  const ultimo = o.hasta ? periodoQueContiene(o.hasta, o.repeticion) : null;

  let actual = periodoQueContiene(hoy, o.repeticion);
  if (actual.desde < primero.desde) actual = primero;
  if (ultimo && actual.desde > ultimo.desde) actual = ultimo;

  const anteriores: Periodo[] = [];
  let cursor = actual;
  while (anteriores.length < cuantos) {
    const previo = periodoQueContiene(sumarDiasISO(cursor.desde, -1), o.repeticion);
    if (previo.desde < primero.desde) break;
    anteriores.unshift(previo);
    cursor = previo;
  }
  return { actual, anteriores };
}

/**
 * El ritmo: compara lo que lleva con lo que llevaría avanzando parejo.
 *
 * Ir al 40 % a mitad de periodo es ir bien; ir al 40 % el penúltimo día, no.
 * Un margen del 10 % del camino separa «en ritmo» de «adelantado/retrasado»,
 * para que una sola pieza de más o de menos no cambie el color cada día.
 *
 * En las de nivel el camino va de `base` (donde empezó el periodo) a la meta;
 * en las de flujo, de 0 a la meta.
 */
export function calcularRitmo(meta: number, base: number, actual: number, periodo: Periodo, ahora = Date.now()) {
  const { ini: iniIso, fin: finIso } = instantes(periodo);
  const ini = Date.parse(iniIso);
  const fin = Date.parse(finIso);
  const fraccion = Math.min(1, Math.max(0, (ahora - ini) / (fin - ini)));
  const camino = Math.max(0, meta - base);
  const esperado = base + camino * fraccion;
  const margen = Math.max(camino, 1) * 0.1;

  let ritmo: Ritmo;
  if (actual >= meta) ritmo = "cumplido";
  else if (ahora >= fin) ritmo = "fallido";
  else if (ahora < ini) ritmo = "pendiente";
  else if (actual >= esperado + margen) ritmo = "adelantado";
  else if (actual >= esperado - margen) ritmo = "en-ritmo";
  else ritmo = "retrasado";

  return { esperado, ritmo };
}

/**
 * Cómo pintar una pieza del calendario.
 *
 * - hecha:     publicada
 * - vencida:   su día ya pasó y no se publicó
 * - en-riesgo: sale hoy o en los dos próximos días y sigue en idea o guion
 * - en-curso:  todo lo demás
 */
export function estadoPieza(p: Pieza, hoy: string): "hecha" | "vencida" | "en-riesgo" | "en-curso" {
  if (p.estado === "publicado") return "hecha";
  if (!p.fecha) return "en-curso";
  if (p.fecha < hoy) return "vencida";
  const dias = (Date.parse(`${p.fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA;
  if (dias <= 2 && (p.estado === "idea" || p.estado === "guion")) return "en-riesgo";
  return "en-curso";
}

