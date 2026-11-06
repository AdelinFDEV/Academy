"use client";

import { Flame } from "lucide-react";
import { TjInfo } from "./TjControls";
import { factorStr, pctStr, pnlStr, rStr, toneOf, type Tone } from "./tjFormat";
import type { Stats } from "./tjStats";

interface Props {
  stats: Stats;
  drawdown: { abs: number; pct: number | null };
}

/** Anillo de acierto: la parte ganadora en verde, la perdedora en rojo y el BE en gris. */
function WinRing({ stats }: { stats: Stats }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const total = stats.count || 1;
  const parts: { tone: Tone; n: number }[] = [
    { tone: "win", n: stats.wins },
    { tone: "loss", n: stats.losses },
    { tone: "be", n: stats.bes },
  ];
  let offset = 0;
  return (
    <div className="tja-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={R} className="tja-ring-track" />
        {parts.map(p => {
          const len = (p.n / total) * C;
          const el = p.n ? (
            <circle
              key={p.tone} cx="60" cy="60" r={R}
              className={`tja-ring-arc tone-${p.tone}`}
              // Un hueco de 3 entre tramos; con un solo tramo, el anillo se cierra entero.
              strokeDasharray={`${p.n === stats.count ? C : Math.max(len - 3, 0.5)} ${C}`}
              strokeDashoffset={-offset}
            />
          ) : null;
          offset += len;
          return el;
        })}
      </svg>
      <span className="tja-ring-value">
        <strong>{Math.round(stats.winRate)}<span>%</span></strong>
        <small>de acierto</small>
      </span>
    </div>
  );
}

/**
 * Tarjeta bajo el calendario: tus operaciones (anillo de acierto y recuentos) y
 * la calidad de tu sistema (cuatro métricas). El balance vive en la cabecera.
 */
export default function TjSummary({ stats, drawdown }: Props) {
  const pf = stats.profitFactor;
  // Textos cortos a propósito: caben en una línea en la columna de la tarjeta.
  const metrics: { label: string; hint: string; value: string; sub: string; tone: Tone }[] = [
    {
      label: "Profit factor",
      hint: "Lo que ganan tus operaciones buenas dividido entre lo que pierden las malas. Por encima de 1,5 es un sistema sólido.",
      // Sin pérdidas el factor es infinito: se dice con palabras, no con «∞».
      value: pf === Infinity ? "Sin pérdidas" : factorStr(pf),
      sub: pf == null ? "Aún sin resultados" : pf === Infinity ? "Ninguna perdedora aún" : pf >= 1.5 ? "Sistema sólido" : pf >= 1 ? "Rentable, pero justo" : "Ahora pierde dinero",
      tone: pf == null ? "be" : pf >= 1.5 ? "win" : pf >= 1 ? "be" : "loss",
    },
    {
      label: "Esperanza",
      hint: "Lo que deja de media cada operación, medido en R (unidades de riesgo). Es la cifra que dice si tu método tiene ventaja.",
      value: stats.expectancyR != null ? rStr(stats.expectancyR) : "—",
      sub: `${pnlStr(stats.avgPnl)} de media`,
      tone: toneOf(stats.expectancyR ?? 0),
    },
    {
      label: "Drawdown máx.",
      hint: "La mayor caída desde un máximo de capital hasta el mínimo siguiente. Mide cuánto dolor aguanta tu cuenta.",
      value: drawdown.abs === 0 ? "0 %" : drawdown.pct != null ? pctStr(drawdown.pct) : pnlStr(drawdown.abs),
      sub: drawdown.abs === 0 ? "Sin caídas por ahora" : drawdown.pct != null ? pnlStr(drawdown.abs) : "Desde el máximo",
      tone: drawdown.abs < 0 ? "loss" : "be",
    },
    {
      label: "Ganancia / pérdida",
      hint: "Cuántas veces cabe tu pérdida media en tu ganancia media. Con un ratio alto puedes acertar menos de la mitad y ganar.",
      value: stats.payoff != null ? `${stats.payoff.toFixed(2).replace(".", ",")}×` : "—",
      sub: stats.payoff != null
        ? `${pnlStr(stats.avgWin)} / ${pnlStr(stats.avgLoss)}`
        : !stats.losses ? "Aún sin perdidas" : "Aún sin ganadas",
      tone: stats.payoff == null ? "be" : stats.payoff >= 1 ? "win" : "loss",
    },
  ];

  const streak = stats.currentStreak;
  const counts = [
    { tone: "win", label: "Ganadas", n: stats.wins },
    { tone: "loss", label: "Perdidas", n: stats.losses },
    { tone: "be", label: "Breakeven", n: stats.bes },
  ] as const;

  /*
   * Dos zonas con la misma estructura: cabecera (título y, si toca, una acción)
   * a la misma altura en las dos, y el contenido centrado debajo. Así las
   * columnas miden lo mismo y no quedan huecos.
   */
  return (
    <section className="tj-card tja" aria-label="Tu cuenta">
      <div className="tja-zone tja-z2">
        <header className="tja-zone-head">
          <span className="tja-eyebrow">Tus operaciones</span>
          {streak.tone && streak.count >= 2 && (
            <span className={`tja-streak tone-${streak.tone}`} title={`Racha de ${streak.count} ${streak.tone === "win" ? "ganadas" : "perdidas"} seguidas`}>
              <Flame size={12} /> {streak.count} seguidas
            </span>
          )}
        </header>
        <div className="tja-ops">
          <WinRing stats={stats} />
          <ul className="tja-counts">
            {counts.map(c => (
              <li key={c.tone} className={`tone-${c.tone}`}>
                <strong>{c.n}</strong>
                <span><i aria-hidden="true" />{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tja-zone tja-z3">
        <header className="tja-zone-head">
          <span className="tja-eyebrow">Calidad de tu sistema</span>
        </header>
        <dl className="tja-metrics">
          {metrics.map(m => (
            <div key={m.label} className={`tj-metric tone-${m.tone}`}>
              <dt>{m.label} <TjInfo label={m.label}>{m.hint}</TjInfo></dt>
              <dd>{m.value}</dd>
              <dd className="tj-metric-sub">{m.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
