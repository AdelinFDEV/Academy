/**
 * Nova, el asistente del Diario de Trading (versión 1).
 *
 * Lee todo lo que el usuario ha apuntado (operaciones, sensaciones, hitos) y lo
 * cuenta en frases cortas y amables, siempre sobre el presente. Cada mensaje
 * lleva una PRIORIDAD (lo urgente sale antes y se destaca) y, si tiene sentido,
 * una ACCIÓN (un botón que lleva a hacer lo que propone).
 *
 * Además calcula el PULSO: una nota de 0 a 100 de cómo va el trader ahora mismo,
 * repartida en cuatro partes de 25 (riesgo, resultados, emociones, constancia),
 * todas sobre lo reciente. Es la lectura de Nova, no una verdad: por eso se
 * enseña desglosada y con lo que mide cada parte.
 *
 * Son reglas sobre los datos, no un modelo de IA: instantáneo, gratis y sin
 * inventar nada. Los emojis van aquí a propósito: el admin los pidió (06-11-2026).
 *
 * Se rehace ENTERO con cada dato nuevo (una operación, un ánimo, el capital),
 * decidido con el admin el 07-11-2026: lo primero que hace es reaccionar a lo
 * último apuntado. Para no ser pesada, cada capítulo tiene un tope de mensajes
 * (TOPE) y manda la prioridad; para no pasar nada por alto, «Lo más importante»
 * se elige entre todos los mensajes antes de recortar.
 */

import { MONTHS, WEEKDAY_NAMES, pctStr, pnlStr, rStr } from "./tjFormat";
import {
  BREAKDOWNS, COOLDOWN_MIN, RISK_LIMIT_PCT, buildInsights, computeStats, groupStats, milestoneProgress,
  periodReads, welcomeReading, type Milestone, type Stats, type Trade, type TradeContext,
} from "./tjStats";
import { animoInfo, fechaDate, fechaKey, pnlPorDia, rachaDias, type DiasMap } from "./tjDias";

export type BotSection = "pulso" | "hoy" | "animo" | "operaciones" | "hitos" | "consejos";
export type BotTone = "win" | "loss" | "be" | "accent";
export type BotActionKind = "nuevo" | "hitos" | "capital" | "emociones" | "operaciones";
export type BotExpression = "happy" | "calm" | "worried" | "celebrate";

export interface BotAction {
  kind: BotActionKind;
  label: string;
}

export interface BotMessage {
  id: string;
  section: Exclude<BotSection, "pulso">;
  emoji: string;
  text: string;
  tone: BotTone;
  /** 0-100. A partir de IMPORTANT se destaca y sube a «Lo más importante». */
  priority: number;
  /** Frase corta para la píldora, si este mensaje merece anunciarse. */
  teaser?: string;
  action?: BotAction;
}

export interface PulsePart {
  id: "riesgo" | "resultados" | "emociones" | "constancia";
  label: string;
  /** 0-25, o null si aún no hay datos para medirla (cuenta como la mitad). */
  value: number | null;
  hint: string;
}

export interface BotPulse {
  score: number;
  label: string;
  parts: PulsePart[];
}

export interface BotReport {
  /** Frases cortas que rotan junto al avatar: el saludo y luego lo más urgente. */
  teasers: string[];
  messages: BotMessage[];
  /** Los mensajes más importantes (prioridad alta), para el primer capítulo. */
  highlights: BotMessage[];
  pulse: BotPulse | null;
  /** La cara de Nova según cómo va el usuario. */
  expression: BotExpression;
  /** Huella de los mensajes: si cambia, hay algo nuevo que el usuario no ha visto. */
  signature: string;
  /** Cuándo se hizo el análisis (ISO) y con cuántas operaciones. */
  analizado: string;
  operaciones: number;
}

export const BOT_NAME = "Nova";
/** Dónde guarda el Diario la huella del último análisis (la lee NovaNav para avisar de novedades). */
export const NOVA_FIRMA = "nova-firma";
export const IMPORTANT = 75;

