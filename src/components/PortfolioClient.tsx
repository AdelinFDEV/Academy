"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Lock, ArrowRight, Plus, Trash2,
  RefreshCw, Pencil, Check, X, Wallet, Crown,
} from "lucide-react";

interface Position {
  id: string;
  coin_symbol: string;
  coin_name: string;
  coingecko_id: string;
  buy_price: number;
  quantity: number;
  buy_date: string;
  notes?: string | null;
}

interface PriceEntry {
  usd: number;
  usd_24h_change: number;
}

interface Props {
  initialPositions: Position[];
  isPremium: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
  BNB: "#f3ba2f",
  ADA: "#0d1e6d",
  XRP: "#346aa9",
  MATIC: "#8247e5",
  POL: "#8247e5",
  DOT: "#e6007a",
  AVAX: "#e84142",
  LINK: "#2a5ada",
  DOGE: "#c3a634",
  LTC: "#bfbbbb",
  ATOM: "#2e3148",
  UNI: "#ff007a",
  INJ: "#00b4d8",
  SUI: "#4da2ff",
  APT: "#00c2cb",
  NEAR: "#00ec97",
};

function coinColor(symbol: string): string {
  return COIN_COLORS[symbol.toUpperCase()] ?? "#ff6b2b";
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1000) return `$${fmt(n, 0)}`;
  if (Math.abs(n) >= 1) return `$${fmt(n, 2)}`;
  return `$${fmt(n, 4)}`;
}

