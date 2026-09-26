import { MONTHS, WEEKDAY_NAMES, pctStr, pnlStr, rStr } from "./tjFormat";

export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "breakeven";

export interface Trade {
  id: string;
  date: string;
  pair: string;
  direction: Direction;
  risk_amount: number;
  expected_gain: number;
  pnl: number;
  /** Lo que de verdad pasó. null = el P&L es el del plan (objetivo o −riesgo). */
  real_pnl: number | null;
  result: TradeResult;
  strategy: string | null;
  notes: string | null;
  created_at: string;
}

/** Riesgo por encima del cual una operación se considera agresiva. */
export const RISK_LIMIT_PCT = 2;
/** Tamaño mínimo de un grupo (un par, un día…) para sacar conclusiones de él. */
const MIN_GROUP = 5;
/** Por debajo de esto, cualquier estadística es sobre todo ruido. */
export const MIN_SAMPLE = 30;

/**
 * Orden cronológico estable. El selector guarda la fecha con precisión de minutos,
 * así que dos operaciones seguidas empatan a menudo: sin desempate, el orden que
 * devuelve la BD es arbitrario y la curva de capital acumula el P&L al revés.
 */
export function byChronology(a: Trade, b: Trade): number {
  return a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at);
}

/** Múltiplo de R realizado: lo ganado o perdido en unidades de riesgo. */
export const rOf = (t: Trade): number | null => (t.risk_amount > 0 ? t.pnl / t.risk_amount : null);

export const resultTone = (r: TradeResult) => (r === "breakeven" ? "be" : r);

// ─────────────────────────── Contexto de cuenta ───────────────────────────

export interface TradeContext {
  equityBefore: number | null;
  riskPct: number | null;
}

/**
 * Capital de la cuenta justo antes de cada operación y qué porcentaje arriesgó.
 * Se calcula siempre sobre el historial completo, no sobre lo filtrado: el
 * riesgo de una operación no cambia porque la mires sola.
 */
export function accountContext(trades: Trade[], capital: number | null): Map<string, TradeContext> {
  const map = new Map<string, TradeContext>();
  let equity = capital;
  for (const t of trades) {
    map.set(t.id, {
      equityBefore: equity,
      riskPct: equity != null && equity > 0 ? (t.risk_amount / equity) * 100 : null,
    });
    if (equity != null) equity += t.pnl;
  }
  return map;
}

// ─────────────────────────── Estadísticas ───────────────────────────

export interface Stats {
  count: number;
  wins: number;
  losses: number;
  bes: number;
  totalPnl: number;
  winRate: number;
  avgPnl: number;
  avgWin: number;
  avgLoss: number;
  best: number | null;
  worst: number | null;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number | null;
  payoff: number | null;
  expectancyR: number | null;
  totalR: number;
  bestWinStreak: number;
  bestLossStreak: number;
  currentStreak: { tone: "win" | "loss" | null; count: number };
}

export function computeStats(trades: Trade[]): Stats {
  let wins = 0, losses = 0, bes = 0, grossProfit = 0, grossLoss = 0;
  let sumWin = 0, sumLoss = 0, rSum = 0, rCount = 0;
  let best: number | null = null, worst: number | null = null;
  let bestWinStreak = 0, bestLossStreak = 0, runWin = 0, runLoss = 0;

  for (const t of trades) {
    if (t.pnl > 0) {
      grossProfit += t.pnl;
      if (best == null || t.pnl > best) best = t.pnl;
    } else if (t.pnl < 0) {
      grossLoss -= t.pnl;
      if (worst == null || t.pnl < worst) worst = t.pnl;
    }
    const r = rOf(t);
    if (r != null) { rSum += r; rCount++; }

    // El breakeven ni suma ni rompe una racha: se salta.
    if (t.result === "win") {
      wins++; sumWin += t.pnl;
      runLoss = 0; runWin++;
      bestWinStreak = Math.max(bestWinStreak, runWin);
    } else if (t.result === "loss") {
      losses++; sumLoss += t.pnl;
      runWin = 0; runLoss++;
      bestLossStreak = Math.max(bestLossStreak, runLoss);
    } else {
      bes++;
    }
  }

  const count = trades.length;
  const totalPnl = grossProfit - grossLoss;
  const avgWin = wins ? sumWin / wins : 0;
  const avgLoss = losses ? sumLoss / losses : 0;

  return {
    count, wins, losses, bes, totalPnl,
    winRate: count ? (wins / count) * 100 : 0,
    avgPnl: count ? totalPnl / count : 0,
    avgWin, avgLoss, best, worst, grossProfit, grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null,
    payoff: wins && losses ? avgWin / Math.abs(avgLoss) : null,
    expectancyR: rCount ? rSum / rCount : null,
    totalR: rSum,
    bestWinStreak, bestLossStreak,
    currentStreak: runWin ? { tone: "win", count: runWin } : runLoss ? { tone: "loss", count: runLoss } : { tone: null, count: 0 },
  };
}

