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
  manual: { texto: "Lo cuento yo", emoji: "✍️", grupo: "yo", tipo: "flujo", ayuda: "Veces que haces algo: grabar, escribir un guion, cerrar una colaboración… Lo sumas tú con el botón +1." },
  marca: { texto: "Una cifra que apunto yo", emoji: "📏", grupo: "yo", tipo: "nivel", ayuda: "Un número que apuntas cada vez: seguidores en X, saldo de la cuenta de trading, visitas del mes… Si la meta es menor que donde empiezas, el objetivo es bajar." },
  entradas: { texto: "Entradas publicadas", emoji: "📝", grupo: "auto", tipo: "flujo", ayuda: "Cuenta sola las entradas que publicas en la web dentro del periodo." },
  videos: { texto: "Vídeos de YouTube", emoji: "🎬", grupo: "auto", tipo: "flujo", ayuda: "Cuenta solos los vídeos largos que el bot anuncia en el canal." },
  registros: { texto: "Registros nuevos", emoji: "👤", grupo: "auto", tipo: "flujo", ayuda: "Cuenta sola las cuentas nuevas en la web, sin administradores." },
  premium: { texto: "Altas Premium", emoji: "👑", grupo: "auto", tipo: "flujo", ayuda: "Cuenta sola la gente que se hace Premium dentro del periodo." },
  ingresos: { texto: "Ingresos Premium", emoji: "💶", grupo: "auto", tipo: "flujo", ayuda: "Euros estimados como en la pestaña Premium: una cuota mensual por suscriptor." },
  miembros_telegram: { texto: "Miembros en Telegram", emoji: "📣", grupo: "auto", tipo: "nivel", ayuda: "Un total a alcanzar en el canal gratuito. Sale de la foto diaria de las 04:00." },
  suscriptores_youtube: { texto: "Suscriptores de YouTube", emoji: "▶️", grupo: "auto", tipo: "nivel", ayuda: "Un total a alcanzar. Se fotografía cada día a las 04:00 con la clave de YouTube." },
} as const;
export type Metrica = keyof typeof METRICAS;

/**
 * Ámbito de un objetivo. El panel se centra SOLO en el negocio (dinero,
 * crecimiento y contenido) desde el 05-10-2026: la interfaz ya no ofrece
 * «personal». Se mantiene el tipo porque la columna existe en la base.
 */
export const AMBITOS = { negocio: "Negocio", personal: "Personal" } as const;
export type Ambito = keyof typeof AMBITOS;

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

/**
 * De qué va una nota del diario. El diario se centra en el negocio: dinero,
 * crecimiento y gestión del contenido. Nada personal (decidido el 05-10-2026).
 */
export const ETIQUETAS = {
  dinero: { texto: "Dinero", emoji: "💶" },
  crecimiento: { texto: "Crecimiento", emoji: "📈" },
  contenido: { texto: "Contenido", emoji: "🎬" },
} as const;
export type Etiqueta = keyof typeof ETIQUETAS;

/**
 * Qué te ha afectado y qué te ha motivado, marcado en cada nota del diario.
 * Listas cerradas a propósito: son las que se pueden contar y cruzar con el
 * ánimo para saber qué pesa más. Casi todo es del negocio; apariencia,
 * familia y vida amorosa están porque también mueven el ánimo con el que
 * trabajas. Las claves se guardan en la base: no se renombran.
 */
export const FACTORES_NEGATIVOS = {
  pocos_ingresos: { texto: "Pocos ingresos", emoji: "💸" },
  poco_crecimiento: { texto: "Crecer despacio", emoji: "🐢" },
  contenido_flojo: { texto: "Contenido que no funciona", emoji: "📉" },
  sin_tiempo: { texto: "Falta de tiempo", emoji: "⏳" },
  cansancio: { texto: "Cansancio", emoji: "😮‍💨" },
  procrastinar: { texto: "Procrastinar", emoji: "🛋️" },
  comparacion: { texto: "Compararme con otros", emoji: "👀" },
  mercado_bajista: { texto: "Mercado bajista", emoji: "🐻" },
  criticas: { texto: "Críticas o comentarios", emoji: "💬" },
  tecnico: { texto: "Problemas técnicos", emoji: "🛠️" },
  incertidumbre: { texto: "Incertidumbre", emoji: "🌫️" },
  apariencia: { texto: "Apariencia personal", emoji: "🪞" },
  familia: { texto: "Familia", emoji: "👨‍👩‍👧" },
  amor: { texto: "Vida amorosa", emoji: "❤️" },
} as const;
export type Negativo = keyof typeof FACTORES_NEGATIVOS;

