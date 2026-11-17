"use client";

import { useId, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TjSegmented } from "./TjControls";
import { TJ_COLORS, moneyStr, pctStr, pnlStr, toneOf } from "./tjFormat";
import { resultTone, type EquityPoint } from "./tjStats";

/**
 * Las gráficas del Diario (estilo «Cuaderno de estudio», 17-11-2026): papel
 * blanco, rejilla suave de cuaderno, la curva en el azul del Diario y cada
 * operación marcada con el verde o el rojo de su resultado (lo único con signo).
 * El CSS vive en diario-analisis.css (prefijo `dja-`).
 */

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

/** Las marcas de los ejes: Nunito, en tinta 2. */
const DJA_TICK = { fill: TJ_COLORS.axis, fontSize: 12, fontWeight: 700 };

/** Con más puntos que esto, marcar cada operación ensucia más que informa. */
const MAX_DOTS = 80;

const dotColor = (p?: EquityPoint) => (p?.trade ? TJ_COLORS[resultTone(p.trade.result)] : TJ_COLORS.be);

function EquityDot({ cx, cy, payload, index }: DotRenderProps) {
  if (cx == null || cy == null) return null;
  return <circle key={index} cx={cx} cy={cy} r={4.5} fill={dotColor(payload)} stroke={TJ_COLORS.bg} strokeWidth={2.5} />;
}

function EquityActiveDot({ cx, cy, payload }: DotRenderProps) {
  const color = dotColor(payload);
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill={color} opacity={0.16} />
      <circle cx={cx} cy={cy} r={7} fill={color} stroke={TJ_COLORS.bg} strokeWidth={3} />
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
    <div className="dja-tip">
      <span className="dja-tip-cab">{p.trade ? `${p.trade.pair} · ${p.label}` : p.label}</span>
      <strong className={isDd ? "tone-loss" : undefined}>{isDd ? (usePct ? pctStr(p.ddPct!) : pnlStr(p.dd)) : moneyStr(p.equity)}</strong>
      {p.trade && <span className={`dja-tip-res tone-${resultTone(p.trade.result)}`}>{pnlStr(p.trade.pnl)} en esta operación</span>}
      {!isDd && p.dd < 0 && <span className="dja-tip-pie">Desde el máximo: <b className="tone-loss">{pnlStr(p.dd)}</b></span>}
    </div>
  );
}

export type EquityMode = "equity" | "drawdown";

/**
 * Curva mínima, sin ejes ni tooltip: solo la forma, sobre papel blanco. SVG
 * propio en vez de Recharts porque es decorativa y se pinta en una tarjeta
 * estrecha (el balance de la cabecera).
 */
export function Sparkline({ values, base }: { values: number[]; base: number }) {
  // useId trae «:» o «»: no valen dentro de url(#…), así que se limpian.
  const id = `spark${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const min = Math.min(base, ...values);
  const max = Math.max(base, ...values);
  const span = max - min || 1;
  const W = 100;
  const H = 36;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 3 - ((v - min) / span) * (H - 6);
  const line = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const color = values[values.length - 1] < base ? TJ_COLORS.loss : TJ_COLORS.win;
  return (
    <svg className="dja-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={y(base)} y2={y(base)} className="dja-spark-base" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,${H} ${line} ${W},${H}`} fill={`url(#${id})`} />
      <polyline
        points={line} fill="none" stroke={color} strokeWidth={2.5}
        vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

