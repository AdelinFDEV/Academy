"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Lock, Calculator } from "lucide-react";
import "./calculadora.css";

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

  // Dónde caen los cambios de zona en el medidor: los mismos umbrales que
  // getFeasibility, puestos en la misma escala logarítmica que el marcador.
  const zonas = btcMC > 0
    ? [10e9, 100e9, btcMC * 0.5, btcMC].map((v) => gaugePosition(v, btcMC))
    : [25, 50, 75, 100];
  const degradado = `linear-gradient(90deg, #34d399 0%, #34d399 ${zonas[0]}%, #fbbf24 ${zonas[0]}%, #fbbf24 ${zonas[1]}%, #f97316 ${zonas[1]}%, #f97316 ${zonas[2]}%, #f87171 ${zonas[2]}%, #f87171 100%)`;

  const probar = (precio: string, oferta: string) => {
    setPriceRaw(precio);
    setSupplyRaw(oferta);
  };

  const hora = lastUpdated?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pc">

      {/* ── Cabecera ── */}
      <header className="pc-cab">
        <span className="pc-eyebrow">
          <span className="pc-eyebrow-punto" aria-hidden="true" />
          Herramienta gratuita · Datos en directo
        </span>
        <h1 className="pc-titulo">Predicción de Precio</h1>
        <p className="pc-lead">
          ¿Puede un token llegar al precio que esperas? Calcula la{" "}
          <Link href="/glosario/market-cap">capitalización de mercado</Link> que necesitaría y compárala al momento
          con la de Bitcoin, Ethereum y Solana.
        </p>
      </header>

      {/* ── Mercado en directo ── */}
      <div className="pc-mercado" aria-label="Precios en directo">
        {(["bitcoin", "ethereum", "solana"] as (keyof LiveData)[]).map((id) => {
          const coin = liveData?.[id];
          const chg = coin?.usd_24h_change ?? 0;
          const up = chg >= 0;
          return (
            <div key={id} className="pc-moneda" style={{ "--c": COIN_COLORS[id] } as React.CSSProperties}>
              <span className="pc-moneda-icono" aria-hidden="true">{COIN_SYMBOLS[id].charAt(0)}</span>
              <span className="pc-moneda-nombre">
                <strong>{COIN_SYMBOLS[id]}</strong>
                <small>{COIN_NAMES[id]}</small>
              </span>
              {coin ? (
                <span className="pc-moneda-cifras">
                  <strong>{fmtPrice(coin.usd)}</strong>
                  <small className={up ? "es-sube" : "es-baja"}>
                    {up ? "+" : "−"}{Math.abs(chg).toFixed(2)} %
                  </small>
                </span>
              ) : (
                <span className="pc-moneda-cargando">{liveError ? "Sin datos" : "Cargando…"}</span>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="pc-actualizar"
          onClick={fetchLive}
          disabled={fetching}
          aria-label="Actualizar los precios"
          title={hora ? `Actualizado a las ${hora}` : "Actualizar"}
        >
          <RefreshCw size={14} className={fetching ? "pc-gira" : ""} aria-hidden="true" />
          <span>{liveError ? "Reintentar" : hora ?? "…"}</span>
        </button>
      </div>

      {/* ── La calculadora: datos a la izquierda, resultado a la derecha ── */}
      <section className="pc-panel" aria-label="Calculadora">

        <div className="pc-datos">
          <p className="pc-formula">
            <span>Capitalización</span>
            <i aria-hidden="true">=</i>
            <span>Precio</span>
            <i aria-hidden="true">×</i>
            <span>Monedas en circulación</span>
          </p>

          <div className="pc-campo">
            <label className="pc-etiqueta" htmlFor="pc-precio">
              <span className="pc-paso" aria-hidden="true">1</span>
              Precio objetivo
            </label>
            <p className="pc-ayuda">El precio al que te gustaría ver el token, en dólares.</p>
            <div className="pc-caja">
              <span className="pc-caja-prefijo" aria-hidden="true">$</span>
              <input
                id="pc-precio"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="pc-input"
                placeholder="10"
                value={priceRaw}
                onChange={(e) => setPriceRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
          </div>

          <div className="pc-campo">
            <label className="pc-etiqueta" htmlFor="pc-oferta">
              <span className="pc-paso" aria-hidden="true">2</span>
              Monedas en circulación
            </label>
            <p className="pc-ayuda">
              Su <Link href="/glosario/oferta-circulante">oferta circulante</Link>. Admite abreviaturas: 500M, 55.5B, 1T.
            </p>
            <div className="pc-caja">
              <input
                id="pc-oferta"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="pc-input"
                placeholder="55.5B"
                value={supplyRaw}
                onChange={(e) => setSupplyRaw(e.target.value)}
              />
              {supply > 0 && <span className="pc-caja-lectura">{fmtSupply(supply)}</span>}
            </div>
            <div className="pc-atajos" role="group" aria-label="Cantidades habituales">
              {SUPPLY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`pc-atajo${supply === p.value ? " is-activo" : ""}`}
                  aria-pressed={supply === p.value}
                  onClick={() => setSupplyRaw(p.value.toString())}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pc-ejemplos">
            <span>¿No sabes por dónde empezar?</span>
            <button type="button" onClick={() => probar("10", "55.5B")}>XRP a $10</button>
            <button type="button" onClick={() => probar("1", "1T")}>1T de monedas a $1</button>
          </div>
        </div>

        <div className={`pc-resultado${hasResult && !agotado ? " is-activo" : ""}`} aria-live="polite">
          {agotado ? (
            /* Muro suave: se enseña DESPUÉS de tres resultados, nunca antes,
               para que quien llega de una búsqueda vea funcionar la
               herramienta antes de que se le pida nada. */
            <div className="pc-muro">
              <span className="pc-muro-icono" aria-hidden="true"><Lock size={20} /></span>
              <p className="pc-muro-titulo">Has usado tus tres cálculos gratis</p>
              <p className="pc-muro-texto">
                Crea una cuenta gratuita y sigue calculando sin límite. También te abre el quiz de cada guía y sus
                logros, sin pagar nada.
              </p>
              <Link href="/register?next=/calculadora" className="pc-boton">Crear cuenta gratuita</Link>
              <p className="pc-muro-alt">
                ¿Ya tienes una? <Link href="/login?next=/calculadora">Entrar</Link>
              </p>
            </div>
          ) : !hasResult ? (
            <div className="pc-vacio">
              <span className="pc-vacio-icono" aria-hidden="true"><Calculator size={22} /></span>
              <p className="pc-vacio-titulo">Tu resultado aparecerá aquí</p>
              <p className="pc-vacio-texto">
                Escribe un precio y cuántas monedas hay en circulación. El cálculo se hace al momento, mientras
                escribes.
              </p>
            </div>
          ) : (
            <>
              <span className="pc-res-rotulo">Capitalización necesaria</span>
              <p className="pc-res-cifra">{fmtMC(displayMC)}</p>
              <p className="pc-res-cuenta">
                {fmtPrice(targetPrice)} <i>×</i> {fmtShort(supply)} monedas
              </p>

              {feasCfg && (
                <div className="pc-veredicto" style={{ "--v": feasCfg.color } as React.CSSProperties}>
                  <div className="pc-veredicto-cab">
                    <span className="pc-veredicto-icono" aria-hidden="true">
                      {feasCfg.icon === "check" && <CheckCircle size={16} />}
                      {feasCfg.icon === "warn" && <AlertTriangle size={16} />}
                      {feasCfg.icon === "x" && <XCircle size={16} />}
                    </span>
                    <strong>{feasCfg.label}</strong>
                  </div>
                  <p>{feasCfg.desc}</p>

                  <div className="pc-medidor" aria-hidden="true">
                    <div className="pc-medidor-pista" style={{ background: degradado }}>
                      <span className="pc-medidor-marca" style={{ left: `${gaugePct}%` }} />
                    </div>
                    <div className="pc-medidor-escala">
                      <span>Factible</span>
                      <span>Difícil</span>
                      <span>Supera a BTC</span>
                    </div>
                  </div>
                </div>
              )}

              {liveData && (vsEth !== null || vsBtc !== null) && (
                <div className="pc-frente">
                  {vsEth !== null && (
                    <div>
                      <small>Frente a Ethereum</small>
                      <strong>{vsEth >= 1 ? `${vsEth.toFixed(2)}×` : `${(vsEth * 100).toFixed(0)} %`}</strong>
                      <span>{vsEth >= 1 ? "su capitalización" : "de su capitalización"}</span>
                    </div>
                  )}
                  {vsBtc !== null && (
                    <div>
                      <small>Frente a Bitcoin</small>
                      <strong>{vsBtc >= 1 ? `${vsBtc.toFixed(2)}×` : `${(vsBtc * 100).toFixed(0)} %`}</strong>
                      <span>{vsBtc >= 1 ? "su capitalización" : "de su capitalización"}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Se avisa solo cuando queda poco: decir "te quedan 3" nada más
              entrar suena a cuenta atrás y espanta antes de aportar nada. */}
          {!isLoggedIn && !agotado && restantes <= 2 && (
            <p className="pc-restantes">
              Te {restantes === 1 ? "queda 1 cálculo gratis" : `quedan ${restantes} cálculos gratis`}.{" "}
              <Link href="/register?next=/calculadora">Crea una cuenta</Link> y sigue sin límite.
            </p>
          )}
        </div>
      </section>

      {/* ── Comparativa ── */}
      {barItems.length > 0 && (
        <section className="pc-compara" aria-labelledby="pc-compara-titulo">
          <div className="pc-compara-cab">
            <h2 id="pc-compara-titulo">Dónde quedaría frente a las grandes</h2>
            <p>
              {hasResult && !agotado
                ? "La capitalización que necesitaría tu token, al lado de las de hoy."
                : "Capitalización de mercado actual de las tres principales."}
            </p>
          </div>

          <div className="pc-barras">
            {barItems
              .filter((item) => !(item.isTarget && agotado))
              .map((item) => {
                const pct = Math.max((item.mc / maxMC) * 100, 0.8);
                return (
                  <div
                    key={item.key}
                    className={`pc-barra${item.isTarget ? " es-tuyo" : ""}`}
                    style={{ "--c": item.isTarget ? "var(--accent-orange)" : item.color } as React.CSSProperties}
                  >
                    <span className="pc-barra-nombre">
                      <strong>{item.isTarget ? "Tu token" : item.symbol}</strong>
                      {!item.isTarget && <small>{item.label}</small>}
                    </span>
                    <span className="pc-barra-pista">
                      <span className="pc-barra-relleno" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="pc-barra-valor">{fmtMC(item.mc)}</span>
                  </div>
                );
              })}
          </div>

          {/* La comparación también queda tras el muro: si no, el cálculo se
              lee igual en las barras y el tope no serviría de nada. */}
          {hasResult && liveData && !agotado && (
            <div className="pc-conclusion">
              {neededMC > btcMC ? (
                <p>Para alcanzar ese precio, el token necesitaría <strong>{fmtMC(neededMC)}</strong> de capitalización: más que Bitcoin ({fmtMC(btcMC)}). Esto nunca ha ocurrido en la historia de las criptomonedas.</p>
              ) : neededMC > ethMC ? (
                <p>La capitalización necesaria (<strong>{fmtMC(neededMC)}</strong>) superaría a Ethereum ({fmtMC(ethMC)}) y sería el {((neededMC / btcMC) * 100).toFixed(0)} % de la de Bitcoin.</p>
              ) : neededMC > solMC ? (
                <p>La capitalización necesaria (<strong>{fmtMC(neededMC)}</strong>) quedaría entre Solana ({fmtMC(solMC)}) y Ethereum ({fmtMC(ethMC)}): territorio de las diez mayores del mercado.</p>
              ) : (
                <p>La capitalización necesaria (<strong>{fmtMC(neededMC)}</strong>) es inferior a la de Solana ({fmtMC(solMC)}). Un objetivo más accesible dentro del mercado actual.</p>
              )}
            </div>
          )}

          <p className="pc-nota">Datos de CoinGecko, en dólares. Se actualizan solos cada minuto.</p>
        </section>
      )}
    </div>
  );
}
