"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Plus, Trash2, RefreshCw, Pencil, Check, X, Wallet, Crown,
  ChevronDown, Scale,
} from "lucide-react";
import CifraAnimada from "@/components/CifraAnimada";
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
}

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

/** Colores de reserva para monedas sin color propio, para que no salgan todas iguales. */
const RESERVA = ["#ff6b2b", "#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"];

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

/** Por qué se puede ordenar la tabla. */
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

/**
 * La cartera spot del Portfolio Adelin.
 *
 * Rehecha el 04-11-2026: cabecera con el estado en vivo, una cifra principal
 * (valor actual con su P&L), la barra de reparto de la cartera por moneda y
 * la tabla de posiciones con su peso. La página solo la ve quien es Premium o
 * Admin (`/portfolio` redirige al resto a `/premium`), así que aquí ya no hay
 * vista bloqueada.
 *
 * El formulario de admin y su lógica (la fusión de compras de la misma moneda
 * la decide el servidor) no han cambiado.
 */
export default function PortfolioClient({ initialPositions, isAdmin }: Props) {
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

  // Peso de cada moneda sobre el valor actual: la barra de reparto y la
  // columna de peso. Ordenadas de más a menos, que es como se lee un reparto.
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

  // La tabla, en el orden elegido. Sin dato (precio aún sin llegar) va al final.
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
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(pos: Position) {
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

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function savePosition() {
    setFormError("");
    if (!form.coin_symbol || !form.coin_name || !form.coingecko_id || !form.buy_price || !form.invested || !form.buy_date) {
      setFormError("Completa todos los campos obligatorios.");
      return;
    }
    const buyPrice = parseFloat(form.buy_price);
    const invested = parseFloat(form.invested);
    if (isNaN(buyPrice) || buyPrice <= 0 || isNaN(invested) || invested <= 0) {
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
      if (!res.ok) { setFormError(json.error ?? "Error al guardar"); return; }

      // Al crear, el servidor puede haber FUSIONADO la compra con una posición
      // que ya existía de esa misma moneda (ver POST en /api/portfolio): en ese
      // caso devuelve esa fila ya actualizada, no una nueva. Por eso se decide
      // por el id de lo que vuelve y no por si había `editingId`: dar por hecho
      // que un alta siempre añade una fila duplicaría la moneda en la tabla.
      const siguientes = positions.some((p) => p.id === json.id)
        ? positions.map((p) => (p.id === json.id ? json : p))
        : [...positions, json];

      setPositions(siguientes);
      cancelForm();
      fetchPrices(siguientes);
    } catch {
      setFormError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePosition(id: string) {
    if (!confirm("¿Eliminar esta posición?")) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) setPositions((prev) => prev.filter((p) => p.id !== id));
  }

  const cargando = <span className="pv-cargando" aria-label="Cargando" />;

  return (
    <div className="pv-spot">
      {/* ── Estado en vivo ── */}
      <div className="pv-estado">
        <span className="pv-vivo">
          <span className="pv-vivo-punto" aria-hidden="true" />
          En vivo
          {lastUpdated && (
            <span className="pv-vivo-hora">
              · {lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </span>
        <button
          className="pv-refrescar"
          onClick={() => { setPricesLoading(true); fetchPrices(positions); }}
          disabled={pricesLoading}
          title="Actualizar precios"
        >
          <RefreshCw size={14} className={pricesLoading ? "pv-gira" : ""} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {positions.length > 0 && (
        <>
          {/* ── Las cifras ── */}
          <div className="pv-kpis">
            <div className={`pv-kpi-principal${pricesLoading ? "" : totalPositive ? " es-sube" : " es-baja"}`}>
              <span className="pv-etiqueta">Valor actual de la cartera</span>
              <span className="pv-kpi-grande">
                {pricesLoading ? cargando : <CifraAnimada valor={totalCurrent} formato={fmtCurrency} />}
              </span>
              {/* Mientras llegan los precios no se enseña el resultado: con el
                  precio de compra como reserva saldría un +0,00 % falso. */}
              <span className="pv-kpi-fila">
                {pricesLoading ? cargando : (
                  <>
                    <span className="pv-pill">
                      {totalPositive ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                      {totalPositive ? "+" : ""}{fmt(totalPnlPct)} %
                    </span>
                    <span className="pv-kpi-pnl">
                      {totalPositive ? "+" : ""}{fmtCurrency(totalPnl)} desde la compra
                    </span>
                  </>
                )}
              </span>
            </div>

            <div className="pv-kpi">
              <span className="pv-etiqueta">Invertido</span>
              <span className="pv-kpi-valor">{fmtCurrency(totalInvested)}</span>
              <span className="pv-kpi-pie">Coste de entrada total</span>
            </div>
            <div className="pv-kpi">
              <span className="pv-etiqueta">Posiciones</span>
              <span className="pv-kpi-valor">{positions.length}</span>
              <span className="pv-kpi-pie">
                {pricesLoading ? "Calculando…" : `${ganadoras} en ganancias · ${perdedoras} en pérdidas`}
              </span>
            </div>
          </div>

          {/* ── Destacadas: mejor, peor y la que más pesa ── */}
          {!pricesLoading && mejor && peor && mayor && (
            <div className="pv-destacadas">
              {[
                { titulo: "Mejor posición", f: mejor, icono: <TrendingUp size={15} aria-hidden="true" />, tono: "es-sube" },
                { titulo: "Peor posición", f: peor, icono: <TrendingDown size={15} aria-hidden="true" />, tono: (peor.pnlPct ?? 0) >= 0 ? "es-sube" : "es-baja" },
                { titulo: "Mayor peso", f: mayor, icono: <Scale size={15} aria-hidden="true" />, tono: "" },
              ].map((d) => (
                <div key={d.titulo} className="pv-destacada" style={{ "--c": d.f.color } as React.CSSProperties}>
                  <span className="pv-destacada-cab">
                    <span className={`pv-destacada-icono ${d.tono}`}>{d.icono}</span>
                    <span className="pv-etiqueta">{d.titulo}</span>
                  </span>
                  <span className="pv-destacada-cuerpo">
                    <span className="pv-moneda-icono">{d.f.pos.coin_symbol.slice(0, 4)}</span>
                    <span className="pv-destacada-texto">
                      <b>{d.f.pos.coin_name}</b>
                      {d.titulo === "Mayor peso" ? (
                        <small>{fmt(d.f.peso, 1)} % de la cartera</small>
                      ) : (
                        <small className={d.tono}>
                          {(d.f.pnlPct ?? 0) >= 0 ? "+" : ""}{fmt(d.f.pnlPct ?? 0)} % · {(d.f.pnl ?? 0) >= 0 ? "+" : ""}{fmtCurrency(d.f.pnl ?? 0)}
                        </small>
                      )}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── El reparto: anillo y leyenda ── */}
          <div className="pv-reparto">
            <div className="pv-reparto-cab">
              <span className="pv-etiqueta">Reparto de la cartera</span>
              <span className="pv-reparto-nota">por valor actual</span>
            </div>
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
              <ul className="pv-reparto-leyenda">
                {pesos.map((f) => (
                  <li key={f.pos.id} style={{ "--c": f.color } as React.CSSProperties}>
                    <i aria-hidden="true" />
                    <b>{f.pos.coin_symbol}</b>
                    <span className="pv-reparto-barrita"><em style={{ width: `${Math.max(f.peso, 2)}%` }} /></span>
                    <span className="pv-reparto-valor">{f.currentValue !== null ? fmtCurrency(f.currentValue) : "—"}</span>
                    <span className="pv-reparto-pct">{fmt(f.peso, 1)} %</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ── Las posiciones ── */}
      {positions.length === 0 ? (
        <div className="pv-vacio">
          <Wallet size={30} strokeWidth={1.4} aria-hidden="true" />
          <p>No hay posiciones todavía.</p>
          {isAdmin && <button className="pv-btn" onClick={openAdd}><Plus size={15} /> Añadir primera posición</button>}
        </div>
      ) : (
        <div className="pv-tabla-wrap">
          <table className="pv-tabla">
            <thead>
              <tr>
                <th>Moneda</th>
                <th className="es-num">Precio de compra</th>
                <th className="es-num">Precio actual</th>
                <th className="es-num">Invertido</th>
                {/* Las cuatro últimas ordenan la tabla al pulsarlas. */}
                {COLUMNAS_ORDEN.map((c) => (
                  <th key={c.id} className="es-num" aria-sort={orden === c.id ? "descending" : "none"}>
                    <button
                      type="button"
                      className={`pv-orden${orden === c.id ? " is-activo" : ""}`}
                      onClick={() => setOrden(c.id)}
                    >
                      {c.texto}
                      <ChevronDown size={12} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </th>
                ))}
                {isAdmin && <th aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((f) => {
                const positive = f.pnl !== null ? f.pnl >= 0 : null;
                return (
                  <tr key={f.pos.id} style={{ "--c": f.color } as React.CSSProperties}>
                    <td>
                      <span className="pv-moneda">
                        <span className="pv-moneda-icono">{f.pos.coin_symbol.slice(0, 4)}</span>
                        <span className="pv-moneda-texto">
                          <b>{f.pos.coin_name}</b>
                          <small>{fmt(f.pos.quantity, f.pos.quantity < 1 ? 6 : 4)} {f.pos.coin_symbol}</small>
                        </span>
                      </span>
                    </td>
                    <td className="es-num es-tenue">{fmtCurrency(f.pos.buy_price)}</td>
                    <td className="es-num">
                      {pricesLoading ? cargando : f.currentPrice !== null ? fmtCurrency(f.currentPrice) : "—"}
                    </td>
                    <td className="es-num es-tenue">{fmtCurrency(f.invested)}</td>
                    <td className="es-num es-fuerte">
                      {pricesLoading ? cargando : f.currentValue !== null ? fmtCurrency(f.currentValue) : "—"}
                    </td>
                    <td className="es-num">
                      {pricesLoading ? cargando : f.pnl !== null ? (
                        <span className={`pv-pnl ${positive ? "es-sube" : "es-baja"}`}>
                          <b>{positive ? "+" : ""}{fmt(f.pnlPct ?? 0)} %</b>
                          <small>{positive ? "+" : ""}{fmtCurrency(f.pnl)}</small>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="es-num">
                      {pricesLoading ? cargando : f.change24h !== null ? (
                        <span className={`pv-chip ${f.change24h >= 0 ? "es-sube" : "es-baja"}`}>
                          {f.change24h >= 0 ? "+" : ""}{fmt(f.change24h)} %
                        </span>
                      ) : "—"}
                    </td>
                    <td className="es-num">
                      <span className="pv-peso">
                        <span className="pv-peso-barra"><i style={{ width: `${Math.max(f.peso, 2)}%` }} /></span>
                        {fmt(f.peso, 1)} %
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="pv-acciones">
                        <button onClick={() => openEdit(f.pos)} title="Editar" aria-label={`Editar ${f.pos.coin_symbol}`}>
                          <Pencil size={14} />
                        </button>
                        <button className="es-borrar" onClick={() => deletePosition(f.pos.id)} title="Eliminar" aria-label={`Eliminar ${f.pos.coin_symbol}`}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Panel de admin ── */}
      {isAdmin && (
        <div className="pv-admin">
          <div className="pv-admin-cab">
            <span className="pv-admin-etiqueta">
              <Crown size={13} aria-hidden="true" /> Panel admin
            </span>
            {!showForm && (
              <button className="pv-btn" onClick={openAdd}>
                <Plus size={15} /> Añadir posición
              </button>
            )}
          </div>

          {showForm && (
            <div className="pv-form" id="pv-form">
              <div className="pv-form-titulo">
                {editingId ? "Editar posición" : "Nueva posición"}
              </div>
              {/* La fusión pasa en el servidor y no se ve venir desde el
                  formulario: se avisa en cuanto el id escrito coincide con una
                  moneda que ya está en cartera. */}
              {!editingId && yaEnCartera && (
                <div className="pv-form-aviso">
                  Ya tienes {yaEnCartera.coin_symbol} en cartera: esta compra se sumará a esa
                  posición y el precio de compra pasará a ser la media ponderada de ambas.
                </div>
              )}
              <div className="pv-form-rejilla">
                <label className="pv-campo">
                  <span>Símbolo *</span>
                  <input
                    placeholder="BTC"
                    value={form.coin_symbol}
                    onChange={(e) => setForm((f) => ({ ...f, coin_symbol: e.target.value.toUpperCase() }))}
                  />
                </label>
                <label className="pv-campo">
                  <span>Nombre *</span>
                  <input
                    placeholder="Bitcoin"
                    value={form.coin_name}
                    onChange={(e) => setForm((f) => ({ ...f, coin_name: e.target.value }))}
                  />
                </label>
                <label className="pv-campo pv-campo--ancho">
                  <span>CoinGecko ID * <small>(ej: bitcoin, ethereum, solana)</small></span>
                  <input
                    placeholder="bitcoin"
                    value={form.coingecko_id}
                    onChange={(e) => setForm((f) => ({ ...f, coingecko_id: e.target.value.toLowerCase() }))}
                  />
                </label>
                <label className="pv-campo">
                  <span>Precio de compra (USD) *</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="65000"
                    value={form.buy_price}
                    onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))}
                  />
                </label>
                <label className="pv-campo">
                  <span>Dinero invertido (USD) *</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="1000"
                    value={form.invested}
                    onChange={(e) => setForm((f) => ({ ...f, invested: e.target.value }))}
                  />
                </label>
                <label className="pv-campo">
                  <span>Fecha de compra *</span>
                  <input
                    type="date"
                    value={form.buy_date}
                    onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
                  />
                </label>
                <label className="pv-campo pv-campo--ancho">
                  <span>Notas <small>(opcional)</small></span>
                  <input
                    placeholder="DCA mensual, acumulación..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
              </div>

              {formError && <p className="pv-form-error">{formError}</p>}

              <div className="pv-form-acciones">
                <button className="pv-btn" onClick={savePosition} disabled={saving}>
                  {saving ? "Guardando..." : <><Check size={15} /> {editingId ? "Guardar cambios" : "Añadir posición"}</>}
                </button>
                <button className="pv-btn pv-btn--ghost" onClick={cancelForm} disabled={saving}>
                  <X size={15} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
