"use client";

import { useState, useMemo } from "react";

type Direction = "long" | "short";
type TradeResult = "win" | "loss" | "breakeven";

interface Trade {
  id: string;
  date: string;
  pair: string;
  direction: Direction;
  entry_price: number;
  exit_price: number;
  size: number;
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
  entry_price: string;
  exit_price: string;
  size: string;
  strategy: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  date: new Date().toISOString().split("T")[0],
  pair: "",
  direction: "long",
  entry_price: "",
  exit_price: "",
  size: "",
  strategy: "",
  notes: "",
};

const COMMON_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT",
  "XRP/USDT", "DOGE/USDT", "ADA/USDT", "AVAX/USDT", "LINK/USDT",
];

// ─────────────────────────────────────────────
// SVG Charts
// ─────────────────────────────────────────────

function EquityCurve({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="chart-empty">
        Registra tu primera operación para ver la curva de equity
      </div>
    );
  }

  const W = 800, H = 220;
  const PAD = { top: 24, right: 28, bottom: 36, left: 64 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  // Cumulative PnL series: starts at 0 before first trade
  const series: number[] = [0];
  trades.forEach(t => series.push(series[series.length - 1] + t.pnl));

  const minV = Math.min(0, ...series);
  const maxV = Math.max(0, ...series);
  const range = maxV - minV || 1;

  const tx = (i: number) => PAD.left + (i / (series.length - 1 || 1)) * cW;
  const ty = (v: number) => PAD.top + cH - ((v - minV) / range) * cH;
  const zeroY = ty(0);

  const isPositive = series[series.length - 1] >= 0;
  const lineColor = isPositive ? "#5fd39a" : "#ff5555";
  const gradId = "ec-grad";

  const polyPts = series.map((v, i) => `${tx(i)},${ty(v)}`).join(" ");
  const areaPath = [
    `M ${tx(0)},${zeroY}`,
    ...series.map((v, i) => `L ${tx(i)},${ty(v)}`),
    `L ${tx(series.length - 1)},${zeroY}`,
    "Z",
  ].join(" ");

  // 5 y-axis ticks
  const ticks = Array.from({ length: 5 }, (_, i) => minV + (range * i) / 4);

  // X-axis labels: first / mid / last trade dates
  const xLabels = ([0, Math.floor((trades.length - 1) / 2), trades.length - 1] as number[])
    .filter((v, i, a) => a.indexOf(v) === i && trades[v])
    .map(idx => ({ idx, label: trades[idx].date.slice(5) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {ticks.map((v, i) => (
        <line key={i} x1={PAD.left} y1={ty(v)} x2={W - PAD.right} y2={ty(v)}
          stroke="rgba(240,244,255,0.05)" strokeWidth="1" />
      ))}

      {/* Zero baseline */}
      <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
        stroke="rgba(240,244,255,0.16)" strokeWidth="1" strokeDasharray="5 4" />

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Equity line */}
      <polyline points={polyPts} fill="none" stroke={lineColor}
        strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Per-trade dots */}
      {trades.map((t, i) => {
        const dotColor = t.result === "win" ? "#5fd39a" : t.result === "loss" ? "#ff5555" : "#93a3c4";
        return (
          <circle key={t.id} cx={tx(i + 1)} cy={ty(series[i + 1])} r="3.5"
            fill={dotColor} stroke="rgba(10,22,40,0.85)" strokeWidth="1.5" />
        );
      })}

      {/* Last dot */}
      <circle cx={tx(series.length - 1)} cy={ty(series[series.length - 1])} r="5"
        fill={lineColor} stroke="rgba(10,22,40,0.9)" strokeWidth="2" />

      {/* Y-axis labels */}
      {ticks.map((v, i) => (
        <text key={i} x={PAD.left - 8} y={ty(v) + 4} textAnchor="end"
          fontSize="10" fill="rgba(240,244,255,0.35)" fontFamily="Space Grotesk, sans-serif">
          {v >= 0 ? "+" : ""}{v.toFixed(0)}$
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map(({ idx, label }) => (
        <text key={idx} x={tx(idx + 1)} y={H - 6} textAnchor="middle"
          fontSize="10" fill="rgba(240,244,255,0.3)" fontFamily="Space Grotesk, sans-serif">
          {label}
        </text>
      ))}
    </svg>
  );
}

function WinRateDonut({ wins, losses, breakevens }: { wins: number; losses: number; breakevens: number }) {
  const total = wins + losses + breakevens || 1;
  const r = 36;
  const circ = 2 * Math.PI * r;

  const winDash = (wins / total) * circ;
  const lossDash = (losses / total) * circ;
  const beDash = (breakevens / total) * circ;

  // Start at 12 o'clock (offset = circ/4)
  const o0 = circ / 4;
  const o1 = o0 - winDash;
  const o2 = o1 - lossDash;

  const winRate = Math.round((wins / total) * 100);

  return (
    <svg viewBox="0 0 100 100" style={{ width: "120px", height: "120px", flexShrink: 0 }}>
      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(240,244,255,0.06)" strokeWidth="14" />
      {/* Wins */}
      {wins > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#5fd39a" strokeWidth="14"
          strokeDasharray={`${winDash} ${circ - winDash}`} strokeDashoffset={o0} />
      )}
      {/* Losses */}
      {losses > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#ff5555" strokeWidth="14"
          strokeDasharray={`${lossDash} ${circ - lossDash}`} strokeDashoffset={o1} />
      )}
      {/* Breakevens */}
      {breakevens > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#93a3c4" strokeWidth="14"
          strokeDasharray={`${beDash} ${circ - beDash}`} strokeDashoffset={o2} />
      )}
      <text x="50" y="47" textAnchor="middle" fontSize="16" fontWeight="700" fill="#eef2fb"
        fontFamily="Space Grotesk, sans-serif">
        {winRate}%
      </text>
      <text x="50" y="60" textAnchor="middle" fontSize="7" fill="rgba(240,244,255,0.4)"
        fontFamily="Space Grotesk, sans-serif" letterSpacing="0.1em">
        ACIERTOS
      </text>
    </svg>
  );
}

