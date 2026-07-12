"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import CryptoMarkets from "@/components/CryptoMarkets";
import { Search, Eye, Minus, Sparkles } from "lucide-react";
import { CoinGeckoGlyph } from "@/components/BrandMarks";

function CoinGeckoMark() {
  return (
    <span className="wl-cg-mark" aria-hidden="true">
      <CoinGeckoGlyph size={15} />
    </span>
  );
}

interface WatchCoin {
  id: string;
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  amount: number | null;
}

interface PriceData {
  usd: number;
  usd_24h_change: number;
}

interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

type CoinInput = { id: string; symbol: string; name: string; thumb?: string };

export default function WatchlistClient({ initialCoins }: { initialCoins: WatchCoin[] }) {
  const [coins, setCoins]             = useState<WatchCoin[]>(initialCoins);
  const [prices, setPrices]           = useState<Record<string, PriceData>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [search, setSearch]           = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [adding, setAdding]           = useState<string | null>(null);
  const [removing, setRemoving]       = useState<string | null>(null);
  // Cantidades del mini-portfolio. Se inicializan desde la BD (columna
  // watchlist.amount) y se persisten por usuario en Supabase.
  const [holdings, setHoldings] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialCoins
        .filter((c) => c.amount != null)
        .map((c) => [c.coin_id, String(c.amount)])
    )
  );
  const holdingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const persistHolding = useCallback(async (rowId: string, raw: string) => {
    const num = raw ? parseFloat(raw) : NaN;
    const amount = Number.isFinite(num) ? num : null;
    const supabase = createClient();
    await supabase.from("watchlist").update({ amount }).eq("id", rowId);
  }, []);

  function setHolding(coin: WatchCoin, value: string) {
    // Solo dígitos, un separador decimal.
    const clean = value.replace(/[^\d.,]/g, "").replace(",", ".");
    setHoldings((prev) => {
      const next = { ...prev };
      if (clean) next[coin.coin_id] = clean;
      else delete next[coin.coin_id];
      return next;
    });
    // Persistencia diferida (evita un write por cada tecla).
    clearTimeout(holdingTimers.current[coin.id]);
    holdingTimers.current[coin.id] = setTimeout(() => persistHolding(coin.id, clean), 600);
  }

  function flushHolding(coin: WatchCoin) {
    clearTimeout(holdingTimers.current[coin.id]);
    persistHolding(coin.id, holdings[coin.coin_id] ?? "");
  }

  const fetchPrices = useCallback(async (coinList: WatchCoin[]) => {
    if (coinList.length === 0) return;
    setLoadingPrices(true);
    try {
      const ids = coinList.map((c) => c.coin_id).join(",");
      const res = await fetch(`/api/crypto/price?ids=${encodeURIComponent(ids)}`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      }
    } catch {}
    setLoadingPrices(false);
  }, []);

  useEffect(() => {
    fetchPrices(coins);
    const interval = setInterval(() => fetchPrices(coins), 60_000);
    return () => clearInterval(interval);
  }, [coins, fetchPrices]);

  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/crypto/search?query=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.coins ?? []);
        }
      } catch {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  async function addCoin(result: CoinInput) {
    if (coins.some((c) => c.coin_id === result.id)) return;
    setAdding(result.id);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setAdding(null);
      return;
    }

    const { data, error } = await supabase
      .from("watchlist")
      .insert({
        user_id: session.user.id,
        coin_id: result.id,
        coin_symbol: result.symbol.toUpperCase(),
        coin_name: result.name,
      })
      .select("id, coin_id, coin_symbol, coin_name, amount")
      .single();
    if (!error && data) {
      const updated = [...coins, data];
      setCoins(updated);
      fetchPrices(updated);
    }
    setAdding(null);
    setSearch("");
    setSearchResults([]);
  }

  async function removeCoin(coin: WatchCoin) {
    setRemoving(coin.id);
    const supabase = createClient();
    await supabase.from("watchlist").delete().eq("id", coin.id);
    setCoins((prev) => prev.filter((c) => c.id !== coin.id));
    clearTimeout(holdingTimers.current[coin.id]);
    if (holdings[coin.coin_id]) {
      setHoldings((prev) => {
        const next = { ...prev };
        delete next[coin.coin_id];
        return next;
      });
    }
    setRemoving(null);
  }

  function fmt(n: number): string {
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    if (n >= 1)    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  }

  // ── Live summary of the tracked coins ──
  const priced = coins
    .map((c) => ({ coin: c, change: prices[c.coin_id]?.usd_24h_change }))
    .filter((x): x is { coin: WatchCoin; change: number } => typeof x.change === "number");
  const ups   = priced.filter((x) => x.change >= 0).length;
  const downs = priced.length - ups;
  const best  = priced.length > 0
    ? priced.reduce((a, b) => (b.change > a.change ? b : a))
    : null;

  const portfolioTotal = coins.reduce((sum, c) => {
    const qty = parseFloat(holdings[c.coin_id] || "0") || 0;
    const price = prices[c.coin_id]?.usd;
    return sum + (price && qty > 0 ? qty * price : 0);
  }, 0);

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <div className="watchlist-header-icon">
          <Eye size={22} aria-hidden="true" />
        </div>
        <div className="watchlist-header-text">
          <span className="watchlist-eyebrow">
            <span className="watchlist-eyebrow-dot" />
            Seguimiento en directo
          </span>
          <h1 className="watchlist-title">
            Tu <span>Watchlist</span>
          </h1>
          <p>Sigue el precio de tus criptomonedas favoritas en tiempo real y descubre las gemas que acaban de entrar al Top 200.</p>

          <div className="wl-badges">
            <span className="wl-source">
              <span className="wl-live-dot" />
              En colaboración con
              <a
                className="wl-cg-badge"
                href="https://www.coingecko.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Datos de mercado por CoinGecko"
              >
                <CoinGeckoMark />
                <span className="wl-cg-word">Coin<span>Gecko</span></span>
              </a>
            </span>
            <span className="wl-gem-pill">
              <Sparkles size={13} aria-hidden="true" />
              Radar de gemas emergentes
            </span>
          </div>
        </div>
      </div>

      {/* ── Live summary ── */}
      {coins.length > 0 && (
        <div className="watchlist-summary">
          <div className="watchlist-summary-item">
            <span className="watchlist-summary-l">Siguiendo</span>
            <span className="watchlist-summary-v">{coins.length}</span>
          </div>
          <span className="watchlist-summary-sep" />
          <div className="watchlist-summary-item">
            <span className="watchlist-summary-l">Suben</span>
            <span className="watchlist-summary-v pos">{ups}</span>
          </div>
          <div className="watchlist-summary-item">
            <span className="watchlist-summary-l">Bajan</span>
            <span className="watchlist-summary-v neg">{downs}</span>
          </div>
          {best && (
            <>
              <span className="watchlist-summary-sep" />
              <div className="watchlist-summary-item watchlist-summary-best">
                <span className="watchlist-summary-l">Mejor 24h</span>
                <span className="watchlist-summary-v">
                  {best.coin.coin_symbol}
                  <span className={best.change >= 0 ? "pos" : "neg"}>
                    {`${best.change >= 0 ? "+" : ""}${best.change.toFixed(2)}%`}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Search / Add ── */}
      <div className="watchlist-add-wrap">
        <div className="watchlist-search-box">
          <span className="watchlist-search-icon-badge">
            <Search size={15} aria-hidden="true" />
          </span>
          <input
            type="text"
            className="watchlist-search-input"
            placeholder="Busca una criptomoneda por nombre o símbolo para añadirla…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {searching && <span className="watchlist-search-spinner" />}
        </div>

        {searchResults.length > 0 && (
          <div className="watchlist-results">
            {searchResults.map((r) => {
              const already = coins.some((c) => c.coin_id === r.id);
              return (
                <button
                  key={r.id}
                  className={`watchlist-result-item${already ? " already" : ""}`}
                  onClick={() => !already && addCoin(r)}
                  disabled={already || adding === r.id}
                >
                  {r.thumb && <img src={r.thumb} alt={r.name} className="watchlist-result-thumb" />}
                  <span className="watchlist-result-name">{r.name}</span>
                  <span className="watchlist-result-symbol">{r.symbol.toUpperCase()}</span>
                  {already ? (
                    <span className="watchlist-result-tag">Ya añadida</span>
                  ) : (
                    <span className="watchlist-result-tag add">+ Añadir</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Personal watchlist ── */}
      {coins.length === 0 ? (
        <div className="watchlist-empty">
          <Eye size={40} aria-hidden="true" />
          <p>Aún no sigues ninguna criptomoneda. Búscala arriba o añádela desde el mercado en tiempo real.</p>
        </div>
      ) : (
        <div className="watchlist-list">
          <div className="watchlist-list-title-row">
            <span className="watchlist-list-title">Tu selección</span>
            <span className="watchlist-list-count">{coins.length}</span>
          </div>
          <div className="watchlist-list-header">
            <span>Moneda</span>
            <span>Precio</span>
            <span>24h</span>
            <span>Posición</span>
            <span />
          </div>
          {coins.map((coin) => {
            const p = prices[coin.coin_id];
            const change = p?.usd_24h_change ?? null;
            const positive = change !== null && change >= 0;
            const qty = parseFloat(holdings[coin.coin_id] || "0") || 0;
            const posValue = p && qty > 0 ? qty * p.usd : 0;
            return (
              <div key={coin.id} className={`watchlist-row${change !== null ? (positive ? " watchlist-row--up" : " watchlist-row--down") : ""}`}>
                <div className="watchlist-row-name">
                  <span className="watchlist-row-avatar">{coin.coin_symbol.charAt(0)}</span>
                  <span className="watchlist-row-name-text">
                    <span className="watchlist-row-symbol">{coin.coin_symbol}</span>
                    <span className="watchlist-row-full">{coin.coin_name}</span>
                  </span>
                </div>
                <div className="watchlist-row-price">
                  {loadingPrices && !p ? (
                    <span className="watchlist-loading-dot" />
                  ) : p ? (
                    <span>${fmt(p.usd)}</span>
                  ) : (
                    <span className="watchlist-no-price">—</span>
                  )}
                </div>
                <div className="watchlist-row-change-cell">
                  {change !== null ? (
                    <span className={`watchlist-change-pill${positive ? " positive" : " negative"}`}>
                      <span className="watchlist-change-arrow">{positive ? "▲" : "▼"}</span>
                      {`${positive ? "+" : ""}${change.toFixed(2)}%`}
                    </span>
                  ) : (
                    <span className="watchlist-no-price">—</span>
                  )}
                </div>
                <div className="watchlist-pos">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="watchlist-qty"
                    placeholder="0"
                    value={holdings[coin.coin_id] ?? ""}
                    onChange={(e) => setHolding(coin, e.target.value)}
                    onBlur={() => flushHolding(coin)}
                    aria-label={`Cantidad de ${coin.coin_name}`}
                  />
                  {posValue > 0 && (
                    <span className="watchlist-pos-value">${fmt(posValue)}</span>
                  )}
                </div>
                <button
                  className="watchlist-remove-btn"
                  onClick={() => removeCoin(coin)}
                  disabled={removing === coin.id}
                  aria-label={`Eliminar ${coin.coin_name}`}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
          {portfolioTotal > 0 && (
            <div className="watchlist-total-row">
              <span className="watchlist-total-label">Valor total de tu cartera</span>
              <span className="watchlist-total-value">${fmt(portfolioTotal)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Top 200 real-time market table ── */}
      <CryptoMarkets
        watchedIds={coins.map((c) => c.coin_id)}
        onAdd={addCoin}
      />
    </div>
  );
}
