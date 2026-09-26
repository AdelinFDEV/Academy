"use client";

import { useMemo } from "react";
import { BarChart3, ShieldAlert } from "lucide-react";
import TjPeriodSummary from "./TjPeriodSummary";
import TjCalendar from "./TjCalendar";
import TjBreakdown from "./TjBreakdown";
import { TjInfo } from "./TjControls";
import { dateShort, moneyStr, pctStr, pnlStr, rStr, ratioStr, toneOf, type Tone } from "./tjFormat";
import { RISK_LIMIT_PCT, computeStats, executionStats, rOf, type Trade, type TradeContext } from "./tjStats";

/** Tramos del histograma de resultados, en múltiplos de R. */
const R_BUCKETS: { label: string; test: (r: number) => boolean; tone: Tone }[] = [
  { label: "≤ −1R", test: r => r <= -1, tone: "loss" },
  { label: "−1–0", test: r => r > -1 && r < 0, tone: "loss" },
  { label: "0R", test: r => r === 0, tone: "be" },
  { label: "0–1", test: r => r > 0 && r < 1, tone: "win" },
  { label: "1–2", test: r => r >= 1 && r < 2, tone: "win" },
  { label: "2–3", test: r => r >= 2 && r < 3, tone: "win" },
  { label: "≥ 3R", test: r => r >= 3, tone: "win" },
];

