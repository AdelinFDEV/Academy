"use client";

import { useMemo, type CSSProperties } from "react";
import TjPeriodSummary from "./TjPeriodSummary";
import TjBreakdown from "./TjBreakdown";
import { TjInfo } from "./TjControls";
import { dateShort, factorStr, moneyStr, pctStr, pnlStr, rStr, ratioStr, toneOf, type Tone } from "./tjFormat";
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

  const pf = stats.profitFactor;
  const headline: { label: string; value: string; sub: string; info: string; tone?: Tone }[] = [
    {
      label: "P&L total", value: pnlStr(stats.totalPnl), sub: `${rStr(stats.totalR)} acumuladas en ${plural(stats.count, "operación", "operaciones")}`,
      info: "Lo ganado menos lo perdido en las operaciones que ves con los filtros actuales.", tone: toneOf(stats.totalPnl),
    },
    {
      label: "Acierto", value: `${Math.round(stats.winRate)} %`,
      sub: `${stats.wins} ganadas · ${stats.losses} perdidas${stats.bes ? ` · ${stats.bes} BE` : ""}`,
      info: "Qué parte de tus operaciones acabó en ganancia. Solo no basta: hay que leerlo junto a lo que ganas y pierdes de media.",
    },
    {
      label: "Profit factor", value: factorStr(pf),
      sub: pf == null ? "sin datos" : pf >= 1.5 ? "sistema sólido" : pf >= 1 ? "rentable, pero justo" : "pierde dinero",
      info: "Lo que ganan tus operaciones buenas dividido entre lo que pierden las malas. Por encima de 1,5 es un sistema sólido.",
      tone: pf == null ? undefined : pf >= 1.5 ? "win" : pf >= 1 ? "be" : "loss",
    },
    {
      label: "Esperanza", value: stats.expectancyR != null ? rStr(stats.expectancyR) : "—",
      sub: `${pnlStr(stats.avgPnl)} de media por operación`,
      info: "Lo que deja de media cada operación, medido en R (unidades de riesgo). Es la cifra que dice si tu método tiene ventaja.",
      tone: toneOf(stats.expectancyR ?? 0),
    },
  ];

  // Cara a cara: lo mismo medido en ganadoras y en perdedoras, para compararlo de un vistazo.
  const duel: { label: string; win: string; loss: string }[] = [
    { label: "Operaciones", win: String(stats.wins), loss: String(stats.losses) },
    { label: "Media", win: stats.wins ? pnlStr(stats.avgWin) : "—", loss: stats.losses ? pnlStr(stats.avgLoss) : "—" },
    { label: "La mayor", win: stats.best != null ? pnlStr(stats.best) : "—", loss: stats.worst != null ? pnlStr(stats.worst) : "—" },
    { label: "Racha más larga", win: plural(stats.bestWinStreak, "seguida", "seguidas"), loss: plural(stats.bestLossStreak, "seguida", "seguidas") },
    { label: "Total", win: pnlStr(stats.grossProfit), loss: pnlStr(-stats.grossLoss) },
  ];
  const grossMax = Math.max(stats.grossProfit, stats.grossLoss, 1e-9);

  const share = (n: number) => `${(n / Math.max(stats.count, 1)) * 100}%`;
  const barra = (c: string): CSSProperties => ({ "--c": c } as CSSProperties);

  return (
    <>
      <dl className="dja-cuatro">
        {headline.map(k => (
          <div key={k.label} className="dj-hoja dja-kpi">
            <dt className="dj-etq">{k.label} <TjInfo label={k.label}>{k.info}</TjInfo></dt>
            <dd className={`dj-cifra dja-kpi-cifra${k.tone ? ` tone-${k.tone}` : ""}`}>{k.value}</dd>
            <dd className="dja-kpi-pie">{k.sub}</dd>
            {k.label === "Acierto" && stats.count > 0 && (
              <dd className="dja-reparto" aria-hidden="true">
                <i className="tone-win" style={{ width: share(stats.wins) }} />
                <i className="tone-be" style={{ width: share(stats.bes) }} />
                <i className="tone-loss" style={{ width: share(stats.losses) }} />
              </dd>
            )}
          </div>
        ))}
      </dl>

      <section className="dj-hoja">
        <header className="dj-cabeza">
          <div>
            <h3>Ganadoras frente a perdedoras</h3>
            <p>Lo mismo medido a cada lado, para compararlo de un vistazo</p>
          </div>
        </header>
        <div className="dja-duelo-cuerpo">
          <div className="dja-duelo-izq">
            <div className="dja-duelo-barras" aria-hidden="true">
              <span className="dj-etq">Ganado</span>
              <span className="dj-barra" style={barra("var(--sube)")}>
                <i style={{ width: `${(stats.grossProfit / grossMax) * 100}%` }} />
              </span>
              <span className="dj-etq">Perdido</span>
              <span className="dj-barra" style={barra("var(--baja)")}>
                <i style={{ width: `${(stats.grossLoss / grossMax) * 100}%`, animationDelay: "120ms" }} />
              </span>
            </div>
            <p className="dja-lectura">
              {stats.payoff != null
                ? <>Cada ganadora vale de media <b>{stats.payoff.toFixed(2).replace(".", ",")} veces</b> una perdedora.</>
                : "Hacen falta ganadoras y perdedoras para compararlas."}
            </p>
          </div>
          <table className="dja-duelo-tabla">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Medida</span></th>
                <th scope="col"><span className="dj-chip tone-win">Ganadoras</span></th>
                <th scope="col"><span className="dj-chip tone-loss">Perdedoras</span></th>
              </tr>
            </thead>
            <tbody>
              {duel.map(d => (
                <tr key={d.label}>
                  <th scope="row">{d.label}</th>
                  <td className="tone-win">{d.win}</td>
                  <td className="tone-loss">{d.loss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <TjPeriodSummary trades={trades} ctx={ctx} />

      <div className="dja-par">
        <section className="dj-hoja">
          <header className="dj-cabeza">
            <div>
              <h3>Distribución en R</h3>
              <p>Cuántas operaciones cerraron en cada tramo de riesgo</p>
            </div>
          </header>
          <div className="dja-hist-barras">
            {histogram.map((b, i) => (
              <div
                key={b.label}
                className={`tone-${b.tone}${b.count ? "" : " is-cero"}`}
                title={`${b.label}: ${plural(b.count, "operación", "operaciones")}`}
              >
                <strong>{b.count || ""}</strong>
                <i style={{ height: `${Math.max((b.count / histMax) * 100, b.count ? 4 : 0)}%`, animationDelay: `${100 + i * 60}ms` }} />
              </div>
            ))}
          </div>
          <div className="dja-hist-eje" aria-hidden="true">
            {histogram.map(b => <span key={b.label}>{b.label}</span>)}
          </div>
          <span className="dj-nota dja-hist-nota">a la derecha del 0R, lo que ganaste</span>
        </section>

        <section className="dj-hoja">
          <header className="dj-cabeza">
            <div>
              <h3>Riesgo y ejecución</h3>
              <p>Cómo planeas y cómo cumples el plan</p>
            </div>
          </header>
          <dl className="dja-papeles">
            {riskItems.map(r => (
              <div key={r.label} className={`dja-papel${r.tone ? ` is-${r.tone}` : ""}`}>
                <dt>
                  <span className="dja-papel-tit">{r.label} <TjInfo label={r.label}>{r.info}</TjInfo></span>
                  <span className="dja-papel-pie">{r.sub}</span>
                </dt>
                <dd className={`dj-cifra${r.tone ? ` tone-${r.tone}` : ""}`}>{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <TjBreakdown trades={trades} />
    </>
  );
}
