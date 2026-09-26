"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TJ_COLORS, moneyStr, pctStr, pnlStr } from "./tjFormat";
import { resultTone, type EquityPoint } from "./tjStats";

/**
 * Recharts inyecta estas props en los render-props de puntos y tooltips. Su
 * tipado público es demasiado laxo, así que se declaran las formas mínimas.
 */
interface DotRenderProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: EquityPoint;
}

interface TooltipRenderProps<T> {
  active?: boolean;
  payload?: { name?: string; value?: number | string; payload: T }[];
}

const AXIS_TICK = { fill: TJ_COLORS.axis, fontSize: 12, fontWeight: 600 };

/** Con más puntos que esto, marcar cada operación ensucia más que informa. */
const MAX_DOTS = 80;

const dotColor = (p?: EquityPoint) => (p?.trade ? TJ_COLORS[resultTone(p.trade.result)] : TJ_COLORS.be);

function EquityDot({ cx, cy, payload, index }: DotRenderProps) {
  if (cx == null || cy == null) return null;
  return <circle key={index} cx={cx} cy={cy} r={4} fill={dotColor(payload)} stroke={TJ_COLORS.bg} strokeWidth={2} />;
}

function EquityActiveDot({ cx, cy, payload }: DotRenderProps) {
  const color = dotColor(payload);
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.18} />
      <circle cx={cx} cy={cy} r={6} fill={color} stroke={TJ_COLORS.bg} strokeWidth={2.5} />
    </g>
  );
}

/**
 * Marcas "redondas" (múltiplos de 1/2/5 × 10^n) que abarcan [min, max]: el eje
 * enseña números con los que es fácil ubicar mentalmente cada punto.
 */
function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) { min -= 1; max += 1; }
  const rawStep = (max - min) / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const step = (residual >= 5 ? 5 : residual >= 2 ? 2 : 1) * magnitude;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step + step * 0.001; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

function EquityTooltip({ active, payload, isDd, usePct }: TooltipRenderProps<EquityPoint> & { isDd: boolean; usePct: boolean }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tj-tip">
      <span className="tj-tip-head">{p.trade ? `${p.trade.pair} · ${p.label}` : p.label}</span>
      <strong>{isDd ? (usePct ? pctStr(p.ddPct!) : pnlStr(p.dd)) : moneyStr(p.equity)}</strong>
      {p.trade && <span className={`tone-${resultTone(p.trade.result)}`}>{pnlStr(p.trade.pnl)}</span>}
      {!isDd && p.dd < 0 && <span className="muted">Desde el máximo: {pnlStr(p.dd)}</span>}
    </div>
  );
}

export type EquityMode = "equity" | "drawdown";

export function EquityChart({ series, base, mode }: { series: EquityPoint[]; base: number; mode: EquityMode }) {
  const isDd = mode === "drawdown";
  const usePct = isDd && series.every(p => p.ddPct != null);
  const key = isDd ? (usePct ? "ddPct" : "dd") : "equity";
  const values = series.map(p => (isDd ? (usePct ? p.ddPct! : p.dd) : p.equity));
  const ticks = niceTicks(Math.min(isDd ? 0 : base, ...values), Math.max(isDd ? 0 : base, ...values));
  const last = series[series.length - 1].equity;
  const color = isDd || last < base ? TJ_COLORS.loss : TJ_COLORS.win;
  const fmt = (v: number) => (usePct ? `${Math.round(v)}%` : `${Math.round(v)}$`);

  return (
    <div className="tj-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`tj-grad-${mode}`} x1="0" y1={isDd ? "1" : "0"} x2="0" y2={isDd ? "0" : "1"}>
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={TJ_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} tickMargin={12} minTickGap={36} />
          <YAxis
            axisLine={false} tickLine={false} width={64}
            domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tick={AXIS_TICK} tickFormatter={fmt}
          />
          <Tooltip content={<EquityTooltip isDd={isDd} usePct={usePct} />} cursor={{ stroke: "rgba(240,244,255,0.25)", strokeDasharray: "4 4" }} />
          <ReferenceLine y={isDd ? 0 : base} stroke="rgba(240,244,255,0.25)" strokeDasharray="5 4" />
          <Area
            type="monotone" dataKey={key} stroke={color} strokeWidth={2.5}
            fill={`url(#tj-grad-${mode})`}
            dot={!isDd && series.length <= MAX_DOTS ? <EquityDot /> : false}
            activeDot={isDd ? { r: 5, fill: color } : <EquityActiveDot />}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