// ─────────────────────────── Ejecución frente al plan ───────────────────────────

export interface Execution {
  /** Operaciones con P&L real apuntado. */
  count: number;
  wins: number;
  losses: number;
  /** Parte del objetivo que se llevan de media las ganadoras (1 = el objetivo entero). */
  captured: number | null;
  /** Pérdida media frente al riesgo planeado (1 = justo el stop; más = deslizamiento o stop movido). */
  lossVsStop: number | null;
}

const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/** Solo mira operaciones con P&L real: en las demás, plan y resultado son lo mismo por definición. */
export function executionStats(trades: Trade[]): Execution {
  const real = trades.filter(t => t.real_pnl != null);
  const won = real.filter(t => t.pnl > 0 && t.expected_gain > 0).map(t => t.pnl / t.expected_gain);
  const lost = real.filter(t => t.pnl < 0 && t.risk_amount > 0).map(t => -t.pnl / t.risk_amount);
  return { count: real.length, wins: won.length, losses: lost.length, captured: avg(won), lossVsStop: avg(lost) };
}

// ─────────────────────────── Curva de capital ───────────────────────────

export interface EquityPoint {
  label: string;
  equity: number;
  dd: number;
  ddPct: number | null;
  trade: Trade | null;
}

/**
 * Sin capital (base 0) la curva es solo P&L acumulado, y un drawdown en % sobre
 * un pico de P&L no significa nada: ganar 20 $ y perderlos saldría como −100 %.
 * Por eso ddPct solo existe cuando hay capital de partida.
 */
export function equitySeries(trades: Trade[], base: number): EquityPoint[] {
  const hasBase = base > 0;
  const points: EquityPoint[] = [{ label: "Inicio", equity: base, dd: 0, ddPct: hasBase ? 0 : null, trade: null }];
  let equity = base;
  let peak = base;
  for (const t of trades) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    points.push({
      label: new Date(t.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
      equity,
      dd: equity - peak,
      ddPct: hasBase && peak > 0 ? ((equity - peak) / peak) * 100 : null,
      trade: t,
    });
  }
  return points;
}

export function maxDrawdown(series: EquityPoint[]): { abs: number; pct: number | null } {
  let abs = 0;
  let pct: number | null = null;
  for (const p of series) {
    abs = Math.min(abs, p.dd);
    if (p.ddPct != null) pct = Math.min(pct ?? 0, p.ddPct);
  }
  return { abs, pct };
}

// ─────────────────────────── Filtros ───────────────────────────

export type RangeId = "all" | "30d" | "90d" | "ytd";

export interface Filters {
  range: RangeId;
  pair: string;
  strategy: string;
  direction: "" | Direction;
}

export const NO_FILTERS: Filters = { range: "all", pair: "", strategy: "", direction: "" };
export const NO_STRATEGY = "Sin estrategia";

export const isFiltered = (f: Filters) => f.range !== "all" || !!f.pair || !!f.strategy || !!f.direction;

export function applyFilters(trades: Trade[], f: Filters, now: Date): Trade[] {
  let from = -Infinity;
  if (f.range === "30d") from = now.getTime() - 30 * 864e5;
  if (f.range === "90d") from = now.getTime() - 90 * 864e5;
  if (f.range === "ytd") from = new Date(now.getFullYear(), 0, 1).getTime();
  return trades.filter(t =>
    new Date(t.date).getTime() >= from &&
    (!f.pair || t.pair === f.pair) &&
    (!f.strategy || (t.strategy ?? NO_STRATEGY) === f.strategy) &&
    (!f.direction || t.direction === f.direction)
  );
}

