"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from "recharts";
import { TjSegmented } from "./TjControls";
import DivergingBar from "./TjDivergingBar";
import { TJ_COLORS, factorStr, pctStr, pnlStr, toneOf } from "./tjFormat";
import { groupStats, periodKey, type Granularity, type GroupStats, type Trade, type TradeContext } from "./tjStats";

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: "month", label: "Mensual" },
  { value: "quarter", label: "Trimestral" },
  { value: "year", label: "Anual" },
];

/** Cuántos periodos caben en el gráfico sin que las barras se vuelvan hilos. */
const VISIBLE: Record<Granularity, number> = { month: 12, quarter: 8, year: 10 };

const TICK = { fill: TJ_COLORS.axis, fontSize: 11.5, fontWeight: 700 };

interface Row extends GroupStats {
  returnPct: number | null;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { payload: Row }[];
}

function PeriodTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="dja-tip">
      <span className="dja-tip-cab cap">{p.label}</span>
      <strong className={`tone-${toneOf(p.pnl)}`}>{pnlStr(p.pnl)}</strong>
      <span className="dja-tip-pie">{p.count} op. · {Math.round(p.winRate)} % acierto</span>
    </div>
  );
}

export default function TjPeriodSummary({ trades, ctx }: { trades: Trade[]; ctx: Map<string, TradeContext> }) {
  const [granularity, setGranularity] = useState<Granularity>("month");

  const rows: Row[] = useMemo(() =>
    groupStats(trades, periodKey(granularity))
      .sort((a, b) => a.sort - b.sort)
      .map(g => {
        const start = ctx.get(g.trades[0].id)?.equityBefore;
        return { ...g, returnPct: start && start > 0 ? (g.pnl / start) * 100 : null };
      }),
  [trades, ctx, granularity]);

  const chart = rows.slice(-VISIBLE[granularity]);
  const green = rows.filter(r => r.pnl > 0).length;
  const best = rows.reduce<Row | null>((b, r) => (!b || r.pnl > b.pnl ? r : b), null);
  const worst = rows.reduce<Row | null>((w, r) => (!w || r.pnl < w.pnl ? r : w), null);
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.pnl)), 1);
  const unit = granularity === "month" ? "meses" : granularity === "quarter" ? "trimestres" : "años";
  const total = rows.reduce((s, r) => s + r.pnl, 0);

  // Acierto del periodo más reciente con operaciones, frente al anterior: cambia
  // con la vista (mes, trimestre o año) y con los filtros de arriba.
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const hitDelta = last && prev ? Math.round(last.winRate) - Math.round(prev.winRate) : null;

  return (
    <section className="dj-hoja">
      <header className="dj-cabeza">
        <div>
          <h3>Rendimiento por periodo</h3>
          <p>Cómo se reparte tu resultado en el tiempo</p>
        </div>
        <TjSegmented label="Periodo" value={granularity} onChange={setGranularity} options={OPTIONS} />
      </header>

      <dl className="dja-fichas">
        <div className="dj-ficha dja-dato">
          <dt className="dj-etq">{unit} en verde</dt>
          <dd className="dj-cifra dja-dato-cifra">{green}<small>/{rows.length}</small></dd>
          <dd className="dja-dato-pie">{rows.length ? Math.round((green / rows.length) * 100) : 0} % de los {unit}</dd>
        </div>
        {last && (
          <div className="dj-ficha dja-dato">
            <dt className="dj-etq">Acierto · <span className="cap">{last.label}</span></dt>
            <dd className="dj-cifra dja-dato-cifra">{Math.round(last.winRate)} %</dd>
            <dd className={`dja-dato-pie${hitDelta ? ` tone-${toneOf(hitDelta)}` : ""}`}>
              {hitDelta == null
                ? `ganadas: ${last.wins} de ${last.count}`
                : `${hitDelta === 0 ? "igual que" : `${hitDelta > 0 ? "+" : "−"}${Math.abs(hitDelta)} pts frente a`} ${prev.label}`}
            </dd>
          </div>
        )}
        {best && best.pnl > 0 && (
          <div className="dj-ficha dja-dato">
            <dt className="dj-etq">Mejor</dt>
            <dd className="dj-cifra dja-dato-cifra tone-win">{pnlStr(best.pnl)}</dd>
            <dd className="dja-dato-pie cap">{best.label}</dd>
          </div>
        )}
        {worst && worst.pnl < 0 && (
          <div className="dj-ficha dja-dato">
            <dt className="dj-etq">Peor</dt>
            <dd className="dj-cifra dja-dato-cifra tone-loss">{pnlStr(worst.pnl)}</dd>
            <dd className="dja-dato-pie cap">{worst.label}</dd>
          </div>
        )}
        <div className="dj-ficha dja-dato">
          <dt className="dj-etq">Media por periodo</dt>
          <dd className={`dj-cifra dja-dato-cifra tone-${toneOf(total)}`}>{pnlStr(rows.length ? total / rows.length : 0)}</dd>
        </div>
      </dl>

      <div className="dja-grafica dja-grafica--barras">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={TJ_COLORS.grid} strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="label" axisLine={false} tickLine={false} interval={0} tickMargin={8}
              tick={TICK}
              tickFormatter={(l: string) => (granularity === "month" ? l.slice(0, 3) : l)}
            />
            <YAxis axisLine={false} tickLine={false} width={54} tick={TICK} tickFormatter={(v: number) => `${Math.round(v)}$`} />
            <Tooltip content={<PeriodTooltip />} cursor={{ fill: TJ_COLORS.azulSuave, fillOpacity: 0.6, radius: 10 }} />
            <ReferenceLine y={0} stroke={TJ_COLORS.be} strokeWidth={1.5} />
            <Bar dataKey="pnl" radius={[8, 8, 8, 8]} maxBarSize={44} animationDuration={700}>
              {chart.map(r => <Cell key={r.key} fill={TJ_COLORS[toneOf(r.pnl)]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="dja-tabla">
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col" className="num">Ops.</th>
            <th scope="col" className="num">Acierto</th>
            <th scope="col" className="num">P. factor</th>
            <th scope="col" className="num">Retorno</th>
            <th scope="col" className="dja-tabla-pnl">P&L</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map(r => (
            <tr key={r.key}>
              <th scope="row" className="cap">{r.label}</th>
              <td className="num" data-et="Ops.">{r.count}</td>
              <td className="num" data-et="Acierto">{Math.round(r.winRate)} %</td>
              <td className="num" data-et="P. factor">{factorStr(r.profitFactor)}</td>
              <td className={`num tone-${toneOf(r.returnPct ?? 0)}`} data-et="Retorno">{r.returnPct != null ? pctStr(r.returnPct) : "—"}</td>
              <td className="dja-tabla-pnl">
                <DivergingBar value={r.pnl} max={maxAbs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
