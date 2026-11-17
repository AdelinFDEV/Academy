"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Lock, Calculator } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
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

  // Se lee una vez al montar (en el servidor no hay localStorage), justo
  // después de pintar: así el HTML del servidor y el primer pintado coinciden.
  useEffect(() => {
    if (!activo) return;
    const id = window.setTimeout(() => {
      try {
        const guardado = Number(window.localStorage.getItem(CLAVE_CONTEO) ?? "0");
        if (Number.isFinite(guardado) && guardado > 0) setUsos(guardado);
      } catch {
        /* navegador con el almacenamiento bloqueado: se cuenta solo en memoria */
      }
    }, 0);
    return () => window.clearTimeout(id);
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
    // Con «reducir movimiento», la cifra final directamente, sin contar.
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (diff === 0 || quieto) {
      fromRef.current = target;
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

// Los colores del veredicto son los del sistema del cuaderno (ESTILO.md): menta
// lo que se puede, amarillo el riesgo, naranja lo muy difícil y coral el fallo.
// No son cifras con signo, así que no llevan el verde y el rojo de las cifras.
const FEASIBILITY: Record<Feasibility, { label: string; desc: string; color: string; icon: "check" | "warn" | "x" }> = {
  "factible":    { label: "Factible",                  desc: "Market caps así ya existen en el mercado actual.",              color: "menta",    icon: "check" },
  "desafiante":  { label: "Desafiante",                desc: "Territorio top-20. Difícil, pero con precedentes reales.",     color: "amarillo", icon: "warn"  },
  "muy-dificil": { label: "Muy difícil",               desc: "Solo los top-10 globales alcanzan este nivel.",                color: "naranja",  icon: "warn"  },
  "extremo":     { label: "Extremadamente difícil",    desc: "Superaría el 50% del market cap de Bitcoin.",                 color: "coral",    icon: "x"     },
  "imposible":   { label: "Prácticamente imposible",   desc: "Superaría a Bitcoin. Nunca ocurrido en la historia del crypto.", color: "coral", icon: "x"  },
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

// Cada moneda, un color del cuaderno (con su lateral, para el relieve).
const COIN_COLORS: Record<string, string> = {
  bitcoin:  "naranja",
  ethereum: "azul",
  solana:   "lila",
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

  /** `aMano`: lo pidió la persona con la tecla (y solo entonces suena si falla). */
  const fetchLive = useCallback(async (aMano = false) => {
    setFetching(true);
    setLiveError(false);
    try {
      const res = await fetch("/api/market-data");
      if (!res.ok) throw new Error();
      const data: LiveData = await res.json();
      setLiveData(data);
      setLastUpdated(new Date());
    } catch {
      if (aMano) sonar("error");
      setLiveError(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    // La primera carga, justo después de pintar; luego, cada minuto, pero solo
    // con la pestaña a la vista: en el móvil, una pestaña en segundo plano no
    // gasta datos ni batería. Al volver a ella, se refresca en el acto.
    const primera = window.setTimeout(() => fetchLive(), 0);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchLive();
    }, 60_000);
    const alVolver = () => {
      if (document.visibilityState === "visible") fetchLive();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearTimeout(primera);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
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
      color: "amarillo", isTarget: true,
    };
    return [...coins, target].sort((a, b) => a.mc - b.mc);
  }, [liveData, neededMC, hasResult]);

  const maxMC = Math.max(btcMC, neededMC, 1);

  // Dónde caen los cambios de zona en el medidor: los mismos umbrales que
  // getFeasibility, puestos en la misma escala logarítmica que el marcador.
  const zonas = btcMC > 0
    ? [10e9, 100e9, btcMC * 0.5, btcMC].map((v) => gaugePosition(v, btcMC))
    : [25, 50, 75, 100];
  const degradado = `linear-gradient(90deg, var(--menta) 0%, var(--menta) ${zonas[0]}%, var(--amarillo) ${zonas[0]}%, var(--amarillo) ${zonas[1]}%, var(--naranja) ${zonas[1]}%, var(--naranja) ${zonas[2]}%, var(--coral) ${zonas[2]}%, var(--coral) 100%)`;

  const probar = (precio: string, oferta: string) => {
    setPriceRaw(precio);
    setSupplyRaw(oferta);
  };

  const hora = lastUpdated?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pc">

      {/* ── Cabecera ── */}
      <header className="pc-cab">
        <p className="pc-eyebrow">Herramienta gratuita · Datos en directo</p>
        <h1 className="pc-titulo">
          Predicción de <span className="fluor">Precio</span>
        </h1>
        <p className="pc-lead">
          ¿Puede un token llegar al precio que esperas? Calcula la{" "}
          <Link href="/glosario/market-cap">capitalización de mercado</Link> que necesitaría y compárala al momento
          con la de Bitcoin, Ethereum y Solana.
        </p>
      </header>

      <div className="pc-mesa">

        {/* ══ La calculadora de colegio: la pantalla arriba, las teclas abajo ══ */}
        <section className="pc-maquina" aria-label="Calculadora">
          <div className="pc-marca">
            <span className="pc-marca-nombre" aria-hidden="true">Adelin · calc</span>
            <span className="pc-solar" aria-hidden="true"><i /><i /><i /><i /></span>
          </div>

          {/* Lo que se anuncia al lector de pantalla: la cifra FINAL, no cada
              paso de la cuenta animada de la pantalla. */}
          <p className="sr-only" aria-live="polite">
            {agotado
              ? "Has usado tus tres cálculos gratis."
              : hasResult
                ? `Capitalización necesaria: ${fmtMC(neededMC)}.${feasCfg ? ` ${feasCfg.label}.` : ""}`
                : ""}
          </p>

          <div className={`pc-lcd${hasResult && !agotado ? " is-activo" : ""}`}>
            {agotado ? (
              /* Muro suave: se enseña DESPUÉS de tres resultados, nunca antes,
                 para que quien llega de una búsqueda vea funcionar la
                 herramienta antes de que se le pida nada. */
              <div className="pc-muro">
                <span className="pc-muro-icono" aria-hidden="true"><Lock size={20} strokeWidth={2.6} /></span>
                <p className="pc-muro-titulo">Has usado tus tres cálculos gratis</p>
                <p className="pc-muro-texto">
                  Crea una cuenta gratuita y sigue calculando sin límite. También te abre el quiz de cada guía y sus
                  logros, sin pagar nada.
                </p>
                <Tecla href="/register?next=/calculadora" tamano="peq">Crear cuenta gratuita</Tecla>
                <p className="pc-muro-alt">
                  ¿Ya tienes una? <Link href="/login?next=/calculadora">Entrar</Link>
                </p>
              </div>
            ) : !hasResult ? (
              <div className="pc-vacio">
                <span className="pc-vacio-icono" aria-hidden="true"><Calculator size={20} strokeWidth={2.6} /></span>
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
          </div>

          {/* La fórmula, grabada en la carcasa bajo la pantalla. */}
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
                enterKeyHint="next"
                autoComplete="off"
                className="pc-input"
                placeholder="10"
                value={priceRaw}
                onChange={(e) => setPriceRaw(e.target.value.replace(/\$/g, ""))}
                // «Siguiente» en el teclado del móvil: al segundo campo.
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) document.getElementById("pc-oferta")?.focus();
                }}
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
                inputMode="text"
                enterKeyHint="done"
                autoComplete="off"
                className="pc-input"
                placeholder="55.5B"
                value={supplyRaw}
                onChange={(e) => setSupplyRaw(e.target.value)}
                // «Hecho»: se cierra el teclado y queda a la vista el resultado.
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) e.currentTarget.blur();
                }}
              />
              {supply > 0 && <span className="pc-caja-lectura">{fmtSupply(supply)}</span>}
            </div>
            <div className="pc-atajos" role="group" aria-label="Cantidades habituales">
              {SUPPLY_PRESETS.map((p) => (
                <Tecla
                  key={p.label}
                  tamano="peq"
                  color={supply === p.value ? "amarillo" : "blanca"}
                  className={supply === p.value ? "is-pulsada" : undefined}
                  aria-pressed={supply === p.value}
                  onClick={() => setSupplyRaw(p.value.toString())}
                >
                  {p.label}
                </Tecla>
              ))}
            </div>
          </div>

          <div className="pc-ejemplos">
            <span className="pc-ejemplos-tit">¿No sabes por dónde empezar?</span>
            <div className="pc-ejemplos-teclas">
              <Tecla tamano="peq" color="cielo" onClick={() => probar("10", "55.5B")}>XRP a $10</Tecla>
              <Tecla tamano="peq" color="cielo" onClick={() => probar("1", "1T")}>1T de monedas a $1</Tecla>
            </div>
          </div>

          {/* Se avisa solo cuando queda poco: decir "te quedan 3" nada más
              entrar suena a cuenta atrás y espanta antes de aportar nada. */}
          {!isLoggedIn && !agotado && restantes <= 2 && (
            <p className="pc-restantes">
              Te {restantes === 1 ? "queda 1 cálculo gratis" : `quedan ${restantes} cálculos gratis`}.{" "}
              <Link href="/register?next=/calculadora">Crea una cuenta</Link> y sigue sin límite.
            </p>
          )}
        </section>

        {/* ══ La mesa de al lado: el mercado, el veredicto y la comparativa ══ */}
        <div className="pc-lado">

          {/* ── Mercado en directo: el tique de papel ── */}
          <section className="pc-mercado" aria-labelledby="pc-mercado-tit">
            <div className="pc-mercado-cab">
              <h2 className="pc-mercado-tit" id="pc-mercado-tit">Mercado en directo</h2>
              <Tecla
                tamano="peq"
                color="blanca"
                className="pc-actualizar"
                onClick={() => fetchLive(true)}
                disabled={fetching}
                aria-label="Actualizar los precios"
                title={hora ? `Actualizado a las ${hora}` : "Actualizar"}
              >
                <RefreshCw size={14} strokeWidth={2.8} className={fetching ? "pc-gira" : ""} aria-hidden="true" />
                <span>{liveError ? "Reintentar" : hora ?? "…"}</span>
              </Tecla>
            </div>

            <ul className="pc-monedas">
              {(["bitcoin", "ethereum", "solana"] as (keyof LiveData)[]).map((id) => {
                const coin = liveData?.[id];
                const chg = coin?.usd_24h_change ?? 0;
                const up = chg >= 0;
                return (
                  <li key={id} className={`pc-moneda pc-c--${COIN_COLORS[id]}`}>
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
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── El veredicto ── */}
          {hasResult && !agotado && feasCfg && (
            <div className={`pc-veredicto pc-c--${feasCfg.color}`}>
              <div className="pc-veredicto-cab">
                <span className="pc-veredicto-icono" aria-hidden="true">
                  {feasCfg.icon === "check" && <CheckCircle size={18} strokeWidth={2.6} />}
                  {feasCfg.icon === "warn" && <AlertTriangle size={18} strokeWidth={2.6} />}
                  {feasCfg.icon === "x" && <XCircle size={18} strokeWidth={2.6} />}
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
                        className={`pc-barra pc-c--${item.color}${item.isTarget ? " es-tuyo" : ""}`}
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
      </div>
    </div>
  );
}
