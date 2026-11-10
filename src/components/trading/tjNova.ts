/**
 * Nova, la asistente del Diario de Trading (versión 2, 10-11-2026).
 *
 * Lee todo lo que el usuario ha apuntado (operaciones, sensaciones, hitos) y lo
 * cuenta en frases cortas y amables, siempre sobre el presente. Cada mensaje
 * lleva una PRIORIDAD (lo urgente sale antes y se destaca) y, si tiene sentido,
 * una ACCIÓN (un botón que lleva a hacer lo que propone).
 *
 * Tres capas, en este orden:
 *
 *   1. LA LECTURA (`leerDiario`). Antes de opinar, Nova convierte los datos en
 *      hechos: la sesión de hoy, lo último apuntado, la curva y la caída desde
 *      el máximo, lo reciente (últimas 10), el ánimo de la semana, la racha de
 *      días… Las reglas solo leen hechos; nunca vuelven a recorrer las tablas.
 *
 *   2. LA MEMORIA (`recordar`). Nova no guarda nada: VUELVE A LEER el diario tal
 *      como estaba hace 7 días, hace 30 y el lunes de esta semana, y compara.
 *      Así sabe si un problema PERSISTE («hace una semana ya te lo dije»), si
 *      lo has CORREGIDO (y te lo reconoce), y qué OBJETIVO te tocaba esta
 *      semana, con su progreso. Como sale de los
 *      propios datos, nunca se desincroniza, sirve en cualquier dispositivo y
 *      se borra sola al reiniciar el diario.
 *
 *   3. LAS REGLAS. Cada capítulo tiene un tope de mensajes (TOPE) y manda la
 *      prioridad; «Lo más importante» se elige entre TODO antes de recortar.
 *
 * Por dentro evalúa cuatro ÁREAS (riesgo, resultados, emociones, constancia)
 * sobre lo reciente, pero no da ninguna nota: el «pulso» de 0 a 100 se retiró
 * el 10-11-2026 porque confundía. Las áreas solo sirven para elegir el
 * objetivo de la semana (la más floja el lunes).
 *
 * Son reglas sobre los datos, no un modelo de IA: instantáneo, gratis y sin
 * inventar nada. Los emojis van aquí a propósito: el admin los pidió (06-11-2026).
 *
 * Se rehace ENTERO con cada dato nuevo (una operación, un ánimo, el capital),
 * decidido con el admin el 07-11-2026: lo primero que hace es reaccionar a lo
 * último apuntado.
 */

import { MONTHS, WEEKDAY_NAMES, pctStr, pnlStr, rStr } from "./tjFormat";
import {
  BREAKDOWNS, COOLDOWN_MIN, RISK_LIMIT_PCT, buildInsights, computeStats, groupStats, milestoneProgress,
  periodReads, welcomeReading, type Milestone, type Stats, type Trade, type TradeContext,
} from "./tjStats";
import { animoInfo, fechaDate, fechaKey, pnlPorDia, rachaDias, type DiasMap } from "./tjDias";

export type BotSection = "importante" | "semana" | "hoy" | "animo" | "operaciones" | "hitos" | "consejos";
export type BotTone = "win" | "loss" | "be" | "accent";
export type BotActionKind = "nuevo" | "hitos" | "capital" | "emociones" | "operaciones";
export type BotExpression = "happy" | "calm" | "worried" | "celebrate";

/** Capítulos que llevan mensajes propios («Lo más importante» reúne los de los demás; la semana se pinta aparte). */
export type BotMessageSection = Exclude<BotSection, "importante" | "semana">;

export interface BotAction {
  kind: BotActionKind;
  label: string;
}

export interface BotMessage {
  id: string;
  section: BotMessageSection;
  emoji: string;
  text: string;
  tone: BotTone;
  /** 0-100. A partir de IMPORTANT se destaca y sube a «Lo más importante». */
  priority: number;
  /** Frase corta para anunciarlo, si este mensaje merece anunciarse. */
  teaser?: string;
  action?: BotAction;
  /** Nova ya lo dijo hace una semana y sigue igual: se enseña con su marca. */
  persistente?: boolean;
}

/** Un área de la operativa, evaluada de 0 a 25 sobre lo reciente. Solo para elegir el objetivo de la semana. */
interface Area {
  id: "riesgo" | "resultados" | "emociones" | "constancia";
  /** 0-25, o null si aún no hay datos para medirla. */
  value: number | null;
}

/** El objetivo de la semana: sale del área más floja el lunes, y se mide con lo apuntado desde entonces. */
export interface Objetivo {
  id: Area["id"] | "muestra";
  titulo: string;
  porque: string;
  /** Lo hecho y la meta, en su unidad (operaciones, días…). */
  hecho: number;
  meta: number;
  unidad: string;
  /** 0-100. */
  progreso: number;
  cumplido: boolean;
  /** Qué queda, en una frase. */
  estado: string;
  /** El lunes de la semana (AAAA-MM-DD). */
  desde: string;
}

/** Lo que hay de nuevo, resumido para avisar desde la barra de la web sin abrir el Diario. */
export interface BotResumen {
  importantes: number;
  total: number;
  frase: string;
}

export interface BotReport {
  /** Frases cortas: el saludo y luego lo más urgente. */
  teasers: string[];
  messages: BotMessage[];
  /** Los mensajes más importantes (prioridad alta), para el primer capítulo. */
  highlights: BotMessage[];
  objetivo: Objetivo | null;
  /** La cara de Nova según cómo va el usuario. */
  expression: BotExpression;
  /** Huella de los mensajes: si cambia, hay algo nuevo que el usuario no ha visto. */
  signature: string;
  resumen: BotResumen;
  /** Cuándo se hizo el análisis (ISO) y con cuántas operaciones. */
  analizado: string;
  operaciones: number;
}

export const BOT_NAME = "Nova";
/** Dónde guarda el Diario la huella del último análisis (la lee NovaNav para avisar de novedades). */
export const NOVA_FIRMA = "nova-firma";
/** Dónde guarda el Diario el resumen del último análisis (lo lee NovaNav para decir QUÉ hay de nuevo). */
export const NOVA_RESUMEN = "nova-resumen";
export const IMPORTANT = 75;

export const SECTION_LABEL: Record<BotSection, string> = {
  importante: "Lo más importante",
  semana: "Tu objetivo de la semana",
  hoy: "Tu situación",
  animo: "Tus sensaciones",
  operaciones: "Tus últimas operaciones",
  hitos: "Tus hitos",
  consejos: "Lo que dicen tus números",
};

interface Input {
  name: string;
  trades: Trade[];
  dias: DiasMap;
  milestones: Milestone[];
  ctx: Map<string, TradeContext>;
  stats: Stats;
  capital: number | null;
  now: Date;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const dayName = (d: Date) => `el ${WEEKDAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()}`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const coma = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
const daysBetween = (a: Date, b: Date) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 864e5);
const diasAtras = (now: Date, n: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, now.getHours(), now.getMinutes());
/** El lunes de la semana de `d`, a las 00:00. */
const lunesDe = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
/** Las operaciones apuntadas hasta un instante (por la fecha de la operación). */
const hasta = (trades: Trade[], t: Date) => trades.filter(x => new Date(x.date).getTime() <= t.getTime());
/** R de una operación (lo ganado o perdido en veces el riesgo), si tiene riesgo. */
const rDe = (t: Trade) => (t.risk_amount > 0 ? t.pnl / t.risk_amount : null);

