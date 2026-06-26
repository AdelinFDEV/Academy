"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Info } from "lucide-react";

// ── Types ─────────────────────────────────────────────────
interface CoinData {
  usd: number;
  usd_market_cap: number;
  usd_24h_change: number;
}
interface LiveData {
  bitcoin: CoinData;
  ethereum: CoinData;
  solana: CoinData;
}

// ── Number helpers ────────────────────────────────────────
function parseNum(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/[$,\s]/g, "").toUpperCase();
  const suffixes: [string, number][] = [["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]];
  for (const [sfx, mult] of suffixes) {
    if (clean.endsWith(sfx)) {
      const n = parseFloat(clean.slice(0, -sfx.length));
      return isNaN(n) ? 0 : n * mult;
    }
  }
  return parseFloat(clean) || 0;
}

function fmtPrice(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 100_000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (n >= 0.01) return "$" + n.toFixed(4);
  if (n >= 0.0001) return "$" + n.toFixed(6);
  if (n >= 0.000001) return "$" + n.toFixed(8);
  return "$" + n.toExponential(3);
}

function fmtMC(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

function fmtSupply(n: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T tokens";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B tokens";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M tokens";
  return n.toLocaleString("en-US") + " tokens";
}

function fmtMult(m: number): string {
  if (m <= 0) return "—";
  if (m >= 1000) return "×" + Math.round(m).toLocaleString("en-US");
  if (m >= 10) return "×" + m.toFixed(1);
  if (m >= 1) return "×" + m.toFixed(2);
  return "×" + m.toFixed(3);
}

function changeColor(pct: number) {
  return pct >= 0 ? "var(--accent-green, #34d399)" : "#f87171";
}

// ── Static market cap milestones ─────────────────────────
type MilestoneType = "static" | "live";

const STATIC_MILESTONES: { label: string; mc: number; type: MilestoneType }[] = [
  { label: "$10M",   mc: 10e6,  type: "static" },
  { label: "$50M",   mc: 50e6,  type: "static" },
  { label: "$100M",  mc: 100e6, type: "static" },
  { label: "$500M",  mc: 500e6, type: "static" },
  { label: "$1B",    mc: 1e9,   type: "static" },
  { label: "$5B",    mc: 5e9,   type: "static" },
  { label: "$10B",   mc: 10e9,  type: "static" },
  { label: "$50B",   mc: 50e9,  type: "static" },
  { label: "$100B",  mc: 100e9, type: "static" },
  { label: "$500B",  mc: 500e9, type: "static" },
];

const SUPPLY_PRESETS = [
  { label: "100M",  value: 100e6 },
  { label: "500M",  value: 500e6 },
  { label: "1B",    value: 1e9 },
  { label: "10B",   value: 10e9 },
  { label: "100B",  value: 100e9 },
  { label: "1T",    value: 1e12 },
];

const COIN_SYMBOLS: Record<string, string> = { bitcoin: "₿", ethereum: "Ξ", solana: "◎" };
const COIN_COLORS: Record<string, string> = { bitcoin: "#F7931A", ethereum: "#627EEA", solana: "#9945FF" };

// ── Component ─────────────────────────────────────────────
export default function CalculadoraClient() {
  const [supplyRaw, setSupplyRaw]       = useState("");
  const [priceRaw, setPriceRaw]         = useState("");
  const [customMCRaw, setCustomMCRaw]   = useState("");
  const [tab, setTab]                   = useState<"live" | "custom">("live");
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null); // "bitcoin"|"ethereum"|"solana"|null
  const [liveData, setLiveData]         = useState<LiveData | null>(null);
  const [liveFetching, setLiveFetching] = useState(false);
  const [liveError, setLiveError]       = useState(false);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);

  const fetchLive = useCallback(async () => {
    setLiveFetching(true);
    setLiveError(false);
    try {
      const res = await fetch("/api/market-data");
      if (!res.ok) throw new Error();
      const data: LiveData = await res.json();
      setLiveData(data);
      setLastUpdated(new Date());
    } catch {
      setLiveError(true);
    } finally {
      setLiveFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 60_000);
    return () => clearInterval(id);
  }, [fetchLive]);

  // Derived values
  const supply      = parseNum(supplyRaw);
  const curPrice    = parseNum(priceRaw);
  const customMC    = parseNum(customMCRaw);

  const targetMC = useMemo(() => {
    if (tab === "live" && selectedCoin && liveData) {
      return (liveData as any)[selectedCoin]?.usd_market_cap ?? 0;
    }
    if (tab === "custom") return customMC;
    return 0;
  }, [tab, selectedCoin, liveData, customMC]);

  const targetPrice  = supply > 0 && targetMC > 0 ? targetMC / supply : 0;
  const multiplier   = curPrice > 0 && targetPrice > 0 ? targetPrice / curPrice : null;
  const curMC        = curPrice > 0 && supply > 0 ? curPrice * supply : 0;
  const hasResult    = targetPrice > 0;

  // Scenario table
  const scenarios = useMemo(() => {
    const rows: { label: string; mc: number; type: MilestoneType }[] = STATIC_MILESTONES.map(m => ({ ...m }));
    if (liveData) {
      const coins: [keyof LiveData, string][] = [["solana", "SOL"], ["ethereum", "ETH"], ["bitcoin", "BTC"]];
      for (const [id, sym] of coins) {
        rows.push({ label: `${sym} MC`, mc: liveData[id].usd_market_cap, type: "live" });
      }
    }
    return rows.sort((a, b) => a.mc - b.mc);
  }, [liveData]);

  const liveCoins = liveData
    ? (["bitcoin", "ethereum", "solana"] as (keyof LiveData)[]).map(id => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        symbol: { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" }[id],
        mc: liveData[id].usd_market_cap,
        price: liveData[id].usd,
        change: liveData[id].usd_24h_change,
      }))
    : [];

  return (
    <div className="calc-wrap">

      {/* ── Page header ── */}
      <div className="calc-page-header">
        <h1 className="calc-page-title">Calculadora de Precio</h1>
        <p className="calc-page-sub">
          Descubre a qué precio llegaría tu token si alcanzara el Market Cap de Bitcoin, Ethereum u otro nivel de referencia.
        </p>
      </div>

      {/* ── Formula explainer ── */}
      <div className="calc-formula-bar">
        <span className="calc-formula-pill">Precio objetivo</span>
        <span className="calc-formula-eq">=</span>
        <span className="calc-formula-pill">Market Cap objetivo</span>
        <span className="calc-formula-div">÷</span>
        <span className="calc-formula-pill">Supply en circulación</span>
      </div>

      {/* ── Main grid ── */}
      <div className="calc-grid">

        {/* ── Left: inputs ── */}
        <div className="calc-inputs-col">

          {/* Supply */}
          <div className="calc-field">
            <label className="calc-label">
              Supply en circulación
              <span className="calc-label-hint">Número de monedas en circulación</span>
            </label>
            <div className="calc-input-wrap">
              <input
                type="text"
                inputMode="decimal"
                className="calc-input"
                placeholder="Ej: 1,000,000,000 o 1B"
                value={supplyRaw}
                onChange={e => setSupplyRaw(e.target.value)}
              />
              {supply > 0 && (
                <span className="calc-input-parsed">{fmtSupply(supply)}</span>
              )}
            </div>
            <div className="calc-presets">
              {SUPPLY_PRESETS.map(p => (
                <button
                  key={p.label}
                  className={`calc-preset-btn${supply === p.value ? " active" : ""}`}
                  onClick={() => setSupplyRaw(p.value.toString())}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current price (optional) */}
          <div className="calc-field">
            <label className="calc-label">
              Precio actual <span className="calc-label-opt">opcional</span>
              <span className="calc-label-hint">Para calcular el multiplicador desde precio actual</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix"
                placeholder="0.05"
                value={priceRaw}
                onChange={e => setPriceRaw(e.target.value.replace("$", ""))}
              />
            </div>
            {curMC > 0 && (
              <p className="calc-field-note">Market Cap actual del token: <strong>{fmtMC(curMC)}</strong></p>
            )}
          </div>

          {/* Target selector */}
          <div className="calc-field">
            <label className="calc-label">Market Cap objetivo</label>
            <div className="calc-tabs">
              <button
                className={`calc-tab${tab === "live" ? " active" : ""}`}
                onClick={() => setTab("live")}
              >
                Tiempo real
              </button>
              <button
                className={`calc-tab${tab === "custom" ? " active" : ""}`}
                onClick={() => setTab("custom")}
              >
                Personalizado
              </button>
            </div>

            {tab === "live" && (
              <div className="calc-live-coins">
                {liveCoins.length === 0 ? (
                  <div className="calc-live-loading">
                    {liveError
                      ? <span className="calc-live-error"><Info size={14} /> Error al cargar datos. <button onClick={fetchLive}>Reintentar</button></span>
                      : <span className="calc-live-spinner" />
                    }
                  </div>
                ) : (
                  liveCoins.map(coin => (
                    <button
                      key={coin.id}
                      className={`calc-coin-card${selectedCoin === coin.id ? " selected" : ""}`}
                      onClick={() => setSelectedCoin(selectedCoin === coin.id ? null : coin.id)}
                      style={{ "--coin-color": COIN_COLORS[coin.id] } as React.CSSProperties}
                    >
                      <div className="calc-coin-top">
                        <span className="calc-coin-symbol" style={{ color: COIN_COLORS[coin.id] }}>
                          {COIN_SYMBOLS[coin.id]} {coin.symbol}
                        </span>
                        <span className="calc-coin-change" style={{ color: changeColor(coin.change) }}>
                          {coin.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {Math.abs(coin.change).toFixed(2)}%
                        </span>
                      </div>
                      <span className="calc-coin-mc">{fmtMC(coin.mc)}</span>
                      <span className="calc-coin-price">{fmtPrice(coin.price)}</span>
                      {supply > 0 && (
                        <span className="calc-coin-implied">
                          → {fmtPrice(coin.mc / supply)}
                        </span>
                      )}
                    </button>
                  ))
                )}
                {liveCoins.length > 0 && (
                  <div className="calc-live-footer">
                    <span className="calc-live-timestamp">
                      {lastUpdated
                        ? `Actualizado ${lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                        : "Cargando..."
                      }
                    </span>
                    <button className="calc-refresh-btn" onClick={fetchLive} disabled={liveFetching} aria-label="Actualizar datos">
                      <RefreshCw size={12} className={liveFetching ? "calc-spin" : ""} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "custom" && (
              <div className="calc-custom-mc">
                <div className="calc-input-wrap calc-input-wrap--dollar">
                  <span className="calc-input-prefix">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="calc-input calc-input--has-prefix"
                    placeholder="Ej: 5000000000 o 5B"
                    value={customMCRaw}
                    onChange={e => setCustomMCRaw(e.target.value.replace("$", ""))}
                  />
                  {customMC > 0 && (
                    <span className="calc-input-parsed">{fmtMC(customMC)}</span>
                  )}
                </div>
                <div className="calc-mc-presets">
                  {[["$100M", 100e6], ["$500M", 500e6], ["$1B", 1e9], ["$10B", 10e9], ["$50B", 50e9], ["$100B", 100e9], ["$1T", 1e12]].map(([label, val]) => (
                    <button
                      key={label as string}
                      className={`calc-preset-btn${customMC === val ? " active" : ""}`}
                      onClick={() => setCustomMCRaw((val as number).toString())}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: result ── */}
        <div className="calc-result-col">
          <div className={`calc-result-card${hasResult ? " calc-result-card--active" : ""}`}>
            {!supply && !targetMC ? (
              <div className="calc-result-empty">
                <div className="calc-result-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <circle cx="20" cy="20" r="19" stroke="rgba(240,244,255,0.1)" strokeWidth="2"/>
                    <text x="20" y="26" textAnchor="middle" fontSize="18" fill="rgba(240,244,255,0.15)" fontFamily="monospace">$</text>
                  </svg>
                </div>
                <p>Introduce el supply y<br/>selecciona un Market Cap</p>
              </div>
            ) : (
              <>
                <span className="calc-result-label">Precio estimado</span>
                <div className="calc-result-price">
                  {hasResult ? fmtPrice(targetPrice) : <span className="calc-result-dash">—</span>}
                </div>

                {hasResult && (
                  <>
                    <div className="calc-result-context">
                      si alcanzara un Market Cap de <strong>{fmtMC(targetMC)}</strong>
                    </div>

                    {multiplier !== null && (
                      <div className={`calc-result-multiplier${multiplier >= 1 ? " up" : " down"}`}>
                        <span className="calc-result-mult-value">{fmtMult(multiplier)}</span>
                        <span className="calc-result-mult-label">
                          {multiplier >= 1 ? "desde precio actual" : "precio actual más alto"}
                        </span>
                      </div>
                    )}

                    <div className="calc-result-stats">
                      <div className="calc-result-stat">
                        <span className="calc-result-stat-l">Market Cap objetivo</span>
                        <span className="calc-result-stat-v">{fmtMC(targetMC)}</span>
                      </div>
                      <div className="calc-result-stat">
                        <span className="calc-result-stat-l">Supply</span>
                        <span className="calc-result-stat-v">{fmtSupply(supply)}</span>
                      </div>
                      {curMC > 0 && (
                        <div className="calc-result-stat">
                          <span className="calc-result-stat-l">MC actual</span>
                          <span className="calc-result-stat-v">{fmtMC(curMC)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!hasResult && supply > 0 && (
                  <p className="calc-result-hint">Selecciona o introduce un Market Cap objetivo</p>
                )}
                {!hasResult && targetMC > 0 && (
                  <p className="calc-result-hint">Introduce el supply del token</p>
                )}
              </>
            )}
          </div>

          {/* BTC comparison (when live coin selected) */}
          {hasResult && tab === "live" && selectedCoin && liveData && (
            <div className="calc-compare-note">
              <Info size={13} />
              {selectedCoin === "bitcoin"
                ? `Bitcoin ha tardado ~15 años en alcanzar ${fmtMC(liveData.bitcoin.usd_market_cap)} de market cap.`
                : selectedCoin === "ethereum"
                ? `Ethereum alcanzó ${fmtMC(liveData.ethereum.usd_market_cap)} en aproximadamente 7 años.`
                : `Solana ha crecido hasta ${fmtMC(liveData.solana.usd_market_cap)} en aproximadamente 5 años.`
              }
            </div>
          )}
        </div>
      </div>

      {/* ── Scenario table ── */}
      {supply > 0 && (
        <div className="calc-scenarios">
          <div className="calc-scenarios-head">
            <h2 className="calc-scenarios-title">Tabla de escenarios</h2>
            <p className="calc-scenarios-sub">
              Precio estimado del token para distintos niveles de Market Cap
            </p>
          </div>
          <div className="calc-scenarios-table-wrap">
            <table className="calc-scenarios-table">
              <thead>
                <tr>
                  <th>Market Cap</th>
                  <th>Precio estimado</th>
                  {curPrice > 0 && <th>vs. Precio actual</th>}
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((row, i) => {
                  const rowPrice = supply > 0 ? row.mc / supply : 0;
                  const rowMult = curPrice > 0 && rowPrice > 0 ? rowPrice / curPrice : null;
                  const isSelected = Math.abs(row.mc - targetMC) < 1;
                  const isLive = (row as any).type === "live";

                  return (
                    <tr
                      key={i}
                      className={`calc-scenario-row${isSelected ? " calc-scenario-row--selected" : ""}${isLive ? " calc-scenario-row--live" : ""}`}
                      onClick={() => {
                        setTab("custom");
                        setCustomMCRaw(row.mc.toString());
                        setSelectedCoin(null);
                      }}
                    >
                      <td>
                        <span className="calc-sc-mc">
                          {isLive && <span className="calc-sc-live-dot" />}
                          {fmtMC(row.mc)}
                        </span>
                      </td>
                      <td className="calc-sc-price">{fmtPrice(rowPrice)}</td>
                      {curPrice > 0 && (
                        <td>
                          {rowMult !== null ? (
                            <span className={`calc-sc-mult${rowMult >= 1 ? " up" : " down"}`}>
                              {fmtMult(rowMult)}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      <td className="calc-sc-label">
                        {isLive ? <span className="calc-sc-live-badge">{row.label}</span> : row.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="calc-scenarios-note">
            Haz clic en cualquier fila para usarla como objetivo · Los valores en tiempo real se actualizan cada minuto
          </p>
        </div>
      )}
    </div>
  );
}
