"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieIcon } from "lucide-react";
import type { Tx } from "./MiPortfolioClient";

export interface ChartHolding {
  coin_id: string;
  coin_symbol: string;
  qty: number;
  avgCost: number;
  invested: number;
  currentValue: number | null;
  unrealized: number | null;
}

const GREEN = "#34d399";
const RED = "#f87171";
const GOLD = "#e6b455";
const ALLOC_COLORS = ["#e6b455", "#ff8552", "#5aa2ff", "#34d399", "#a78bfa", "#f472b6", "#22d3ee", "#facc15", "#fb7185", "#4ade80"];

const round2 = (n: number) => Math.round(n * 100) / 100;

function abbrev(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const fmtDay = (ts: number) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

function priceAt(series: number[][] | undefined, target: number): number | null {
  if (!series || series.length === 0) return null;
  if (target <= series[0][0]) return series[0][1];
  let last = series[0][1];
  for (const point of series) {
    if (point[0] > target) break;
    last = point[1];
  }
  return last;
}

function BalanceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: number; value: number; invested: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pnl = d.value - d.invested;
  return (
    <div className="mpf-tt">
      <div className="mpf-tt-date">{new Date(d.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</div>
      <div className="mpf-tt-row"><span>Valor</span><strong>{usd(d.value)}</strong></div>
      <div className="mpf-tt-row"><span>Invertido</span><strong className="muted">{usd(d.invested)}</strong></div>
      <div className="mpf-tt-row"><span>P&L</span><strong className={pnl >= 0 ? "pos" : "neg"}>{(pnl >= 0 ? "+" : "−") + usd(Math.abs(pnl))}</strong></div>
    </div>
  );
}

function PerfTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { symbol: string; pnl: number; pctv: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="mpf-tt">
      <div className="mpf-tt-date">{d.symbol}</div>
      <div className="mpf-tt-row"><span>Rendimiento</span><strong className={d.pctv >= 0 ? "pos" : "neg"}>{pct(d.pctv)}</strong></div>
      <div className="mpf-tt-row"><span>P&L</span><strong className={d.pnl >= 0 ? "pos" : "neg"}>{(d.pnl >= 0 ? "+" : "−") + usd(Math.abs(d.pnl))}</strong></div>
    </div>
  );
}

function AllocTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; share: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="mpf-tt">
      <div className="mpf-tt-date">{d.name}</div>
      <div className="mpf-tt-row"><span>Valor</span><strong>{usd(d.value)}</strong></div>
      <div className="mpf-tt-row"><span>Peso</span><strong>{d.share.toFixed(1)}%</strong></div>
    </div>
  );
}