/** Cómo se nombra lo que falta para cada hito, en singular y plural. */
const HITO_UNIDAD: Record<string, [string, string]> = {
  arranque: ["operación más", "operaciones más"],
  ratio: ["operación más con ratio 1:1,5 o mejor", "operaciones más con ratio 1:1,5 o mejor"],
  calma: ["día más con 3 operaciones o menos", "días más con 3 operaciones o menos"],
  verdes: ["día más cerrado en verde", "días más cerrados en verde"],
  ventaja: ["R más", "R más"],
  maximos: ["máximo nuevo más", "máximos nuevos más"],
  trimestres: ["trimestre más cerrado en verde", "trimestres más cerrados en verde"],
  muestra: ["operación más", "operaciones más"],
  disciplina: [`operación más seguida arriesgando ≤ ${RISK_LIMIT_PCT} %`, `operaciones más seguidas arriesgando ≤ ${RISK_LIMIT_PCT} %`],
  porque: ["operación más con estrategia o nota", "operaciones más con estrategia o nota"],
  revancha: ["vez más esperando tras una pérdida", "veces más esperando tras una pérdida"],
  semanas: ["semana más apuntando", "semanas más apuntando"],
  control: ["pérdida más dentro de lo que arriesgabas", "pérdidas más dentro de lo que arriesgabas"],
  objetivo: ["ganadora más llevada hasta su objetivo", "ganadoras más llevadas hasta su objetivo"],
  meses: ["mes más cerrado en verde", "meses más cerrados en verde"],
  recuperacion: ["vuelta más a máximos", "vueltas más a máximos"],
  vivir: ["mes válido más (10+ operaciones)", "meses válidos más (10+ operaciones cada uno)"],
};

