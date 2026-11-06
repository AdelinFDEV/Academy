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
}

export const BOT_NAME = "Nova";
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

export function buildBotReport({ name, trades, dias, milestones, ctx, stats, capital, now }: Input): BotReport {
  const out: BotMessage[] = [];
  const add = (m: Omit<BotMessage, "id"> & { key: string }) => {
    const { key, ...rest } = m;
    out.push({ id: `${m.section}-${key}`, ...rest });
  };

  const hoyKey = fechaKey(now);
  const porDia = pnlPorDia(trades);
  const hoy = porDia.get(hoyKey);
  const animoHoy = dias[hoyKey]?.animo ? animoInfo(dias[hoyKey].animo!) : null;
  const last = trades[trades.length - 1];
  const { tone: rachaTone, count: rachaN } = stats.currentStreak;

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

  // ───────── Tu situación: hoy y esta semana ─────────
  if (!trades.length) {
    add({
      section: "hoy", key: "vacio", emoji: "✍️", tone: "accent", priority: 95,
      text: `¡Bienvenido a tu diario, ${name}! Apunta tu primera operación y empiezo a ayudarte con todo lo que veo.`,
      teaser: "¡Empecemos tu diario! ✍️", action: { kind: "nuevo", label: "Apuntar mi primera operación" },
    });
  } else {
    if (hoy) {
      // Sobreoperar: hoy el doble (o más) de lo normal en un día con operaciones.
      const otrosDias = [...porDia.entries()].filter(([k]) => k !== hoyKey).map(([, v]) => v.count);
      const normal = avg(otrosDias);
      if (normal != null && hoy.count >= 3 && hoy.count >= normal * 2) {
        add({
          section: "hoy", key: "sobreoperar", emoji: "🌀", tone: "loss", priority: 85,
          text: `Hoy llevas ${hoy.count} operaciones y un día normal tuyo tiene ${normal.toFixed(1).replace(".", ",")}. Operar de más suele salir caro: ¿cada entrada estaba en tu plan?`,
          teaser: "Mucha actividad hoy… 👀",
        });
      }
      add({
        section: "hoy", key: "hoy", emoji: hoy.pnl >= 0 ? "💪" : "🧘", tone: hoy.pnl >= 0 ? "win" : "loss", priority: 70,
        text: hoy.pnl >= 0
          ? `Hoy llevas ${plural(hoy.count, "operación", "operaciones")} y vas ${pnlStr(hoy.pnl)}. ¡Buen día!`
          : `Hoy llevas ${plural(hoy.count, "operación", "operaciones")} y vas ${pnlStr(hoy.pnl)}. Respira: un mal día no define tu mes.`,
        teaser: hoy.pnl > 0 ? "¡Buen día de trading! 💪" : undefined,
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

    add({ section: "hoy", key: "lectura", emoji: "🗓️", tone: "be", priority: 30, text: welcomeReading(periodReads(trades, now), trades.length) });

    const sinOperar = last ? daysBetween(new Date(last.date), now) : 0;
    if (sinOperar >= 7) {
      add({ section: "hoy", key: "pausa", emoji: "😌", tone: "be", priority: 40, text: `Llevas ${plural(sinOperar, "día", "días")} sin operar. Esperar al momento bueno también es operar bien.` });
    }
    if (capital) {
      const ret = (stats.totalPnl / capital) * 100;
      add({
        section: "hoy", key: "cuenta", emoji: ret >= 0 ? "📈" : "📉", tone: ret > 0 ? "win" : ret < 0 ? "loss" : "be", priority: 35,
        text: `Tu cuenta está en ${pctStr(ret, true, 2)} desde que empezaste (${pnlStr(stats.totalPnl)}).`,
      });
    }
  }

  // ───────── Tus sensaciones ─────────
  if (!animoHoy) {
    add({
      section: "animo", key: "hoy-falta", emoji: "🙂", tone: "accent", priority: 55,
      text: "Aún no me has contado cómo te sientes hoy. Me ayuda a entender tus resultados: elige un emoji al apuntar tu próxima operación.",
      teaser: "¿Cómo te sientes hoy? 🙂", action: { kind: "nuevo", label: "Contarte cómo me siento" },
    });
  } else if (animoHoy.value <= 2) {
    add({
      section: "animo", key: "hoy-mal", emoji: animoHoy.emoji, tone: "loss", priority: hoy ? 90 : 75,
      text: hoy
        ? `Hoy te sientes «${animoHoy.label.toLowerCase()}» y has operado. Con la cabeza cargada se toman peores decisiones: si dudas, para por hoy.`
        : `Hoy no es tu mejor día (${animoHoy.label.toLowerCase()}). Si no te ves fino, no operar también es una decisión ganadora.`,
      teaser: "Hoy cuídate un poco 🫶",
    });
  } else {
    add({ section: "animo", key: "hoy-bien", emoji: animoHoy.emoji, tone: "win", priority: 30, text: `Hoy te sientes «${animoHoy.label.toLowerCase()}». ¡Aprovéchalo, pero sin saltarte tu plan!` });
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

  // El último día reciente (dos semanas) en que operó sintiéndose mal y perdió.
  const reciente = Object.values(dias)
    .filter(d => d.animo != null && d.animo <= 2 && (porDia.get(d.fecha)?.pnl ?? 0) < 0)
    .filter(d => daysBetween(fechaDate(d.fecha), now) <= 14 && d.fecha !== hoyKey)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (reciente) {
    const a = animoInfo(reciente.animo!);
    const d = fechaDate(reciente.fecha);
    add({
      section: "animo", key: "reciente", emoji: "🤔", tone: "loss", priority: 60,
      text: `${cap(dayName(d))} de ${MONTHS[d.getMonth()]} te sentías «${a.label.toLowerCase()}» ${a.emoji} y cerraste en ${pnlStr(porDia.get(reciente.fecha)!.pnl)}. ¿Casualidad?`,
    });
  }

  const racha = rachaDias(dias, now);
  if (racha >= 3) {
    add({ section: "animo", key: "racha-diario", emoji: "📔", tone: "win", priority: 38, text: `Llevas ${racha} días seguidos contándome cómo te sientes. ¡Esa constancia es oro!` });
  }

  // ───────── Tus últimas operaciones ─────────
  if (last) {
    const d = new Date(last.date);
    add({
      section: "operaciones", key: "ultima", emoji: last.result === "win" ? "✅" : last.result === "loss" ? "❌" : "➖",
      tone: last.pnl > 0 ? "win" : last.pnl < 0 ? "loss" : "be", priority: 45,
      text: `Tu última operación: ${last.pair} en ${last.direction}, ${dayName(d)}, cerró en ${pnlStr(last.pnl)}.`,
      action: { kind: "operaciones", label: "Ver mis operaciones" },
    });

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

    const ult = trades.slice(-5);
    if (ult.length >= 3) {
      const w = ult.filter(t => t.result === "win").length;
      const l = ult.filter(t => t.result === "loss").length;
      const p = ult.reduce((s, t) => s + t.pnl, 0);
      add({
        section: "operaciones", key: "ultimas", emoji: "📋", tone: p > 0 ? "win" : p < 0 ? "loss" : "be", priority: 40,
        text: `En tus últimas ${ult.length}: ${plural(w, "ganada", "ganadas")} y ${plural(l, "perdida", "perdidas")}, en total ${pnlStr(p)}.`,
      });
    }

    // Riesgo medio reciente (con capital y al menos 5 operaciones).
    const riesgos = trades.slice(-RECIENTES).map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
    const rMedio = avg(riesgos);
    if (riesgos.length >= 5 && rMedio != null) {
      add(rMedio > RISK_LIMIT_PCT
        ? { section: "operaciones", key: "riesgo-medio", emoji: "🎯", tone: "loss", priority: 80, text: `En tus últimas ${riesgos.length} arriesgas de media un ${pctStr(rMedio, false, 2)} por operación. Bájalo por debajo del ${RISK_LIMIT_PCT} % y dormirás mejor.` }
        : { section: "operaciones", key: "riesgo-medio", emoji: "🎯", tone: "win", priority: 32, text: `Tu riesgo medio reciente es de un ${pctStr(rMedio, false, 2)} por operación. ¡Así se protege una cuenta!` });
    }

    // Forma: las últimas 10 frente a las 10 anteriores, en R.
    const rsDe = (v: Trade[]) => v.map(t => (t.risk_amount > 0 ? t.pnl / t.risk_amount : null)).filter((r): r is number => r != null);
    const ahora = rsDe(trades.slice(-RECIENTES));
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
  const enCurso = milestones
    .filter(m => !m.locked)
    .map(m => ({ m, p: milestoneProgress(m) }))
    .filter(x => x.p.next != null)
    .sort((a, b) => b.p.progress - a.p.progress);
  enCurso.slice(0, 2).forEach(({ m, p }, i) => {
    const falta = p.next! - m.best;
    const cerca = p.progress >= 75;
    add({
      section: "hitos", key: `cerca-${m.id}`, emoji: cerca ? "🔥" : i === 0 ? "🏆" : "🎯", tone: "accent", priority: cerca ? 72 : 45 - i * 5,
      text: `Te ${Math.ceil(falta) === 1 && m.id !== "rentabilidad" ? "falta" : "faltan"} ${hitoFalta(m, falta)} para desbloquear «${m.title}», nivel ${p.level + 1}.`,
      teaser: cerca ? "¡Tienes un hito muy cerca! 🏆" : undefined,
      action: i === 0 ? { kind: "hitos", label: "Ver mis hitos" } : undefined,
    });
  });
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
    buildInsights(trades, stats, ctx)
      .filter(i => !/^(Llevas|Racha)/.test(i.text))
      .slice(0, 3)
      .forEach((i, n) => add({
        section: "consejos", key: String(n), emoji: i.tone === "win" ? "✅" : i.tone === "loss" ? "⚠️" : "💡",
        tone: i.tone, priority: i.tone === "loss" ? 50 : i.tone === "win" ? 35 : 25, text: i.text,
      }));
  }

  // ───────── Pulso, destacados, cara y frases ─────────
  const pulse = buildPulse(trades, dias, ctx, now);
  const byPriority = [...out].sort((a, b) => b.priority - a.priority);
  const highlights = byPriority.filter(m => m.priority >= IMPORTANT).slice(0, 3);

  const celebra = !!recien || newHighAtLast || (rachaTone === "win" && rachaN >= 3);
  const preocupa = (rachaTone === "loss" && rachaN >= 2) || (animoHoy != null && animoHoy.value <= 2) || (pulse != null && pulse.score < 40);
  const expression: BotExpression = preocupa ? "worried" : celebra ? "celebrate" : pulse != null && pulse.score >= 65 ? "happy" : "calm";

  const teasers = [`¡Hola, ${name}! 👋`];
  byPriority.filter(m => m.teaser).slice(0, 3).forEach(m => teasers.push(m.teaser!));
  teasers.push(out.length > 1 ? `Tengo ${out.length} cosas que contarte 👀` : "Tengo algo que contarte 👀");
  if (pulse) teasers.push(`Tu pulso de hoy: ${pulse.score}/100 💓`);

  return {
    teasers, messages: out, highlights, pulse, expression,
    signature: hash(out.map(m => `${m.id}:${m.text}`).join("|")),
  };
}
