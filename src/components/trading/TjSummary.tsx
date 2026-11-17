"use client";

import { motion } from "framer-motion";
import { Divide, Flame, Scale, Sigma, TrendingDown, type LucideIcon } from "lucide-react";
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
    <div className="djs-anillo">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={R} className="djs-anillo-pista" />
        {parts.map((p, i) => {
          const len = (p.n / total) * C;
          // Un hueco de 3 entre tramos; con un solo tramo, el anillo se cierra entero.
          const dash = p.n === stats.count ? C : Math.max(len - 3, 0.5);
          const el = p.n ? (
            <motion.circle
              key={p.tone} cx="60" cy="60" r={R}
              className={`djs-anillo-arco tone-${p.tone}`}
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${dash} ${C}` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.12 }}
            />
          ) : null;
          offset += len;
          return el;
        })}
      </svg>
      <span className="djs-anillo-valor">
        <strong className="dj-cifra">{Math.round(stats.winRate)}<span> %</span></strong>
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
  const metrics: { label: string; icon: LucideIcon; hint: string; value: string; sub: string; tone: Tone; conSigno?: boolean }[] = [
    {
      label: "Profit factor",
      icon: Scale,
      hint: "Lo que ganan tus operaciones buenas dividido entre lo que pierden las malas. Por encima de 1,5 es un sistema sólido.",
      // Sin pérdidas el factor es infinito: se dice con palabras, no con «∞».
      value: pf === Infinity ? "Sin pérdidas" : factorStr(pf),
      sub: pf == null ? "Aún sin resultados" : pf === Infinity ? "Ninguna perdedora aún" : pf >= 1.5 ? "Sistema sólido" : pf >= 1 ? "Rentable, pero justo" : "Ahora pierde dinero",
      tone: pf == null ? "be" : pf >= 1.5 ? "win" : pf >= 1 ? "be" : "loss",
    },
    {
      label: "Esperanza",
      icon: Sigma,
      hint: "Lo que deja de media cada operación, medido en R (unidades de riesgo). Es la cifra que dice si tu método tiene ventaja.",
      value: stats.expectancyR != null ? rStr(stats.expectancyR) : "—",
      sub: `${pnlStr(stats.avgPnl)} de media`,
      tone: toneOf(stats.expectancyR ?? 0),
      conSigno: true,
    },
    {
      label: "Drawdown máx.",
      icon: TrendingDown,
      hint: "La mayor caída desde un máximo de capital hasta el mínimo siguiente. Mide cuánto dolor aguanta tu cuenta.",
      value: drawdown.abs === 0 ? "0 %" : drawdown.pct != null ? pctStr(drawdown.pct) : pnlStr(drawdown.abs),
      sub: drawdown.abs === 0 ? "Sin caídas por ahora" : drawdown.pct != null ? pnlStr(drawdown.abs) : "Desde el máximo",
      tone: drawdown.abs < 0 ? "loss" : "be",
      conSigno: true,
    },
    {
      label: "Ganancia / pérdida",
      icon: Divide,
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
    <section className="dj-hoja djs" aria-label="Tu cuenta">
      <div className="djs-zona djs-ops">
        <header className="djs-cab">
          <h3>Tus operaciones</h3>
          {streak.tone && streak.count >= 2 && (
            <span className={`dj-chip tone-${streak.tone}`} title={`Racha de ${streak.count} ${streak.tone === "win" ? "ganadas" : "perdidas"} seguidas`}>
              <Flame size={13} aria-hidden="true" /> {streak.count} seguidas
            </span>
          )}
        </header>
        <div className="djs-ops-cuerpo">
          <WinRing stats={stats} />
          <ul className="djs-cuentas">
            {counts.map(c => (
              <li key={c.tone} className={`tone-${c.tone}`}>
                <strong className="dj-cifra">{c.n}</strong>
                <span><i aria-hidden="true" />{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="djs-zona djs-calidad">
        <header className="djs-cab">
          <h3>Calidad de tu sistema</h3>
          <span className="dj-nota">lo que dicen tus números</span>
        </header>
        <dl className="djs-metricas">
          {metrics.map(m => (
            <div key={m.label} className="djs-metrica">
              <dt>
                <span className="djs-metrica-ic" aria-hidden="true"><m.icon size={14} strokeWidth={2.4} /></span>
                <span className="djs-metrica-nombre">{m.label}</span> <TjInfo label={m.label}>{m.hint}</TjInfo>
              </dt>
              {/* Verde y rojo solo en cifras con signo (esperanza y caída); el profit
                  factor y el ratio no lo tienen: su lectura va en la línea de abajo. */}
              <dd className={`dj-cifra${m.conSigno ? ` tone-${m.tone}` : ""}`}>{m.value}</dd>
              <dd className={`djs-metrica-sub${m.conSigno ? "" : ` is-${m.tone}`}`}>{m.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
