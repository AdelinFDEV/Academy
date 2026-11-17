"use client";

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
  Plus, Trash2, RefreshCw, Pencil, Check, X, Wallet, Crown, Coins, Layers, PiggyBank,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CifraAnimada from "@/components/CifraAnimada";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { formatoES } from "@/lib/formato";

interface Position {
  id: string;
  coin_symbol: string;
  coin_name: string;
  coingecko_id: string;
  buy_price: number;
  quantity: number;
  buy_date: string;
  notes?: string | null;
}

interface PriceEntry {
  usd: number;
  usd_24h_change: number;
}

interface Props {
  initialPositions: Position[];
  isAdmin: boolean;
  /** El registro de «Últimos movimientos», que va junto al reparto. */
  registro?: ReactNode;
}

/** El color de marca de cada moneda: su ficha y su tramo en el reparto. */
const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
  BNB: "#f3ba2f",
  ADA: "#3468d1",
  XRP: "#5a8fd6",
  MATIC: "#8247e5",
  POL: "#8247e5",
  DOT: "#e6007a",
  AVAX: "#e84142",
  LINK: "#2a5ada",
  DOGE: "#c3a634",
  LTC: "#bfbbbb",
  ATOM: "#6f7390",
  UNI: "#ff007a",
  INJ: "#00b4d8",
  SUI: "#4da2ff",
  APT: "#00c2cb",
  NEAR: "#00ec97",
};

/**
 * Colores de reserva para monedas sin color propio, para que no salgan todas
 * iguales: los de la paleta del cuaderno (ESTILO.md), sin el verde ni el rojo
 * de las cifras.
 */
const RESERVA = ["#ff8a1f", "#2fbff5", "#8f7cff", "#2fc488", "#ff6b81", "#ffd23f", "#4f5dff"];

function coinColor(symbol: string, i: number): string {
  return COIN_COLORS[symbol.toUpperCase()] ?? RESERVA[i % RESERVA.length];
}

/** Siempre con punto de miles: el formato español de serie deja «7500» sin separar. */
function fmt(n: number, decimals = 2): string {
  return formatoES(n, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1000) return `$${fmt(n, 0)}`;
  if (Math.abs(n) >= 1) return `$${fmt(n, 2)}`;
  return `$${fmt(n, 4)}`;
}

/** El porcentaje con su signo delante. Fuera del componente: `CifraAnimada` la necesita estable. */
function pctSigno(n: number): string {
  return `${n >= 0 ? "+" : ""}${fmt(n)} %`;
}

/** Por qué se pueden ordenar las posiciones. */
type Orden = "peso" | "valor" | "pnl" | "d24";

const COLUMNAS_ORDEN: { id: Orden; texto: string }[] = [
  { id: "valor", texto: "Valor actual" },
  { id: "pnl", texto: "P&L" },
  { id: "d24", texto: "24 h" },
  { id: "peso", texto: "Peso" },
];

/** Circunferencia de los anillos: r = 15.9155 da 100, así los % son longitudes. */
const R_DONUT = 15.9155;

const EMPTY_FORM = {
  coin_symbol: "",
  coin_name: "",
  coingecko_id: "",
  buy_price: "",
  invested: "",
  buy_date: new Date().toISOString().split("T")[0],
  notes: "",
};

/** La ficha redonda de una moneda, en su color de marca. */
function Moneda({ simbolo, color }: { simbolo: string; color: string }) {
  return (
    <span className="pv-moneda-icono" style={{ "--c": color } as React.CSSProperties} aria-hidden="true">
      {simbolo.slice(0, 4)}
    </span>
  );
}

/**
 * La cartera spot del Portfolio Adelin.
 *
 * Rehecha el 17-11-2026 con el estilo «Cuaderno de estudio»: la rentabilidad
 * en grande con el color de su signo y las cifras en fichas de papel; la
 * mejor, la peor y la que más pesa con su pegatina; el reparto como un anillo
 * de colores (cada moneda en el suyo) junto al registro de movimientos; y las
 * posiciones como filas de cuaderno, que en el móvil pasan a ser fichas. La
 * página solo la ve quien es Premium o Admin (`/portfolio` redirige al resto a
 * `/premium`), así que aquí no hay vista bloqueada.
 *
 * El formulario de admin y su lógica (la fusión de compras de la misma moneda
 * la decide el servidor) no han cambiado: mismos campos, mismas llamadas.
 */