export const FACTORES_MOTIVOS = {
  dinero: { texto: "Ganar dinero", emoji: "💶" },
  nuevos_premium: { texto: "Nuevos Premium", emoji: "👑" },
  crecimiento: { texto: "Ver crecer la comunidad", emoji: "📈" },
  contenido_exito: { texto: "Contenido que funciona", emoji: "🚀" },
  mensaje_seguidor: { texto: "Mensaje de un seguidor", emoji: "💌" },
  terminar: { texto: "Terminar algo", emoji: "✅" },
  aprender: { texto: "Aprender algo nuevo", emoji: "🧠" },
  idea_nueva: { texto: "Una idea nueva", emoji: "💡" },
  mercado_alcista: { texto: "Mercado alcista", emoji: "🐂" },
  rutina: { texto: "Buena rutina", emoji: "🔁" },
  colaboracion: { texto: "Una colaboración", emoji: "🤝" },
  apariencia: { texto: "Apariencia personal", emoji: "🪞" },
  familia: { texto: "Familia", emoji: "👨‍👩‍👧" },
  amor: { texto: "Vida amorosa", emoji: "❤️" },
} as const;
export type Motivo = keyof typeof FACTORES_MOTIVOS;

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
  ambito: Ambito;
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
  etiqueta: Etiqueta | null;
  /** Rutas dentro del bucket privado `diario`. */
  fotos: string[];
  lugar: string | null;
  lat: number | null;
  lng: number | null;
  objetivo_id: string | null;
  ancla: boolean;
  /** Vacíos (o sin la columna, antes del SQL) si no se marcó nada. */
  negativos?: Negativo[] | null;
  motivos?: Motivo[] | null;
  created_at: string;
};

/** De qué es cada gasto de la empresa. Las claves se guardan en la base: no se renombran. */
export const CATEGORIAS_GASTO = {
  herramientas: { texto: "Herramientas y software", emoji: "🧰" },
  hosting: { texto: "Hosting y servidores", emoji: "🖥️" },
  publicidad: { texto: "Publicidad", emoji: "📣" },
  equipo: { texto: "Equipo", emoji: "🎙️" },
  formacion: { texto: "Formación", emoji: "📚" },
  colaboradores: { texto: "Colaboradores", emoji: "🤝" },
  impuestos: { texto: "Impuestos y gestoría", emoji: "🧾" },
  otros: { texto: "Otros", emoji: "📦" },
} as const;
export type CategoriaGasto = keyof typeof CATEGORIAS_GASTO;

export type Gasto = {
  id: string;
  fecha: string;
  concepto: string;
  categoria: CategoriaGasto;
  importe: number;
  /** Cuenta cada mes desde `fecha` hasta `hasta` (null = sigue). */
  recurrente: boolean;
  hasta: string | null;
};

/** Lo que suma un gasto en un mes "AAAA-MM": su importe si cae (o se repite) ese mes, 0 si no. */
export function gastoEnMes(g: Gasto, mes: string): number {
  const inicio = g.fecha.slice(0, 7);
  if (!g.recurrente) return inicio === mes ? g.importe : 0;
  if (mes < inicio) return 0;
  if (g.hasta && mes > g.hasta.slice(0, 7)) return 0;
  return g.importe;
}

/** Una idea: texto y canal, con un tick de hecha. Sin día ni estado. */
export type Idea = { id: string; texto: string; canal: Canal; hecha: boolean; created_at: string };

/** Lo que te propones en el diario, escrito a mano: sin cifras, solo hecho o no. */
export const HORIZONTES = { semana: "Esta semana", mes: "Este mes" } as const;
export type Horizonte = keyof typeof HORIZONTES;