export default function MiPortfolioCharts({
  holdings, txs, history, historyLoading,
}: {
  holdings: ChartHolding[];
  txs: Tx[];
  history: Record<string, number[][]>;
  historyLoading: boolean;
}) {
  // ── Crecimiento del balance: valor e invertido a lo largo del tiempo ──
  const timeline = useMemo(() => {
    if (txs.length === 0 || Object.keys(history).length === 0) return [];
    const sorted = [...txs].sort((a, b) =>
      a.tx_date === b.tx_date ? a.created_at.localeCompare(b.created_at) : a.tx_date.localeCompare(b.tx_date)
    );
    const startMs = new Date(sorted[0].tx_date + "T00:00:00").getTime();
    const endMs = Date.now();
    const numPoints = Math.min(Math.max(Math.round((endMs - startMs) / 86_400_000), 2), 90);
    const out: { date: number; value: number; invested: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const dateMs = startMs + ((endMs - startMs) * i) / numPoints;
      const state: Record<string, { qty: number; avgCost: number }> = {};
      for (const t of sorted) {
        if (new Date(t.tx_date + "T00:00:00").getTime() > dateMs) break;
        const s = state[t.coin_id] ?? (state[t.coin_id] = { qty: 0, avgCost: 0 });
        if (t.type === "buy") {
          const nq = s.qty + t.quantity;
          s.avgCost = nq > 0 ? (s.qty * s.avgCost + t.quantity * t.price) / nq : 0;
          s.qty = nq;
        } else {
          s.qty -= t.quantity;
          if (s.qty <= 1e-9) { s.qty = Math.max(0, s.qty); if (s.qty === 0) s.avgCost = 0; }
        }
      }
      let value = 0, invested = 0;
      for (const cid of Object.keys(state)) {
        const s = state[cid];
        if (s.qty <= 1e-9) continue;
        invested += s.qty * s.avgCost;
        const px = priceAt(history[cid], dateMs);
        value += s.qty * (px ?? s.avgCost);
      }
      out.push({ date: Math.round(dateMs), value: round2(value), invested: round2(invested) });
    }
    return out;
  }, [txs, history]);

  // ── Rendimiento por activo (mejor y peor) ──
  const performers = useMemo(() => {
    return holdings
      .filter((h) => h.unrealized != null && h.invested > 0)
      .map((h) => ({ symbol: h.coin_symbol, pctv: (h.unrealized! / h.invested) * 100, pnl: h.unrealized! }))
      .sort((a, b) => b.pctv - a.pctv);
  }, [holdings]);

  // ── Distribución de la cartera ──
  const allocation = useMemo(() => {
    const items = holdings
      .filter((h) => (h.currentValue ?? 0) > 0)
      .map((h) => ({ name: h.coin_symbol, value: h.currentValue as number }));
    const total = items.reduce((s, x) => s + x.value, 0) || 1;
    return items
      .sort((a, b) => b.value - a.value)
      .map((x) => ({ ...x, share: (x.value / total) * 100 }));
  }, [holdings]);

  const perfDomain = useMemo(() => {
    const max = Math.max(1, ...performers.map((p) => Math.abs(p.pctv)));
    const bound = Math.ceil(max / 5) * 5;
    return [-bound, bound] as [number, number];
  }, [performers]);

  if (holdings.length === 0) return null;

  return (
    <div className="mpf-charts">
      {/* ── Crecimiento del balance ── */}
      <div className="mpf-card mpf-chart-card mpf-chart-card--wide">
        <div className="mpf-card-title"><TrendingUp size={16} /> Crecimiento del balance</div>
        {timeline.length >= 2 ? (
          <div className="mpf-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="mpfValueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,244,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fill: "#8fa3b8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(240,244,255,0.08)" }} minTickGap={28} />
                <YAxis tickFormatter={abbrev} tick={{ fill: "#8fa3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip content={<BalanceTooltip />} />
                <Area type="monotone" dataKey="invested" stroke="#6b7b8a" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} name="Invertido" />
                <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2.5} fill="url(#mpfValueGrad)" dot={false} name="Valor" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mpf-chart-legend">
              <span><i className="mpf-leg-dot" style={{ background: GOLD }} /> Valor de la cartera</span>
              <span><i className="mpf-leg-dot mpf-leg-dot--dash" /> Capital invertido</span>
            </div>
          </div>
        ) : (
          <div className="mpf-chart-empty">{historyLoading ? "Cargando histórico de precios…" : "Aún no hay suficiente histórico para dibujar el balance."}</div>
        )}
      </div>

      {/* ── Rendimiento por activo ── */}
      <div className="mpf-card mpf-chart-card">
        <div className="mpf-card-title"><BarChart3 size={16} /> Rendimiento por activo</div>
        {performers.length > 0 ? (
          <div className="mpf-chart-wrap">
            <ResponsiveContainer width="100%" height={Math.max(150, performers.length * 38)}>
              <BarChart data={performers} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,244,255,0.06)" horizontal={false} />
                <XAxis type="number" domain={perfDomain} tickFormatter={(v) => v + "%"} tick={{ fill: "#8fa3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="symbol" tick={{ fill: "#dce8f8", fontSize: 12, fontWeight: 700 }} tickLine={false} axisLine={false} width={54} />
                <Tooltip cursor={{ fill: "rgba(240,244,255,0.04)" }} content={<PerfTooltip />} />
                <Bar dataKey="pctv" radius={[0, 5, 5, 0]} barSize={16}>
                  {performers.map((p) => <Cell key={p.symbol} fill={p.pctv >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mpf-chart-empty">Añade el precio de compra para ver el rendimiento.</div>
        )}
      </div>

      {/* ── Distribución de la cartera ── */}
      <div className="mpf-card mpf-chart-card">
        <div className="mpf-card-title"><PieIcon size={16} /> Distribución</div>
        {allocation.length > 0 ? (
          <div className="mpf-alloc">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={2} stroke="none">
                  {allocation.map((a, i) => <Cell key={a.name} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<AllocTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mpf-alloc-legend">
              {allocation.slice(0, 8).map((a, i) => (
                <span key={a.name} className="mpf-alloc-item">
                  <i className="mpf-leg-dot" style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                  {a.name} <strong>{a.share.toFixed(1)}%</strong>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mpf-chart-empty">Sin posiciones con valor de mercado.</div>
        )}
      </div>
    </div>
  );
}
