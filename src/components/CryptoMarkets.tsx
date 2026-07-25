"use client";

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { Plus, TrendingUp, Star, Search, X } from "lucide-react";

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

type SortKey = "rank" | "price" | "pct24" | "pct7d" | "mcap" | "vol";

const SORT_VALUE: Record<SortKey, (c: MarketCoin) => number> = {
  rank:  (c) => c.market_cap_rank ?? Number.MAX_SAFE_INTEGER,
  price: (c) => c.current_price ?? 0,
  pct24: (c) => c.price_change_percentage_24h ?? 0,
  pct7d: (c) => c.price_change_percentage_7d_in_currency ?? 0,
  mcap:  (c) => c.market_cap ?? 0,
  vol:   (c) => c.total_volume ?? 0,
};

type Props = {
  watchedIds: string[];
  onAdd: (coin: CoinInput) => Promise<void>;
  topSlot?: ReactNode;
};

const PER_PAGE = 30;

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

export default function CryptoMarkets({ watchedIds, onAdd, topSlot }: Props) {
  const [coins, setCoins]   = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash]   = useState<Record<string, "up" | "down">>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [query, setQuery]   = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [moversPeriod, setMoversPeriod] = useState<"24h" | "7d">("24h");
  const prevPrices = useRef<Record<string, number>>({});
  const sectionRef = useRef<HTMLElement>(null);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }

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

  // "Recién llegada al Top 200": la moneda situada en el filo del ranking
  // (rank más alto), excluyendo stablecoins para que la narrativa de
  // crecimiento tenga sentido.
  const newcomer = useMemo(() => {
    const STABLES = new Set([
      "usdt", "usdc", "dai", "busd", "tusd", "usde", "fdusd", "usds",
      "pyusd", "gusd", "usdp", "usdd", "frax", "lusd", "eurc", "eurs",
    ]);
    const eligible = coins.filter(
      (c) => c.market_cap_rank != null && !STABLES.has(c.symbol.toLowerCase())
    );
    if (eligible.length === 0) return null;
    return eligible.reduce((a, b) => (b.market_cap_rank > a.market_cap_rank ? b : a));
  }, [coins]);

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? coins.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
        )
      : coins;
    const getVal = SORT_VALUE[sortKey];
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => (getVal(a) - getVal(b)) * dir);
  }, [coins, query, sortKey, sortDir]);

  // Top 5 que más suben y bajan, según el periodo elegido (24h o 7d).
  const movers = useMemo(() => {
    const key: "price_change_percentage_24h" | "price_change_percentage_7d_in_currency" =
      moversPeriod === "24h" ? "price_change_percentage_24h" : "price_change_percentage_7d_in_currency";
    const eligible = coins.filter((c) => typeof c[key] === "number");
    const sorted = [...eligible].sort((a, b) => (b[key] as number) - (a[key] as number));
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse(), key };
  }, [coins, moversPeriod]);

  // Paginación de 30 en 30 para no renderizar una única lista enorme.
  const totalPages = Math.max(1, Math.ceil(displayed.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = displayed.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Al filtrar u ordenar, volver a la primera página.
  useEffect(() => { setPage(1); }, [query, sortKey, sortDir]);

  function goPage(n: number) {
    setPage(Math.min(Math.max(1, n), totalPages));
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {!loading && newcomer && (() => {
        const watched = watchedIds.includes(newcomer.id);
        const pct24 = newcomer.price_change_percentage_24h;
        const pct7d = newcomer.price_change_percentage_7d_in_currency;
        return (
          <div className="newcomer-banner">
            <span className="newcomer-glow" aria-hidden="true" />
            <div className="newcomer-logo-wrap">
              <img
                src={newcomer.image}
                alt={newcomer.name}
                className="newcomer-logo"
                loading="lazy"
                width={52}
                height={52}
              />
              <span className="newcomer-rank">#{newcomer.market_cap_rank}</span>
            </div>

            <div className="newcomer-body">
              <span className="newcomer-eyebrow">
                <TrendingUp size={13} aria-hidden="true" />
                Recién llegada al Top 200
              </span>
              <h3 className="newcomer-name">
                {newcomer.name}
                <span className="newcomer-sym">{newcomer.symbol.toUpperCase()}</span>
              </h3>
              <p className="newcomer-tagline">
                Acaba de colarse entre las 200 mayores criptomonedas. Una candidata a
                vigilar de cerca por su posible crecimiento.
              </p>
            </div>

            <div className="newcomer-side">
              <div className="newcomer-stats">
                <div className="newcomer-stat">
                  <span className="newcomer-stat-l">Precio</span>
                  <span className="newcomer-stat-v">{fmtPrice(newcomer.current_price)}</span>
                </div>
                <div className="newcomer-stat">
                  <span className="newcomer-stat-l">24h</span>
                  <span className={`newcomer-stat-v ${(pct24 ?? 0) >= 0 ? "pos" : "neg"}`}>
                    {fmtPct(pct24)}
                  </span>
                </div>
                <div className="newcomer-stat">
                  <span className="newcomer-stat-l">7d</span>
                  <span className={`newcomer-stat-v ${(pct7d ?? 0) >= 0 ? "pos" : "neg"}`}>
                    {fmtPct(pct7d)}
                  </span>
                </div>
              </div>

              {watched ? (
                <span className="newcomer-cta watched">
                  <Star size={14} aria-hidden="true" />
                  En tu watchlist
                </span>
              ) : (
                <button
                  className="newcomer-cta"
                  onClick={() => handleAdd(newcomer)}
                  disabled={adding === newcomer.id}
                >
                  {adding === newcomer.id ? (
                    <span className="crypto-add-spinner" />
                  ) : (
                    <>
                      <Plus size={14} aria-hidden="true" />
                      Vigilar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {!loading && coins.length > 0 && (
        <div className="movers-panel">
          <div className="movers-head">
            <h3 className="movers-title">
              <TrendingUp size={16} aria-hidden="true" /> Los que más se mueven
            </h3>
            <div className="movers-toggle">
              <button
                className={`movers-toggle-btn${moversPeriod === "24h" ? " active" : ""}`}
                onClick={() => setMoversPeriod("24h")}
              >24h</button>
              <button
                className={`movers-toggle-btn${moversPeriod === "7d" ? " active" : ""}`}
                onClick={() => setMoversPeriod("7d")}
              >7d</button>
            </div>
          </div>
          <div className="movers-grid">
            <div className="movers-col">
              <span className="movers-col-title up">Top 5 subidas · {moversPeriod}</span>
              {movers.gainers.map((coin) => (
                <div key={coin.id} className="mover-row">
                  <img src={coin.image} alt="" className="mover-logo" loading="lazy" width={20} height={20} />
                  <span className="mover-sym">{coin.symbol.toUpperCase()}</span>
                  <span className="mover-price">{fmtPrice(coin.current_price)}</span>
                  <span className="mover-pct pos">{fmtPct(coin[movers.key])}</span>
                </div>
              ))}
            </div>
            <div className="movers-col">
              <span className="movers-col-title down">Top 5 bajadas · {moversPeriod}</span>
              {movers.losers.map((coin) => (
                <div key={coin.id} className="mover-row">
                  <img src={coin.image} alt="" className="mover-logo" loading="lazy" width={20} height={20} />
                  <span className="mover-sym">{coin.symbol.toUpperCase()}</span>
                  <span className="mover-price">{fmtPrice(coin.current_price)}</span>
                  <span className="mover-pct neg">{fmtPct(coin[movers.key])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    {topSlot}

    <section className="crypto-markets" ref={sectionRef}>
      <div className="crypto-markets-header">
        <div>
          <h2 className="crypto-markets-title">Mercado — Top 200</h2>
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

      {!loading && (
        <div className="crypto-search-box">
          <Search size={15} aria-hidden="true" />
          <input
            type="text"
            className="crypto-search-input"
            placeholder="Filtra el Top 200 por nombre o símbolo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button
              className="crypto-search-clear"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="crypto-markets-loading">
          <span className="watchlist-search-spinner" />
          <span>Cargando datos de mercado…</span>
        </div>
      ) : (
        <>
        <div className="crypto-table-wrap">
          <table className="crypto-table">
            <thead>
              <tr>
                <th className="crypto-th-rank">
                  <button className={`crypto-th-sort${sortKey === "rank" ? " active" : ""}`} onClick={() => toggleSort("rank")}>
                    # {sortKey === "rank" && <span className="crypto-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
                <th className="crypto-th-name">Moneda</th>
                <th className="crypto-th-price">
                  <button className={`crypto-th-sort${sortKey === "price" ? " active" : ""}`} onClick={() => toggleSort("price")}>
                    Precio {sortKey === "price" && <span className="crypto-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
                <th className="crypto-th-pct">
                  <button className={`crypto-th-sort${sortKey === "pct24" ? " active" : ""}`} onClick={() => toggleSort("pct24")}>
                    24h {sortKey === "pct24" && <span className="crypto-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
                <th className="crypto-th-pct crypto-col-hide-sm">
                  <button className={`crypto-th-sort${sortKey === "pct7d" ? " active" : ""}`} onClick={() => toggleSort("pct7d")}>
                    7d {sortKey === "pct7d" && <span className="crypto-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
                <th className="crypto-th-big crypto-col-hide-md">
                  <button className={`crypto-th-sort${sortKey === "mcap" ? " active" : ""}`} onClick={() => toggleSort("mcap")}>
                    Market Cap {sortKey === "mcap" && <span className="crypto-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
                <th className="crypto-th-big crypto-col-hide-md">
                  <button className={`crypto-th-sort${sortKey === "vol" ? " active" : ""}`} onClick={() => toggleSort("vol")}>
                    Vol 24h {sortKey === "vol" && <span className="crypto-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
                <th className="crypto-th-add"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr className="crypto-row">
                  <td className="crypto-empty-row" colSpan={8}>
                    No hay ninguna moneda que coincida con «{query}».
                  </td>
                </tr>
              )}
              {pageItems.map((coin) => {
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

        {totalPages > 1 && (
          <div className="crypto-pagination">
            <button className="crypto-page-btn" onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}>‹ Anterior</button>
            <div className="crypto-page-nums">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`crypto-page-num${n === currentPage ? " active" : ""}`} onClick={() => goPage(n)}>{n}</button>
              ))}
            </div>
            <button className="crypto-page-btn" onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente ›</button>
          </div>
        )}
        </>
      )}
    </section>
    </>
  );
}