function PnlByPair({ trades }: { trades: Trade[] }) {
  const byPair: Record<string, number> = {};
  trades.forEach(t => { byPair[t.pair] = (byPair[t.pair] ?? 0) + t.pnl; });

  const pairs = Object.entries(byPair)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 6);

  if (pairs.length === 0) {
    return <div className="chart-empty">Sin datos aún</div>;
  }

  const maxAbs = Math.max(...pairs.map(([, v]) => Math.abs(v)), 1);
  const ROW = 28, GAP = 7, LABEL = 78, W = 300, BAR_MAX = W - LABEL - 58;
  const H = pairs.length * (ROW + GAP);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {pairs.map(([pair, pnl], i) => {
        const y = i * (ROW + GAP);
        const bw = (Math.abs(pnl) / maxAbs) * BAR_MAX;
        const pos = pnl >= 0;
        const color = pos ? "#5fd39a" : "#ff5555";
        return (
          <g key={pair}>
            <text x={0} y={y + ROW / 2 + 4} fontSize="11" fill="rgba(240,244,255,0.5)"
              fontFamily="Space Grotesk, sans-serif">{pair}</text>
            <rect x={LABEL} y={y + 2} width={bw} height={ROW - 4} rx="4"
              fill={pos ? "rgba(95,211,154,0.12)" : "rgba(255,85,85,0.12)"} />
            <rect x={LABEL} y={y + 2} width={Math.min(bw, 5)} height={ROW - 4} rx="3" fill={color} />
            <text x={LABEL + bw + 6} y={y + ROW / 2 + 4} fontSize="11" fill={color} fontWeight="600"
              fontFamily="Space Grotesk, sans-serif">
              {pos ? "+" : ""}{pnl.toFixed(1)}$
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function TradingJournal({
  initialTrades,
  userName,
}: {
  initialTrades: Trade[];
  userName: string;
}) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<string | null>(null);

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === "win").length;
    const losses = trades.filter(t => t.result === "loss").length;
    const bes = trades.filter(t => t.result === "breakeven").length;
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const avgPnl = trades.length ? totalPnl / trades.length : 0;
    const best = trades.length ? Math.max(...trades.map(t => t.pnl)) : 0;
    const worst = trades.length ? Math.min(...trades.map(t => t.pnl)) : 0;
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;
    return { wins, losses, bes, totalPnl, avgPnl, best, worst, winRate };
  }, [trades]);

  function pnlStr(n: number) {
    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}$`;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function previewPnl(): number | null {
    const ep = parseFloat(form.entry_price);
    const xp = parseFloat(form.exit_price);
    const sz = parseFloat(form.size);
    if (!ep || !xp || !sz || sz <= 0) return null;
    return form.direction === "long" ? (xp - ep) * sz : (ep - xp) * sz;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al guardar");
      }
      const newTrade: Trade = await res.json();
      setTrades(prev =>
        [...prev, newTrade].sort((a, b) => a.date.localeCompare(b.date))
      );
      setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message);
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
    } finally {
      setDeletingId(null);
    }
  }

  const preview = previewPnl();
  const notedTrade = trades.find(t => t.id === openNotes);

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
        <button
          className="btn-primary btn-small"
          onClick={() => { setShowForm(v => !v); setFormError(""); }}
        >
          {showForm ? "Cancelar" : "+ Nueva operación"}
        </button>
      </div>

      {/* New trade form */}
      {showForm && (
        <div className="tj-form-wrap">
          <form className="tj-form" onSubmit={handleSubmit}>
            <div className="tj-form-grid">
              <div className="field">
                <label>Fecha</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="field">
                <label>Par</label>
                <input
                  type="text" name="pair" list="tj-pairs"
                  value={form.pair} onChange={handleChange}
                  placeholder="BTC/USDT" required
                />
                <datalist id="tj-pairs">
                  {COMMON_PAIRS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div className="field">
                <label>Dirección</label>
                <select name="direction" value={form.direction} onChange={handleChange} required>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div className="field">
                <label>Precio entrada</label>
                <input
                  type="number" name="entry_price"
                  value={form.entry_price} onChange={handleChange}
                  step="any" min="0" placeholder="0.00" required
                />
              </div>
              <div className="field">
                <label>Precio salida</label>
                <input
                  type="number" name="exit_price"
                  value={form.exit_price} onChange={handleChange}
                  step="any" min="0" placeholder="0.00" required
                />
              </div>
              <div className="field">
                <label>Tamaño (unidades)</label>
                <input
                  type="number" name="size"
                  value={form.size} onChange={handleChange}
                  step="any" min="0.000001" placeholder="1" required
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
                <label>Notas (opcional)</label>
                <textarea
                  name="notes" value={form.notes} onChange={handleChange}
                  rows={2} placeholder="Por qué entré, qué aprendí, qué mejorar..."
                />
              </div>
            </div>

            {preview !== null && (
              <div className={`tj-pnl-preview ${preview >= 0 ? "positive" : "negative"}`}>
                P&L estimado: <strong>{pnlStr(preview)}</strong>
                <span className="tj-pnl-label">{preview >= 0 ? "Ganancia" : "Pérdida"}</span>
              </div>
            )}

            {formError && <p className="auth-error" style={{ marginBottom: "1rem" }}>{formError}</p>}

            <div className="form-actions">
              <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar operación"}
              </button>
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
          <span className="tj-stat-value">{pnlStr(stats.best)}</span>
          <span className="tj-stat-label">Mejor op.</span>
        </div>
        <div className="tj-stat-card tj-negative">
          <span className="tj-stat-value">{pnlStr(stats.worst)}</span>
          <span className="tj-stat-label">Peor op.</span>
        </div>
      </div>

      {/* Charts */}
      <div className="tj-charts">
        <div className="tj-chart-main">
          <div className="tj-chart-label">Curva de equity</div>
          <EquityCurve trades={trades} />
        </div>
        <div className="tj-chart-side">
          <div className="tj-chart-block">
            <div className="tj-chart-label">Win / Loss</div>
            <div className="tj-donut-row">
              <WinRateDonut wins={stats.wins} losses={stats.losses} breakevens={stats.bes} />
              <div className="tj-donut-legend">
                <span className="tj-legend win">Ganancias: {stats.wins}</span>
                <span className="tj-legend loss">Pérdidas: {stats.losses}</span>
                {stats.bes > 0 && <span className="tj-legend be">Breakeven: {stats.bes}</span>}
              </div>
            </div>
          </div>
          <div className="tj-chart-block">
            <div className="tj-chart-label">P&L por par</div>
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
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Par</th>
                  <th>Dir.</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Tamaño</th>
                  <th>P&L</th>
                  <th>Resultado</th>
                  <th>Estrategia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...trades].reverse().map(trade => (
                  <>
                    <tr key={trade.id}>
                      <td>{trade.date}</td>
                      <td style={{ fontWeight: 600 }}>{trade.pair}</td>
                      <td>
                        <span className={`tj-dir-badge ${trade.direction}`}>
                          {trade.direction === "long" ? "Long" : "Short"}
                        </span>
                      </td>
                      <td>{trade.entry_price}</td>
                      <td>{trade.exit_price}</td>
                      <td>{trade.size}</td>
                      <td className={trade.pnl >= 0 ? "tj-pnl-pos" : "tj-pnl-neg"}>
                        {pnlStr(trade.pnl)}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={
                            trade.result === "win"
                              ? { color: "#5fd39a", background: "rgba(95,211,154,0.08)", border: "1px solid rgba(95,211,154,0.2)" }
                              : trade.result === "loss"
                              ? { color: "#ff5555", background: "rgba(255,85,85,0.08)", border: "1px solid rgba(255,85,85,0.2)" }
                              : { color: "var(--text-secondary)", background: "rgba(240,244,255,0.04)", border: "1px solid rgba(240,244,255,0.1)" }
                          }
                        >
                          {trade.result === "win" ? "Win" : trade.result === "loss" ? "Loss" : "BE"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                        {trade.strategy || "—"}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {trade.notes && (
                            <button
                              className="action-btn edit"
                              onClick={() => setOpenNotes(openNotes === trade.id ? null : trade.id)}
                            >
                              Notas
                            </button>
                          )}
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(trade.id)}
                            disabled={deletingId === trade.id}
                          >
                            {deletingId === trade.id ? "..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {openNotes === trade.id && trade.notes && (
                      <tr key={`${trade.id}-notes`} className="tj-notes-row">
                        <td colSpan={10}>
                          <div className="tj-notes-cell">
                            <span className="tj-notes-label">{trade.pair} · {trade.date}</span>
                            <p>{trade.notes}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
