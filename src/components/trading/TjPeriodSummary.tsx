"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from "recharts";
import { CalendarRange } from "lucide-react";
import { TjSegmented } from "./TjControls";
import { TJ_COLORS, factorStr, pctStr, pnlStr, toneOf } from "./tjFormat";
import { groupStats, periodKey, type Granularity, type GroupStats, type Trade, type TradeContext } from "./tjStats";

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: "month", label: "Mensual" },
  { value: "quarter", label: "Trimestral" },
  { value: "year", label: "Anual" },
];

/** Cuántos periodos caben en el gráfico sin que las barras se vuelvan hilos. */
const VISIBLE: Record<Granularity, number> = { month: 12, quarter: 8, year: 10 };

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
    <div className="tj-tip">
      <span className="tj-tip-head">{p.label}</span>
      <strong className={`tone-${toneOf(p.pnl)}`}>{pnlStr(p.pnl)}</strong>
      <span className="muted">{p.count} op. · {Math.round(p.winRate)} % acierto</span>
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

  // Acierto del periodo más reciente con operaciones, frente al anterior: cambia
  // con la vista (mes, trimestre o año) y con los filtros de arriba.
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const hitDelta = last && prev ? Math.round(last.winRate) - Math.round(prev.winRate) : null;

  return (
    <section className="tj-card">
      <div className="tj-card-head">
        <span className="tj-label"><CalendarRange size={15} /> Rendimiento por periodo</span>
        <TjSegmented label="Periodo" value={granularity} onChange={setGranularity} options={OPTIONS} />
      </div>

      <dl className="tj-strip">
        <div className="tj-metric">
          <dt>{unit} en verde</dt>
          <dd>{green}/{rows.length}</dd>
          <dd className="tj-metric-sub">{rows.length ? Math.round((green / rows.length) * 100) : 0} % de los {unit}</dd>
        </div>
        {last && (
          <div className={`tj-metric${hitDelta ? ` tone-${toneOf(hitDelta)}` : ""}`}>
            <dt>Acierto · {last.label}</dt>
            <dd>{Math.round(last.winRate)} %</dd>
            <dd className="tj-metric-sub">
              {hitDelta == null
                ? `ganadas: ${last.wins} de ${last.count}`
                : `${hitDelta === 0 ? "igual que" : `${hitDelta > 0 ? "+" : "−"}${Math.abs(hitDelta)} pts frente a`} ${prev.label}`}
            </dd>
          </div>
        )}
        {best && best.pnl > 0 && (
          <div className="tj-metric tone-win">
            <dt>Mejor</dt>
            <dd>{pnlStr(best.pnl)}</dd>
            <dd className="tj-metric-sub cap">{best.label}</dd>
          </div>
        )}
        {worst && worst.pnl < 0 && (
          <div className="tj-metric tone-loss">
            <dt>Peor</dt>
            <dd>{pnlStr(worst.pnl)}</dd>
            <dd className="tj-metric-sub cap">{worst.label}</dd>
          </div>
        )}
        <div className={`tj-metric tone-${toneOf(rows.reduce((s, r) => s + r.pnl, 0))}`}>
          <dt>Media por periodo</dt>
          <dd>{pnlStr(rows.length ? rows.reduce((s, r) => s + r.pnl, 0) / rows.length : 0)}</dd>
        </div>
      </dl>

      <div className="tj-chart is-short">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={TJ_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label" axisLine={false} tickLine={false} interval={0}
              tick={{ fill: TJ_COLORS.axis, fontSize: 11, fontWeight: 600 }}
              tickFormatter={(l: string) => (granularity === "month" ? l.slice(0, 3) : l)}
            />
            <YAxis axisLine={false} tickLine={false} width={56} tick={{ fill: TJ_COLORS.axis, fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v)}$`} />
            <Tooltip content={<PeriodTooltip />} cursor={{ fill: "rgba(240,244,255,0.04)" }} />
            <ReferenceLine y={0} stroke="rgba(240,244,255,0.2)" />
            <Bar dataKey="pnl" radius={[5, 5, 5, 5]} maxBarSize={42} animationDuration={600}>
              {chart.map(r => <Cell key={r.key} fill={TJ_COLORS[toneOf(r.pnl)]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="tj-table-wrap">
        <table className="tj-table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th className="num">Ops.</th>
              <th className="num">Acierto</th>
              <th className="num tj-hide-sm">P. factor</th>
              <th className="num tj-hide-sm">Retorno</th>
              <th className="num">P&L</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map(r => (
              <tr key={r.key}>
                <td className="cap strong">{r.label}</td>
                <td className="num">{r.count}</td>
                <td className="num">{Math.round(r.winRate)} %</td>
                <td className="num tj-hide-sm">{factorStr(r.profitFactor)}</td>
                <td className={`num tj-hide-sm tone-${toneOf(r.returnPct ?? 0)}`}>{r.returnPct != null ? pctStr(r.returnPct) : "—"}</td>
                <td className={`num tone-${toneOf(r.pnl)}`}>
                  <span className="tj-bar-cell">
                    <span className="tj-bar"><i style={{ width: `${(Math.abs(r.pnl) / maxAbs) * 100}%` }} /></span>
                    <strong>{pnlStr(r.pnl)}</strong>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