export default function PortfolioClient({ initialPositions, isAdmin, registro }: Props) {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({});
  // Sin posiciones no hay nada que cargar: así el efecto no tiene que
  // cambiar el estado de golpe al montar.
  const [pricesLoading, setPricesLoading] = useState(initialPositions.length > 0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  // Un borrado que falla lo dice (antes no pasaba nada y no se sabía por qué).
  const [borrarError, setBorrarError] = useState("");
  const [orden, setOrden] = useState<Orden>("peso");

  const fetchPrices = useCallback(async (pos: Position[]) => {
    if (!pos.length) return;
    const ids = [...new Set(pos.map((p) => p.coingecko_id))].join(",");
    try {
      const res = await fetch(`/api/portfolio/prices?ids=${ids}`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
        setLastUpdated(new Date());
      }
    } catch {
      // silently fail — stale prices stay shown
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // La primera carga va en un temporizador, como las siguientes: los precios
  // llegan de fuera (una suscripción), no del render.
  useEffect(() => {
    const primera = setTimeout(() => fetchPrices(positions), 0);
    const interval = setInterval(() => fetchPrices(positions), 30_000);
    return () => {
      clearTimeout(primera);
      clearInterval(interval);
    };
  }, [positions, fetchPrices]);

  // La posición que el POST va a fusionar con lo que se está escribiendo, si
  // la hay. Sirve solo para avisar en el formulario — quien decide de verdad
  // es el servidor, con el mismo criterio (mismo coingecko_id).
  const yaEnCartera = positions.find(
    (p) => p.coingecko_id === form.coingecko_id.trim().toLowerCase()
  );

  // ── Cada posición con sus cifras, y el total ────────────────────────
  const filas = useMemo(() => positions.map((pos, i) => {
    const priceData = prices[pos.coingecko_id];
    const currentPrice = priceData?.usd ?? null;
    const change24h = priceData?.usd_24h_change ?? null;
    const invested = pos.buy_price * pos.quantity;
    const currentValue = currentPrice !== null ? currentPrice * pos.quantity : null;
    const pnl = currentValue !== null ? currentValue - invested : null;
    const pnlPct = pnl !== null && invested > 0 ? (pnl / invested) * 100 : null;
    return { pos, color: coinColor(pos.coin_symbol, i), currentPrice, change24h, invested, currentValue, pnl, pnlPct };
  }), [positions, prices]);

  const totalInvested = filas.reduce((s, f) => s + f.invested, 0);
  const totalCurrent = filas.reduce((s, f) => s + (f.currentValue ?? f.invested), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalPositive = totalPnl >= 0;

  // Peso de cada moneda sobre el valor actual: el reparto y la columna de
  // peso. Ordenadas de más a menos, que es como se lee un reparto.
  const pesos = filas
    .map((f) => ({ ...f, peso: totalCurrent > 0 ? ((f.currentValue ?? f.invested) / totalCurrent) * 100 : 0 }))
    .sort((a, b) => b.peso - a.peso);

  // Las que aún no tienen precio no cuentan ni como ganadoras ni como perdedoras.
  const ganadoras = filas.filter((f) => f.pnl !== null && f.pnl > 0).length;
  const perdedoras = filas.filter((f) => f.pnl !== null && f.pnl < 0).length;

  // La mejor y la peor posición por rentabilidad, y la que más pesa.
  const conResultado = pesos.filter((f) => f.pnlPct !== null);
  const mejor = conResultado.length ? conResultado.reduce((a, f) => ((f.pnlPct ?? 0) > (a.pnlPct ?? 0) ? f : a)) : null;
  const peor = conResultado.length ? conResultado.reduce((a, f) => ((f.pnlPct ?? 0) < (a.pnlPct ?? 0) ? f : a)) : null;
  const mayor = pesos[0] ?? null;

  // Las filas, en el orden elegido. Sin dato (precio aún sin llegar) va al final.
  const clave = (f: (typeof pesos)[number]): number | null =>
    orden === "peso" ? f.peso : orden === "valor" ? f.currentValue : orden === "pnl" ? f.pnlPct : f.change24h;
  const ordenadas = [...pesos].sort((a, b) => {
    const ka = clave(a), kb = clave(b);
    if (ka === null) return 1;
    if (kb === null) return -1;
    return kb - ka;
  });

  // Los tramos del anillo de reparto: cada uno empieza donde acaba el anterior,
  // con un hueco fino entre ellos, desde arriba.
  const tramos = pesos.map((f, i) => ({
    f,
    largo: Math.max(f.peso - (pesos.length > 1 ? 0.8 : 0), 0.3),
    desfase: 25 - pesos.slice(0, i).reduce((suma, x) => suma + x.peso, 0),
  }));

  // ── admin CRUD ───────────────────────────────────────────────────
  function openAdd() {
    sonar("abrir");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(pos: Position) {
    if (!showForm) sonar("abrir");
    setEditingId(pos.id);
    setForm({
      coin_symbol: pos.coin_symbol,
      coin_name: pos.coin_name,
      coingecko_id: pos.coingecko_id,
      buy_price: String(pos.buy_price),
      invested: String(pos.buy_price * pos.quantity),
      buy_date: pos.buy_date,
      notes: pos.notes ?? "",
    });
    setFormError("");
    setShowForm(true);
    setTimeout(() => document.getElementById("pv-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  /** Cierra el formulario. Suena `cerrar` si lo cierra la persona; tras guardar ya sonó `guardado`. */
  function cancelForm(sonido = true) {
    if (sonido) sonar("cerrar");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function savePosition() {
    setFormError("");
    if (!form.coin_symbol || !form.coin_name || !form.coingecko_id || !form.buy_price || !form.invested || !form.buy_date) {
      sonar("error");
      setFormError("Completa todos los campos obligatorios.");
      return;
    }
    const buyPrice = parseFloat(form.buy_price);
    const invested = parseFloat(form.invested);
    if (isNaN(buyPrice) || buyPrice <= 0 || isNaN(invested) || invested <= 0) {
      sonar("error");
      setFormError("Precio y dinero invertido deben ser positivos.");
      return;
    }
    // La API sigue guardando cantidad de cripto, no dinero invertido: aquí se
    // calcula la cantidad a partir de lo que el admin sí conoce (cuánto metió).
    const quantity = invested / buyPrice;
    setSaving(true);
    try {
      const url = editingId ? `/api/portfolio/${editingId}` : "/api/portfolio";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity }),
      });
      const json = await res.json();
      if (!res.ok) { sonar("error"); setFormError(json.error ?? "Error al guardar"); return; }

      // Al crear, el servidor puede haber FUSIONADO la compra con una posición
      // que ya existía de esa misma moneda (ver POST en /api/portfolio): en ese
      // caso devuelve esa fila ya actualizada, no una nueva. Por eso se decide
      // por el id de lo que vuelve y no por si había `editingId`: dar por hecho
      // que un alta siempre añade una fila duplicaría la moneda en la tabla.
      const siguientes = positions.some((p) => p.id === json.id)
        ? positions.map((p) => (p.id === json.id ? json : p))
        : [...positions, json];

      setPositions(siguientes);
      sonar("guardado");
      cancelForm(false);
      fetchPrices(siguientes);
      // Vuelve a leer la página en el servidor para que «Últimos movimientos»
      // enseñe el que se acaba de apuntar.
      router.refresh();
    } catch {
      sonar("error");
      setFormError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePosition(id: string) {
    if (!confirm("¿Eliminar esta posición?")) return;
    setBorrarError("");
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } else {
      sonar("error");
      setBorrarError(res ? "El servidor no dejó borrarla. Vuelve a intentarlo." : "Sin conexión. Vuelve a intentarlo.");
    }
  }

  const cargando = <span className="pv-cargando" aria-label="Cargando" />;
  const tono = (n: number) => (n >= 0 ? "es-sube" : "es-baja");

  return (
    <div className="pv-spot">
      {/* ── Estado en vivo ── */}
      <div className="pv-estado">
        <span className="pv-vivo">
          <span className="pv-latido" aria-hidden="true" />
          En vivo
          {lastUpdated && (
            <span className="pv-vivo-hora">
              · {lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </span>
        <Tecla
          color="blanca"
          tamano="peq"
          onClick={() => { setPricesLoading(true); fetchPrices(positions); }}
          disabled={pricesLoading}
          title="Actualizar precios"
        >
          <RefreshCw size={15} strokeWidth={2.6} className={pricesLoading ? "pv-gira" : ""} aria-hidden="true" />
          Actualizar
        </Tecla>
      </div>

      {positions.length > 0 && (
        <>
          {/* ── El resumen: la rentabilidad en grande y tres fichas ── */}
          <section className="pv-resumen" aria-label="Resumen de la cartera spot">
            <div className={`pv-hoja${pricesLoading ? "" : totalPositive ? " es-sube" : " es-baja"}`}>
              <span className="pv-hoja-cab">
                <span className="pv-hoja-ic" aria-hidden="true"><Coins size={22} strokeWidth={2.3} /></span>
                <span className="pv-etiqueta">Rentabilidad de la cartera</span>
              </span>
              {/* Mientras llegan los precios no se enseña el resultado: con el
                  precio de compra como reserva saldría un +0,00 % falso. */}
              <span className="pv-grande">
                {pricesLoading ? cargando : <CifraAnimada valor={totalPnlPct} formato={pctSigno} />}
              </span>
              <span className="pv-grande-pie">
                {pricesLoading ? cargando : (
                  <>
                    <b className={`pv-signo ${tono(totalPnl)}`}>
                      {totalPositive ? "+" : ""}{fmtCurrency(totalPnl)}
                    </b>{" "}
                    desde la compra
                  </>
                )}
              </span>
            </div>

            <div className="pv-datos">
              <div className="pv-dato pv-dato--menta">
                <span className="pv-dato-ic" aria-hidden="true"><Wallet size={17} strokeWidth={2.4} /></span>
                <span className="pv-etiqueta">Valor actual</span>
                <b>{pricesLoading ? cargando : <CifraAnimada valor={totalCurrent} formato={fmtCurrency} />}</b>
                <small>Lo que vale hoy la cartera</small>
              </div>
              <div className="pv-dato pv-dato--lila">
                <span className="pv-dato-ic" aria-hidden="true"><PiggyBank size={17} strokeWidth={2.4} /></span>
                <span className="pv-etiqueta">Invertido</span>
                <b>{fmtCurrency(totalInvested)}</b>
                <small>Coste de entrada total</small>
              </div>
              <div className="pv-dato pv-dato--cielo">
                <span className="pv-dato-ic" aria-hidden="true"><Layers size={17} strokeWidth={2.4} /></span>
                <span className="pv-etiqueta">Posiciones</span>
                <b>{positions.length}</b>
                <small>
                  {pricesLoading ? "Calculando…" : `${ganadoras} en ganancias · ${perdedoras} en pérdidas`}
                </small>
              </div>
            </div>
          </section>

          {/* ── Destacadas: mejor, peor y la que más pesa, con su pegatina ── */}
          {!pricesLoading && mejor && peor && mayor && (
            <ul className="pv-destacadas" aria-label="Posiciones destacadas">
              {[
                { titulo: "Mejor posición", pegatina: "La mejor", clase: "pv-destacada--menta", f: mejor },
                { titulo: "Peor posición", pegatina: "La peor", clase: "pv-destacada--coral", f: peor },
                { titulo: "Mayor peso", pegatina: "La que más pesa", clase: "pv-destacada--amarillo", f: mayor },
              ].map((d) => (
                <li key={d.titulo} className={`pv-destacada ${d.clase}`}>
                  <span className="pv-pegatina-peq" aria-hidden="true">{d.pegatina}</span>
                  <span className="pv-etiqueta">{d.titulo}</span>
                  <span className="pv-destacada-moneda">
                    <Moneda simbolo={d.f.pos.coin_symbol} color={d.f.color} />
                    <b>{d.f.pos.coin_name}</b>
                  </span>
                  {d.titulo === "Mayor peso" ? (
                    <span className="pv-destacada-cifra">
                      {fmt(d.f.peso, 1)} %<small>de la cartera</small>
                    </span>
                  ) : (
                    <span className={`pv-destacada-cifra pv-signo ${tono(d.f.pnlPct ?? 0)}`}>
                      {pctSigno(d.f.pnlPct ?? 0)}
                      <small>{(d.f.pnl ?? 0) >= 0 ? "+" : ""}{fmtCurrency(d.f.pnl ?? 0)}</small>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* ── El reparto, junto al registro de movimientos ── */}
          <div className="pv-dos">
            <section className="pv-reparto" aria-labelledby="pv-reparto-titulo">
              <header className="pv-bloque-cab">
                <div>
                  <span className="pv-etiqueta">Por valor actual</span>
                  <h2 id="pv-reparto-titulo" className="pv-h2">Reparto de la cartera</h2>
                </div>
              </header>
              <div className="pv-reparto-cuerpo">
                <div className="pv-donut">
                  <svg viewBox="0 0 42 42" aria-hidden="true">
                    <circle cx="21" cy="21" r={R_DONUT} className="pv-donut-fondo" />
                    {tramos.map((t, i) => (
                      <circle
                        key={t.f.pos.id}
                        cx="21"
                        cy="21"
                        r={R_DONUT}
                        className="pv-donut-tramo"
                        style={{
                          "--c": t.f.color,
                          "--i": i,
                          strokeDasharray: `${t.largo} ${100 - t.largo}`,
                          strokeDashoffset: t.desfase,
                        } as React.CSSProperties}
                      />
                    ))}
                  </svg>
                  <span className="pv-donut-centro">
                    <b>{pricesLoading ? "—" : fmtCurrency(totalCurrent)}</b>
                    <small>{positions.length} {positions.length === 1 ? "moneda" : "monedas"}</small>
                  </span>
                </div>
                <ul className="pv-leyenda">
                  {pesos.map((f) => (
                    <li key={f.pos.id} style={{ "--c": f.color } as React.CSSProperties}>
                      <i aria-hidden="true" />
                      <b>{f.pos.coin_symbol}</b>
                      <span className="pv-leyenda-barra"><em style={{ width: `${Math.max(f.peso, 2)}%` }} /></span>
                      <span className="pv-leyenda-pct">{fmt(f.peso, 1)} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {registro}
          </div>
        </>
      )}

      {/* ── Las posiciones ── */}
      {positions.length === 0 ? (
        <>
          {registro}
          <div className="pv-vacio">
            <span className="pv-vacio-ic" aria-hidden="true"><Wallet size={28} strokeWidth={2.2} /></span>
            <p>No hay posiciones todavía.</p>
            {isAdmin && (
              <Tecla color="menta" onClick={openAdd}>
                <Plus size={17} strokeWidth={2.8} aria-hidden="true" /> Añadir primera posición
              </Tecla>
            )}
          </div>
        </>
      ) : (
        <section className="pv-posiciones" aria-labelledby="pv-pos-titulo">
          <header className="pv-bloque-cab">
            <div>
              <span className="pv-etiqueta">Cartera de altcoins</span>
              <h2 id="pv-pos-titulo" className="pv-h2">Las posiciones</h2>
            </div>
            <div className="pv-orden" role="group" aria-label="Ordenar las posiciones">
              <span className="pv-orden-rotulo">Ordenar por</span>
              {COLUMNAS_ORDEN.map((c) => (
                <Tecla
                  key={c.id}
                  tamano="peq"
                  color={orden === c.id ? "menta" : "blanca"}
                  className={orden === c.id ? "is-pulsada" : ""}
                  aria-pressed={orden === c.id}
                  onClick={() => setOrden(c.id)}
                >
                  {c.texto}
                </Tecla>
              ))}
            </div>
          </header>

          <div className={`pv-libreta${isAdmin ? " con-admin" : ""}`}>
            {/* La cabecera de columnas solo se ve en pantallas anchas; en cada
                celda va su rótulo, que el lector de pantalla lee siempre. */}
            <div className="pv-fila pv-fila--cab" aria-hidden="true">
              <span>Moneda</span>
              <span>Compra</span>
              <span>Hoy</span>
              <span>Invertido</span>
              <span>Valor actual</span>
              <span>P&amp;L</span>
              <span>24 h</span>
              <span>Peso</span>
              {isAdmin && <span />}
            </div>

            <ul className="pv-filas">
              {ordenadas.map((f) => {
                const positive = f.pnl !== null ? f.pnl >= 0 : null;
                return (
                  <li key={f.pos.id} className="pv-fila" style={{ "--c": f.color } as React.CSSProperties}>
                    <span className="pv-c pv-c-moneda">
                      <Moneda simbolo={f.pos.coin_symbol} color={f.color} />
                      <span className="pv-moneda-texto">
                        <b>{f.pos.coin_name}</b>
                        <small>{fmt(f.pos.quantity, f.pos.quantity < 1 ? 6 : 4)} {f.pos.coin_symbol}</small>
                      </span>
                    </span>
                    <span className="pv-c pv-c-compra">
                      <small className="pv-c-etq">Precio de compra</small>
                      <span className="es-tenue">{fmtCurrency(f.pos.buy_price)}</span>
                    </span>
                    <span className="pv-c pv-c-actual">
                      <small className="pv-c-etq">Precio actual</small>
                      <span>{pricesLoading ? cargando : f.currentPrice !== null ? fmtCurrency(f.currentPrice) : "—"}</span>
                    </span>
                    <span className="pv-c pv-c-invertido">
                      <small className="pv-c-etq">Invertido</small>
                      <span className="es-tenue">{fmtCurrency(f.invested)}</span>
                    </span>
                    <span className="pv-c pv-c-valor">
                      <small className="pv-c-etq">Valor actual</small>
                      <span className="es-fuerte">
                        {pricesLoading ? cargando : f.currentValue !== null ? fmtCurrency(f.currentValue) : "—"}
                      </span>
                    </span>
                    <span className="pv-c pv-c-pnl">
                      <small className="pv-c-etq">P&amp;L</small>
                      {pricesLoading ? cargando : f.pnl !== null ? (
                        <span className={`pv-pnl pv-signo ${positive ? "es-sube" : "es-baja"}`}>
                          <b>{positive ? "+" : ""}{fmt(f.pnlPct ?? 0)} %</b>
                          <small>{positive ? "+" : ""}{fmtCurrency(f.pnl)}</small>
                        </span>
                      ) : <span>—</span>}
                    </span>
                    <span className="pv-c pv-c-24h">
                      <small className="pv-c-etq">24 h</small>
                      {pricesLoading ? cargando : f.change24h !== null ? (
                        <span className={`pv-chip-signo ${f.change24h >= 0 ? "es-sube" : "es-baja"}`}>
                          {f.change24h >= 0 ? "+" : ""}{fmt(f.change24h)} %
                        </span>
                      ) : <span>—</span>}
                    </span>
                    <span className="pv-c pv-c-peso">
                      <small className="pv-c-etq">Peso</small>
                      <span className="pv-peso">
                        <span className="pv-peso-barra"><i style={{ width: `${Math.max(f.peso, 2)}%` }} /></span>
                        {fmt(f.peso, 1)} %
                      </span>
                    </span>
                    {isAdmin && (
                      <span className="pv-c-acciones">
                        <Tecla
                          color="blanca"
                          tamano="peq"
                          icono
                          onClick={() => openEdit(f.pos)}
                          title="Editar"
                          aria-label={`Editar ${f.pos.coin_symbol}`}
                        >
                          <Pencil size={16} strokeWidth={2.5} aria-hidden="true" />
                        </Tecla>
                        <Tecla
                          color="coral"
                          tamano="peq"
                          icono
                          onClick={() => deletePosition(f.pos.id)}
                          title="Eliminar"
                          aria-label={`Eliminar ${f.pos.coin_symbol}`}
                        >
                          <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
                        </Tecla>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Panel de admin ── */}
      {isAdmin && (
        <section className="pv-admin" aria-label="Panel admin">
          <div className="pv-admin-cab">
            <span className="pv-admin-etiqueta">
              <Crown size={14} strokeWidth={2.5} aria-hidden="true" /> Panel admin
            </span>
            {!showForm && (
              <Tecla color="menta" onClick={openAdd}>
                <Plus size={17} strokeWidth={2.8} aria-hidden="true" /> Añadir posición
              </Tecla>
            )}
          </div>

          {borrarError && (
            <div className="pv-aviso pv-aviso--coral" role="alert">
              <span className="pv-aviso-ic" aria-hidden="true"><X size={18} strokeWidth={3} /></span>
              <span><b>No se pudo eliminar</b>{borrarError}</span>
            </div>
          )}

          {showForm && (
            <div className="pv-form" id="pv-form">
              <h3 className="pv-form-titulo">
                {editingId ? "Editar posición" : "Nueva posición"}
              </h3>
              {/* La fusión pasa en el servidor y no se ve venir desde el
                  formulario: se avisa en cuanto el id escrito coincide con una
                  moneda que ya está en cartera. */}
              {!editingId && yaEnCartera && (
                <div className="pv-aviso pv-aviso--amarillo">
                  <span className="pv-aviso-ic" aria-hidden="true"><AlertTriangle size={18} strokeWidth={2.6} /></span>
                  <span>
                    <b>Se sumará a la que ya hay</b>
                    Ya tienes {yaEnCartera.coin_symbol} en cartera: esta compra se sumará a esa
                    posición y el precio de compra pasará a ser la media ponderada de ambas.
                  </span>
                </div>
              )}
              <div className="pv-form-rejilla">
                <label className="pv-campo">
                  <span className="pv-campo-etq">Símbolo *</span>
                  <input
                    placeholder="BTC" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
                    value={form.coin_symbol}
                    onChange={(e) => setForm((f) => ({ ...f, coin_symbol: e.target.value.toUpperCase() }))}
                  />
                </label>
                <label className="pv-campo">
                  <span className="pv-campo-etq">Nombre *</span>
                  <input
                    placeholder="Bitcoin"
                    value={form.coin_name}
                    onChange={(e) => setForm((f) => ({ ...f, coin_name: e.target.value }))}
                  />
                </label>
                <label className="pv-campo pv-campo--ancho">
                  <span className="pv-campo-etq">CoinGecko ID *</span>
                  <input
                    placeholder="bitcoin" autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck={false}
                    value={form.coingecko_id}
                    onChange={(e) => setForm((f) => ({ ...f, coingecko_id: e.target.value.toLowerCase() }))}
                  />
                  <span className="pv-campo-ayuda">ej: bitcoin, ethereum, solana</span>
                </label>
                <label className="pv-campo">
                  <span className="pv-campo-etq">Precio de compra (USD) *</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="65000"
                    value={form.buy_price}
                    onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))}
                  />
                </label>
                <label className="pv-campo">
                  <span className="pv-campo-etq">Dinero invertido (USD) *</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="1000"
                    value={form.invested}
                    onChange={(e) => setForm((f) => ({ ...f, invested: e.target.value }))}
                  />
                </label>
                <label className="pv-campo">
                  <span className="pv-campo-etq">Fecha de compra *</span>
                  <input
                    type="date"
                    value={form.buy_date}
                    onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
                  />
                </label>
                <label className="pv-campo pv-campo--ancho">
                  <span className="pv-campo-etq">Notas <small>(opcional)</small></span>
                  <input
                    placeholder="DCA mensual, acumulación..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
              </div>

              {formError && (
                <div className="pv-aviso pv-aviso--coral" role="alert">
                  <span className="pv-aviso-ic" aria-hidden="true"><X size={18} strokeWidth={3} /></span>
                  <span><b>No se pudo guardar</b>{formError}</span>
                </div>
              )}

              <div className="pv-form-acciones">
                <Tecla color="menta" onClick={savePosition} disabled={saving}>
                  {saving ? "Guardando..." : (
                    <>
                      <Check size={17} strokeWidth={2.8} aria-hidden="true" /> {editingId ? "Guardar cambios" : "Añadir posición"}
                    </>
                  )}
                </Tecla>
                <Tecla color="blanca" onClick={() => cancelForm()} disabled={saving}>
                  <X size={17} strokeWidth={2.8} aria-hidden="true" /> Cancelar
                </Tecla>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
