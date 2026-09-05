"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

/**
 * Cálculos que puede hacer alguien sin cuenta antes de pedirle el registro.
 *
 * Tres y no uno: con uno se va sin haber entendido la herramienta, y entonces
 * el muro no capta a nadie — solo molesta. Con tres ya ha visto que la
 * respuesta es útil y el registro tiene sentido.
 */
const CALCULOS_GRATIS = 3;
const CLAVE_CONTEO = "calc-usos-anon";

/**
 * Cuenta cuántos resultados DISTINTOS ha visto un visitante sin cuenta.
 *
 * La calculadora no tiene botón: recalcula según se teclea. Contar cada
 * pulsación gastaría los tres intentos escribiendo el primer número, así que se
 * cuenta un resultado solo cuando la pareja (oferta, precio) se queda quieta
 * medio segundo y además es distinta de la anterior contada.
 *
 * Vive en localStorage, que el propio visitante puede borrar. Es a propósito:
 * esto es una puerta comercial, no una barrera de seguridad — la herramienta no
 * usa ningún dato privado. Quien sepa vaciarlo no está robando nada.
 */
function useLimiteAnonimo(activo: boolean, firma: string, hayResultado: boolean) {
  const [usos, setUsos] = useState(0);
  const contadas = useRef<Set<string>>(new Set());

  // Se lee una vez al montar: en el servidor no hay localStorage.
  useEffect(() => {
    if (!activo) return;
    try {
      const guardado = Number(window.localStorage.getItem(CLAVE_CONTEO) ?? "0");
      if (Number.isFinite(guardado) && guardado > 0) setUsos(guardado);
    } catch {
      /* navegador con el almacenamiento bloqueado: se cuenta solo en memoria */
    }
  }, [activo]);

  useEffect(() => {
    if (!activo || !hayResultado || contadas.current.has(firma)) return;

    const id = setTimeout(() => {
      if (contadas.current.has(firma)) return;
      contadas.current.add(firma);
      setUsos((previo) => {
        const siguiente = previo + 1;
        try {
          window.localStorage.setItem(CLAVE_CONTEO, String(siguiente));
        } catch {
          /* ídem */
        }
        return siguiente;
      });
    }, 600);

    return () => clearTimeout(id);
  }, [activo, firma, hayResultado]);

  return { agotado: activo && usos >= CALCULOS_GRATIS, usos };
}

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