function hitoFalta(m: Milestone, falta: number): string {
  if (m.id === "rentabilidad") return `un ${pctStr(falta, false, 1)} más de rentabilidad`;
  const n = Math.max(1, Math.ceil(falta));
  const [one, many] = HITO_UNIDAD[m.id] ?? ["paso más", "pasos más"];
  return plural(n, one, many);
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

/** Cuántas operaciones recientes miran las áreas, la forma y la memoria. */
const RECIENTES = 10;
/** Pérdida que supera el riesgo planeado en más de esto: el stop no se respetó. */
const STOP_HOLGURA = 1.1;
/** Cuántos días atrás un día con operaciones sigue siendo «tu última sesión» (cubre un fin de semana). */
const SESION_DIAS = 3;
/** Cuántos días atrás lo último que apuntaste aún merece una reacción de Nova. */
const NOVEDAD_DIAS = 3;

// ─────────────────────────── Las cuatro áreas ───────────────────────────

/** Riesgo, resultados, emociones y constancia sobre lo reciente, de 0 a 25 cada una. Sin nota global. */
function evaluarAreas(trades: Trade[], dias: DiasMap, ctx: Map<string, TradeContext>, now: Date): Area[] | null {
  if (!trades.length) return null;
  const ult = trades.slice(-RECIENTES);

  // Riesgo: qué parte de las últimas arriesgó ≤ 2 % de la cuenta.
  const riesgos = ult.map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
  const riesgo = riesgos.length ? (riesgos.filter(r => r <= RISK_LIMIT_PCT).length / riesgos.length) * 25 : null;

  // Resultados: esperanza en R de las últimas, de −1R (0) a +1R (25).
  const rs = ult.map(rDe).filter((r): r is number => r != null);
  const rMedia = avg(rs);
  const resultados = rMedia != null ? ((clamp(rMedia, -1, 1) + 1) / 2) * 25 : (computeStats(ult).winRate / 100) * 25;

  // Emociones: ánimo medio de los últimos 7 días, de «muy mal» (0) a «fantástico» (25).
  const animos: number[] = [];
  for (let i = 0; i < 7; i++) {
    const a = dias[fechaKey(diasAtras(now, i))]?.animo;
    if (a != null) animos.push(a);
  }
  const aMedia = avg(animos);
  const emociones = aMedia != null ? ((aMedia - 1) / 3) * 25 : null;

  // Constancia: días apuntados de los últimos 14 (la mitad) y operaciones con estrategia o nota (la otra mitad).
  let apuntados = 0;
  for (let i = 0; i < 14; i++) {
    if (dias[fechaKey(diasAtras(now, i))]) apuntados++;
  }
  const conPorque = ult.filter(t => t.strategy || t.notes).length / ult.length;
  const constancia = (apuntados / 14) * 12.5 + conPorque * 12.5;

  return [
    { id: "riesgo", value: riesgo },
    { id: "resultados", value: resultados },
    { id: "emociones", value: emociones },
    { id: "constancia", value: constancia },
  ];
}

// ─────────────────────────── La lectura ───────────────────────────

/** Los hechos que las reglas leen. Todo lo que hay que saber del diario, calculado una vez. */
interface Lectura {
  hoyKey: string;
  sesion: { key: string; hoy: boolean; dia: string; pnl: number; count: number; wins: number } | null;
  cuando: string;
  animoHoy: ReturnType<typeof animoInfo> | null;
  animoSesion: ReturnType<typeof animoInfo> | null;
  last: Trade | null;
  prev: Trade | null;
  /** Lo último que el usuario APUNTÓ hace poco (por cuándo lo guardó), si merece reacción. */
  novedad: Trade | null;
  recientes: Trade[];
  racha: { tone: "win" | "loss" | null; count: number };
  equity: number;
  peak: number;
  newHighAtLast: boolean;
  ddPct: number | null;
  porDia: Map<string, { pnl: number; count: number; wins: number }>;
  /** Días seguidos (con operaciones) acabados en verde o en rojo, hasta la última sesión. */
  rachaDiasTono: { tone: "win" | "loss" | null; count: number };
  sinRiesgo: number;
}

function leerDiario(trades: Trade[], dias: DiasMap, capital: number | null, stats: Stats, now: Date): Lectura {
  const porDia = pnlPorDia(trades);
  const hoyKey = fechaKey(now);
  // «Hoy» si hoy ya hay operaciones; si no, la última sesión, si fue hace poco.
  const sesionKey = porDia.has(hoyKey) ? hoyKey : [...porDia.keys()].filter(k => k < hoyKey).sort().pop();
  const sesion = sesionKey && daysBetween(fechaDate(sesionKey), now) <= SESION_DIAS
    ? { key: sesionKey, hoy: sesionKey === hoyKey, dia: dayName(fechaDate(sesionKey)), ...porDia.get(sesionKey)! }
    : null;
  const cuando = sesion ? (sesion.hoy ? "hoy" : sesion.dia) : "";
  const animoHoy = dias[hoyKey]?.animo ? animoInfo(dias[hoyKey].animo!) : null;
  const animoSesion = sesion && dias[sesion.key]?.animo ? animoInfo(dias[sesion.key].animo!) : null;
  const last = trades[trades.length - 1] ?? null;
  const prev = trades[trades.length - 2] ?? null;

  const apuntada = trades.reduce<Trade | null>((a, t) => (!a || (t.created_at ?? "") > (a.created_at ?? "") ? t : a), null);
  const novedad = apuntada && apuntada.created_at && daysBetween(new Date(apuntada.created_at), now) <= NOVEDAD_DIAS ? apuntada : null;

  // Curva de capital para máximos y caídas (solo con capital).
  let peak = capital ?? 0;
  let equity = capital ?? 0;
  let newHighAtLast = false;
  trades.forEach((t, i) => {
    equity += t.pnl;
    if (equity > peak) {
      peak = equity;
      if (i === trades.length - 1) newHighAtLast = true;
    }
  });
  const ddPct = capital && peak > 0 ? ((equity - peak) / peak) * 100 : null;

  // Días seguidos en verde o en rojo, mirando los días con operaciones hacia atrás.
  const diasOrden = [...porDia.keys()].sort();
  let rachaDiasTono: Lectura["rachaDiasTono"] = { tone: null, count: 0 };
  for (let i = diasOrden.length - 1; i >= 0; i--) {
    const pnl = porDia.get(diasOrden[i])!.pnl;
    const tone: "win" | "loss" | null = pnl > 0 ? "win" : pnl < 0 ? "loss" : null;
    if (!tone) break;
    if (rachaDiasTono.tone && rachaDiasTono.tone !== tone) break;
    rachaDiasTono = { tone, count: rachaDiasTono.count + 1 };
  }

  return {
    hoyKey, sesion, cuando, animoHoy, animoSesion, last, prev, novedad,
    recientes: trades.slice(-RECIENTES),
    racha: stats.currentStreak,
    equity, peak, newHighAtLast, ddPct, porDia, rachaDiasTono,
    sinRiesgo: trades.filter(t => !(t.risk_amount > 0)).length,
  };
}

// ─────────────────────────── La memoria ───────────────────────────

/** Los problemas que Nova vigila de una semana a otra. */
type CondId = "riesgo" | "stop" | "revancha" | "porque" | "tamano";

/** Cómo se nombra cada problema al recordarlo, y cómo se dice que está corregido. */
const COND: Record<CondId, { nombre: string; corregido: string }> = {
  riesgo: { nombre: "el riesgo por operación", corregido: "tus últimas operaciones ya respetan el 2 % de la cuenta" },
  stop: { nombre: "el stop", corregido: "tus últimas pérdidas se quedan en lo que habías planeado" },
  revancha: { nombre: "la revancha", corregido: "tras perder, ahora esperas antes de volver a entrar" },
  porque: { nombre: "el porqué de cada operación", corregido: "tus últimas operaciones llevan su estrategia o su nota" },
  tamano: { nombre: "el tamaño por euforia", corregido: "has vuelto a tu tamaño de siempre" },
};

/** ¿Qué problemas se ven en el diario tal como está en un momento dado? Mira las últimas 10. */
function condiciones(trades: Trade[], ctx: Map<string, TradeContext>): Record<CondId, boolean> {
  const ult = trades.slice(-RECIENTES);
  const last = ult[ult.length - 1];
  const riesgos = ult.map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
  const altos = riesgos.filter(r => r > RISK_LIMIT_PCT).length;
  const lastRiesgo = last ? ctx.get(last.id)?.riskPct : null;
  const saltados = ult.filter(t => t.result === "loss" && t.risk_amount > 0 && -t.pnl > t.risk_amount * STOP_HOLGURA).length;
  let revancha = false;
  for (let i = 1; i < ult.length; i++) {
    const p = ult[i - 1];
    const min = (new Date(ult[i].date).getTime() - new Date(p.date).getTime()) / 60_000;
    if (p.result === "loss" && min >= 0 && min < COOLDOWN_MIN) revancha = true;
  }
  const previas = trades.slice(-RECIENTES - 1, -1).map(t => t.risk_amount).filter(v => v > 0).sort((a, b) => a - b);
  const mediana = previas.length >= 5 ? previas[Math.floor(previas.length / 2)] : null;
  return {
    riesgo: altos >= 2 || (lastRiesgo != null && lastRiesgo > RISK_LIMIT_PCT),
    stop: saltados >= 2,
    revancha,
    porque: ult.length >= 3 && ult.filter(t => t.strategy || t.notes).length / ult.length < 0.5,
    tamano: !!last && mediana != null && last.risk_amount > 0 && last.risk_amount / mediana >= 1.5,
  };
}

interface Memoria {
  ahora: Record<CondId, boolean>;
  hace7: Record<CondId, boolean> | null;
  /** Operaciones apuntadas desde hace 7 días: con pocas, «corregido» aún no significa nada. */
  desdeHace7: number;
  objetivo: Objetivo | null;
}

/** Objetivo de la semana a partir del área más floja el lunes, medido con lo de esta semana. */
function objetivoSemana(trades: Trade[], dias: DiasMap, ctx: Map<string, TradeContext>, areasLunes: Area[] | null, lunes: Date, now: Date): Objetivo | null {
  const desde = fechaKey(lunes);
  const semana = trades.filter(t => new Date(t.date).getTime() >= lunes.getTime());
  const n = semana.length;
  const medidas = areasLunes?.filter(p => p.value != null) ?? [];
  const floja = medidas.length ? [...medidas].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0] : null;
  // La semana sin empezar: el objetivo se enseña con su meta, a cero.
  const base = { desde, cumplido: false };

  if (!areasLunes || !floja) {
    const hecho = semana.filter(t => t.strategy || t.notes).length;
    const meta = 3;
    return {
      ...base, id: "muestra", titulo: "Apunta 3 operaciones con su porqué",
      porque: "Con el porqué apuntado, dentro de unas semanas sabrás si falla el método o la disciplina.",
      hecho, meta, unidad: "operaciones", progreso: Math.min(100, (hecho / meta) * 100), cumplido: hecho >= meta,
      estado: hecho >= meta ? "Objetivo cumplido esta semana" : `Te ${meta - hecho === 1 ? "falta" : "faltan"} ${plural(meta - hecho, "operación", "operaciones")} con estrategia o nota`,
    };
  }

  if (floja.id === "riesgo") {
    const conPct = semana.map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
    const hecho = conPct.filter(r => r <= RISK_LIMIT_PCT).length;
    const meta = Math.max(3, conPct.length);
    const ok = conPct.length >= 3 && hecho === conPct.length;
    return {
      ...base, id: "riesgo", titulo: `Arriesga ${RISK_LIMIT_PCT} % o menos en todas las operaciones`,
      porque: `El lunes, tu riesgo era lo que más flojo iba. Con el ${RISK_LIMIT_PCT} % de tope, una mala racha no te saca del juego.`,
      hecho, meta, unidad: "operaciones", progreso: Math.min(100, (hecho / meta) * 100), cumplido: ok,
      estado: ok ? "Objetivo cumplido: todas dentro del límite" : !conPct.length ? "Aún sin operaciones esta semana" : hecho === conPct.length ? `De momento todas dentro (${hecho}); el objetivo cuenta a partir de 3` : `${conPct.length - hecho} de ${conPct.length} se pasaron del ${RISK_LIMIT_PCT} %`,
    };
  }

  if (floja.id === "resultados") {
    const conPlan = semana.filter(t => t.risk_amount > 0);
    const hecho = conPlan.filter(t => t.expected_gain / t.risk_amount >= 1.5).length;
    const meta = Math.max(3, conPlan.length);
    const ok = conPlan.length >= 3 && hecho === conPlan.length;
    return {
      ...base, id: "resultados", titulo: "Entra solo con un ratio planeado de 1:1,5 o mejor",
      porque: "El lunes, tus resultados eran lo que más flojo iba. Con 1:1,5 te basta acertar 4 de cada 10 para no perder.",
      hecho, meta, unidad: "operaciones", progreso: Math.min(100, (hecho / meta) * 100), cumplido: ok,
      estado: ok ? "Objetivo cumplido: todas con buen ratio" : !conPlan.length ? "Aún sin operaciones esta semana" : hecho === conPlan.length ? `De momento todas con buen ratio (${hecho}); el objetivo cuenta a partir de 3` : `${conPlan.length - hecho} de ${conPlan.length} entraron con un ratio peor`,
    };
  }

  if (floja.id === "emociones") {
    const diasSemana = daysBetween(lunes, now) + 1;
    const hecho = Array.from({ length: diasSemana }, (_, i) => dias[fechaKey(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i, 12))]?.animo).filter(a => a != null).length;
    const meta = 5;
    return {
      ...base, id: "emociones", titulo: "Apunta tu ánimo 5 días esta semana",
      porque: "El lunes, tus emociones eran lo que más flojo iba. Con el ánimo apuntado veo si operar con la cabeza cargada te cuesta dinero.",
      hecho, meta, unidad: "días", progreso: Math.min(100, (hecho / meta) * 100), cumplido: hecho >= meta,
      estado: hecho >= meta ? "Objetivo cumplido esta semana" : `Te ${meta - hecho === 1 ? "falta" : "faltan"} ${plural(meta - hecho, "día", "días")} con tu ánimo apuntado`,
    };
  }

  const hecho = semana.filter(t => t.strategy || t.notes).length;
  const meta = Math.max(3, n);
  const ok = n >= 3 && hecho === n;
  return {
    ...base, id: "constancia", titulo: "Cada operación con su estrategia o su nota",
    porque: "El lunes, tu constancia era lo que más flojo iba. Sin el porqué, no hay de qué aprender cuando algo sale mal.",
    hecho, meta, unidad: "operaciones", progreso: Math.min(100, (hecho / meta) * 100), cumplido: ok,
    estado: ok ? "Objetivo cumplido: todas con su porqué" : !n ? "Aún sin operaciones esta semana" : hecho === n ? `De momento todas con su porqué (${hecho}); el objetivo cuenta a partir de 3` : `${n - hecho} de ${n} sin estrategia ni nota`,
  };
}

