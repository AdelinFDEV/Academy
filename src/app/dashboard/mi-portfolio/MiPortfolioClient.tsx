"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import Link from "next/link";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { createClient } from "@/lib/supabase/client";
import { Search, PieChart, Plus, Trash2, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import MiPortfolioCharts from "./MiPortfolioCharts";

export interface Tx {
  id: string;
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  tx_date: string;   // YYYY-MM-DD
  created_at: string;
}

interface PriceData { usd: number; usd_24h_change: number; }
interface SearchResult { id: string; name: string; symbol: string; thumb: string; }

interface Holding {
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  qty: number;
  avgCost: number;
  invested: number;
  price: number | null;
  currentValue: number | null;
  unrealized: number | null;
  realized: number;
}

function fmt(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}
const fmtSigned = (n: number) => (n >= 0 ? "+$" : "−$") + fmt(Math.abs(n));
const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// Coste medio ponderado (WAC): procesa las transacciones en orden cronológico.
// Cada compra recalcula el precio medio; cada venta realiza P&L contra ese medio
// sin cambiarlo. Devuelve las posiciones actuales y el P&L realizado por moneda.
function computeHoldings(txs: Tx[], prices: Record<string, PriceData>): { holdings: Holding[]; totalRealized: number } {
  const byCoin: Record<string, Tx[]> = {};
  for (const t of txs) (byCoin[t.coin_id] ??= []).push(t);

  const holdings: Holding[] = [];
  let totalRealized = 0;

  for (const coin_id of Object.keys(byCoin)) {
    const list = [...byCoin[coin_id]].sort((a, b) =>
      a.tx_date === b.tx_date ? a.created_at.localeCompare(b.created_at) : a.tx_date.localeCompare(b.tx_date)
    );
    let qty = 0, avgCost = 0, realized = 0;
    for (const t of list) {
      if (t.type === "buy") {
        const newQty = qty + t.quantity;
        avgCost = newQty > 0 ? (qty * avgCost + t.quantity * t.price) / newQty : 0;
        qty = newQty;
      } else {
        realized += t.quantity * (t.price - avgCost);
        qty -= t.quantity;
        if (qty <= 1e-9) { qty = Math.max(0, qty); if (qty === 0) avgCost = 0; }
      }
    }
    totalRealized += realized;
    const meta = list[list.length - 1];
    const price = prices[coin_id]?.usd ?? null;
    const invested = qty * avgCost;
    const currentValue = price != null ? qty * price : null;
    const unrealized = currentValue != null ? currentValue - invested : null;
    holdings.push({
      coin_id, coin_symbol: meta.coin_symbol, coin_name: meta.coin_name,
      qty, avgCost, invested, price, currentValue, unrealized, realized,
    });
  }

  // Posiciones con saldo primero (por valor), luego las cerradas.
  holdings.sort((a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0));
  return { holdings, totalRealized };
}

const today = () => new Date().toISOString().slice(0, 10);

export default function MiPortfolioClient({ initialTxs }: { initialTxs: Tx[] }) {
  const [txs, setTxs] = useState<Tx[]>(initialTxs);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [history, setHistory] = useState<Record<string, number[][]>>({});
  const [historyLoading, setHistoryLoading] = useState(true);

  // Formulario de nuevo movimiento
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const coinIds = useMemo(() => Array.from(new Set(txs.map((t) => t.coin_id))), [txs]);

  const fetchPrices = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const res = await fetch(`/api/crypto/price?ids=${encodeURIComponent(ids.join(","))}`);
      if (res.ok) setPrices(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchPrices(coinIds);
    const id = setInterval(() => fetchPrices(coinIds), 60_000);
    return () => clearInterval(id);
  }, [coinIds, fetchPrices]);

  // Rango del histórico: desde la primera transacción hasta hoy (30–365 días).
  const historyDays = useMemo(() => {
    if (txs.length === 0) return 90;
    const first = txs.reduce((m, t) => (t.tx_date < m ? t.tx_date : m), txs[0].tx_date);
    const days = Math.ceil((Date.now() - new Date(first + "T00:00:00").getTime()) / 86_400_000) + 1;
    return Math.min(Math.max(days, 30), 365);
  }, [txs]);

  useEffect(() => {
    if (coinIds.length === 0) { setHistory({}); setHistoryLoading(false); return; }
    let alive = true;
    setHistoryLoading(true);
    fetch(`/api/crypto/history?ids=${encodeURIComponent(coinIds.join(","))}&days=${historyDays}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => { if (alive) setHistory(d ?? {}); })
      .catch(() => {})
      .finally(() => { if (alive) setHistoryLoading(false); });
    return () => { alive = false; };
  }, [coinIds, historyDays]);

  // Búsqueda de moneda
  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/crypto/search?query=${encodeURIComponent(search)}`);
        if (res.ok) { const d = await res.json(); setResults(d.coins ?? []); }
      } catch {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { holdings, totalRealized } = useMemo(() => computeHoldings(txs, prices), [txs, prices]);

  const totals = useMemo(() => {
    let value = 0, invested = 0;
    for (const h of holdings) {
      if (h.qty > 0 && h.currentValue != null) { value += h.currentValue; invested += h.invested; }
    }
    const unrealized = value - invested;
    return { value, invested, unrealized, realized: totalRealized, total: unrealized + totalRealized };
  }, [holdings, totalRealized]);

  const openHoldings = holdings.filter((h) => h.qty > 1e-9);

  // En móvil paginamos las posiciones de 3 en 3 para no alargar la sección;
  // en escritorio la tabla es compacta y se muestran todas.
  const [isMobile, setIsMobile] = useState(false);
  const [holdingsPage, setHoldingsPage] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const holdingsPageSize = isMobile ? 3 : (openHoldings.length || 1);
  const holdingsTotalPages = Math.max(1, Math.ceil(openHoldings.length / holdingsPageSize));
  const holdingsCurrent = Math.min(holdingsPage, holdingsTotalPages);
  const pagedHoldings = openHoldings.slice((holdingsCurrent - 1) * holdingsPageSize, holdingsCurrent * holdingsPageSize);
  useEffect(() => { setHoldingsPage(1); }, [isMobile, openHoldings.length]);

  function pickCoin(r: SearchResult) {
    setPicked(r);
    setSearch(r.name);
    setResults([]);
  }

  async function addTx(e: FormEvent) {
    e.preventDefault();
    setError("");
    const q = parseFloat(qty.replace(",", "."));
    const p = parseFloat(price.replace(",", "."));
    if (!picked) { setError("Elige una criptomoneda."); return; }
    if (!Number.isFinite(q) || q <= 0) { setError("Introduce una cantidad válida."); return; }
    if (!Number.isFinite(p) || p < 0) { setError("Introduce un precio válido."); return; }

    setSaving(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setSaving(false); return; }

    const { data, error: dbErr } = await supabase
      .from("portfolio_transactions")
      .insert({
        user_id: session.user.id,
        coin_id: picked.id,
        coin_symbol: picked.symbol.toUpperCase(),
        coin_name: picked.name,
        type,
        quantity: q,
        price: p,
        tx_date: date || today(),
      })
      .select("id, coin_id, coin_symbol, coin_name, type, quantity, price, tx_date, created_at")
      .single();

    if (!dbErr && data) {
      const next = [data as Tx, ...txs];
      setTxs(next);
      fetchPrices(Array.from(new Set(next.map((t) => t.coin_id))));
      // Reset del formulario (mantiene el tipo y la fecha para encadenar movimientos)
      setPicked(null); setSearch(""); setQty(""); setPrice("");
    } else {
      setError("No se pudo guardar el movimiento. Inténtalo de nuevo.");
    }
    setSaving(false);
  }

  async function deleteTx(id: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("portfolio_transactions").delete().eq("id", id);
    setTxs((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  }

  const hasData = txs.length > 0;

  return (
    <div className="mpf-page">
      {/* Header */}
      <div className="mpf-header">
        <div className="mpf-header-icon"><PieChart size={22} aria-hidden="true" /></div>
        <div>
          <span className="mpf-eyebrow"><span className="mpf-eyebrow-dot" /> Cartera personal</span>
          <h1 className="mpf-title">Mi <span>Portfolio</span></h1>
          <p>Registra tus compras y ventas y sigue tu precio medio, valor actual y ganancia o pérdida en tiempo real.</p>
        </div>
      </div>

      {/* Resumen */}
      {hasData && (
        <div className="mpf-summary">
          <div className="mpf-sum-item">
            <span className="mpf-sum-l">Valor actual</span>
            <span className="mpf-sum-v">${fmt(totals.value)}</span>
          </div>
          <div className="mpf-sum-item">
            <span className="mpf-sum-l">Invertido</span>
            <span className="mpf-sum-v muted">${fmt(totals.invested)}</span>
          </div>
          <div className="mpf-sum-item">
            <span className="mpf-sum-l">P&L no realizado</span>
            <span className={`mpf-sum-v ${totals.unrealized >= 0 ? "pos" : "neg"}`}>{fmtSigned(totals.unrealized)}</span>
          </div>
          <div className="mpf-sum-item">
            <span className="mpf-sum-l">P&L realizado</span>
            <span className={`mpf-sum-v ${totals.realized >= 0 ? "pos" : "neg"}`}>{fmtSigned(totals.realized)}</span>
          </div>
          <div className="mpf-sum-item mpf-sum-total">
            <span className="mpf-sum-l">Ganancia / Pérdida total</span>
            <span className={`mpf-sum-v ${totals.total >= 0 ? "pos" : "neg"}`}>{fmtSigned(totals.total)}</span>
          </div>
        </div>
      )}

      {/* Gráficos: crecimiento del balance, rendimiento por activo y distribución */}
      {openHoldings.length > 0 && (
        <MiPortfolioCharts holdings={openHoldings} txs={txs} history={history} historyLoading={historyLoading} />
      )}

      {/* Añadir movimiento */}
      <form className="mpf-add" onSubmit={addTx}>
        <div className="mpf-add-title">Añadir movimiento</div>
        <div className="mpf-type-toggle">
          <button type="button" className={`mpf-type-btn buy${type === "buy" ? " active" : ""}`} onClick={() => setType("buy")}>
            <ArrowDownCircle size={15} /> Compra
          </button>
          <button type="button" className={`mpf-type-btn sell${type === "sell" ? " active" : ""}`} onClick={() => setType("sell")}>
            <ArrowUpCircle size={15} /> Venta
          </button>
        </div>

        <div className="mpf-add-grid">
          <div className="mpf-field mpf-field--search">
            <label className="mpf-label">Criptomoneda</label>
            <div className="mpf-search-box">
              <Search size={15} aria-hidden="true" />
              <input
                type="text"
                className="mpf-input"
                placeholder="Busca por nombre o símbolo…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPicked(null); }}
                autoComplete="off"
              />
              {searching && <span className="watchlist-search-spinner" />}
            </div>
            {results.length > 0 && !picked && (
              <div className="mpf-results">
                {results.map((r) => (
                  <button type="button" key={r.id} className="mpf-result-item" onClick={() => pickCoin(r)}>
                    {r.thumb && <img src={r.thumb} alt="" className="mpf-result-thumb" width={20} height={20} />}
                    <span className="mpf-result-name">{r.name}</span>
                    <span className="mpf-result-sym">{r.symbol.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mpf-field">
            <label className="mpf-label">Cantidad</label>
            <input type="text" inputMode="decimal" className="mpf-input" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.,]/g, ""))} />
          </div>

          <div className="mpf-field">
            <label className="mpf-label">Precio por unidad ($)</label>
            <input type="text" inputMode="decimal" className="mpf-input" placeholder="$0" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))} />
          </div>

          <div className="mpf-field">
            <label className="mpf-label">Fecha</label>
            <input type="date" className="mpf-input" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </div>

          <button type="submit" className="mpf-add-btn" disabled={saving}>
            <Plus size={16} /> {saving ? "Guardando…" : "Añadir"}
          </button>
        </div>
        {error && <div className="mpf-error">{error}</div>}
      </form>

      {/* Posiciones actuales */}
      {openHoldings.length > 0 && (
        <div className="mpf-card">
          <div className="mpf-card-title"><Wallet size={16} /> Tus posiciones</div>
          <div className="mpf-holdings-header">
            <span>Moneda</span>
            <span>Cantidad</span>
            <span>Precio medio</span>
            <span>Precio actual</span>
            <span>Valor actual</span>
            <span>P&L no realizado</span>
          </div>
          {pagedHoldings.map((h) => (
            <div key={h.coin_id} className="mpf-holding">
              <div className="mpf-h-name">
                <span className="mpf-h-avatar">{h.coin_symbol.charAt(0)}</span>
                <span className="mpf-h-name-text">
                  <span className="mpf-h-sym">{h.coin_symbol}</span>
                  <span className="mpf-h-full">{h.coin_name}</span>
                </span>
              </div>
              <div className="mpf-h-cell"><span className="mpf-h-label">Cantidad</span>{h.qty.toLocaleString("en-US", { maximumFractionDigits: 8 })}</div>
              <div className="mpf-h-cell"><span className="mpf-h-label">Precio medio</span>${fmt(h.avgCost)}</div>
              <div className="mpf-h-cell"><span className="mpf-h-label">Precio actual</span>{h.price != null ? `$${fmt(h.price)}` : "—"}</div>
              <div className="mpf-h-cell mpf-h-value"><span className="mpf-h-label">Valor actual</span>{h.currentValue != null ? `$${fmt(h.currentValue)}` : "—"}</div>
              <div className="mpf-h-cell">
                <span className="mpf-h-label">P&L no realizado</span>
                {h.unrealized != null ? (
                  <span className={`mpf-h-pnl ${h.unrealized >= 0 ? "pos" : "neg"}`}>
                    {fmtSigned(h.unrealized)} <span className="mpf-h-pnl-pct">({fmtPct(h.invested > 0 ? (h.unrealized / h.invested) * 100 : 0)})</span>
                  </span>
                ) : "—"}
              </div>
            </div>
          ))}

          {holdingsTotalPages > 1 && (
            <div className="crypto-pagination mpf-holdings-pag">
              <button className="crypto-page-btn" onClick={() => setHoldingsPage((p) => Math.max(1, p - 1))} disabled={holdingsCurrent === 1}>‹ Anterior</button>
              <div className="crypto-page-nums">
                {Array.from({ length: holdingsTotalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`crypto-page-num${n === holdingsCurrent ? " active" : ""}`} onClick={() => setHoldingsPage(n)}>{n}</button>
                ))}
              </div>
              <button className="crypto-page-btn" onClick={() => setHoldingsPage((p) => Math.min(holdingsTotalPages, p + 1))} disabled={holdingsCurrent === holdingsTotalPages}>Siguiente ›</button>
            </div>
          )}
        </div>
      )}

      {/* Historial de movimientos */}
      {hasData ? (
        <div className="mpf-card">
          <div className="mpf-card-title">Historial de movimientos</div>
          <div className="mpf-tx-list">
            {txs.map((t) => (
              <div key={t.id} className="mpf-tx">
                <span className={`mpf-tx-type ${t.type}`}>{t.type === "buy" ? "Compra" : "Venta"}</span>
                <span className="mpf-tx-coin">{t.coin_symbol}</span>
                <span className="mpf-tx-detail">{t.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })} × ${fmt(t.price)}</span>
                <span className="mpf-tx-total">${fmt(t.quantity * t.price)}</span>
                <span className="mpf-tx-date">{new Date(t.tx_date + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <button className="mpf-tx-del" onClick={() => deleteTx(t.id)} disabled={deleting === t.id} aria-label="Eliminar movimiento">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mpf-empty">
          <PieChart size={40} aria-hidden="true" />
          <p>Aún no has registrado ningún movimiento. Añade tu primera compra arriba para empezar a seguir tu cartera.</p>
        </div>
      )}

      <p className="mpf-disclaimer">
        El precio medio se calcula por coste medio ponderado. Los precios de mercado son de CoinGecko, orientativos y con
        unos minutos de retardo. ¿Solo quieres vigilar precios? Usa tu <Link href="/dashboard/watchlist">Watchlist</Link>.
      </p>

      {/* El aviso legal ya no se escribe aquí a mano: lo pone el componente
          compartido, que es el único sitio donde vive ese texto. */}
      <DisclaimerRiesgo variante="general" />
    </div>
  );
}