/** Valores distintos de un campo, del más usado al menos. */
export function distinctByUse(values: string[]): string[] {
  const count = new Map<string, number>();
  values.forEach(v => count.set(v, (count.get(v) ?? 0) + 1));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

// ─────────────────────────── Agrupaciones ───────────────────────────

interface GroupKey {
  key: string;
  label: string;
  sort: number;
}

export interface GroupStats extends GroupKey {
  trades: Trade[];
  count: number;
  wins: number;
  pnl: number;
  winRate: number;
  profitFactor: number | null;
  expectancyR: number | null;
}

export function groupStats(trades: Trade[], keyOf: (t: Trade) => GroupKey): GroupStats[] {
  const groups = new Map<string, GroupKey & { trades: Trade[] }>();
  for (const t of trades) {
    const k = keyOf(t);
    const g = groups.get(k.key) ?? { ...k, trades: [] };
    g.trades.push(t);
    groups.set(k.key, g);
  }
  return [...groups.values()].map(g => {
    const s = computeStats(g.trades);
    return {
      ...g,
      count: s.count, wins: s.wins, pnl: s.totalPnl, winRate: s.winRate,
      profitFactor: s.profitFactor, expectancyR: s.expectancyR,
    };
  });
}

export type Granularity = "month" | "quarter" | "year";

export function periodKey(g: Granularity) {
  return (t: Trade): GroupKey => {
    const d = new Date(t.date);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (g === "month") return { key: `${y}-${m}`, label: `${MONTHS[m]} ${y}`, sort: y * 12 + m };
    const q = Math.floor(m / 3);
    if (g === "quarter") return { key: `${y}-Q${q}`, label: `T${q + 1} ${y}`, sort: y * 4 + q };
    return { key: `${y}`, label: `${y}`, sort: y };
  };
}

export type BreakdownId = "pair" | "strategy" | "direction" | "weekday" | "hour";

export const BREAKDOWNS: Record<BreakdownId, { label: string; keyOf: (t: Trade) => GroupKey }> = {
  pair: { label: "Par", keyOf: t => ({ key: t.pair, label: t.pair, sort: 0 }) },
  strategy: {
    label: "Estrategia",
    keyOf: t => {
      const s = t.strategy ?? NO_STRATEGY;
      return { key: s, label: s, sort: 0 };
    },
  },
  direction: {
    label: "Dirección",
    keyOf: t => ({ key: t.direction, label: t.direction === "long" ? "Long" : "Short", sort: 0 }),
  },
  weekday: {
    label: "Día",
    keyOf: t => {
      const i = (new Date(t.date).getDay() + 6) % 7;
      return { key: String(i), label: WEEKDAY_NAMES[i], sort: i };
    },
  },
  hour: {
    label: "Hora",
    keyOf: t => {
      const b = Math.floor(new Date(t.date).getHours() / 4);
      const pad = (n: number) => String(n).padStart(2, "0");
      return { key: String(b), label: `${pad(b * 4)}:00 – ${pad(b * 4 + 4)}:00`, sort: b };
    },
  },
};

// ─────────────────────────── Observaciones ───────────────────────────

export interface Insight {
  tone: "win" | "loss" | "be";
  text: string;
}

const WEEKDAY_PLURAL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];

/**
 * Lecturas automáticas del diario. Solo se dice algo de un grupo cuando tiene
 * al menos MIN_GROUP operaciones: con tres, cualquier "patrón" es casualidad.
 */