export default function TjAnalysis({ trades, ctx }: { trades: Trade[]; ctx: Map<string, TradeContext> }) {
  const stats = useMemo(() => computeStats(trades), [trades]);
  const streak = stats.currentStreak;

  const rValues = trades.map(rOf).filter((r): r is number => r != null);
  const histogram = R_BUCKETS.map(b => ({ ...b, count: rValues.filter(b.test).length }));
  const histMax = Math.max(...histogram.map(b => b.count), 1);

  // Gestión del riesgo: el % sale del capital de la cuenta antes de cada operación.
  const risks = trades.flatMap(t => {
    const pct = ctx.get(t.id)?.riskPct;
    return pct != null ? [{ t, pct }] : [];
  });
  const hasPct = risks.length > 0;
  const risky = risks.filter(r => r.pct > RISK_LIMIT_PCT).length;
  const biggest = hasPct
    ? risks.reduce((a, b) => (b.pct > a.pct ? b : a))
    : trades.reduce<{ t: Trade; pct: null } | null>((a, t) => (!a || t.risk_amount > a.t.risk_amount ? { t, pct: null } : a), null);
  const planned = trades.filter(t => t.risk_amount > 0).map(t => t.expected_gain / t.risk_amount);
  const avgPlanned = planned.length ? planned.reduce((a, b) => a + b, 0) / planned.length : null;
  const exec = executionStats(trades);
  const noReal = "Rellena «P&L real» al registrar una operación para medirlo";
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const avgRiskPct = hasPct ? risks.reduce((a, r) => a + r.pct, 0) / risks.length : null;
  // Acierto mínimo para no perder dinero con ese ratio: 1 / (1 + R). Sin contar comisiones.
  const breakEven = avgPlanned != null ? 100 / (1 + avgPlanned) : null;

  const riskItems: { label: string; value: string; sub: string; info: string; tone?: Tone }[] = [
    {
      label: "Riesgo por operación",
      value: avgRiskPct != null
        ? pctStr(avgRiskPct, false, 2)
        : moneyStr(trades.reduce((a, t) => a + t.risk_amount, 0) / trades.length),
      sub: avgRiskPct != null ? "de tu cuenta, de media, en cada operación" : "de media en cada operación (define tu capital para verlo en %)",
      info: "Lo que perderías si salta el stop, en porcentaje del capital que tenías justo antes de entrar, y promediado entre tus operaciones. La referencia habitual es no pasar del 1-2 %.",
    },
    {
      label: "Operaciones de riesgo alto",
      value: hasPct ? `${risky} de ${risks.length}` : "—",
      sub: !hasPct
        ? "define tu capital inicial para medirlo"
        : risky
          ? `${plural(risky, "arriesgó", "arriesgaron")} más del ${RISK_LIMIT_PCT} % de la cuenta`
          : `ninguna pasó del ${RISK_LIMIT_PCT} % de la cuenta`,
      info: `Cuántas operaciones arriesgaron más del ${RISK_LIMIT_PCT} % de tu capital. Son las que más daño hacen si coinciden en una mala racha: con cinco pérdidas seguidas al 4 %, la cuenta cae más de un 18 %.`,
      tone: hasPct ? (risky ? "loss" : "win") : undefined,
    },
    {
      label: "Mayor riesgo asumido",
      value: biggest ? (biggest.pct != null ? pctStr(biggest.pct, false, 2) : moneyStr(biggest.t.risk_amount)) : "—",
      sub: biggest ? `en ${biggest.t.pair}, el ${dateShort(biggest.t.date)}` : "—",
      info: "La operación en la que te jugaste la parte más grande de tu cuenta. Sirve para ver si alguna vez te saltaste tu propio límite de riesgo.",
      tone: biggest?.pct != null && biggest.pct > RISK_LIMIT_PCT ? "loss" : undefined,
    },
    {
      label: "Ratio riesgo/beneficio",
      value: avgPlanned != null ? ratioStr(avgPlanned) : "—",
      sub: breakEven != null ? `con él necesitas acertar más del ${Math.round(breakEven)} % para ganar` : "—",
      info: "Tu ganancia objetivo dividida entre tu riesgo, tal como lo planeaste al entrar, y de media. Con 1:2, por cada 1 $ que arriesgas buscas ganar 2 $, y te basta acertar una de cada tres operaciones para no perder dinero.",
      tone: avgPlanned == null ? undefined : avgPlanned >= 2 ? "win" : avgPlanned >= 1 ? "be" : "loss",
    },
    {
      label: "Objetivo conseguido",
      value: exec.captured != null ? pctStr(exec.captured * 100, false, 0) : "—",
      sub: exec.captured != null
        ? `del objetivo te llevas de media en tus ganadoras (${exec.wins})`
        : noReal,
      info: "Solo en ganadoras con P&L real: lo que ganaste dividido entre lo que buscabas. 100 % es llegar al objetivo; si es mucho menos, estás cerrando las ganadoras antes de tiempo.",
      tone: exec.captured == null ? undefined : exec.captured >= 0.9 ? "win" : exec.captured >= 0.7 ? "be" : "loss",
    },
    {
      label: "Pérdida frente al stop",
      value: exec.lossVsStop != null ? `${exec.lossVsStop.toFixed(2).replace(".", ",")}×` : "—",
      sub: exec.lossVsStop == null
        ? noReal
        : exec.lossVsStop > 1.02
          ? `pierdes un ${Math.round((exec.lossVsStop - 1) * 100)} % más de lo planeado (${exec.losses})`
          : `pierdes lo que planeaste, ni un dólar más (${exec.losses})`,
      info: "Solo en perdedoras con P&L real: lo que perdiste dividido entre el riesgo que planeaste. 1× es que el stop saltó justo donde estaba; por encima, hubo deslizamiento o moviste el stop.",
      tone: exec.lossVsStop == null ? undefined : exec.lossVsStop <= 1.05 ? "win" : exec.lossVsStop <= 1.2 ? "be" : "loss",
    },
  ];

  const kpis: { label: string; value: string; sub: string; tone?: Tone }[] = [
    { label: "P&L total", value: pnlStr(stats.totalPnl), sub: `${rStr(stats.totalR)} acumuladas`, tone: toneOf(stats.totalPnl) },
    {
      label: "Ratio de acierto", value: `${Math.round(stats.winRate)} %`,
      sub: `ganadas: ${stats.wins} de ${stats.count}${stats.bes ? ` · ${stats.bes} en breakeven` : ""}`,
    },
    {
      label: "Operaciones", value: String(stats.count),
      sub: streak.tone ? `racha actual: ${streak.count} ${streak.tone === "win" ? "ganada" : "perdida"}${streak.count > 1 ? "s" : ""}` : "sin racha abierta",
    },
    { label: "P&L medio", value: pnlStr(stats.avgPnl), sub: stats.expectancyR != null ? `${rStr(stats.expectancyR)} por operación` : "—", tone: toneOf(stats.avgPnl) },
    // Sin ganadas o sin perdidas no hay media que enseñar: un 0,00 $ en rojo parecería una pérdida.
    {
      label: "Ganancia media", value: stats.wins ? pnlStr(stats.avgWin) : "—",
      sub: stats.wins ? `en ${plural(stats.wins, "ganada", "ganadas")}` : "aún sin ganadas", tone: stats.wins ? "win" : undefined,
    },
    {
      label: "Pérdida media", value: stats.losses ? pnlStr(stats.avgLoss) : "—",
      sub: stats.losses ? `en ${plural(stats.losses, "perdida", "perdidas")}` : "ninguna perdida", tone: stats.losses ? "loss" : undefined,
    },
    { label: "Mejor op.", value: stats.best != null ? pnlStr(stats.best) : "—", sub: "mayor ganancia", tone: "win" },
    { label: "Peor op.", value: stats.worst != null ? pnlStr(stats.worst) : "—", sub: "mayor pérdida", tone: "loss" },
    { label: "Mayor racha ganando", value: String(stats.bestWinStreak), sub: "seguidas sin fallar", tone: "win" },
    { label: "Mayor racha perdiendo", value: String(stats.bestLossStreak), sub: "la peor que aguantaste", tone: "loss" },
  ];

  return (
    <>
      <dl className="tj-card tj-kpis">
        {kpis.map(k => (
          <div key={k.label} className={`tj-metric${k.tone ? ` tone-${k.tone}` : ""}`}>
            <dt>{k.label}</dt>
            <dd>{k.value}</dd>
            <dd className="tj-metric-sub">{k.sub}</dd>
          </div>
        ))}
      </dl>

      <TjPeriodSummary trades={trades} ctx={ctx} />

      <div className="tj-split is-balanced">
        <section className="tj-card tj-hist-card">
          <span className="tj-label" title="Cuántas operaciones cerraron en cada tramo de R (ganancia o pérdida en unidades de riesgo)">
            <BarChart3 size={15} /> Distribución en R
          </span>
          <div className="tj-hist">
            {histogram.map(b => (
              <div key={b.label} className={`tone-${b.tone}`} title={`${b.count} operaciones`}>
                <strong>{b.count || ""}</strong>
                <i style={{ height: `${(b.count / histMax) * 72}%` }} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="tj-card">
          <span className="tj-label"><ShieldAlert size={15} /> Riesgo y ejecución</span>
          <dl className="tj-strip is-grid2">
            {riskItems.map(r => (
              <div key={r.label} className={`tj-metric${r.tone ? ` tone-${r.tone}` : ""}`}>
                <dt>{r.label} <TjInfo label={r.label}>{r.info}</TjInfo></dt>
                <dd>{r.value}</dd>
                <dd className="tj-metric-sub">{r.sub}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <TjCalendar trades={trades} />
      <TjBreakdown trades={trades} />
    </>
  );
}
