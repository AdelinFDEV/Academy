"use client";

import { Fragment, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, PieChart, BarChart3, Award, AlertTriangle,
  Pencil, Trash2, NotebookText,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, LabelList,
} from "recharts";
import { TjSelect, TjPairInput, TjDateTimePicker } from "@/components/trading/TjControls";
import TjTradeCalendar from "@/components/trading/TjCalendar";
import { pnlStr } from "@/components/trading/tjFormat";

type Direction = "long" | "short";
type TradeResult = "win" | "loss" | "breakeven";

/** Mensaje legible de cualquier cosa que se lance, no solo de un Error. */
const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Ha ocurrido un error inesperado";

interface Trade {
  id: string;
  date: string;
  pair: string;
  direction: Direction;
  risk_amount: number;
  expected_gain: number;
  pnl: number;
  result: TradeResult;
  strategy: string | null;
  notes: string | null;
  created_at: string;
}

interface FormState {
  date: string;
  pair: string;
  direction: Direction;
  risk_amount: string;
  expected_gain: string;
  result: TradeResult;
  strategy: string;
  notes: string;
}

const NOTES_MAX = 150;

/**
 * Orden cronologico estable. El selector guarda la fecha con precision de minutos,
 * asi que dos operaciones seguidas empatan a menudo: sin desempate, el orden que
 * devuelve la BD es arbitrario y la curva de capital acumula el P&L al reves.
 */
function byChronology(a: Trade, b: Trade): number {
  return a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at);
}

function nowForInput(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY_FORM: FormState = {
  date: nowForInput(),
  pair: "",
  direction: "long",
  risk_amount: "",
  expected_gain: "",
  result: "win",
  strategy: "",
  notes: "",
};

const COMMON_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT",
  "XRP/USDT", "DOGE/USDT", "ADA/USDT", "AVAX/USDT", "LINK/USDT",
];

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

function formatDateCompact(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function ratioQuality(ratio: number | null): string {
  if (ratio == null) return "";
  if (ratio >= 2) return "good";
  if (ratio >= 1) return "ok";
  return "bad";
}

// ─────────────────────────────────────────────
// SVG Charts
// ─────────────────────────────────────────────

interface EquityPoint {
  label: string;
  value: number;
  trade: Trade | null;
}

/**
 * Recharts inyecta estas props en los render-props de puntos, etiquetas y
 * tooltips. Su tipado publico es demasiado laxo para lo que necesitamos aqui,
 * asi que declaramos las formas minimas que este componente consume.
 */
interface DotRenderProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: EquityPoint;
}

/** Payload de un tooltip de Recharts: cada entrada envuelve el dato original. */
interface TooltipRenderProps<T> {
  active?: boolean;
  payload?: { name?: string; value?: number | string; payload: T }[];
}

// Recharts declara estas coordenadas como `string | number`, asi que se
// aceptan tal cual y se normalizan a numero al usarlas.
interface BarLabelRenderProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
}

const resultColor = (result: TradeResult) =>
  result === "win" ? "#5fd39a" : result === "loss" ? "#ff5555" : "#93a3c4";

function EquityDot(props: DotRenderProps) {
  const { cx, cy, payload, index } = props;
  if (cx == null || cy == null) return null;
  if (!payload?.trade) {
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4.5} fill="#93a3c4" stroke="#0a1628" strokeWidth={2} />;
  }
  const color = resultColor(payload.trade.result);
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5.5} fill={color} stroke="#0a1628" strokeWidth={2} />;
}

function EquityActiveDot(props: DotRenderProps) {
  const { cx, cy, payload } = props;
  const color = payload?.trade ? resultColor(payload.trade.result) : "#93a3c4";
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill={color} opacity={0.2} />
      <circle cx={cx} cy={cy} r={6.5} fill={color} stroke="#0a1628" strokeWidth={2.5} />
    </g>
  );
}