const EMPTY_FORM = {
  coin_symbol: "",
  coin_name: "",
  coingecko_id: "",
  buy_price: "",
  quantity: "",
  buy_date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function PortfolioClient({ initialPositions, isPremium, isAdmin, isLoggedIn }: Props) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPrices = useCallback(async (pos: Position[]) => {
    if (!pos.length) { setPricesLoading(false); return; }
    const ids = [...new Set(pos.map((p) => p.coingecko_id))].join(",");
    try {
      const res = await fetch(`/api/portfolio/prices?ids=${ids}`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
        setLastUpdated(new Date());
      }
    } catch {
      // silently fail — stale prices stay shown
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPremium && !isAdmin) return;
    fetchPrices(positions);
    const interval = setInterval(() => fetchPrices(positions), 30_000);
    return () => clearInterval(interval);
  }, [positions, isPremium, isAdmin, fetchPrices]);

  // ── summary ─────────────────────────────────────────────────────
  const totalInvested = positions.reduce((s, p) => s + p.buy_price * p.quantity, 0);
  const totalCurrent = positions.reduce((s, p) => {
    const price = prices[p.coingecko_id]?.usd ?? p.buy_price;
    return s + price * p.quantity;
  }, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalPositive = totalPnl >= 0;

  // ── admin CRUD ───────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(pos: Position) {
    setEditingId(pos.id);
    setForm({
      coin_symbol: pos.coin_symbol,
      coin_name: pos.coin_name,
      coingecko_id: pos.coingecko_id,
      buy_price: String(pos.buy_price),
      quantity: String(pos.quantity),
      buy_date: pos.buy_date,
      notes: pos.notes ?? "",
    });
    setFormError("");
    setShowForm(true);
    setTimeout(() => document.getElementById("pf-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function savePosition() {
    setFormError("");
    if (!form.coin_symbol || !form.coin_name || !form.coingecko_id || !form.buy_price || !form.quantity || !form.buy_date) {
      setFormError("Completa todos los campos obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/portfolio/${editingId}` : "/api/portfolio";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json.error ?? "Error al guardar"); return; }

      if (editingId) {
        setPositions((prev) => prev.map((p) => (p.id === editingId ? json : p)));
      } else {
        setPositions((prev) => [...prev, json]);
      }
      cancelForm();
      fetchPrices(editingId
        ? positions.map((p) => (p.id === editingId ? json : p))
        : [...positions, json]
      );
    } catch {
      setFormError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePosition(id: string) {
    if (!confirm("¿Eliminar esta posición?")) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) setPositions((prev) => prev.filter((p) => p.id !== id));
  }

  // ── non-premium overlay ──────────────────────────────────────────
  if (!isPremium && !isAdmin) {
    return (
      <div className="pf-locked-wrap">
        {/* blurred background preview */}
        <div className="pf-locked-bg" aria-hidden="true">
          <PortfolioSkeleton count={positions.length || 4} />
        </div>

        {/* big popup */}
        <div className="pf-popup-overlay">
          <div className="pf-popup">
            <div className="pf-popup-lock">
              <Lock size={40} strokeWidth={1.5} />
            </div>
            <div className="pf-popup-badge">PREMIUM</div>
            <h1 className="pf-popup-title">Portfolio Spot</h1>
            <p className="pf-popup-desc">
              Sigo en tiempo real todas mis posiciones en crypto: precio de compra,
              rentabilidad actual y cuánto vale hoy cada coin que tengo.
              Actualización automática cada 30 segundos.
            </p>

            <ul className="pf-popup-features">
              <li><Check size={14} /> Todas mis posiciones activas</li>
              <li><Check size={14} /> Precio de compra vs precio actual</li>
              <li><Check size={14} /> Rentabilidad por posición ($&nbsp;y&nbsp;%)</li>
              <li><Check size={14} /> P&amp;L total actualizado en vivo</li>
              <li><Check size={14} /> Variación 24h de cada coin</li>
            </ul>

            <Link href="/api/checkout" prefetch={false} className="pf-popup-cta">
              {isLoggedIn ? "Hazte Premium" : "Empezar ahora"} — 19,99€/mes
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>

            <p className="pf-popup-login">
              {isLoggedIn ? (
                <>Tu plan actual no incluye esta herramienta. <Link href="/premium">Ver planes</Link></>
              ) : (
                <>¿Ya tienes cuenta? <Link href="/login?next=/portfolio">Inicia sesión</Link></>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── premium / admin view ─────────────────────────────────────────
  return (
    <div className="pf-wrap">
      {/* header */}
      <div className="pf-header">
        <div className="pf-header-left">
          <div className="pf-header-icon"><Wallet size={22} /></div>
          <div>
            <h1 className="pf-title">Portfolio Spot</h1>
            <p className="pf-subtitle">Posiciones reales · precios en tiempo real</p>
          </div>
        </div>
        <div className="pf-header-right">
          {lastUpdated && (
            <span className="pf-last-updated">
              Actualizado {lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            className="pf-refresh-btn"
            onClick={() => { setPricesLoading(true); fetchPrices(positions); }}
            disabled={pricesLoading}
            title="Actualizar precios"
          >
            <RefreshCw size={15} className={pricesLoading ? "pf-spin" : ""} />
          </button>
        </div>
      </div>

      {/* summary cards */}
      {positions.length > 0 && (
        <div className="pf-summary-grid">
          <div className="pf-summary-card">
            <span className="pf-summary-label">Invertido</span>
            <span className="pf-summary-value">{fmtCurrency(totalInvested)}</span>
          </div>
          <div className="pf-summary-card">
            <span className="pf-summary-label">Valor actual</span>
            <span className="pf-summary-value pf-summary-value--accent">
              {pricesLoading ? <span className="pf-loading-dot" /> : fmtCurrency(totalCurrent)}
            </span>
          </div>
          <div className={`pf-summary-card ${totalPositive ? "pf-summary-card--pos" : "pf-summary-card--neg"}`}>
            <span className="pf-summary-label">P&amp;L total</span>
            <span className="pf-summary-value">
              {pricesLoading ? <span className="pf-loading-dot" /> : (
                <>{totalPositive ? "+" : ""}{fmtCurrency(totalPnl)}</>
              )}
            </span>
          </div>
          <div className={`pf-summary-card ${totalPositive ? "pf-summary-card--pos" : "pf-summary-card--neg"}`}>
            <span className="pf-summary-label">Rentabilidad</span>
            <span className="pf-summary-value pf-summary-value--big">
              {pricesLoading ? <span className="pf-loading-dot" /> : (
                <>
                  {totalPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {totalPositive ? "+" : ""}{fmt(totalPnlPct)}%
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* positions table */}
      {positions.length === 0 ? (
        <div className="pf-empty">
          <Wallet size={32} strokeWidth={1.2} />
          <p>No hay posiciones todavía.</p>
          {isAdmin && <button className="pf-btn-add pf-btn-add--center" onClick={openAdd}><Plus size={15} /> Añadir primera posición</button>}
        </div>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th className="pf-th-right">Cantidad</th>
                <th className="pf-th-right">Precio compra</th>
                <th className="pf-th-right">Precio actual</th>
                <th className="pf-th-right">Valor actual</th>
                <th className="pf-th-right">P&amp;L</th>
                <th className="pf-th-right">24h</th>
                {isAdmin && <th className="pf-th-center">·</th>}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const priceData = prices[pos.coingecko_id];
                const currentPrice = priceData?.usd ?? null;
                const change24h = priceData?.usd_24h_change ?? null;
                const currentValue = currentPrice !== null ? currentPrice * pos.quantity : null;
                const invested = pos.buy_price * pos.quantity;
                const pnl = currentValue !== null ? currentValue - invested : null;
                const pnlPct = pnl !== null && invested > 0 ? (pnl / invested) * 100 : null;
                const positive = pnl !== null ? pnl >= 0 : null;

                return (
                  <tr key={pos.id} className="pf-row">
                    <td className="pf-cell-coin">
                      <span
                        className="pf-coin-icon"
                        style={{ background: coinColor(pos.coin_symbol) + "22", color: coinColor(pos.coin_symbol), border: `1px solid ${coinColor(pos.coin_symbol)}44` }}
                      >
                        {pos.coin_symbol.slice(0, 3)}
                      </span>
                      <span className="pf-coin-info">
                        <span className="pf-coin-name">{pos.coin_name}</span>
                        <span className="pf-coin-symbol">{pos.coin_symbol}</span>
                      </span>
                    </td>
                    <td className="pf-td-right pf-cell-qty">
                      {fmt(pos.quantity, pos.quantity < 1 ? 6 : 4)}
                    </td>
                    <td className="pf-td-right pf-cell-muted">
                      {fmtCurrency(pos.buy_price)}
                    </td>
                    <td className="pf-td-right">
                      {pricesLoading ? <span className="pf-loading-dot" /> : (
                        currentPrice !== null ? fmtCurrency(currentPrice) : "—"
                      )}
                    </td>
                    <td className="pf-td-right">
                      {pricesLoading ? <span className="pf-loading-dot" /> : (
                        currentValue !== null ? fmtCurrency(currentValue) : "—"
                      )}
                    </td>
                    <td className="pf-td-right">
                      {pricesLoading ? <span className="pf-loading-dot" /> : pnl !== null ? (
                        <span className={`pf-pnl ${positive ? "pf-pnl--pos" : "pf-pnl--neg"}`}>
                          <span>{positive ? "+" : ""}{fmtCurrency(pnl)}</span>
                          <span className="pf-pnl-pct">{positive ? "+" : ""}{fmt(pnlPct ?? 0)}%</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="pf-td-right">
                      {pricesLoading ? <span className="pf-loading-dot" /> : change24h !== null ? (
                        <span className={`pf-change ${change24h >= 0 ? "pf-change--pos" : "pf-change--neg"}`}>
                          {change24h >= 0 ? "+" : ""}{fmt(change24h)}%
                        </span>
                      ) : "—"}
                    </td>
                    {isAdmin && (
                      <td className="pf-td-center pf-cell-actions">
                        <button className="pf-action-btn" onClick={() => openEdit(pos)} title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button className="pf-action-btn pf-action-btn--del" onClick={() => deletePosition(pos.id)} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* admin panel */}
      {isAdmin && (
        <div className="pf-admin-panel">
          <div className="pf-admin-header">
            <span className="pf-admin-label">
              <Crown size={13} /> Panel admin
            </span>
            {!showForm && (
              <button className="pf-btn-add" onClick={openAdd}>
                <Plus size={15} /> Añadir posición
              </button>
            )}
          </div>

          {showForm && (
            <div className="pf-form" id="pf-form">
              <div className="pf-form-title">
                {editingId ? "Editar posición" : "Nueva posición"}
              </div>
              <div className="pf-form-grid">
                <label className="pf-form-field">
                  <span>Símbolo *</span>
                  <input
                    className="pf-input"
                    placeholder="BTC"
                    value={form.coin_symbol}
                    onChange={(e) => setForm((f) => ({ ...f, coin_symbol: e.target.value.toUpperCase() }))}
                  />
                </label>
                <label className="pf-form-field">
                  <span>Nombre *</span>
                  <input
                    className="pf-input"
                    placeholder="Bitcoin"
                    value={form.coin_name}
                    onChange={(e) => setForm((f) => ({ ...f, coin_name: e.target.value }))}
                  />
                </label>
                <label className="pf-form-field pf-form-field--wide">
                  <span>CoinGecko ID * <small>(ej: bitcoin, ethereum, solana)</small></span>
                  <input
                    className="pf-input"
                    placeholder="bitcoin"
                    value={form.coingecko_id}
                    onChange={(e) => setForm((f) => ({ ...f, coingecko_id: e.target.value.toLowerCase() }))}
                  />
                </label>
                <label className="pf-form-field">
                  <span>Precio de compra (USD) *</span>
                  <input
                    className="pf-input"
                    type="number"
                    step="any"
                    placeholder="65000"
                    value={form.buy_price}
                    onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))}
                  />
                </label>
                <label className="pf-form-field">
                  <span>Cantidad *</span>
                  <input
                    className="pf-input"
                    type="number"
                    step="any"
                    placeholder="0.5"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </label>
                <label className="pf-form-field">
                  <span>Fecha de compra *</span>
                  <input
                    className="pf-input"
                    type="date"
                    value={form.buy_date}
                    onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
                  />
                </label>
                <label className="pf-form-field pf-form-field--wide">
                  <span>Notas <small>(opcional)</small></span>
                  <input
                    className="pf-input"
                    placeholder="DCA mensual, acumulación..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
              </div>

              {formError && <p className="pf-form-error">{formError}</p>}

              <div className="pf-form-actions">
                <button className="pf-btn-save" onClick={savePosition} disabled={saving}>
                  {saving ? "Guardando..." : <><Check size={15} /> {editingId ? "Guardar cambios" : "Añadir posición"}</>}
                </button>
                <button className="pf-btn-cancel" onClick={cancelForm} disabled={saving}>
                  <X size={15} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PortfolioSkeleton({ count }: { count: number }) {
  return (
    <div className="pf-skeleton-wrap">
      <div className="pf-skeleton-header">
        <div className="pf-skeleton-block pf-skeleton-block--title" />
        <div className="pf-skeleton-block pf-skeleton-block--sub" />
      </div>
      <div className="pf-skeleton-cards">
        {[0,1,2,3].map((i) => (
          <div key={i} className="pf-skeleton-card" />
        ))}
      </div>
      <div className="pf-skeleton-table">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="pf-skeleton-row">
            <div className="pf-skeleton-block pf-skeleton-block--coin" />
            <div className="pf-skeleton-block pf-skeleton-block--val" />
            <div className="pf-skeleton-block pf-skeleton-block--val" />
            <div className="pf-skeleton-block pf-skeleton-block--val" />
          </div>
        ))}
      </div>
    </div>
  );
}