export function buildInsights(trades: Trade[], stats: Stats, ctx: Map<string, TradeContext>): Insight[] {
  const out: Insight[] = [];
  if (!trades.length) return out;

  if (stats.count < MIN_SAMPLE) {
    out.push({ tone: "be", text: `Con ${stats.count} ${stats.count === 1 ? "operación" : "operaciones"} aún hay mucho ruido: las conclusiones empiezan a sostenerse a partir de ${MIN_SAMPLE}.` });
  } else if (stats.expectancyR != null) {
    out.push(stats.expectancyR > 0
      ? { tone: "win", text: `Tu método tiene ventaja: cada operación deja de media ${rStr(stats.expectancyR)} (${pnlStr(stats.avgPnl)}).` }
      : { tone: "loss", text: `Ahora mismo cada operación resta ${rStr(stats.expectancyR)} de media: revisa entradas o tamaño antes de seguir.` });
  }

  const { tone, count } = stats.currentStreak;
  if (tone === "loss" && count >= 3) {
    out.push({ tone: "loss", text: `Llevas ${count} pérdidas seguidas. Buen momento para bajar tamaño o parar a revisar.` });
  } else if (tone === "win" && count >= 4) {
    out.push({ tone: "be", text: `Racha de ${count} ganadas: cuidado con subir el tamaño por euforia.` });
  }

  const risks = trades.map(t => ctx.get(t.id)?.riskPct).filter((r): r is number => r != null);
  const risky = risks.filter(r => r > RISK_LIMIT_PCT);
  if (risky.length) {
    out.push({ tone: "loss", text: `${risky.length} ${risky.length === 1 ? "operación arriesgó" : "operaciones arriesgaron"} más del ${RISK_LIMIT_PCT} % de la cuenta (la mayor, ${pctStr(Math.max(...risky), false)}).` });
  } else if (risks.length >= MIN_GROUP) {
    const avg = risks.reduce((s, r) => s + r, 0) / risks.length;
    out.push({ tone: "win", text: `Riesgo bajo control: ninguna operación pasa del ${RISK_LIMIT_PCT} % de la cuenta (media ${pctStr(avg, false, 2)}).` });
  }

  const exec = executionStats(trades);
  if (exec.losses >= MIN_GROUP && exec.lossVsStop! > 1.1) {
    out.push({ tone: "loss", text: `Tus pérdidas superan de media el riesgo planeado en un ${Math.round((exec.lossVsStop! - 1) * 100)} %: revisa si mueves el stop o si el deslizamiento se come tu plan.` });
  }
  if (exec.wins >= MIN_GROUP && exec.captured! < 0.7) {
    out.push({ tone: "loss", text: `Cierras las ganadoras antes de tiempo: te quedas de media con el ${Math.round(exec.captured! * 100)} % del objetivo.` });
  }

  const pairs = groupStats(trades, BREAKDOWNS.pair.keyOf).filter(g => g.count >= MIN_GROUP).sort((a, b) => b.pnl - a.pnl);
  if (pairs.length > 1) {
    const top = pairs[0];
    const low = pairs[pairs.length - 1];
    if (top.pnl > 0) out.push({ tone: "win", text: `Tu mejor par es ${top.label}: ${pnlStr(top.pnl)} en ${top.count} operaciones, con un ${Math.round(top.winRate)} % de acierto.` });
    if (low.pnl < 0) out.push({ tone: "loss", text: `${low.label} te resta ${pnlStr(low.pnl)} en ${low.count} operaciones.` });
  }

  const dirs = groupStats(trades, BREAKDOWNS.direction.keyOf).filter(g => g.count >= MIN_GROUP);
  if (dirs.length === 2 && Math.sign(dirs[0].pnl) * Math.sign(dirs[1].pnl) < 0) {
    const [bad, good] = dirs[0].pnl < 0 ? dirs : [dirs[1], dirs[0]];
    out.push({ tone: "loss", text: `Tus ${bad.label.toLowerCase()}s restan ${pnlStr(bad.pnl)} mientras los ${good.label.toLowerCase()}s suman ${pnlStr(good.pnl)}.` });
  }

  const days = groupStats(trades, BREAKDOWNS.weekday.keyOf).filter(g => g.count >= MIN_GROUP && g.pnl < 0).sort((a, b) => a.pnl - b.pnl);
  if (days.length) {
    out.push({ tone: "loss", text: `Los ${WEEKDAY_PLURAL[days[0].sort]} son tu peor día: ${pnlStr(days[0].pnl)} en ${days[0].count} operaciones.` });
  }

  if (stats.count >= 20 && stats.payoff != null) {
    if (stats.winRate < 50 && stats.payoff >= 1.5) {
      out.push({ tone: "win", text: `Aciertas menos de la mitad, pero cada ganancia vale ${stats.payoff.toFixed(1).replace(".", ",")} veces una pérdida: es un perfil rentable.` });
    } else if (stats.winRate >= 55 && stats.payoff < 0.8) {
      out.push({ tone: "loss", text: `Aciertas mucho, pero una pérdida media borra ${(1 / stats.payoff).toFixed(1).replace(".", ",")} ganancias medias.` });
    }
  }

  return out.slice(0, 5);
}