export type Intencion = {
  id: string;
  texto: string;
  horizonte: Horizonte;
  /** El lunes de su semana o el día 1 de su mes. */
  desde: string;
  hecha: boolean;
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
  /** Solo en los de tipo «marca»: todo lo apuntado, del más antiguo al más reciente. */
  marcas: { fecha: string; valor: number }[];
};

/**
 * ¿Se alcanzó la meta? En los que bajan (meta menor que el punto de partida,
 * como perder peso) se cumple al llegar a la meta o por debajo.
 */
export function cumpleMeta(meta: number, base: number, valor: number): boolean {
  return meta < base ? valor <= meta : valor >= meta;
}

/** Cuánto del camino lleva, de 0 a 100, sirva el objetivo para subir o para bajar. */
export function porcentajeAvance(o: { metrica: Metrica; meta: number; base: number; actual: number }): number {
  const base = METRICAS[o.metrica].tipo === "nivel" ? o.base : 0;
  const recorrido = o.meta - base;
  if (recorrido === 0) return cumpleMeta(o.meta, base, o.actual) ? 100 : 0;
  return Math.min(100, Math.max(0, ((o.actual - base) / recorrido) * 100));
}

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
 * Los periodos de un objetivo que tocan el rango [desde, hasta], recortados a
 * él. Lo usa el calendario para pintar cada objetivo como una franja que cubre
 * sus días: uno solo si no se repite, o cada semana o cada mes si sí.
 */
export function periodosEnRango(o: Objetivo, desde: string, hasta: string): Periodo[] {
  const fin = o.hasta ?? "9999-12-31";
  if (o.desde > hasta || fin < desde) return [];
  if (o.repeticion === "no") {
    return [{ desde: o.desde > desde ? o.desde : desde, hasta: fin < hasta ? fin : hasta }];
  }
  const periodos: Periodo[] = [];
  let cursor = periodoQueContiene(o.desde > desde ? o.desde : desde, o.repeticion);
  while (cursor.desde <= hasta && cursor.desde <= fin) {
    const ini = [cursor.desde, desde, o.desde].sort().at(-1) as string;
    const fi = [cursor.hasta, hasta, fin].sort()[0];
    if (ini <= fi) periodos.push({ desde: ini, hasta: fi });
    cursor = periodoQueContiene(sumarDiasISO(cursor.hasta, 1), o.repeticion);
  }
  return periodos;
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
  // El camino puede ser hacia abajo (bajar de peso): se mide en el sentido de
  // la meta, así que «avanzar» es acercarse a ella venga de donde venga.
  const camino = meta - base;
  const esperado = base + camino * fraccion;
  const sentido = camino < 0 ? -1 : 1;
  const margen = Math.max(Math.abs(camino), 1) * 0.1;
  const adelanto = (actual - esperado) * sentido;

  let ritmo: Ritmo;
  if (cumpleMeta(meta, base, actual) && (camino !== 0 || actual === meta)) ritmo = "cumplido";
  else if (ahora >= fin) ritmo = "fallido";
  else if (ahora < ini) ritmo = "pendiente";
  else if (adelanto >= margen) ritmo = "adelantado";
  else if (adelanto >= -margen) ritmo = "en-ritmo";
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


// ── Cierre del día: productividad y dinero ───────────────────────────────────

/** Cómo fue el día. 3 arriba: es la escala que se guarda en `dias_balance`. */
export const PRODUCTIVIDAD = {
  3: { texto: "Muy productivo", emoji: "✅", corto: "¡Muy productivo!" },
  2: { texto: "Productivo", emoji: "✅", corto: "Productivo" },
  1: { texto: "No productivo", emoji: "❌", corto: "No productivo" },
} as const;
export type Productividad = keyof typeof PRODUCTIVIDAD;

/** De dónde viene el dinero de cada día. */
export const FUENTES = {
  premium: { texto: "Premium", emoji: "👑" },
  youtube: { texto: "YouTube", emoji: "▶️" },
  trading: { texto: "Trading", emoji: "📈" },
  asesorias: { texto: "Asesorías", emoji: "🤝" },
  otros: { texto: "Otros", emoji: "💶" },
} as const;
export type Fuente = keyof typeof FUENTES;

export type Balance = {
  fecha: string;
  productividad: Productividad | null;
  nota: string | null;
  ingresos: Partial<Record<Fuente, number>>;
  total: number;
};
