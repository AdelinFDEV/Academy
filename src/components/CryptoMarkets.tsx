"use client";

import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
};

type CoinInput = { id: string; symbol: string; name: string };

type Props = {
  watchedIds: string[];
  onAdd: (coin: CoinInput) => Promise<void>;
};

function fmtPrice(n: number): string {
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1)    return "$" + n.toFixed(4);
  return "$" + n.toFixed(8);
}

function fmtBig(n: number): string {
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6)  return "$" + (n / 1e6).toFixed(2) + "M";
  return "$" + n.toLocaleString("en-US");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export default function CryptoMarkets({ watchedIds, onAdd }: Props) {
  const [coins, setCoins]   = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash]   = useState<Record<string, "up" | "down">>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const prevPrices = useRef<Record<string, number>>({});

  async function fetchMarkets() {
    try {
      const res = await fetch("/api/crypto/markets");
      if (!res.ok) return;
      const data: MarketCoin[] = await res.json();

      const newFlash: Record<string, "up" | "down"> = {};
      data.forEach((c) => {
        const prev = prevPrices.current[c.id];
        if (prev !== undefined && prev !== c.current_price) {
          newFlash[c.id] = c.current_price > prev ? "up" : "down";
        }
        prevPrices.current[c.id] = c.current_price;
      });

      setCoins(data);
      setLoading(false);
      setLastUpdate(new Date());

      if (Object.keys(newFlash).length > 0) {
        setFlash(newFlash);
        setTimeout(() => setFlash({}), 1200);
      }
    } catch {}
  }

  useEffect(() => {
    fetchMarkets();
    const id = setInterval(fetchMarkets, 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleAdd(coin: MarketCoin) {
    setAdding(coin.id);
    await onAdd({ id: coin.id, symbol: coin.symbol, name: coin.name });
    setAdding(null);
  }

  return (
    <section className="crypto-markets">
      <div className="crypto-markets-header">
        <div>
          <h2 className="crypto-markets-title">Mercado — Top 50</h2>
          {lastUpdate && (
            <span className="crypto-markets-update">
              Actualizado {lastUpdate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <div className="crypto-markets-badge">
          <span className="crypto-live-dot" />
          En vivo
        </div>
      </div>

      {loading ? (
        <div className="crypto-markets-loading">
          <span className="watchlist-search-spinner" />
          <span>Cargando datos de mercado…</span>
        </div>
      ) : (
        <div className="crypto-table-wrap">
          <table className="crypto-table">
            <thead>
              <tr>
                <th className="crypto-th-rank">#</th>
                <th className="crypto-th-name">Moneda</th>
                <th className="crypto-th-price">Precio</th>
                <th className="crypto-th-pct">24h</th>
                <th className="crypto-th-pct crypto-col-hide-sm">7d</th>
                <th className="crypto-th-big crypto-col-hide-md">Market Cap</th>
                <th className="crypto-th-big crypto-col-hide-md">Vol 24h</th>
                <th className="crypto-th-add"></th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => {
                const watched = watchedIds.includes(coin.id);
                const f = flash[coin.id];
                const pct24 = coin.price_change_percentage_24h ?? 0;
                const pct7d = coin.price_change_percentage_7d_in_currency ?? 0;
                return (
                  <tr key={coin.id} className="crypto-row">
                    <td className="crypto-td-rank">{coin.market_cap_rank}</td>
                    <td className="crypto-td-name">
                      <img src={coin.image} alt={coin.name} className="crypto-logo" loading="lazy" width={24} height={24} />
                      <span className="crypto-coin-name">{coin.name}</span>
                      <span className="crypto-coin-sym">{coin.symbol.toUpperCase()}</span>
                    </td>
                    <td className={`crypto-td-price${f ? ` flash-${f}` : ""}`}>
                      {fmtPrice(coin.current_price)}
                    </td>
                    <td className={`crypto-td-pct ${pct24 >= 0 ? "pos" : "neg"}`}>
                      {fmtPct(coin.price_change_percentage_24h)}
                    </td>
                    <td className={`crypto-td-pct crypto-col-hide-sm ${pct7d >= 0 ? "pos" : "neg"}`}>
                      {fmtPct(coin.price_change_percentage_7d_in_currency)}
                    </td>
                    <td className="crypto-td-big crypto-col-hide-md">{fmtBig(coin.market_cap)}</td>
                    <td className="crypto-td-big crypto-col-hide-md">{fmtBig(coin.total_volume)}</td>
                    <td className="crypto-td-add">
                      {watched ? (
                        <span className="crypto-watched-star" title="En tu watchlist">★</span>
                      ) : (
                        <button
                          className="crypto-add-btn"
                          onClick={() => handleAdd(coin)}
                          disabled={adding === coin.id}
                          title="Añadir a watchlist"
                        >
                          {adding === coin.id ? (
                            <span className="crypto-add-spinner" />
                          ) : (
                            <Plus size={12} aria-hidden="true" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