// ── Count-up animation ─────────────────────────────────────
function useCountUp(target: number, duration = 650): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const start = fromRef.current;
    const diff  = target - start;
    if (diff === 0) {
      setVal(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p     = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur   = start + diff * eased;
      fromRef.current = cur;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
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

// Marker position (%) on the difficulty gauge, log-scaled from $1M to BTC's cap.
function gaugePosition(mc: number, btcMC: number): number {
  if (mc <= 0) return 0;
  const min = 1e6;
  const max = Math.max(btcMC, 1e9);
  const p = (Math.log10(mc) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return Math.min(Math.max(p, 0.015), 1) * 100;
}

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
const COIN_NAMES: Record<string, string> = {
  bitcoin: "Bitcoin", ethereum: "Ethereum", solana: "Solana",
};

// ── Component ──────────────────────────────────────────────
export default function CalculadoraClient({ isLoggedIn }: { isLoggedIn: boolean }) {
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

  // Tope para quien no tiene cuenta. La firma identifica el cálculo concreto:
  // repetir el mismo no gasta otro intento.
  const { agotado, usos } = useLimiteAnonimo(
    !isLoggedIn,
    `${supply}|${targetPrice}`,
    hasResult,
  );
  const restantes = Math.max(0, CALCULOS_GRATIS - usos);

  const displayMC = useCountUp(neededMC);

  const btcMC = liveData?.bitcoin.usd_market_cap  ?? 0;
  const ethMC = liveData?.ethereum.usd_market_cap ?? 0;
  const solMC = liveData?.solana.usd_market_cap   ?? 0;

  const feasibility = hasResult && btcMC > 0 ? getFeasibility(neededMC, btcMC) : null;
  const feasCfg     = feasibility ? FEASIBILITY[feasibility] : null;
  const gaugePct    = feasibility && btcMC > 0 ? gaugePosition(neededMC, btcMC) : 0;

  const vsEth = ethMC > 0 && neededMC > 0 ? neededMC / ethMC : null;
  const vsBtc = btcMC > 0 && neededMC > 0 ? neededMC / btcMC : null;

  // All bar items sorted ascending for visual comparison
  const barItems = useMemo(() => {
    const coins = liveData
      ? (["solana", "ethereum", "bitcoin"] as (keyof LiveData)[]).map(id => ({
          key:   id,
          label: COIN_NAMES[id],
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
        <span className="calc-eyebrow">
          <span className="calc-eyebrow-dot" />
          Herramienta · Datos en tiempo real
        </span>
        <h1 className="calc-page-title">Predicción de Precio</h1>
        <p className="calc-page-sub">
          ¿A qué precio puede llegar un token? Calcula el Market Cap que necesitaría y descubre si es realista comparándolo con Bitcoin, Ethereum y Solana en tiempo real.
        </p>
      </div>

      {/* Live price ticker */}
      <div className="calc-ticker">
        {(["bitcoin", "ethereum", "solana"] as (keyof LiveData)[]).map(id => {
          const coin = liveData?.[id];
          const chg  = coin?.usd_24h_change ?? 0;
          const up   = chg >= 0;
          return (
            <div key={id} className="calc-ticker-item">
              <span className="calc-ticker-dot" style={{ background: COIN_COLORS[id] }} />
              <div className="calc-ticker-body">
                <div className="calc-ticker-top">
                  <span className="calc-ticker-sym">{COIN_SYMBOLS[id]}</span>
                  <span className="calc-ticker-name">{COIN_NAMES[id]}</span>
                </div>
                {coin ? (
                  <div className="calc-ticker-figures">
                    <span className="calc-ticker-price">{fmtPrice(coin.usd)}</span>
                    <span className={`calc-ticker-chg ${up ? "up" : "down"}`}>
                      {up ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <span className="calc-ticker-loading">
                    {liveError ? "Sin datos" : "Cargando…"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
          {/* Se avisa solo cuando queda poco: decir "te quedan 3" nada más
              entrar suena a cuenta atrás y espanta antes de aportar nada. */}
          {!isLoggedIn && !agotado && restantes <= 2 && (
            <p className="calc-restantes">
              Te {restantes === 1 ? "queda 1 cálculo gratis" : `quedan ${restantes} cálculos gratis`}.{" "}
              <Link href="/register?next=/calculadora">Crea una cuenta</Link> y sigue sin límite.
            </p>
          )}

          <div className={`calc-result-card${hasResult ? " calc-result-card--active" : ""}`}>

            {agotado ? (
              /* Muro suave: se enseña DESPUÉS de tres resultados, nunca antes,
                 para que quien llega de una búsqueda vea funcionar la
                 herramienta antes de que se le pida nada. */
              <div className="calc-gate">
                <p className="calc-gate-title">Has usado tus tres cálculos gratis</p>
                <p className="calc-gate-text">
                  Crea una cuenta gratuita y sigue calculando sin límite. También
                  te abre la calculadora de riesgo y la watchlist, sin pagar nada.
                </p>
                <Link href="/register?next=/calculadora" className="calc-gate-cta">
                  Crear cuenta gratuita
                </Link>
                <p className="calc-gate-alt">
                  ¿Ya tienes una? <Link href="/login?next=/calculadora">Entrar</Link>
                </p>
              </div>
            ) : !hasResult ? (
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

                <div className="calc-result-price">{fmtMC(displayMC)}</div>

                {/* Breakdown */}
                <div className="calc-breakdown">
                  <span className="calc-breakdown-val">{fmtPrice(targetPrice)}</span>
                  <span className="calc-breakdown-op">×</span>
                  <span className="calc-breakdown-val">{fmtShort(supply)}</span>
                  <span className="calc-breakdown-op">=</span>
                  <span className="calc-breakdown-result">{fmtMC(neededMC)}</span>
                </div>

                {/* Difficulty gauge */}
                {feasCfg && (
                  <div className="calc-gauge">
                    <div className="calc-gauge-track">
                      <div
                        className="calc-gauge-marker"
                        style={{ left: `${gaugePct}%`, borderColor: feasCfg.color }}
                      />
                    </div>
                    <div className="calc-gauge-scale">
                      <span>Factible</span>
                      <span>Difícil</span>
                      <span>Imposible</span>
                    </div>
                    <div
                      className="calc-feasibility-label calc-gauge-verdict"
                      style={{ color: feasCfg.color }}
                    >
                      {feasCfg.icon === "check" && <CheckCircle size={14} />}
                      {feasCfg.icon === "warn"  && <AlertTriangle size={14} />}
                      {feasCfg.icon === "x"     && <XCircle size={14} />}
                      {feasCfg.label}
                    </div>
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
                    <span className="calc-bar-dot" style={{ background: item.isTarget ? "var(--accent-orange)" : item.color }} />
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
                        background: item.isTarget
                          ? "linear-gradient(90deg, var(--accent-orange-soft), var(--accent-orange))"
                          : `linear-gradient(90deg, ${item.color}99, ${item.color})`,
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
          {/* La comparación también queda tras el muro: si no, el cálculo se
              lee igual en las barras y el tope no serviría de nada. */}
          {hasResult && liveData && !agotado && (
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
