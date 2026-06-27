"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────
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

// ── Number helpers ─────────────────────────────────────────
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
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1)    return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}

function fmtMC(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6)  return "$" + (n / 1e6).toFixed(2) + "M";
  return "$" + n.toFixed(0);
}

function fmtSupply(n: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T tokens";
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + "B tokens";
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + "M tokens";
  return n.toLocaleString("en-US") + " tokens";
}

function fmtShort(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString("en-US");
}

// ── Feasibility ────────────────────────────────────────────
type Feasibility = "factible" | "desafiante" | "muy-dificil" | "extremo" | "imposible";

function getFeasibility(mc: number, btcMC: number): Feasibility {
  if (mc > btcMC)          return "imposible";
  if (mc > btcMC * 0.5)   return "extremo";
  if (mc > 100e9)          return "muy-dificil";
  if (mc > 10e9)           return "desafiante";
  return "factible";
}

const FEASIBILITY: Record<Feasibility, { label: string; desc: string; color: string; icon: "check" | "warn" | "x" }> = {
  "factible":    { label: "Factible",                  desc: "Market caps así ya existen en el mercado actual.",              color: "#34d399", icon: "check" },
  "desafiante":  { label: "Desafiante",                desc: "Territorio top-20. Difícil, pero con precedentes reales.",     color: "#fbbf24", icon: "warn"  },
  "muy-dificil": { label: "Muy difícil",               desc: "Solo los top-10 globales alcanzan este nivel.",                color: "#f97316", icon: "warn"  },
  "extremo":     { label: "Extremadamente difícil",    desc: "Superaría el 50% del market cap de Bitcoin.",                 color: "#f87171", icon: "x"     },
  "imposible":   { label: "Prácticamente imposible",   desc: "Superaría a Bitcoin. Nunca ocurrido en la historia del crypto.", color: "#f87171", icon: "x"  },
};

// ── Supply presets ─────────────────────────────────────────
const SUPPLY_PRESETS = [
  { label: "100M",        value: 100e6   },
  { label: "1B",          value: 1e9     },
  { label: "10B",         value: 10e9    },
  { label: "55.5B (XRP)", value: 55.5e9  },
  { label: "100B",        value: 100e9   },
  { label: "1T",          value: 1e12    },
];

const COIN_COLORS: Record<string, string> = {
  bitcoin:  "#F7931A",
  ethereum: "#627EEA",
  solana:   "#9945FF",
};
const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL",
};