function EquityTooltip({ active, payload }: TooltipRenderProps<EquityPoint>) {
  if (!active || !payload || !payload.length) return null;
  const p: EquityPoint = payload[0].payload;
  return (
    <div className="tj-eq-tooltip">
      <div className="tj-eq-tooltip-date">{p.label}</div>
      <div className="tj-eq-tooltip-value">{p.value.toFixed(2)}$</div>
      {p.trade && (
        <div className={`tj-eq-tooltip-trade ${p.trade.result}`}>
          {p.trade.pair} · {p.trade.pnl >= 0 ? "+" : ""}{p.trade.pnl.toFixed(2)}$
        </div>
      )}
    </div>
  );
}

// Genera marcas "redondas" (múltiplos limpios de 1/2/5 × 10^n) que abarcan
// [min, max], en vez de dividir el rango en partes iguales — así el eje Y
// muestra números con los que es fácil ubicar mentalmente los puntos reales.
function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  const rawStep = range / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const step = residual >= 5 ? 5 * magnitude : residual >= 2 ? 2 * magnitude : magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

function EquityCurve({ trades, startingCapital }: { trades: Trade[]; startingCapital: number | null }) {
  if (trades.length === 0) {
    return (
      <div className="chart-empty">
        Registra tu primera operación para ver la curva de equity
      </div>
    );
  }

  const base = startingCapital ?? 0;

  const data: EquityPoint[] = [{ label: "Inicio", value: base, trade: null }];
  trades.forEach(t => {
    data.push({
      label: formatDateShort(t.date),
      value: data[data.length - 1].value + t.pnl,
      trade: t,
    });
  });

  const values = data.map(d => d.value);
  const minV = Math.min(base, ...values);
  const maxV = Math.max(base, ...values);
  const yTicks = niceTicks(minV, maxV, 5);
  const yDomain: [number, number] = [yTicks[0], yTicks[yTicks.length - 1]];

  const isPositive = data[data.length - 1].value >= base;
  const lineColor = isPositive ? "#5fd39a" : "#ff5555";

  return (
    <div className="tj-eq-chart" style={{ filter: `drop-shadow(0 0 10px ${lineColor}40)` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -4, bottom: 10 }}>
          <defs>
            <linearGradient id="ec-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(240,244,255,0.07)" vertical={false} />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(240,244,255,0.6)", fontSize: 13, fontWeight: 600 }}
            tickMargin={14}
            minTickGap={40}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={68}
            domain={yDomain}
            ticks={yTicks}
            tick={{ fill: "rgba(240,244,255,0.6)", fontSize: 13, fontWeight: 600 }}
            tickFormatter={(v: number) => `${startingCapital == null && v >= 0 ? "+" : ""}${Math.round(v)}$`}
          />

          <Tooltip content={<EquityTooltip />} cursor={{ stroke: "rgba(240,244,255,0.25)", strokeDasharray: "4 4" }} />

          <ReferenceLine y={base} stroke="rgba(240,244,255,0.25)" strokeDasharray="5 4" />

          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={3}
            fill="url(#ec-grad)"
            dot={<EquityDot />}
            activeDot={<EquityActiveDot />}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutTooltip({ active, payload }: TooltipRenderProps<{ color: string }>) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="tj-eq-tooltip">
      <div className="tj-eq-tooltip-date">{p.name}</div>
      <div className="tj-eq-tooltip-value" style={{ color: p.payload.color }}>{p.value}</div>
    </div>
  );
}

function WinRateDonut({ wins, losses, breakevens }: { wins: number; losses: number; breakevens: number }) {
  const total = wins + losses + breakevens || 1;
  const winRate = Math.round((wins / total) * 100);

  const data = [
    { name: "Ganancias", value: wins, color: "#5fd39a" },
    { name: "Pérdidas", value: losses, color: "#ff5555" },
    { name: "Breakeven", value: breakevens, color: "#93a3c4" },
  ].filter(d => d.value > 0);

  return (
    <div className="tj-donut-wrap">
      <ResponsiveContainer width={122} height={122}>
        <RePieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={56}
            paddingAngle={4}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </RePieChart>
      </ResponsiveContainer>
      <div className="tj-donut-center">
        <span className="tj-donut-pct">{winRate}%</span>
        <span className="tj-donut-sub">Aciertos</span>
      </div>
    </div>
  );
}