/** Vuelve a leer el diario tal como estaba hace una semana y el lunes, y lo compara con hoy. */
function recordar(trades: Trade[], dias: DiasMap, ctx: Map<string, TradeContext>, now: Date): Memoria {
  const ahora = condiciones(trades, ctx);
  const t7 = diasAtras(now, 7);
  const de7 = hasta(trades, t7);
  const hace7 = de7.length >= 3 ? condiciones(de7, ctx) : null;

  const lunes = lunesDe(now);
  const areasLunes = evaluarAreas(hasta(trades, lunes), dias, ctx, lunes);
  const objetivo = trades.length || Object.keys(dias).length ? objetivoSemana(trades, dias, ctx, areasLunes, lunes, now) : null;

  return { ahora, hace7, desdeHace7: trades.length - de7.length, objetivo };
}

// ─────────────────────────── Informe ───────────────────────────

/*
 * Cuántos mensajes enseña cada capítulo como mucho. Nova se rehace con CADA
 * dato nuevo, así que tiene que ser corta: dentro de cada capítulo manda la
 * prioridad y lo que no cabe se queda fuera. Lo urgente nunca se pierde:
 * «Lo más importante» se elige ANTES de recortar, entre todos los mensajes.
 */
const TOPE: Record<BotMessageSection, number> = {
  hoy: 3,
  animo: 3,
  operaciones: 3,
  hitos: 2,
  consejos: 3,
};

/** Prioridad y emoji de cada lectura del análisis (buildInsights), según lo que dice. */
const INSIGHT: Record<string, { win: number; loss: number; be: number }> = {
  stop: { win: 0, loss: 68, be: 0 },
  corta: { win: 0, loss: 62, be: 0 },
  esperanza: { win: 42, loss: 66, be: 0 },
  direccion: { win: 0, loss: 54, be: 0 },
  "par-low": { win: 0, loss: 52, be: 0 },
  "par-top": { win: 36, loss: 0, be: 0 },
  dia: { win: 0, loss: 48, be: 0 },
  payoff: { win: 40, loss: 56, be: 0 },
  muestra: { win: 0, loss: 0, be: 22 },
};