// ── Component ──────────────────────────────────────────────
export default function CalculadoraClient() {
  const [supplyRaw, setSupplyRaw] = useState("");
  const [priceRaw,  setPriceRaw]  = useState("");
  const [liveData,  setLiveData]  = useState<LiveData | null>(null);
  const [fetching,  setFetching]  = useState(false);
  const [liveError, setLiveError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLive = useCallback(async () => {
    setFetching(true);
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
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 60_000);
    return () => clearInterval(id);
  }, [fetchLive]);

  const supply      = parseNum(supplyRaw);
  const targetPrice = parseNum(priceRaw);
  const neededMC    = supply > 0 && targetPrice > 0 ? supply * targetPrice : 0;
  const hasResult   = neededMC > 0;

  const btcMC = liveData?.bitcoin.usd_market_cap  ?? 0;
  const ethMC = liveData?.ethereum.usd_market_cap ?? 0;
  const solMC = liveData?.solana.usd_market_cap   ?? 0;

  const feasibility = hasResult && btcMC > 0 ? getFeasibility(neededMC, btcMC) : null;
  const feasCfg     = feasibility ? FEASIBILITY[feasibility] : null;

  const vsEth = ethMC > 0 && neededMC > 0 ? neededMC / ethMC : null;
  const vsBtc = btcMC > 0 && neededMC > 0 ? neededMC / btcMC : null;

  // All bar items sorted ascending for visual comparison
  const barItems = useMemo(() => {
    const coins = liveData
      ? (["solana", "ethereum", "bitcoin"] as (keyof LiveData)[]).map(id => ({
          key:   id,
          label: id === "bitcoin" ? "Bitcoin" : id === "ethereum" ? "Ethereum" : "Solana",
          symbol: COIN_SYMBOLS[id],
          mc:    liveData[id].usd_market_cap,
          color: COIN_COLORS[id],
          isTarget: false,
        }))
      : [];

    if (!hasResult) return coins.sort((a, b) => a.mc - b.mc);

    const target = {
      key: "target", label: "Tu token", symbol: "→", mc: neededMC,
      color: "var(--accent-orange)", isTarget: true,
    };
    return [...coins, target].sort((a, b) => a.mc - b.mc);
  }, [liveData, neededMC, hasResult]);

  const maxMC = Math.max(btcMC, neededMC, 1);

  return (
    <div className="calc-wrap">

      {/* Header */}
      <div className="calc-page-header">
        <h1 className="calc-page-title">Predicción de Precio</h1>
        <p className="calc-page-sub">
          ¿A qué precio puede llegar un token? Calcula el Market Cap que necesitaría y descubre si es realista comparándolo con Bitcoin, Ethereum y Solana en tiempo real.
        </p>
      </div>

      {/* Formula */}
      <div className="calc-formula-bar">
        <span className="calc-formula-pill">Market Cap Necesario</span>
        <span className="calc-formula-eq">=</span>
        <span className="calc-formula-pill">Precio Objetivo</span>
        <span className="calc-formula-div">×</span>
        <span className="calc-formula-pill">Supply Circulante</span>
      </div>

      {/* Grid */}
      <div className="calc-grid">

        {/* ── Inputs ── */}
        <div className="calc-inputs-col">

          {/* Price */}
          <div className="calc-field">
            <label className="calc-label">
              Precio objetivo
              <span className="calc-label-hint">¿A qué precio quieres que llegue el token?</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix calc-input--hero"
                placeholder="10"
                value={priceRaw}
                onChange={e => setPriceRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
          </div>

          {/* Supply */}
          <div className="calc-field">
            <label className="calc-label">
              Supply circulante
              <span className="calc-label-hint">Número de tokens en circulación</span>
            </label>
            <div className="calc-input-wrap">
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--hero"
                placeholder="Ej: 55.5B o 55,500,000,000"
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

          {/* Tip */}
          <div className="calc-tip">
            <strong>Ejemplo:</strong> XRP a $10 con supply de 55.5B = Market Cap necesario de <strong>$555B</strong> — más que Ethereum.
          </div>
        </div>

        {/* ── Result ── */}
        <div className="calc-result-col">
          <div className={`calc-result-card${hasResult ? " calc-result-card--active" : ""}`}>

            {!hasResult ? (
              <div className="calc-result-empty">
                <div className="calc-result-empty-icon">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                    <circle cx="22" cy="22" r="21" stroke="rgba(240,244,255,0.08)" strokeWidth="2"/>
                    <text x="22" y="30" textAnchor="middle" fontSize="22" fill="rgba(240,244,255,0.1)" fontFamily="monospace">$</text>
                  </svg>
                </div>
                <p>Introduce precio y supply<br/>para ver el resultado</p>
              </div>
            ) : (
              <>
                <span className="calc-result-label">Market Cap necesario</span>

                <div className="calc-result-price">{fmtMC(neededMC)}</div>

                {/* Breakdown */}
                <div className="calc-breakdown">
                  <span className="calc-breakdown-val">{fmtPrice(targetPrice)}</span>
                  <span className="calc-breakdown-op">×</span>
                  <span className="calc-breakdown-val">{fmtShort(supply)}</span>
                  <span className="calc-breakdown-op">=</span>
                  <span className="calc-breakdown-result">{fmtMC(neededMC)}</span>
                </div>

                {/* Feasibility badge */}
                {feasCfg && (
                  <div
                    className="calc-feasibility"
                    style={{ borderColor: feasCfg.color + "50", background: feasCfg.color + "12" }}
                  >
                    <span className="calc-feasibility-label" style={{ color: feasCfg.color }}>
                      {feasCfg.icon === "check" && <CheckCircle size={13} />}
                      {feasCfg.icon === "warn"  && <AlertTriangle size={13} />}
                      {feasCfg.icon === "x"     && <XCircle size={13} />}
                      {feasCfg.label}
                    </span>
                    <span className="calc-feasibility-desc">{feasCfg.desc}</span>
                  </div>
                )}

                {/* Vs live */}
                {liveData && (
                  <div className="calc-result-stats">
                    {vsEth !== null && (
                      <div className="calc-result-stat">
                        <span className="calc-result-stat-l">vs. Ethereum</span>
                        <span className="calc-result-stat-v">
                          {vsEth >= 1
                            ? `${vsEth.toFixed(2)}× el MC de ETH`
                            : `${(vsEth * 100).toFixed(0)}% del MC de ETH`}
                        </span>
                      </div>
                    )}
                    {vsBtc !== null && (
                      <div className="calc-result-stat">
                        <span className="calc-result-stat-l">vs. Bitcoin</span>
                        <span className="calc-result-stat-v">
                          {vsBtc >= 1
                            ? `${vsBtc.toFixed(2)}× el MC de BTC`
                            : `${(vsBtc * 100).toFixed(0)}% del MC de BTC`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Comparison bars ── */}
      {barItems.length > 0 && (
        <div className="calc-comparison">
          <div className="calc-comparison-head">
            <div>
              <h2 className="calc-comparison-title">Comparativa en tiempo real</h2>
              <p className="calc-comparison-sub">
                {hasResult
                  ? "Dónde quedaría el Market Cap necesario respecto a las principales criptomonedas"
                  : "Market caps actuales de referencia"}
              </p>
            </div>
            <div className="calc-comparison-live">
              <span className="calc-live-dot-small" />
              <span>
                {liveError
                  ? <span style={{ color: "#f87171" }}>Error al cargar</span>
                  : lastUpdated
                    ? `${lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
                    : "Cargando..."
                }
              </span>
              <button
                className="calc-refresh-btn"
                onClick={fetchLive}
                disabled={fetching}
                aria-label="Actualizar datos"
              >
                <RefreshCw size={12} className={fetching ? "calc-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="calc-bars">
            {barItems.map(item => {
              const pct = Math.max((item.mc / maxMC) * 100, 0.8);
              return (
                <div key={item.key} className={`calc-bar-row${item.isTarget ? " calc-bar-row--target" : ""}`}>
                  <div className="calc-bar-meta">
                    <span className="calc-bar-symbol" style={{ color: item.isTarget ? "var(--accent-orange)" : item.color }}>
                      {item.symbol}
                    </span>
                    <span className="calc-bar-label">{item.label}</span>
                  </div>
                  <div className="calc-bar-track">
                    <div
                      className="calc-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: item.isTarget ? "var(--accent-orange)" : item.color,
                        opacity: item.isTarget ? 1 : 0.7,
                      }}
                    />
                  </div>
                  <span className={`calc-bar-value${item.isTarget ? " calc-bar-value--target" : ""}`}>
                    {fmtMC(item.mc)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Context sentence */}
          {hasResult && liveData && (
            <div className="calc-context">
              {neededMC > btcMC ? (
                <p>Para alcanzar ese precio, el token necesitaría <strong>{fmtMC(neededMC)}</strong> de Market Cap — superando a Bitcoin ({fmtMC(btcMC)}). Esto nunca ha ocurrido en la historia del crypto.</p>
              ) : neededMC > ethMC ? (
                <p>El Market Cap necesario (<strong>{fmtMC(neededMC)}</strong>) superaría a Ethereum ({fmtMC(ethMC)}) y representaría el {((neededMC / btcMC) * 100).toFixed(0)}% del Market Cap de Bitcoin.</p>
              ) : neededMC > solMC ? (
                <p>El Market Cap necesario (<strong>{fmtMC(neededMC)}</strong>) estaría entre Solana ({fmtMC(solMC)}) y Ethereum ({fmtMC(ethMC)}). Territorio top-10 del mercado.</p>
              ) : (
                <p>El Market Cap necesario (<strong>{fmtMC(neededMC)}</strong>) es inferior al de Solana ({fmtMC(solMC)}). Un objetivo más accesible dentro del mercado actual.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
