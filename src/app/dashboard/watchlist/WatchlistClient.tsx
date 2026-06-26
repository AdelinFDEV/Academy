"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import CryptoMarkets from "@/components/CryptoMarkets";

interface WatchCoin {
  id: string;
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
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
    const { data, error } = await supabase
      .from("watchlist")
      .insert({
        coin_id: result.id,
        coin_symbol: result.symbol.toUpperCase(),
        coin_name: result.name,
      })
      .select("id, coin_id, coin_symbol, coin_name")
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
    setRemoving(null);
  }

  function fmt(n: number): string {
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    if (n >= 1)    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  }

  return (
    <div className="watchlist-page">
      <div className="dashboard-header">
        <h1>Watchlist</h1>
        <p>Sigue el precio de tus coins favoritas. Se actualiza cada minuto.</p>
      </div>

      {/* ── Search / Add ── */}
      <div className="watchlist-add-wrap">
        <div className="watchlist-search-box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="watchlist-search-icon">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="watchlist-search-input"
            placeholder="Añadir coin — busca por nombre o símbolo…"
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
          <svg width="40" height="40" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8Z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Tu watchlist está vacía. Busca una coin arriba o añádela desde el mercado.</p>
        </div>
      ) : (
        <div className="watchlist-list">
          <div className="watchlist-list-header">
            <span>Moneda</span>
            <span>Precio</span>
            <span>24h</span>
            <span />
          </div>
          {coins.map((coin) => {
            const p = prices[coin.coin_id];
            const change = p?.usd_24h_change ?? null;
            const positive = change !== null && change >= 0;
            return (
              <div key={coin.id} className="watchlist-row">
                <div className="watchlist-row-name">
                  <span className="watchlist-row-symbol">{coin.coin_symbol}</span>
                  <span className="watchlist-row-full">{coin.coin_name}</span>
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
                <div className={`watchlist-row-change${positive ? " positive" : " negative"}`}>
                  {change !== null ? `${positive ? "+" : ""}${change.toFixed(2)}%` : "—"}
                </div>
                <button
                  className="watchlist-remove-btn"
                  onClick={() => removeCoin(coin)}
                  disabled={removing === coin.id}
                  aria-label={`Eliminar ${coin.coin_name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Top 50 real-time market table ── */}
      <CryptoMarkets
        watchedIds={coins.map((c) => c.coin_id)}
        onAdd={addCoin}
      />
    </div>
  );
}