// ─────────────────────────── Hitos ───────────────────────────

export type MilestoneGroup = "proceso" | "resultado";

export interface Milestone {
  id: string;
  group: MilestoneGroup;
  title: string;
  desc: string;
  tiers: number[];
  /** Qué significa cada nivel, cuando el número solo no lo dice. */
  tierNotes?: string[];
  format: (v: number) => string;
  current: number;
  best: number;
  reachedAt: (string | null)[];
  locked: string | null;
}

/** Valor del hito en un momento: tras una operación, o al cerrarse un mes. */
interface Point {
  date: string;
  value: number;
}

export interface MilestoneDef {
  id: string;
  group: MilestoneGroup;
  title: string;
  desc: string;
  tiers: number[];
  tierNotes?: string[];
  format: (v: number) => string;
  needsCapital?: boolean;
  series: (trades: Trade[], capital: number | null, ctx: Map<string, TradeContext>, now: Date) => Point[];
}

/** Espera mínima tras una pérdida para que la siguiente entrada no cuente como revancha. */
export const COOLDOWN_MIN = 60;

const count = (v: number) => String(Math.round(v));
const perTrade = (trades: Trade[], valueOf: (t: Trade, i: number) => number): Point[] =>
  trades.map((t, i) => ({ date: t.date, value: valueOf(t, i) }));
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/*
 * Premian el proceso antes que el resultado. Dos ideas que se descartaron a
 * propósito: contar operaciones como mérito (empuja a sobreoperar) y las rachas
 * ganadoras (premian el azar). La racha sigue siendo una estadística en Análisis.
 */
export const MILESTONES: MilestoneDef[] = [
  {
    id: "muestra", group: "proceso", title: "Muestra fiable", desc: "Operaciones registradas",
    tiers: [30, 100, 250, 500], format: count,
    tierNotes: [
      "Tus estadísticas empiezan a sostenerse",
      "Tu win rate ya dice algo de ti",
      "Tus rachas y tus caídas tienen historia detrás",
      "Una muestra de trader profesional",
    ],
    series: trades => perTrade(trades, (_, i) => i + 1),
  },
  {
    id: "disciplina", group: "proceso", title: "Disciplina de riesgo", desc: `Seguidas arriesgando ≤ ${RISK_LIMIT_PCT} % de la cuenta`,
    tiers: [10, 25, 50, 100], format: count, needsCapital: true,
    series: (trades, _c, ctx) => {
      let run = 0;
      return perTrade(trades, t => ((ctx.get(t.id)?.riskPct ?? Infinity) <= RISK_LIMIT_PCT ? ++run : (run = 0)));
    },
  },
  {
    id: "porque", group: "proceso", title: "Diario con porqué", desc: "Operaciones con estrategia o nota",
    tiers: [5, 25, 100, 250], format: count,
    series: trades => {
      let n = 0;
      return perTrade(trades, t => (t.notes || t.strategy ? ++n : n));
    },
  },
  {
    id: "revancha", group: "proceso", title: "Sin revancha", desc: `Tras una pérdida, esperaste ${COOLDOWN_MIN} min antes de volver a entrar`,
    tiers: [5, 15, 40, 100], format: count,
    series: trades => {
      let n = 0;
      return perTrade(trades, (t, i) => {
        const prev = trades[i - 1];
        if (prev?.result === "loss" && new Date(t.date).getTime() - new Date(prev.date).getTime() >= COOLDOWN_MIN * 60_000) n++;
        return n;
      });
    },
  },
  {
    id: "meses", group: "resultado", title: "Meses en verde", desc: "Meses ya cerrados con P&L positivo",
    tiers: [1, 3, 6, 12], format: count,
    series: (trades, _c, _x, now) => {
      // Un mes solo cuenta cuando ha terminado: el día 10 aún puede acabar en rojo.
      // Por eso el valor se mide el día 1 de cada mes, que es cuando el anterior cierra.
      if (!trades.length) return [];
      const sums = new Map<number, number>();
      for (const t of trades) {
        const m = monthIndex(new Date(t.date));
        sums.set(m, (sums.get(m) ?? 0) + t.pnl);
      }
      const points: Point[] = [];
      let green = 0;
      for (let m = Math.min(...sums.keys()) + 1; m <= monthIndex(now); m++) {
        if ((sums.get(m - 1) ?? 0) > 0) green++;
        points.push({ date: new Date(Math.floor(m / 12), m % 12, 1).toISOString(), value: green });
      }
      return points;
    },
  },
  {
    id: "rentabilidad", group: "resultado", title: "Rentabilidad", desc: "Retorno sobre el capital inicial",
    tiers: [5, 10, 25, 50, 100], format: v => pctStr(v, true, 0), needsCapital: true,
    series: (trades, capital) => {
      let pnl = 0;
      return perTrade(trades, t => ((pnl += t.pnl) / capital!) * 100);
    },
  },
  {
    id: "recuperacion", group: "resultado", title: "Vuelta a máximos", desc: "Caídas de más del 5 % recuperadas hasta un nuevo máximo",
    tiers: [1, 3, 5, 10], format: count, needsCapital: true,
    series: (trades, capital) => {
      let equity = capital!, peak = equity, deep = false, n = 0;
      return perTrade(trades, t => {
        equity += t.pnl;
        if (equity > peak) {
          if (deep) n++;
          peak = equity;
          deep = false;
        } else if ((equity - peak) / peak <= -0.05) {
          deep = true;
        }
        return n;
      });
    },
  },
];