export const SECTION_LABEL: Record<BotSection, string> = {
  pulso: "Tu pulso",
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
const daysBetween = (a: Date, b: Date) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 864e5);

/** Cómo se nombra lo que falta para cada hito, en singular y plural. */
const HITO_UNIDAD: Record<string, [string, string]> = {
  muestra: ["operación más", "operaciones más"],
  disciplina: [`operación más seguida arriesgando ≤ ${RISK_LIMIT_PCT} %`, `operaciones más seguidas arriesgando ≤ ${RISK_LIMIT_PCT} %`],
  porque: ["operación más con estrategia o nota", "operaciones más con estrategia o nota"],
  revancha: ["vez más esperando tras una pérdida", "veces más esperando tras una pérdida"],
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

/** Cuántas operaciones recientes miran el pulso y la forma. */
const RECIENTES = 10;

// ─────────────────────────── Pulso ───────────────────────────

function buildPulse(trades: Trade[], dias: DiasMap, ctx: Map<string, TradeContext>, now: Date): BotPulse | null {
  if (!trades.length) return null;
  const ult = trades.slice(-RECIENTES);

  // Riesgo: qué parte de las últimas arriesgó ≤ 2 % de la cuenta.
  const riesgos = ult.map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
  const riesgo = riesgos.length ? (riesgos.filter(r => r <= RISK_LIMIT_PCT).length / riesgos.length) * 25 : null;

  // Resultados: esperanza en R de las últimas, de −1R (0) a +1R (25).
  const rs = ult.map(t => (t.risk_amount > 0 ? t.pnl / t.risk_amount : null)).filter((r): r is number => r != null);
  const rMedia = avg(rs);
  const resultados = rMedia != null ? ((clamp(rMedia, -1, 1) + 1) / 2) * 25 : (computeStats(ult).winRate / 100) * 25;

  // Emociones: ánimo medio de los últimos 7 días, de «muy mal» (0) a «fantástico» (25).
  const animos: number[] = [];
  for (let i = 0; i < 7; i++) {
    const a = dias[fechaKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12))]?.animo;
    if (a != null) animos.push(a);
  }
  const aMedia = avg(animos);
  const emociones = aMedia != null ? ((aMedia - 1) / 3) * 25 : null;

  // Constancia: días apuntados de los últimos 14 (la mitad) y operaciones con estrategia o nota (la otra mitad).
  let apuntados = 0;
  for (let i = 0; i < 14; i++) {
    if (dias[fechaKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12))]) apuntados++;
  }
  const conPorque = ult.filter(t => t.strategy || t.notes).length / ult.length;
  const constancia = (apuntados / 14) * 12.5 + conPorque * 12.5;

  const parts: PulsePart[] = [
    {
      id: "riesgo", label: "Riesgo", value: riesgo,
      hint: riesgo == null ? "Define tu capital para medirlo" : `${riesgos.filter(r => r <= RISK_LIMIT_PCT).length} de ${riesgos.length} con ≤ ${RISK_LIMIT_PCT} % de la cuenta`,
    },
    {
      id: "resultados", label: "Resultados", value: resultados,
      hint: rMedia != null ? `${rStr(rMedia)} de media en tus últimas ${ult.length}` : `${Math.round(computeStats(ult).winRate)} % de acierto en tus últimas ${ult.length}`,
    },
    {
      id: "emociones", label: "Emociones", value: emociones,
      hint: aMedia != null ? `Tu ánimo medio esta semana: ${animoInfo(Math.round(aMedia) as 1 | 2 | 3 | 4).label.toLowerCase()}` : "Cuéntame cómo te sientes para medirlo",
    },
    {
      id: "constancia", label: "Constancia", value: constancia,
      hint: `${apuntados} de 14 días apuntados · ${Math.round(conPorque * 100)} % con porqué`,
    },
  ];

  // Lo que aún no se puede medir cuenta como la mitad: ni premia ni castiga.
  const score = Math.round(parts.reduce((s, p) => s + (p.value ?? 12.5), 0));
  const label = score >= 75 ? "En plena forma" : score >= 55 ? "Vas por buen camino" : score >= 35 ? "Con cuidado" : "Momento de parar y revisar";
  return { score, label, parts };
}