/** La hoja de la curva: el gráfico y cuatro lecturas que lo explican sin pasar el ratón. */
export function TjEquityCard({
  series,
  capital,
  drawdown,
}: {
  series: EquityPoint[];
  capital: number | null;
  drawdown: { abs: number; pct: number | null };
}) {
  const [mode, setMode] = useState<EquityMode>("equity");
  const base = capital ?? 0;
  const last = series[series.length - 1];
  const peak = Math.max(...series.map(p => p.equity));
  const low = Math.min(...series.map(p => p.equity));
  const ops = series.length - 1;
  const stats: { label: string; value: string; tone?: string }[] = capital != null
    ? [
        { label: "Actual", value: moneyStr(last.equity), tone: toneOf(last.equity - base) },
        { label: "Máximo", value: moneyStr(peak) },
        { label: "Mínimo", value: moneyStr(low) },
        { label: "Desde el máximo", value: last.ddPct != null ? pctStr(last.ddPct) : pnlStr(last.dd), tone: last.dd < 0 ? "loss" : "be" },
      ]
    : [
        { label: "P&L acumulado", value: pnlStr(last.equity), tone: toneOf(last.equity) },
        { label: "Máximo", value: pnlStr(peak) },
        { label: "Mínimo", value: pnlStr(low) },
        { label: "Mayor caída", value: pnlStr(drawdown.abs), tone: drawdown.abs < 0 ? "loss" : "be" },
      ];

  return (
    <section className="dj-hoja">
      <header className="dj-cabeza">
        <div>
          <h3>{capital != null ? "Evolución del capital" : "Curva de P&L"}</h3>
          <p>{ops} {ops === 1 ? "operación" : "operaciones"}, de la primera a la última</p>
        </div>
        <TjSegmented label="Vista del gráfico" value={mode} onChange={setMode}
          options={[{ value: "equity", label: "Capital" }, { value: "drawdown", label: "Drawdown" }]} />
      </header>
      <dl className="dja-fichas dja-fichas--cuatro">
        {stats.map(s => (
          <div key={s.label} className="dj-ficha dja-dato">
            <dt className="dj-etq">{s.label}</dt>
            <dd className={`dj-cifra dja-dato-cifra${s.tone ? ` tone-${s.tone}` : ""}`}>{s.value}</dd>
          </div>
        ))}
      </dl>
      <EquityChart series={series} base={base} mode={mode} />
      {mode === "equity" && series.length <= MAX_DOTS && (
        <p className="dja-leyenda" aria-hidden="true">
          <span><i className="dja-punto tone-win" /> ganadora</span>
          <span><i className="dja-punto tone-loss" /> perdedora</span>
          <span className="dj-nota">cada punto, una operación</span>
        </p>
      )}
    </section>
  );
}

export function EquityChart({ series, base, mode }: { series: EquityPoint[]; base: number; mode: EquityMode }) {
  const isDd = mode === "drawdown";
  const usePct = isDd && series.every(p => p.ddPct != null);
  const key = isDd ? (usePct ? "ddPct" : "dd") : "equity";
  const values = series.map(p => (isDd ? (usePct ? p.ddPct! : p.dd) : p.equity));
  const ticks = niceTicks(Math.min(isDd ? 0 : base, ...values), Math.max(isDd ? 0 : base, ...values));
  // El capital va en el azul del Diario; la caída es pérdida, en rojo.
  const color = isDd ? TJ_COLORS.loss : TJ_COLORS.azul;
  const fmt = (v: number) => (usePct ? `${Math.round(v)}%` : `${Math.round(v)}$`);

  return (
    <div className="dja-grafica">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`dja-relleno-${mode}`} x1="0" y1={isDd ? "1" : "0"} x2="0" y2={isDd ? "0" : "1"}>
              <stop offset="0%" stopColor={color} stopOpacity={0.24} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={TJ_COLORS.grid} strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={DJA_TICK} tickMargin={12} minTickGap={36} />
          <YAxis
            axisLine={false} tickLine={false} width={60}
            domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tick={DJA_TICK} tickFormatter={fmt}
          />
          <Tooltip
            content={<EquityTooltip isDd={isDd} usePct={usePct} />}
            cursor={{ stroke: TJ_COLORS.azul, strokeOpacity: 0.45, strokeWidth: 2, strokeDasharray: "4 4" }}
          />
          <ReferenceLine y={isDd ? 0 : base} stroke={TJ_COLORS.be} strokeWidth={1.5} strokeDasharray="6 5" />
          <Area
            type="monotone" dataKey={key} stroke={color} strokeWidth={3} strokeLinecap="round"
            fill={`url(#dja-relleno-${mode})`}
            dot={!isDd && series.length <= MAX_DOTS ? <EquityDot /> : false}
            activeDot={isDd ? { r: 6, fill: color, stroke: TJ_COLORS.bg, strokeWidth: 3 } : <EquityActiveDot />}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