/** Id en user_badges de un nivel de hito: "diario-disciplina-2". */
export const milestoneBadgeId = (family: string, level: number) => `diario-${family}-${level}`;

/** Niveles ya guardados como logro, por familia: el más alto y la fecha de cada uno. */
export type StoredLevels = Map<string, Map<number, string>>;

export function parseStoredLevels(rows: { badge_id: string; unlocked_at: string }[]): StoredLevels {
  const out: StoredLevels = new Map();
  for (const r of rows) {
    const m = /^diario-([a-z]+)-(d+)$/.exec(r.badge_id);
    if (!m) continue;
    const levels = out.get(m[1]) ?? new Map<number, string>();
    levels.set(Number(m[2]), r.unlocked_at);
    out.set(m[1], levels);
  }
  return out;
}

export interface MilestoneProgress {
  level: number;
  next: number | null;
  progress: number;
}

export function milestoneProgress(m: Milestone): MilestoneProgress {
  const level = m.reachedAt.filter(Boolean).length;
  const next = m.tiers[level] ?? null;
  return { level, next, progress: next == null ? 100 : Math.max(0, Math.min(100, (m.best / next) * 100)) };
}

/** El hito sin completar más cerca de su siguiente nivel: el que más motiva enseñar. */
export function nextMilestone(milestones: Milestone[]): { m: Milestone; p: MilestoneProgress } | null {
  let pick: { m: Milestone; p: MilestoneProgress } | null = null;
  for (const m of milestones) {
    if (m.locked) continue;
    const p = milestoneProgress(m);
    if (p.next != null && (!pick || p.progress > pick.p.progress)) pick = { m, p };
  }
  return pick;
}

/**
 * Un hito alcanzado no se pierde: si llegaste a +25 % y luego bajaste, lo
 * conseguiste igual. Por eso el nivel sale de la mejor marca, y el valor
 * actual se enseña aparte.
 */
export function buildMilestones(
  trades: Trade[],
  capital: number | null,
  ctx: Map<string, TradeContext>,
  now: Date,
  stored: StoredLevels = new Map(),
): Milestone[] {
  return MILESTONES.map(def => {
    const locked = def.needsCapital && !(capital && capital > 0) ? "Define tu capital inicial para activarlo" : null;
    const points = locked ? [] : def.series(trades, capital, ctx, now);
    const values = points.map(p => p.value);
    return {
      id: def.id, group: def.group, title: def.title, desc: def.desc, tiers: def.tiers, tierNotes: def.tierNotes,
      format: def.format, locked,
      current: values.length ? values[values.length - 1] : 0,
      best: values.length ? Math.max(...values) : 0,
      // Un nivel ya guardado como logro cuenta aunque los datos de hoy no lo alcancen
      // (se borró una operación, cambió el capital): se consiguió y no se pierde.
      reachedAt: def.tiers.map((tier, i) => points.find(p => p.value >= tier)?.date ?? stored.get(def.id)?.get(i + 1) ?? null),
    };
  });
}