// ─────────────────────────── Informe ───────────────────────────

/*
 * Cuántos mensajes enseña cada capítulo como mucho. Nova se rehace con CADA
 * dato nuevo, así que tiene que ser corta: dentro de cada capítulo manda la
 * prioridad y lo que no cabe se queda fuera. Lo urgente nunca se pierde:
 * «Lo más importante» se elige ANTES de recortar, entre todos los mensajes.
 */
const TOPE: Record<Exclude<BotSection, "pulso">, number> = {
  hoy: 4,
  animo: 3,
  operaciones: 4,
  hitos: 2,
  consejos: 4,
};

/** Cuántos días atrás un día con operaciones sigue siendo «tu última sesión» (cubre un fin de semana). */
const SESION_DIAS = 3;
/** Cuántos días atrás lo último que apuntaste aún merece una reacción de Nova. */
const NOVEDAD_DIAS = 3;
/** Pérdida que supera el riesgo planeado en más de esto: el stop no se respetó. */
const STOP_HOLGURA = 1.1;

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

/** R de una operación (lo ganado o perdido en veces el riesgo), si tiene riesgo. */
const rDe = (t: Trade) => (t.risk_amount > 0 ? t.pnl / t.risk_amount : null);

export function buildBotReport({ name, trades, dias, milestones, ctx, stats, capital, now }: Input): BotReport {
  const out: BotMessage[] = [];
  const add = (m: Omit<BotMessage, "id"> & { key: string }) => {
    const { key, ...rest } = m;
    out.push({ id: `${m.section}-${key}`, ...rest });
  };

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
  const last = trades[trades.length - 1];
  const { tone: rachaTone, count: rachaN } = stats.currentStreak;

  // Lo último que el usuario APUNTÓ (por cuándo lo guardó, no por la fecha de la operación).
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
      const otrosDias = [...porDia.entries()].filter(([k]) => k !== sesion.key).map(([, v]) => v.count);
      const normal = avg(otrosDias);
      if (normal != null && sesion.count >= 3 && sesion.count >= normal * 2) {
        add({
          section: "hoy", key: "sobreoperar", emoji: "🌀", tone: "loss", priority: 85,
          text: `${cap(cuando)} ${sesion.hoy ? "llevas" : "hiciste"} ${sesion.count} operaciones y un día normal tuyo tiene ${normal.toFixed(1).replace(".", ",")}. Operar de más suele salir caro: ¿cada entrada estaba en tu plan?`,
          teaser: "Mucha actividad… 👀",
        });
      }
      add({
        section: "hoy", key: "sesion", emoji: sesion.pnl >= 0 ? "💪" : "🧘", tone: sesion.pnl >= 0 ? "win" : "loss", priority: 58,
        text: `${sesion.hoy ? "Hoy llevas" : `Tu última sesión fue ${sesion.dia}:`} ${plural(sesion.count, "operación", "operaciones")} y ${sesion.hoy ? "vas" : "cerraste"} en ${pnlStr(sesion.pnl)}. ${sesion.pnl >= 0 ? "¡Buen día!" : "Respira: un mal día no define tu mes."}`,
        teaser: sesion.pnl > 0 ? "¡Buen día de trading! 💪" : undefined,
      });
    }

    if (newHighAtLast && trades.length >= 3 && capital) {
      add({
        section: "hoy", key: "maximo", emoji: "🚀", tone: "win", priority: 78,
        text: `¡Tu cuenta acaba de marcar un nuevo máximo: ${pnlStr(equity - capital)} desde el inicio! Es justo cuando más cuesta mantener la disciplina.`,
        teaser: "¡Nuevo máximo de tu cuenta! 🚀",
      });
    } else if (ddPct != null && ddPct <= -5) {
      add({
        section: "hoy", key: "caida", emoji: "🛡️", tone: "loss", priority: 82,
        text: `Estás un ${pctStr(Math.abs(ddPct), false, 1)} por debajo de tu máximo (${pnlStr(equity - peak)}). Ahora lo primero es proteger la cuenta: tamaño pequeño y solo tus mejores entradas.`,
        teaser: "Hablemos de tu cuenta 🛡️",
      });
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
    // Operó y no contó cómo estaba: se le pide, sin insistir si no ha operado.
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
  const conAnimo = Object.values(dias).filter(d => d.animo != null && porDia.has(d.fecha));
  const malos = conAnimo.filter(d => d.animo! <= 2).map(d => porDia.get(d.fecha)!.pnl);
  const buenos = conAnimo.filter(d => d.animo! >= 3).map(d => porDia.get(d.fecha)!.pnl);
  const mMal = avg(malos);
  const mBien = avg(buenos);
  if (malos.length >= 2 && buenos.length >= 2 && mMal != null && mBien != null) {
    add(mMal < mBien
      ? { section: "animo", key: "efecto", emoji: "📊", tone: "loss", priority: 68, text: `Tus emociones pesan: los días que operas sintiéndote mal haces de media ${pnlStr(mMal)}; los días que te sientes bien, ${pnlStr(mBien)}.`, teaser: "Tus emociones pesan 📊", action: { kind: "emociones", label: "Ver mis emociones" } }
      : { section: "animo", key: "efecto", emoji: "🧊", tone: "win", priority: 40, text: `Incluso los días que te sientes mal mantienes la cabeza fría: de media ${pnlStr(mMal)} frente a ${pnlStr(mBien)} los días buenos.` });
  }

  // Tendencia del ánimo: últimos 7 días frente a los 7 anteriores (3 días apuntados en cada uno).
  const animoEn = (desde: number, hasta: number) => {
    const v: number[] = [];
    for (let i = desde; i < hasta; i++) {
      const a = dias[fechaKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12))]?.animo;
      if (a != null) v.push(a);
    }
    return v;
  };
  const semana = animoEn(0, 7);
  const anterior = animoEn(7, 14);
  if (semana.length >= 3 && anterior.length >= 3) {
    const diff = avg(semana)! - avg(anterior)!;
    if (Math.abs(diff) >= 0.5) {
      add(diff > 0
        ? { section: "animo", key: "tendencia", emoji: "🌤️", tone: "win", priority: 45, text: "Esta semana te sientes mejor que la anterior. Apunta qué ha cambiado: es una pista de lo que te sienta bien." }
        : { section: "animo", key: "tendencia", emoji: "🌧️", tone: "loss", priority: 62, text: "Esta semana te sientes peor que la anterior. Ojo: el ánimo bajo suele empujar a operar por impulso." });
    }
  }

  // El último día reciente (dos semanas) en que operó sintiéndose mal y perdió, si no es el que ya se ha contado.
  const reciente = Object.values(dias)
    .filter(d => d.animo != null && d.animo <= 2 && (porDia.get(d.fecha)?.pnl ?? 0) < 0)
    .filter(d => daysBetween(fechaDate(d.fecha), now) <= 14 && d.fecha !== hoyKey && d.fecha !== sesion?.key)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (reciente) {
    const a = animoInfo(reciente.animo!);
    const d = fechaDate(reciente.fecha);
    add({
      section: "animo", key: "reciente", emoji: "🤔", tone: "loss", priority: 58,
      text: `${cap(dayName(d))} de ${MONTHS[d.getMonth()]} te sentías «${a.label.toLowerCase()}» ${a.emoji} y cerraste en ${pnlStr(porDia.get(reciente.fecha)!.pnl)}. ¿Casualidad?`,
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
        section: "operaciones", key: "riesgo", emoji: "⚠️", tone: "loss", priority: 86,
        text: `En la última arriesgaste un ${pctStr(riesgo, false, 1)} de tu cuenta. Lo sano es no pasar del ${RISK_LIMIT_PCT} %: así una mala racha no te saca del juego.`,
        teaser: "Ojo con tu riesgo ⚠️",
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
        const trasGanar = trades[trades.length - 2]?.result === "win";
        add({
          section: "operaciones", key: "tamano", emoji: "📏", tone: "loss", priority: trasGanar ? 79 : 70,
          text: `En la última arriesgaste ${sube.toFixed(1).replace(".", ",")} veces lo que sueles${trasGanar ? ", justo después de una ganancia" : ""}. Si no estaba en tu plan, vuelve a tu tamaño de siempre: la euforia también hace perder.`,
          teaser: "Has subido el tamaño 📏",
        });
      }
    }

    const prev = trades[trades.length - 2];
    if (prev?.result === "loss") {
      const min = Math.round((new Date(last.date).getTime() - new Date(prev.date).getTime()) / 60_000);
      if (min >= 0 && min < COOLDOWN_MIN) {
        add({
          section: "operaciones", key: "revancha", emoji: "⏱️", tone: "loss", priority: 84,
          text: `Tras una pérdida volviste a entrar a los ${plural(min, "minuto", "minutos")}. La próxima vez, date al menos ${COOLDOWN_MIN} minutos de aire: la revancha casi nunca sale bien.`,
          teaser: "Tengo un aviso para ti ⏱️",
        });
      }
    }

    /*
     * HABILIDAD · Stop respetado en lo reciente. Entre las últimas 10, cuántas
     * pérdidas fueron mayores que el riesgo planeado. Una sola puede ser
     * deslizamiento; dos o más ya son una costumbre.
     */
    const recientes = trades.slice(-RECIENTES);
    const saltados = recientes.filter(t => t.result === "loss" && t.risk_amount > 0 && -t.pnl > t.risk_amount * STOP_HOLGURA).length;
    if (saltados >= 2) {
      add({
        section: "operaciones", key: "stop", emoji: "🧱", tone: "loss", priority: 81,
        text: `En tus últimas ${recientes.length}, ${saltados} pérdidas fueron mayores que lo que arriesgabas. El stop es tu seguro: si lo mueves, el riesgo que apuntas deja de ser real.`,
        teaser: "Hablemos de tu stop 🧱",
      });
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
  }

  // ───────── Pulso, destacados, recorte, cara y frases ─────────
  const pulse = buildPulse(trades, dias, ctx, now);
  const byPriority = [...out].sort((a, b) => b.priority - a.priority);
  // Lo más importante se elige entre TODO, antes de recortar los capítulos.
  const highlights = byPriority.filter(m => m.priority >= IMPORTANT).slice(0, 3);
  const enCapitulo = new Map<string, number>();
  const messages = byPriority.filter(m => {
    const n = (enCapitulo.get(m.section) ?? 0) + 1;
    enCapitulo.set(m.section, n);
    return n <= TOPE[m.section] || highlights.includes(m);
  });

  const celebra = !!recien || newHighAtLast || (rachaTone === "win" && rachaN >= 3);
  const preocupa = (rachaTone === "loss" && rachaN >= 2) || (animoHoy != null && animoHoy.value <= 2) || (pulse != null && pulse.score < 40);
  const expression: BotExpression = preocupa ? "worried" : celebra ? "celebrate" : pulse != null && pulse.score >= 65 ? "happy" : "calm";

  const teasers = [`¡Hola, ${name}! 👋`];
  byPriority.filter(m => m.teaser).slice(0, 3).forEach(m => teasers.push(m.teaser!));
  teasers.push(messages.length > 1 ? `Tengo ${messages.length} cosas que contarte 👀` : "Tengo algo que contarte 👀");
  if (pulse) teasers.push(`Tu pulso de hoy: ${pulse.score}/100 💓`);

  return {
    teasers, messages, highlights, pulse, expression,
    signature: hash(messages.map(m => `${m.id}:${m.text}`).join("|")),
    analizado: now.toISOString(),
    operaciones: trades.length,
  };
}