export function buildBotReport({ name, trades, dias, milestones, ctx, stats, capital, now }: Input): BotReport {
  const out: BotMessage[] = [];
  const add = (m: Omit<BotMessage, "id"> & { key: string }) => {
    const { key, ...rest } = m;
    out.push({ id: `${m.section}-${key}`, ...rest });
  };

  const L = leerDiario(trades, dias, capital, stats, now);
  const M = recordar(trades, dias, ctx, now);
  const { sesion, cuando, animoHoy, animoSesion, last, prev, novedad, recientes } = L;
  const { tone: rachaTone, count: rachaN } = L.racha;

  /** «de el stop» → «del stop». */
const de = (nombre: string) => (nombre.startsWith("el ") ? `del ${nombre.slice(3)}` : `de ${nombre}`);

/** Si hace una semana Nova ya vio este problema y sigue, se dice y pesa más. */
  const persiste = (c: CondId) => !!M.hace7?.[c] && M.ahora[c] && M.desdeHace7 >= 3;
  const recuerdo = (c: CondId, texto: string) => (persiste(c) ? `Hace una semana ya vimos ${COND[c].nombre} y sigue igual: ${texto[0].toLowerCase()}${texto.slice(1)}` : texto);
  const extra = (c: CondId) => (persiste(c) ? 6 : 0);

  // ───────── Tu situación ─────────
  if (!trades.length) {
    add({
      section: "hoy", key: "vacio", emoji: "✍️", tone: "accent", priority: 95,
      text: `¡Bienvenido a tu diario, ${name}! Apunta tu primera operación y empiezo a ayudarte con todo lo que veo.`,
      teaser: "¡Empecemos tu diario! ✍️", action: { kind: "nuevo", label: "Apuntar mi primera operación" },
    });
  } else {
    /*
     * HABILIDAD · Reacción a lo último apuntado. Lo primero que Nova mira cuando
     * llega un dato nuevo: cómo salió en R, si respetó el plan (stop y objetivo)
     * y si lleva su porqué. Todo en un mensaje: es una reacción, no un informe.
     */
    if (novedad) {
      const r = rDe(novedad);
      const partes: string[] = [`${novedad.pair} en ${novedad.direction}, ${pnlStr(novedad.pnl)}${r != null ? ` (${rStr(r)})` : ""}`];
      let rompioPlan = false;
      if (novedad.result === "loss" && novedad.risk_amount > 0 && -novedad.pnl > novedad.risk_amount * STOP_HOLGURA) {
        partes.push(`perdiste un ${Math.round((-novedad.pnl / novedad.risk_amount - 1) * 100)} % más de lo que arriesgabas: ¿moviste el stop?`);
        rompioPlan = true;
      } else if (novedad.result === "win" && novedad.expected_gain > 0 && novedad.pnl < novedad.expected_gain * 0.5) {
        partes.push(`te quedaste con el ${Math.round((novedad.pnl / novedad.expected_gain) * 100)} % de tu objetivo; si cerraste por miedo, apúntalo`);
      } else if (novedad.result === "loss") {
        partes.push("perdiste lo planeado: eso es respetar el stop 👏");
      } else if (novedad.result === "win") {
        partes.push("ejecutada según tu plan 👏");
      }
      if (!novedad.strategy && !novedad.notes) partes.push("le falta la estrategia o una nota, y sin porqué no hay de qué aprender");
      add({
        section: "hoy", key: "novedad", emoji: rompioPlan ? "🧐" : novedad.pnl > 0 ? "✅" : novedad.pnl < 0 ? "📝" : "➖",
        tone: rompioPlan ? "loss" : novedad.pnl > 0 ? "win" : novedad.pnl < 0 ? "loss" : "be",
        priority: rompioPlan ? 83 : 66,
        text: `Acabo de ver tu última operación: ${partes.join("; ")}.`,
        teaser: rompioPlan ? "Revisemos tu última operación 🧐" : "He visto tu nueva operación 👀",
        action: { kind: "operaciones", label: "Ver mis operaciones" },
      });
    }

    if (sesion) {
      // Sobreoperar: el doble (o más) de lo normal en un día con operaciones.
      const otrosDias = [...L.porDia.entries()].filter(([k]) => k !== sesion.key).map(([, v]) => v.count);
      const normal = avg(otrosDias);
      if (normal != null && sesion.count >= 3 && sesion.count >= normal * 2) {
        add({
          section: "hoy", key: "sobreoperar", emoji: "🌀", tone: "loss", priority: 85,
          text: `${cap(cuando)} ${sesion.hoy ? "llevas" : "hiciste"} ${sesion.count} operaciones y un día normal tuyo tiene ${coma(normal)}. Operar de más suele salir caro: ¿cada entrada estaba en tu plan?`,
          teaser: "Mucha actividad… 👀",
        });
      }
      add({
        section: "hoy", key: "sesion", emoji: sesion.pnl >= 0 ? "💪" : "🧘", tone: sesion.pnl >= 0 ? "win" : "loss", priority: 58,
        text: `${sesion.hoy ? "Hoy llevas" : `Tu última sesión fue ${sesion.dia}:`} ${plural(sesion.count, "operación", "operaciones")} y ${sesion.hoy ? "vas" : "cerraste"} en ${pnlStr(sesion.pnl)}. ${sesion.pnl >= 0 ? "¡Buen día!" : "Respira: un mal día no define tu mes."}`,
        teaser: sesion.pnl > 0 ? "¡Buen día de trading! 💪" : undefined,
      });
    }

    // Días seguidos en verde o en rojo: la racha que se siente, más que la de operaciones.
    if (L.rachaDiasTono.tone === "loss" && L.rachaDiasTono.count >= 3) {
      add({
        section: "hoy", key: "dias-rojo", emoji: "🌧️", tone: "loss", priority: 74,
        text: `Llevas ${L.rachaDiasTono.count} días de trading seguidos en rojo. No es momento de recuperar: es momento de operar menos y solo lo mejor.`,
        teaser: "Hablemos de estos días 🌧️",
      });
    } else if (L.rachaDiasTono.tone === "win" && L.rachaDiasTono.count >= 3) {
      add({
        section: "hoy", key: "dias-verde", emoji: "☀️", tone: "win", priority: 46,
        text: `${L.rachaDiasTono.count} días de trading seguidos en verde. Lo que estás haciendo funciona: no cambies nada por aburrimiento.`,
      });
    }

    if (L.newHighAtLast && trades.length >= 3 && capital) {
      add({
        section: "hoy", key: "maximo", emoji: "🚀", tone: "win", priority: 78,
        text: `¡Tu cuenta acaba de marcar un nuevo máximo: ${pnlStr(L.equity - capital)} desde el inicio! Es justo cuando más cuesta mantener la disciplina.`,
        teaser: "¡Nuevo máximo de tu cuenta! 🚀",
      });
    } else if (L.ddPct != null && L.ddPct <= -5) {
      add({
        section: "hoy", key: "caida", emoji: "🛡️", tone: "loss", priority: 82,
        text: `Estás un ${pctStr(Math.abs(L.ddPct), false, 1)} por debajo de tu máximo (${pnlStr(L.equity - L.peak)}). Ahora lo primero es proteger la cuenta: tamaño pequeño y solo tus mejores entradas.`,
        teaser: "Hablemos de tu cuenta 🛡️",
      });
    }

    /*
     * HABILIDAD · Tu semana frente a la anterior. Siete días contra los siete de
     * antes, en R media y acierto: cómo va la forma, sin esperar al mes.
     */
    const semana = trades.filter(t => new Date(t.date).getTime() > diasAtras(now, 7).getTime());
    const anterior = trades.filter(t => {
      const ms = new Date(t.date).getTime();
      return ms > diasAtras(now, 14).getTime() && ms <= diasAtras(now, 7).getTime();
    });
    if (semana.length >= 3 && anterior.length >= 3) {
      const rA = avg(semana.map(rDe).filter((r): r is number => r != null));
      const rB = avg(anterior.map(rDe).filter((r): r is number => r != null));
      const sA = computeStats(semana);
      const sB = computeStats(anterior);
      if (rA != null && rB != null && Math.abs(rA - rB) >= 0.2) {
        add(rA > rB
          ? { section: "hoy", key: "semana", emoji: "📈", tone: "win", priority: 44, text: `Esta semana vas mejor que la anterior: ${rStr(rA)} de media por operación frente a ${rStr(rB)}, y aciertas el ${Math.round(sA.winRate)} % (antes el ${Math.round(sB.winRate)} %).` }
          : { section: "hoy", key: "semana", emoji: "📉", tone: "loss", priority: 60, text: `Esta semana vas peor que la anterior: ${rStr(rA)} de media por operación frente a ${rStr(rB)}. Antes de la próxima sesión, mira qué ha cambiado: ¿las entradas, el tamaño o cómo llegas?` });
      }
    }

    const sinOperar = last ? daysBetween(new Date(last.date), now) : 0;
    if (sinOperar >= 7) {
      add({ section: "hoy", key: "pausa", emoji: "😌", tone: "be", priority: 40, text: `Llevas ${plural(sinOperar, "día", "días")} sin operar. Esperar al momento bueno también es operar bien.` });
    }
    add({ section: "hoy", key: "lectura", emoji: "🗓️", tone: "be", priority: 30, text: welcomeReading(periodReads(trades, now), trades.length) });
    if (capital) {
      const ret = (stats.totalPnl / capital) * 100;
      add({
        section: "hoy", key: "cuenta", emoji: ret >= 0 ? "📈" : "📉", tone: ret > 0 ? "win" : ret < 0 ? "loss" : "be", priority: 28,
        text: `Tu cuenta está en ${pctStr(ret, true, 2)} desde que empezaste (${pnlStr(stats.totalPnl)}).`,
      });
    }
  }

  // ───────── Tus sensaciones ─────────
  if (animoHoy) {
    // Lo que contó HOY manda: es lo que pesa en las decisiones que aún puede tomar.
    if (animoHoy.value <= 2) {
      add({
        section: "animo", key: "hoy-mal", emoji: animoHoy.emoji, tone: "loss", priority: sesion?.hoy ? 88 : 76,
        text: sesion?.hoy
          ? `Hoy te sientes «${animoHoy.label.toLowerCase()}» y estás operando. Con la cabeza cargada se toman peores decisiones: si dudas, para por hoy.`
          : `Hoy no es tu mejor día (${animoHoy.label.toLowerCase()}). Si no te ves fino, no operar también es una decisión ganadora.`,
        teaser: "Hoy cuídate un poco 🫶",
      });
    } else {
      add({ section: "animo", key: "hoy-bien", emoji: animoHoy.emoji, tone: "win", priority: 30, text: `Hoy te sientes «${animoHoy.label.toLowerCase()}». ¡Aprovéchalo, pero sin saltarte tu plan!` });
    }
  } else if (sesion && !animoSesion) {
    add({
      section: "animo", key: "falta", emoji: "🙂", tone: "accent", priority: sesion.hoy ? 56 : 46,
      text: `No me contaste cómo te sentías ${cuando}. Me ayuda a entender tus resultados: elige un emoji al apuntar tu próxima operación.`,
      teaser: "¿Cómo te sientes al operar? 🙂", action: { kind: "nuevo", label: "Contarte cómo me siento" },
    });
  } else if (sesion && !sesion.hoy && animoSesion && animoSesion.value <= 2) {
    add({
      section: "animo", key: "sesion-mal", emoji: animoSesion.emoji, tone: "loss", priority: 64,
      text: `${cap(sesion.dia)} te sentías «${animoSesion.label.toLowerCase()}» y operaste (${pnlStr(sesion.pnl)}). Antes de la próxima sesión, comprueba cómo llegas.`,
    });
  }

  // ¿Operar con mal ánimo le cuesta dinero? Solo con al menos 2 días de cada lado.
  const conAnimo = Object.values(dias).filter(d => d.animo != null && L.porDia.has(d.fecha));
  const malos = conAnimo.filter(d => d.animo! <= 2).map(d => L.porDia.get(d.fecha)!.pnl);
  const buenos = conAnimo.filter(d => d.animo! >= 3).map(d => L.porDia.get(d.fecha)!.pnl);
  const mMal = avg(malos);
  const mBien = avg(buenos);
  if (malos.length >= 2 && buenos.length >= 2 && mMal != null && mBien != null) {
    add(mMal < mBien
      ? { section: "animo", key: "efecto", emoji: "📊", tone: "loss", priority: 68, text: `Tus emociones pesan: los días que operas sintiéndote mal haces de media ${pnlStr(mMal)}; los días que te sientes bien, ${pnlStr(mBien)}.`, teaser: "Tus emociones pesan 📊", action: { kind: "emociones", label: "Ver mis emociones" } }
      : { section: "animo", key: "efecto", emoji: "🧊", tone: "win", priority: 40, text: `Incluso los días que te sientes mal mantienes la cabeza fría: de media ${pnlStr(mMal)} frente a ${pnlStr(mBien)} los días buenos.` });
  }

  // Tendencia del ánimo: últimos 7 días frente a los 7 anteriores (3 días apuntados en cada uno).
  const animoEn = (desde: number, fin: number) => {
    const v: number[] = [];
    for (let i = desde; i < fin; i++) {
      const a = dias[fechaKey(diasAtras(now, i))]?.animo;
      if (a != null) v.push(a);
    }
    return v;
  };
  const semanaA = animoEn(0, 7);
  const anteriorA = animoEn(7, 14);
  if (semanaA.length >= 3 && anteriorA.length >= 3) {
    const diff = avg(semanaA)! - avg(anteriorA)!;
    if (Math.abs(diff) >= 0.5) {
      add(diff > 0
        ? { section: "animo", key: "tendencia", emoji: "🌤️", tone: "win", priority: 45, text: "Esta semana te sientes mejor que la anterior. Apunta qué ha cambiado: es una pista de lo que te sienta bien." }
        : { section: "animo", key: "tendencia", emoji: "🌧️", tone: "loss", priority: 62, text: "Esta semana te sientes peor que la anterior. Ojo: el ánimo bajo suele empujar a operar por impulso." });
    }
  }

  // El último día reciente (dos semanas) en que operó sintiéndose mal y perdió, si no es el que ya se ha contado.
  const reciente = Object.values(dias)
    .filter(d => d.animo != null && d.animo <= 2 && (L.porDia.get(d.fecha)?.pnl ?? 0) < 0)
    .filter(d => daysBetween(fechaDate(d.fecha), now) <= 14 && d.fecha !== L.hoyKey && d.fecha !== sesion?.key)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (reciente) {
    const a = animoInfo(reciente.animo!);
    const d = fechaDate(reciente.fecha);
    add({
      section: "animo", key: "reciente", emoji: "🤔", tone: "loss", priority: 58,
      text: `${cap(dayName(d))} de ${MONTHS[d.getMonth()]} te sentías «${a.label.toLowerCase()}» ${a.emoji} y cerraste en ${pnlStr(L.porDia.get(reciente.fecha)!.pnl)}. ¿Casualidad?`,
    });
  }

  const racha = rachaDias(dias, now);
  if (racha >= 3) {
    add({ section: "animo", key: "racha-diario", emoji: "📔", tone: "win", priority: 36, text: `Llevas ${racha} días seguidos contándome cómo te sientes. ¡Esa constancia es oro!` });
  }

  // ───────── Tus últimas operaciones ─────────
  if (last) {
    if (rachaTone === "loss" && rachaN >= 2) {
      add({
        section: "operaciones", key: "racha", emoji: "🛑", tone: "loss", priority: rachaN >= 3 ? 92 : 80,
        text: `Llevas ${rachaN} pérdidas seguidas. Buen momento para bajar el tamaño o tomarte un descanso: las rachas se cortan con calma, no con prisa.`,
        teaser: "Hablemos de tu racha 🧘",
      });
    } else if (rachaTone === "win" && rachaN >= 3) {
      add({
        section: "operaciones", key: "racha", emoji: "🔥", tone: "win", priority: 72,
        text: `¡${rachaN} ganadas seguidas! Disfrútalo, pero no subas el tamaño por euforia.`, teaser: "¡Vas en racha! 🔥",
      });
    }

    const riesgo = ctx.get(last.id)?.riskPct;
    if (riesgo != null && riesgo > RISK_LIMIT_PCT) {
      add({
        section: "operaciones", key: "riesgo", emoji: "⚠️", tone: "loss", priority: 86 + extra("riesgo"), persistente: persiste("riesgo"),
        text: recuerdo("riesgo", `En la última arriesgaste un ${pctStr(riesgo, false, 1)} de tu cuenta. Lo sano es no pasar del ${RISK_LIMIT_PCT} %: así una mala racha no te saca del juego.`),
        teaser: persiste("riesgo") ? "Tu riesgo sigue alto ⚠️" : "Ojo con tu riesgo ⚠️",
      });
    }

    /*
     * HABILIDAD · Tamaño por euforia. La última arriesga bastante más de lo
     * normal en él (la mediana de las 10 anteriores): suele pasar tras ganar.
     */
    const previas = trades.slice(-RECIENTES - 1, -1).map(t => t.risk_amount).filter(v => v > 0).sort((a, b) => a - b);
    if (previas.length >= 5 && last.risk_amount > 0) {
      const mediana = previas[Math.floor(previas.length / 2)];
      const sube = last.risk_amount / mediana;
      if (sube >= 1.5) {
        const trasGanar = prev?.result === "win";
        add({
          section: "operaciones", key: "tamano", emoji: "📏", tone: "loss", priority: (trasGanar ? 79 : 70) + extra("tamano"), persistente: persiste("tamano"),
          text: recuerdo("tamano", `En la última arriesgaste ${coma(sube)} veces lo que sueles${trasGanar ? ", justo después de una ganancia" : ""}. Si no estaba en tu plan, vuelve a tu tamaño de siempre: la euforia también hace perder.`),
          teaser: "Has subido el tamaño 📏",
        });
      }
    }

    if (prev?.result === "loss") {
      const min = Math.round((new Date(last.date).getTime() - new Date(prev.date).getTime()) / 60_000);
      if (min >= 0 && min < COOLDOWN_MIN) {
        add({
          section: "operaciones", key: "revancha", emoji: "⏱️", tone: "loss", priority: 84 + extra("revancha"), persistente: persiste("revancha"),
          text: recuerdo("revancha", `Tras una pérdida volviste a entrar a los ${plural(min, "minuto", "minutos")}. La próxima vez, date al menos ${COOLDOWN_MIN} minutos de aire: la revancha casi nunca sale bien.`),
          teaser: "Tengo un aviso para ti ⏱️",
        });
      }
    }

    /*
     * HABILIDAD · Stop respetado en lo reciente. Entre las últimas 10, cuántas
     * pérdidas fueron mayores que el riesgo planeado. Una sola puede ser
     * deslizamiento; dos o más ya son una costumbre.
     */
    const saltados = recientes.filter(t => t.result === "loss" && t.risk_amount > 0 && -t.pnl > t.risk_amount * STOP_HOLGURA).length;
    if (saltados >= 2) {
      add({
        section: "operaciones", key: "stop", emoji: "🧱", tone: "loss", priority: 81 + extra("stop"), persistente: persiste("stop"),
        text: recuerdo("stop", `En tus últimas ${recientes.length}, ${saltados} pérdidas fueron mayores que lo que arriesgabas. El stop es tu seguro: si lo mueves, el riesgo que apuntas deja de ser real.`),
        teaser: "Hablemos de tu stop 🧱",
      });
    }

    /*
     * HABILIDAD · Sin porqué. La mitad o más de las últimas sin estrategia ni
     * nota: el diario pierde lo que más enseña.
     */
    if (M.ahora.porque) {
      const sin = recientes.filter(t => !t.strategy && !t.notes).length;
      add({
        section: "operaciones", key: "porque", emoji: "✏️", tone: "accent", priority: 52 + extra("porque"), persistente: persiste("porque"),
        text: recuerdo("porque", `${sin} de tus últimas ${recientes.length} no llevan estrategia ni nota. Es lo que dentro de tres meses te dirá si falló el método o la disciplina: apúntalo aunque sean cuatro palabras.`),
        action: { kind: "operaciones", label: "Ver mis operaciones" },
      });
    }

    /*
     * MEMORIA · Lo corregido. Un problema que Nova vio hace una semana y que hoy,
     * con al menos tres operaciones nuevas, ya no está: se reconoce.
     */
    if (M.hace7 && M.desdeHace7 >= 3) {
      (Object.keys(COND) as CondId[])
        .filter(c => M.hace7![c] && !M.ahora[c])
        .slice(0, 2)
        .forEach(c => add({
          section: "operaciones", key: `corregido-${c}`, emoji: "👏", tone: "win", priority: 62,
          text: `Hace una semana te hablé ${de(COND[c].nombre)}, y lo has corregido: ${COND[c].corregido}. Esto es exactamente para lo que sirve un diario.`,
          teaser: `Has corregido ${COND[c].nombre} 👏`,
        }));
    }

    const ult = trades.slice(-5);
    if (ult.length >= 3) {
      const w = ult.filter(t => t.result === "win").length;
      const l = ult.filter(t => t.result === "loss").length;
      const p = ult.reduce((s, t) => s + t.pnl, 0);
      add({
        section: "operaciones", key: "ultimas", emoji: "📋", tone: p > 0 ? "win" : p < 0 ? "loss" : "be", priority: 40,
        text: `En tus últimas ${ult.length}: ${plural(w, "ganada", "ganadas")} y ${plural(l, "perdida", "perdidas")}, en total ${pnlStr(p)}.`,
        action: { kind: "operaciones", label: "Ver mis operaciones" },
      });
    }

    // Riesgo medio reciente (con capital y al menos 5 operaciones).
    const riesgos = recientes.map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
    const rMedio = avg(riesgos);
    if (riesgos.length >= 5 && rMedio != null) {
      add(rMedio > RISK_LIMIT_PCT
        ? { section: "operaciones", key: "riesgo-medio", emoji: "🎯", tone: "loss", priority: 80, text: `En tus últimas ${riesgos.length} arriesgas de media un ${pctStr(rMedio, false, 2)} por operación. Bájalo por debajo del ${RISK_LIMIT_PCT} % y dormirás mejor.` }
        : { section: "operaciones", key: "riesgo-medio", emoji: "🎯", tone: "win", priority: 32, text: `Tu riesgo medio reciente es de un ${pctStr(rMedio, false, 2)} por operación. ¡Así se protege una cuenta!` });
    }

    // Forma: las últimas 10 frente a las 10 anteriores, en R.
    const rsDe = (v: Trade[]) => v.map(rDe).filter((r): r is number => r != null);
    const ahora = rsDe(recientes);
    const antes = rsDe(trades.slice(-2 * RECIENTES, -RECIENTES));
    if (ahora.length >= 8 && antes.length >= 8) {
      const a = avg(ahora)!;
      const b = avg(antes)!;
      if (Math.abs(a - b) >= 0.2) {
        add(a > b
          ? { section: "operaciones", key: "forma", emoji: "📶", tone: "win", priority: 55, text: `Estás mejorando: tus últimas ${RECIENTES} dejan ${rStr(a)} de media, frente a ${rStr(b)} de las ${RECIENTES} anteriores.` }
          : { section: "operaciones", key: "forma", emoji: "📉", tone: "loss", priority: 70, text: `Tu forma ha bajado: tus últimas ${RECIENTES} dejan ${rStr(a)} de media, frente a ${rStr(b)} de las ${RECIENTES} anteriores. ¿Ha cambiado algo en tu forma de operar?`, teaser: "He notado un cambio en tu forma 📉" });
      }
    }

    // Datos a medias: sin riesgo apuntado no hay R, ni % de cuenta, ni hitos de disciplina.
    if (L.sinRiesgo) {
      add({
        section: "operaciones", key: "sin-riesgo", emoji: "🧩", tone: "accent", priority: 48,
        text: `${plural(L.sinRiesgo, "operación", "operaciones")} sin riesgo apuntado. Sin el riesgo no puedo medir su R ni cuánto de tu cuenta te jugaste: edítala${L.sinRiesgo === 1 ? "" : "s"} y añádelo.`,
        action: { kind: "operaciones", label: "Completar mis operaciones" },
      });
    }
  }

  // ───────── Tus hitos ─────────
  const recien = milestones
    .flatMap(m => m.reachedAt.map((at, i) => ({ m, level: i + 1, at })))
    .filter(x => x.at && daysBetween(new Date(x.at), now) <= 7)
    .sort((a, b) => b.at!.localeCompare(a.at!))[0];
  if (recien) {
    add({
      section: "hitos", key: "recien", emoji: "🎉", tone: "win", priority: 76,
      text: `¡Desbloqueaste «${recien.m.title}», nivel ${recien.level}, hace muy poco! Sigue así.`, teaser: "¡Tengo algo que celebrar! 🎉",
    });
  }
  milestones
    .filter(m => !m.locked)
    .map(m => ({ m, p: milestoneProgress(m) }))
    .filter(x => x.p.next != null)
    .sort((a, b) => b.p.progress - a.p.progress)
    .slice(0, 2)
    .forEach(({ m, p }, i) => {
      const falta = p.next! - m.best;
      const cerca = p.progress >= 75;
      add({
        section: "hitos", key: `cerca-${m.id}`, emoji: cerca ? "🔥" : i === 0 ? "🏆" : "🎯", tone: "accent", priority: cerca ? 72 : 45 - i * 5,
        text: `Te ${Math.ceil(falta) === 1 && m.id !== "rentabilidad" ? "falta" : "faltan"} ${hitoFalta(m, falta)} para desbloquear «${m.title}», nivel ${p.level + 1}.`,
        teaser: cerca ? "¡Tienes un hito muy cerca! 🏆" : undefined,
        action: i === 0 ? { kind: "hitos", label: "Ver mis hitos" } : undefined,
      });
    });
  const bloqueados = milestones.filter(m => m.locked).length;
  if (bloqueados) {
    add({
      section: "hitos", key: "capital", emoji: "🔓", tone: "accent", priority: 50,
      text: `Define tu capital inicial y se activan ${plural(bloqueados, "hito más", "hitos más")}, además de tu riesgo en %.`,
      action: { kind: "capital", label: "Definir mi capital" },
    });
  }

  // ───────── Lo que dicen tus números ─────────
  if (trades.length) {
    // Mejor y peor franja horaria (al menos 5 operaciones en cada una).
    const franjas = groupStats(trades, BREAKDOWNS.hour.keyOf).filter(g => g.count >= 5).sort((a, b) => b.pnl - a.pnl);
    if (franjas.length >= 2 && franjas[0].pnl > 0 && franjas[franjas.length - 1].pnl < 0) {
      const top = franjas[0];
      const low = franjas[franjas.length - 1];
      add({ section: "consejos", key: "franja", emoji: "🕐", tone: "be", priority: 48, text: `Tu mejor franja es ${top.label} (${pnlStr(top.pnl)}) y la peor, ${low.label} (${pnlStr(low.pnl)}). ¿Y si operas menos en la segunda?` });
    }

    // Tu mejor y tu peor estrategia, en lo reciente (últimas 30, al menos 4 de cada).
    const ult30 = trades.slice(-30);
    const estrategias = groupStats(ult30.filter(t => t.strategy), BREAKDOWNS.strategy.keyOf).filter(g => g.count >= 4).sort((a, b) => (b.expectancyR ?? -9) - (a.expectancyR ?? -9));
    if (estrategias.length >= 2) {
      const top = estrategias[0];
      const low = estrategias[estrategias.length - 1];
      if (top.expectancyR != null && low.expectancyR != null && top.expectancyR > 0 && low.expectancyR < 0) {
        add({
          section: "consejos", key: "estrategia", emoji: "🧭", tone: "accent", priority: 58,
          text: `En tus últimas ${ult30.length}, «${top.label}» te deja ${rStr(top.expectancyR)} por operación y «${low.label}» te resta ${rStr(low.expectancyR)}. Haz más de la primera y menos de la segunda, o revisa qué falla en ella.`,
          teaser: "Sé qué estrategia te funciona 🧭",
        });
      }
    }

    // Todas las lecturas del análisis, cada una con su prioridad. Fuera las que
    // Nova ya cuenta a su manera (racha y riesgo) y, si ya avisó del stop en lo
    // reciente, la del stop en todo el historial.
    const yaStop = out.some(m => m.id === "operaciones-stop");
    buildInsights(trades, stats, ctx, Infinity)
      .filter(i => i.id !== "racha" && i.id !== "riesgo" && !(yaStop && i.id === "stop"))
      .forEach(i => {
        const priority = INSIGHT[i.id]?.[i.tone] || (i.tone === "loss" ? 50 : i.tone === "win" ? 35 : 25);
        add({
          section: "consejos", key: i.id, emoji: i.tone === "win" ? "✅" : i.tone === "loss" ? "⚠️" : "💡",
          tone: i.tone, priority, text: i.text,
        });
      });

    /*
     * HABILIDAD · Antes de tu próxima sesión. Una lista corta y personal con lo
     * que más le cuesta: sale de los problemas vivos, no de un manual.
     */
    const pasos: string[] = [];
    if (M.ahora.riesgo) pasos.push(`calcula el tamaño para no pasar del ${RISK_LIMIT_PCT} % antes de entrar`);
    if (M.ahora.stop) pasos.push("pon el stop al entrar y no lo muevas en contra");
    if (M.ahora.revancha) pasos.push(`tras una pérdida, ${COOLDOWN_MIN} minutos sin pantalla`);
    if (M.ahora.porque) pasos.push("escribe por qué entras antes de entrar");
    if (animoHoy == null && sesion?.hoy) pasos.push("apunta cómo te sientes antes de la primera operación");
    if (pasos.length) {
      add({
        section: "consejos", key: "checklist", emoji: "🧾", tone: "accent", priority: 47,
        text: `Antes de tu próxima sesión: ${pasos.slice(0, 3).join("; ")}.`,
      });
    }
  }

  // ───────── Objetivo de la semana, como mensaje cuando toca celebrarlo ─────────
  if (M.objetivo?.cumplido) {
    add({
      section: "hoy", key: "objetivo-ok", emoji: "🎯", tone: "win", priority: 73,
      text: `Objetivo de la semana cumplido: «${M.objetivo.titulo}». La semana que viene te pongo otro según lo que más te cueste entonces.`,
      teaser: "¡Objetivo de la semana cumplido! 🎯",
    });
  }

  // ───────── Destacados, recorte, cara y frases ─────────
  const byPriority = [...out].sort((a, b) => b.priority - a.priority);
  // Lo más importante se elige entre TODO, antes de recortar los capítulos.
  const highlights = byPriority.filter(m => m.priority >= IMPORTANT).slice(0, 3);
  const enCapitulo = new Map<string, number>();
  const messages = byPriority.filter(m => {
    const n = (enCapitulo.get(m.section) ?? 0) + 1;
    enCapitulo.set(m.section, n);
    return n <= TOPE[m.section] || highlights.includes(m);
  });

  // La cara: preocupada con racha de pérdidas, mal ánimo o caída de la cuenta; contenta si lo reciente deja R positiva.
  const rReciente = avg(recientes.map(rDe).filter((r): r is number => r != null));
  const celebra = !!recien || L.newHighAtLast || (rachaTone === "win" && rachaN >= 3) || !!M.objetivo?.cumplido;
  const preocupa = (rachaTone === "loss" && rachaN >= 2) || (animoHoy != null && animoHoy.value <= 2) || (L.ddPct != null && L.ddPct <= -5);
  const expression: BotExpression = preocupa ? "worried" : celebra ? "celebrate" : rReciente != null && rReciente > 0.2 ? "happy" : "calm";

  const teasers = [`¡Hola, ${name}! 👋`];
  byPriority.filter(m => m.teaser).slice(0, 3).forEach(m => teasers.push(m.teaser!));
  if (M.objetivo && !M.objetivo.cumplido && M.objetivo.progreso >= 60) teasers.push("Tu objetivo de la semana está cerca 🎯");
  teasers.push(messages.length > 1 ? `Tengo ${messages.length} cosas que contarte 👀` : "Tengo algo que contarte 👀");

  const frase = byPriority.find(m => m.teaser)?.teaser ?? (messages.length > 1 ? `Tengo ${messages.length} cosas que contarte` : "Tengo algo que contarte");

  return {
    teasers, messages, highlights, expression,
    objetivo: M.objetivo,
    signature: hash(messages.map(m => `${m.id}:${m.text}`).join("|")),
    resumen: { importantes: highlights.length, total: messages.length, frase },
    analizado: now.toISOString(),
    operaciones: trades.length,
  };
}