function PairTooltip({ active, payload }: TooltipRenderProps<{ pair: string; pnl: number }>) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tj-eq-tooltip">
      <div className="tj-eq-tooltip-date">{p.pair}</div>
      <div className="tj-eq-tooltip-value" style={{ color: p.pnl >= 0 ? "#5fd39a" : "#ff5555" }}>
        {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}$
      </div>
    </div>
  );
}

function PnlByPair({ trades }: { trades: Trade[] }) {
  const byPair: Record<string, number> = {};
  trades.forEach(t => { byPair[t.pair] = (byPair[t.pair] ?? 0) + t.pnl; });

  const allPairs = Object.entries(byPair).map(([pair, pnl]) => ({ pair, pnl }));
  const chartData = [...allPairs]
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 6)
    .map(p => ({ ...p, absPnl: Math.abs(p.pnl) }));

  if (chartData.length === 0) {
    return <div className="chart-empty">Sin datos aún</div>;
  }

  const bestPair = allPairs.reduce<{ pair: string; pnl: number } | null>(
    (best, p) => (p.pnl > (best?.pnl ?? -Infinity) ? p : best), null
  );
  const maxAbs = Math.max(...chartData.map(p => p.absPnl), 1);

  function renderValueLabel(props: BarLabelRenderProps) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    const index = props.index ?? 0;
    const item = chartData[index];
    const color = item.pnl >= 0 ? "#5fd39a" : "#ff5555";
    return (
      <text x={x + width + 8} y={y + height / 2} dy={4} fontSize={13} fontWeight={700}
        fill={color} fontFamily="Space Grotesk, sans-serif">
        {item.pnl >= 0 ? "+" : ""}{item.pnl.toFixed(1)}$
      </text>
    );
  }

  return (
    <>
      {bestPair && bestPair.pnl > 0 && (
        <div className="tj-pair-top">
          <Award size={13} />
          <span>Mejor par: <strong>{bestPair.pair}</strong></span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={chartData.length * 48}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 54, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="pl-grad-pos" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5fd39a" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5fd39a" stopOpacity={0.95} />
            </linearGradient>
            <linearGradient id="pl-grad-neg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff5555" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ff5555" stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <XAxis type="number" domain={[0, maxAbs * 1.15]} hide />
          <YAxis
            type="category"
            dataKey="pair"
            axisLine={false}
            tickLine={false}
            width={82}
            tick={{ fill: "rgba(240,244,255,0.75)", fontSize: 13, fontWeight: 700 }}
          />
          <Tooltip content={<PairTooltip />} cursor={{ fill: "rgba(240,244,255,0.04)" }} />
          <Bar dataKey="absPnl" radius={6} isAnimationActive animationDuration={700} animationEasing="ease-out">
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? "url(#pl-grad-pos)" : "url(#pl-grad-neg)"} />
            ))}
            <LabelList content={renderValueLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function TradingJournal({
  initialTrades,
  userName,
  initialCapital,
}: {
  initialTrades: Trade[];
  userName: string;
  initialCapital: number | null;
}) {
  const [trades, setTrades] = useState<Trade[]>(() => [...initialTrades].sort(byChronology));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const [capital, setCapital] = useState<number | null>(initialCapital);
  const [editingCapital, setEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(initialCapital?.toString() ?? "");
  const [savingCapital, setSavingCapital] = useState(false);
  const [capitalError, setCapitalError] = useState("");

  const stats = useMemo(() => {
    const winTrades = trades.filter(t => t.result === "win");
    const lossTrades = trades.filter(t => t.result === "loss");
    const wins = winTrades.length;
    const losses = lossTrades.length;
    const bes = trades.filter(t => t.result === "breakeven").length;
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const avgPnl = trades.length ? totalPnl / trades.length : 0;
    const avgWin = wins ? winTrades.reduce((s, t) => s + t.pnl, 0) / wins : 0;
    const avgLoss = losses ? lossTrades.reduce((s, t) => s + t.pnl, 0) / losses : 0;
    // La mejor operacion solo puede salir de las que ganan, y la peor solo de las
    // que pierden. Con un Math.min sobre todas, un diario sin ninguna perdida
    // mostraba una ganancia como "peor operacion". Sin candidatas no hay cifra:
    // la tarjeta muestra un guion en vez de mentir con un 0.
    const gains = trades.filter(t => t.pnl > 0).map(t => t.pnl);
    const drops = trades.filter(t => t.pnl < 0).map(t => t.pnl);
    const best = gains.length ? Math.max(...gains) : null;
    const worst = drops.length ? Math.min(...drops) : null;
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;

    // Rachas maximas consecutivas. `trades` ya viene ordenado por byChronology,
    // asi que basta recorrerlo una vez. El breakeven ni suma ni rompe: no es
    // victoria ni derrota, se salta y la racha sigue contando a ambos lados.
    let bestWinStreak = 0;
    let bestLossStreak = 0;
    let runWin = 0;
    let runLoss = 0;
    for (const t of trades) {
      if (t.result === "breakeven") continue;
      if (t.result === "win") {
        runLoss = 0;
        runWin += 1;
        if (runWin > bestWinStreak) bestWinStreak = runWin;
      } else {
        runWin = 0;
        runLoss += 1;
        if (runLoss > bestLossStreak) bestLossStreak = runLoss;
      }
    }

    return {
      wins, losses, bes, totalPnl, avgPnl, avgWin, avgLoss, best, worst, winRate,
      bestWinStreak, bestLossStreak,
    };
  }, [trades]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function previewPnl(): number | null {
    const risk = parseFloat(form.risk_amount);
    const gain = parseFloat(form.expected_gain);
    if (form.result === "breakeven") return 0;
    if (form.result === "win") return !isNaN(gain) ? gain : null;
    return !isNaN(risk) ? -risk : null;
  }

  function previewRisk(): { pct: number | null; ratio: number | null } | null {
    const risk = parseFloat(form.risk_amount);
    const gain = parseFloat(form.expected_gain);
    if (isNaN(risk) || risk <= 0) return null;
    const refBalance = currentCapital ?? capital;
    const pct = refBalance && refBalance > 0 ? (risk / refBalance) * 100 : null;
    const ratio = !isNaN(gain) && gain > 0 ? gain / risk : null;
    return { pct, ratio };
  }

  function startEdit(trade: Trade) {
    setEditingId(trade.id);
    setForm({
      date: trade.date.slice(0, 16),
      pair: trade.pair,
      direction: trade.direction,
      risk_amount: String(trade.risk_amount),
      expected_gain: String(trade.expected_gain),
      result: trade.result,
      strategy: trade.strategy ?? "",
      notes: trade.notes ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: nowForInput() });
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/trades", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      const savedTrade: Trade = await res.json();
      setTrades(prev =>
        (editingId ? prev.map(t => (t.id === editingId ? savedTrade : t)) : [...prev, savedTrade])
          .sort(byChronology)
      );
      closeForm();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/trades", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setTrades(prev => prev.filter(t => t.id !== id));
      if (openNotes === id) setOpenNotes(null);
      if (editingId === id) closeForm();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReset() {
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch("/api/trades/reset", { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al resetear");
      }
      setTrades([]);
      setCapital(null);
      setCapitalInput("");
      setOpenNotes(null);
      closeForm();
      setShowResetConfirm(false);
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  async function saveCapital(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(capitalInput);
    if (isNaN(value) || value < 0) {
      setCapitalError("Introduce un capital válido");
      return;
    }
    setSavingCapital(true);
    setCapitalError("");
    try {
      const res = await fetch("/api/trading-capital", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capital: value }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      setCapital(value);
      setEditingCapital(false);
    } catch (err) {
      setCapitalError(errorMessage(err));
    } finally {
      setSavingCapital(false);
    }
  }

  function cancelEditCapital() {
    setCapitalInput(capital?.toString() ?? "");
    setCapitalError("");
    setEditingCapital(false);
  }

  const currentCapital = capital != null ? capital + stats.totalPnl : null;
  const returnPct = capital != null && capital > 0 ? (stats.totalPnl / capital) * 100 : null;

  const preview = previewPnl();
  const risk = previewRisk();

  return (
    <div className="trading-journal">
      {/* Header */}
      <div className="tj-header">
        <div>
          <h1 className="tj-title">Diario de Trading</h1>
          <p className="tj-sub">
            {trades.length} {trades.length === 1 ? "operación registrada" : "operaciones registradas"} · {userName}
          </p>
        </div>
        <div className="tj-header-actions">
          <button
            className="btn-primary btn-small"
            onClick={() => {
              if (showForm) { closeForm(); } else { setShowForm(true); setFormError(""); }
            }}
          >
            {showForm ? "Cancelar" : "+ Nueva operación"}
          </button>
        </div>
      </div>

      {/* Capital de la cuenta */}
      <div className="tj-capital-card">
        {editingCapital ? (
          <form className="tj-capital-edit" onSubmit={saveCapital}>
            <div className="field">
              <label>Capital inicial ($)</label>
              <input
                type="number" step="any" min="0" autoFocus
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                placeholder="1000"
                required
              />
            </div>
            {capitalError && <p className="auth-error">{capitalError}</p>}
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-small" disabled={savingCapital}>
                {savingCapital ? "Guardando..." : "Guardar"}
              </button>
              {capital != null && (
                <button type="button" className="action-btn" onClick={cancelEditCapital}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        ) : capital == null ? (
          <div className="tj-capital-empty">
            <p>Define tu capital inicial para ver cómo evoluciona tu cuenta con cada operación.</p>
            <button className="btn-primary btn-small" onClick={() => setEditingCapital(true)}>
              Definir capital inicial
            </button>
          </div>
        ) : (
          <div className="tj-capital-row">
            <div className="tj-capital-stat">
              <span className="tj-capital-label">Capital inicial</span>
              <span className="tj-capital-value">{capital.toFixed(2)}$</span>
            </div>
            <div className="tj-capital-stat">
              <span className="tj-capital-label">Capital actual</span>
              <span className={`tj-capital-value ${currentCapital! >= capital ? "tj-positive-text" : "tj-negative-text"}`}>
                {currentCapital!.toFixed(2)}$
              </span>
            </div>
            <div className="tj-capital-stat">
              <span className="tj-capital-label">Retorno</span>
              <span className={`tj-capital-value ${returnPct! >= 0 ? "tj-positive-text" : "tj-negative-text"}`}>
                {returnPct! >= 0 ? "+" : ""}{returnPct!.toFixed(2)}%
              </span>
            </div>
            <div className="tj-capital-actions">
              <button className="action-btn edit" onClick={() => setEditingCapital(true)}>
                Editar
              </button>
              <span className="tj-capital-actions-sep" />
              <button
                className="action-btn delete"
                onClick={() => { setShowResetConfirm(true); setResetError(""); }}
              >
                Resetear diario
              </button>
            </div>
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="tj-reset-confirm">
          <p>
            ¿Seguro que quieres resetear el diario? Se borrarán las {trades.length}{" "}
            {trades.length === 1 ? "operación registrada" : "operaciones registradas"} y tu capital inicial.
            <strong> Esta acción no se puede deshacer.</strong>
          </p>
          {resetError && <p className="auth-error">{resetError}</p>}
          <div className="form-actions">
            <button className="action-btn delete" onClick={handleReset} disabled={resetting}>
              {resetting ? "Reseteando..." : "Sí, resetear todo"}
            </button>
            <button className="action-btn" onClick={() => setShowResetConfirm(false)} disabled={resetting}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* New trade form */}
      {showForm && (
        <div className="tj-form-wrap">
          <form className="tj-form" onSubmit={handleSubmit}>
            <div className="tj-form-grid">
              <div className="field">
                <label>Fecha y hora</label>
                <TjDateTimePicker
                  value={form.date}
                  onChange={(v) => setForm(f => ({ ...f, date: v }))}
                />
              </div>
              <div className="field">
                <label>Par</label>
                <TjPairInput
                  value={form.pair}
                  onChange={(v) => setForm(f => ({ ...f, pair: v }))}
                  options={COMMON_PAIRS}
                  placeholder="BTC/USDT"
                />
              </div>
              <div className="field">
                <label>Dirección</label>
                <TjSelect
                  value={form.direction}
                  onChange={(v) => setForm(f => ({ ...f, direction: v as Direction }))}
                  options={[{ value: "long", label: "Long" }, { value: "short", label: "Short" }]}
                />
              </div>
              <div className="field">
                <label>Riesgo asumido ($)</label>
                <input
                  type="number" name="risk_amount"
                  value={form.risk_amount} onChange={handleChange}
                  step="any" min="0" placeholder="0.00" required
                />
              </div>
              <div className="field">
                <label>Ganancia esperada ($)</label>
                <input
                  type="number" name="expected_gain"
                  value={form.expected_gain} onChange={handleChange}
                  step="any" min="0" placeholder="0.00" required
                />
              </div>
              <div className="field">
                <label>Resultado</label>
                <TjSelect
                  value={form.result}
                  onChange={(v) => setForm(f => ({ ...f, result: v as TradeResult }))}
                  options={[
                    { value: "win", label: "Ganada" },
                    { value: "loss", label: "Perdida" },
                    { value: "breakeven", label: "Breakeven" },
                  ]}
                />
              </div>
              <div className="field">
                <label>Estrategia (opcional)</label>
                <input
                  type="text" name="strategy"
                  value={form.strategy} onChange={handleChange}
                  placeholder="Scalping, swing, breakout..."
                />
              </div>
              <div className="field field-full">
                <label>Notas (opcional) <span className="tj-notes-count">{form.notes.length}/{NOTES_MAX}</span></label>
                <textarea
                  name="notes" value={form.notes} onChange={handleChange}
                  rows={3} maxLength={NOTES_MAX} className="tj-notes-textarea"
                  placeholder="Por qué entré, qué aprendí, qué mejorar..."
                />
              </div>
            </div>

            {(preview !== null || risk !== null) && (
              <div className="tj-preview-panel">
                {preview !== null && (
                  <div className={`tj-preview-item${preview > 0 ? " positive" : preview < 0 ? " negative" : " neutral"}`}>
                    <span className="tj-preview-label">P&L estimado</span>
                    <span className="tj-preview-value">{pnlStr(preview)}</span>
                    <span className="tj-preview-tag">{preview > 0 ? "Ganancia" : preview < 0 ? "Pérdida" : "Breakeven"}</span>
                  </div>
                )}
                {risk !== null && risk.pct !== null && (
                  <div className={`tj-preview-item${risk.pct > 2 ? " negative" : ""}`}>
                    <span className="tj-preview-label">Riesgo de cuenta</span>
                    <span className="tj-preview-value">{risk.pct.toFixed(2)}%</span>
                    {risk.pct > 2 && (
                      <span className="tj-preview-tag warning">
                        <AlertTriangle size={12} /> Riesgo alto
                      </span>
                    )}
                  </div>
                )}
                {risk !== null && risk.ratio !== null && (
                  <div className="tj-preview-item">
                    <span className="tj-preview-label">Ratio R:R</span>
                    <span className="tj-preview-value">1:{Math.round(risk.ratio)}</span>
                  </div>
                )}
              </div>
            )}

            {formError && <p className="auth-error" style={{ marginBottom: "1rem" }}>{formError}</p>}

            <div className="form-actions">
              <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar operación"}
              </button>
              {editingId && (
                <button type="button" className="action-btn" onClick={closeForm}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="tj-stats">
        <div className={`tj-stat-card ${stats.totalPnl >= 0 ? "tj-positive" : "tj-negative"}`}>
          <span className="tj-stat-value">{pnlStr(stats.totalPnl)}</span>
          <span className="tj-stat-label">P&L Total</span>
        </div>
        <div className="tj-stat-card">
          <span className="tj-stat-value">{stats.winRate.toFixed(0)}%</span>
          <span className="tj-stat-label">Win Rate</span>
        </div>
        <div className="tj-stat-card">
          <span className="tj-stat-value">{trades.length}</span>
          <span className="tj-stat-label">Operaciones</span>
        </div>
        <div className={`tj-stat-card ${stats.avgPnl >= 0 ? "tj-positive" : "tj-negative"}`}>
          <span className="tj-stat-value">{pnlStr(stats.avgPnl)}</span>
          <span className="tj-stat-label">P&L Medio</span>
        </div>
        <div className="tj-stat-card tj-positive">
          <span className="tj-stat-value">{pnlStr(stats.avgWin)}</span>
          <span className="tj-stat-label">Ganancia media</span>
        </div>
        <div className="tj-stat-card tj-negative">
          <span className="tj-stat-value">{pnlStr(stats.avgLoss)}</span>
          <span className="tj-stat-label">Pérdida media</span>
        </div>
        <div className={`tj-stat-card ${stats.best != null ? "tj-positive" : ""}`}>
          <span className="tj-stat-value">
            {stats.best != null ? pnlStr(stats.best) : "—"}
          </span>
          <span className="tj-stat-label">Mejor op.</span>
        </div>
        <div className={`tj-stat-card ${stats.worst != null ? "tj-negative" : ""}`}>
          <span className="tj-stat-value">
            {stats.worst != null ? pnlStr(stats.worst) : "—"}
          </span>
          <span className="tj-stat-label">Peor op.</span>
        </div>
        <div className={`tj-stat-card tj-stat-streak ${stats.bestWinStreak ? "tj-positive" : ""}`}>
          <span className="tj-stat-value">{stats.bestWinStreak}</span>
          <span className="tj-stat-label">Mayor racha ganando</span>
        </div>
        <div className={`tj-stat-card tj-stat-streak ${stats.bestLossStreak ? "tj-negative" : ""}`}>
          <span className="tj-stat-value">{stats.bestLossStreak}</span>
          <span className="tj-stat-label">Mayor racha perdiendo</span>
        </div>
      </div>

      {/* Calendario mensual */}
      <TjTradeCalendar trades={trades} />

      {/* Charts */}
      <div className="tj-charts">
        <div className="tj-chart-main">
          <div className="tj-chart-head">
            <div className="tj-chart-label">
              <TrendingUp size={15} />
              {capital != null ? "Evolución del capital" : "Curva de equity"}
            </div>
            {returnPct !== null && (
              <span className={`tj-chart-badge${returnPct >= 0 ? " positive" : " negative"}`}>
                {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="tj-chart-body">
            <EquityCurve trades={trades} startingCapital={capital} />
          </div>
        </div>
        <div className="tj-chart-side">
          <div className="tj-chart-block">
            <div className="tj-chart-label"><PieChart size={15} /> Win / Loss</div>
            <div className="tj-donut-row">
              <WinRateDonut wins={stats.wins} losses={stats.losses} breakevens={stats.bes} />
              <div className="tj-donut-legend">
                <div className="tj-legend-row win">
                  <div className="tj-legend-icon"><TrendingUp size={14} /></div>
                  <span className="tj-legend-name">Ganancias</span>
                  <span className="tj-legend-value win">{stats.wins}</span>
                </div>
                <div className="tj-legend-row loss">
                  <div className="tj-legend-icon"><TrendingDown size={14} /></div>
                  <span className="tj-legend-name">Pérdidas</span>
                  <span className="tj-legend-value loss">{stats.losses}</span>
                </div>
                {stats.bes > 0 && (
                  <div className="tj-legend-row be">
                    <div className="tj-legend-icon"><Minus size={14} /></div>
                    <span className="tj-legend-name">Breakeven</span>
                    <span className="tj-legend-value be">{stats.bes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="tj-chart-block">
            <div className="tj-chart-label"><BarChart3 size={15} /> P&L por par</div>
            <PnlByPair trades={trades} />
          </div>
        </div>
      </div>

      {/* Trade table */}
      <div className="tj-table-section">
        <div className="tj-section-head">
          <span className="tj-chart-label" style={{ marginBottom: 0 }}>Registro de operaciones</span>
          <span className="tj-table-count">{trades.length} {trades.length === 1 ? "entrada" : "entradas"}</span>
        </div>

        {trades.length === 0 ? (
          <div className="tj-empty">
            <p>No hay operaciones registradas aún.</p>
            <p>Usa el botón <strong>+ Nueva operación</strong> para empezar tu diario.</p>
          </div>
        ) : (
          <div className="tj-table-wrap">
            <table className="tj-table">
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col className="tj-col-hide-sm" style={{ width: "8%" }} />
                <col className="tj-col-hide-md" style={{ width: "10%" }} />
                <col className="tj-col-hide-md" style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Par</th>
                  <th>Dir.</th>
                  <th>Riesgo</th>
                  <th>Ganancia</th>
                  <th>P&L</th>
                  <th>Resultado</th>
                  <th>Ratio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {[...trades].reverse().map(trade => {
                    const ratio = trade.risk_amount > 0 ? trade.expected_gain / trade.risk_amount : null;
                    const rowCls = trade.result === "win" ? "tj-row-win" : trade.result === "loss" ? "tj-row-loss" : "tj-row-be";
                    const hasDetail = !!(trade.notes || trade.strategy);
                    const ResultIcon = trade.result === "win" ? TrendingUp : trade.result === "loss" ? TrendingDown : Minus;
                    return (
                      <Fragment key={trade.id}>
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={rowCls}
                      >
                        <td className="tj-td-date">{formatDateCompact(trade.date)}</td>
                        <td className="tj-td-pair">{trade.pair}</td>
                        <td>
                          <span className={`tj-dir-badge ${trade.direction}`}>
                            {trade.direction === "long" ? "Long" : "Short"}
                          </span>
                        </td>
                        <td>{trade.risk_amount.toFixed(2)}$</td>
                        <td>{trade.expected_gain.toFixed(2)}$</td>
                        <td className={trade.pnl >= 0 ? "tj-pnl-pos" : "tj-pnl-neg"}>
                          {pnlStr(trade.pnl)}
                        </td>
                        <td>
                          <span className={`tj-result-badge ${trade.result}`}>
                            <ResultIcon size={12} />
                            {trade.result === "win" ? "Ganada" : trade.result === "loss" ? "Perdida" : "Breakeven"}
                          </span>
                        </td>
                        <td className={ratio !== null ? `tj-ratio-${ratioQuality(ratio)}` : "tj-ratio-none"}>
                          {ratio !== null ? `1:${Math.round(ratio)}` : "—"}
                        </td>
                        <td>
                          <div className="tj-row-actions">
                            {hasDetail && (
                              <button
                                type="button"
                                className="tj-icon-btn"
                                title="Ver detalle"
                                aria-label="Ver detalle"
                                onClick={() => setOpenNotes(openNotes === trade.id ? null : trade.id)}
                              >
                                <NotebookText size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="tj-icon-btn"
                              title="Editar"
                              aria-label="Editar"
                              onClick={() => startEdit(trade)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="tj-icon-btn delete"
                              title="Eliminar"
                              aria-label="Eliminar"
                              onClick={() => handleDelete(trade.id)}
                              disabled={deletingId === trade.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      {openNotes === trade.id && hasDetail && (
                        <tr className="tj-notes-row">
                          <td colSpan={9}>
                            <div className="tj-notes-cell">
                              <span className="tj-notes-label">{trade.pair} · {formatDateCompact(trade.date)}</span>
                              {trade.strategy && <p className="tj-notes-strategy"><strong>Estrategia:</strong> {trade.strategy}</p>}
                              {trade.notes && <p>{trade.notes}</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
