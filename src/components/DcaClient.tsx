"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Target, Info, ChevronLeft, ChevronRight, Bitcoin, TrendingUp, TrendingDown,
  Wallet, Scale, CalendarClock,
} from "lucide-react";
import { calcularDCA, PRECIO_OBJETIVO, type CompraDCA } from "@/lib/dca";
import { formatoES } from "@/lib/formato";
import DcaGrafico from "@/components/DcaGrafico";
import CifraAnimada from "@/components/CifraAnimada";

interface Props {
  compras: CompraDCA[];
  precioInicial: number | null;
  isAdmin: boolean;
}

/**
 * Compras por página.
 *
 * Con 39 aportaciones y subiendo cada semana, la tabla entera obligaba a un
 * scroll larguísimo y empujaba el descargo fuera de la vista. Diez entran de
 * una pantalla y dejan cuatro páginas, que se recorren de un vistazo.
 *
 * Aquí sí se recorta el array de verdad, al revés que en el diccionario: esa
 * página necesitaba los 50 enlaces en el HTML por SEO, y `/portfolio` exige
 * sesión y ni siquiera está en el sitemap.
 */
const POR_PAGINA = 10;

const VACIO = { id: "", fecha: "", importe: "", precio_btc: "", notas: "" };

// Siempre con punto de miles (`formatoES`): el formato español de serie deja
// «7500 $» sin separar, y en un panel de cifras se lee peor que «7.500 $».
const usd = (n: number, dec = 2) =>
  formatoES(n, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " $";

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${formatoES(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

const fechaCorta = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

/**
 * El DCA de Bitcoin.
 *
 * Dos cosas que no son negociables en cómo se presenta:
 *
 * 1. **La rentabilidad es la real**, contra el precio de CoinGecko. La
 *    proyección a 200.000 va en su propio bloque y dice de dónde sale. En el
 *    Excel original TODAS las columnas de rentabilidad usaban los 200.000, así
 *    que ahí «obtenido: 11.445» es lo que se ganaría si Bitcoin llegara, no lo
 *    que se lleva ganado. Enseñar eso como rentabilidad sería anunciar un
 *    +170 % que nadie ha cobrado.
 * 2. **Se enseñan las compras una a una.** Es lo que demuestra que el DCA se ha
 *    seguido de verdad, incluidas las semanas en las que el precio caía.
 *
 * Rehecho el 04-11-2026: las cifras en tarjetas, y un gráfico con el precio
 * pagado en cada compra frente al precio medio y al de hoy (`DcaGrafico`),
 * que es lo que explica un DCA de un vistazo. Todo sale de las compras reales.
 */
export default function DcaClient({ compras: iniciales, precioInicial, isAdmin }: Props) {
  const [compras, setCompras] = useState(iniciales);
  const [precio, setPrecio] = useState(precioInicial);
  const [form, setForm] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");

  // Si el precio no llegó en el servidor se reintenta en el cliente: es mejor
  // que enseñar la tabla sin rentabilidad porque CoinGecko tuvo un mal minuto.
  useEffect(() => {
    if (precio !== null) return;
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
      .then((r) => r.json())
      .then((j) => { if (j?.bitcoin?.usd) setPrecio(j.bitcoin.usd); })
      .catch(() => {});
  }, [precio]);

  const r = useMemo(() => calcularDCA(compras, precio ?? 0), [compras, precio]);
  const hayPrecio = precio !== null && precio > 0;

  // La más reciente primero: es la que se mira al entrar.
  const ordenadas = useMemo(() => [...r.compras].reverse(), [r.compras]);
  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));
  // Si se borra la última compra de la última página, `pagina` se queda fuera
  // de rango y la tabla saldría vacía sin explicar por qué.
  const actual = Math.min(pagina, totalPaginas);
  const enPantalla = ordenadas.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);

  async function guardar() {
    setError("");
    setGuardando(true);
    try {
      const editando = !!form.id;
      const res = await fetch("/api/dca", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          fecha: form.fecha,
          importe: form.importe,
          precio_btc: form.precio_btc,
          notas: form.notas,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "No se pudo guardar."); return; }
      setCompras((prev) => {
        const otras = editando ? prev.filter((c) => c.id !== form.id) : prev;
        return [...otras, json].sort((a, b) => a.fecha.localeCompare(b.fecha));
      });
      setForm(VACIO);
      setAbierto(false);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    if (!confirm("¿Borrar esta compra? El precio medio se recalcula.")) return;
    const res = await fetch(`/api/dca?id=${id}`, { method: "DELETE" });
    if (res.ok) setCompras((prev) => prev.filter((c) => c.id !== id));
  }

  if (!compras.length) {
    return (
      <div className="pv-vacio">
        <Bitcoin size={30} strokeWidth={1.4} aria-hidden="true" />
        <p>Todavía no hay ninguna compra cargada en el DCA.</p>
        {isAdmin && <p>Ejecuta <code>scripts/seed-dca-compras.sql</code> en Supabase.</p>}
      </div>
    );
  }

  const sube = r.ganancia >= 0;

  // El ritmo: cada cuántos días se compra de media y cuánto por compra.
  const realizadas = r.compras.filter((c) => c.estado === "realizada");
  const diasEntre = realizadas.length > 1 && r.primera && r.ultima
    ? (Date.parse(r.ultima) - Date.parse(r.primera)) / 86_400_000 / (realizadas.length - 1)
    : null;
  const importeMedio = realizadas.length ? r.invertido / realizadas.length : 0;
  const dias = diasEntre === null ? null : Math.max(1, Math.round(diasEntre));

  // Cuánto está el precio de hoy por encima (o debajo) del precio medio: si
  // está por encima, comprar de forma constante ha salido mejor que el mercado.
  const vsMedio = hayPrecio && r.precioMedio > 0 ? ((r.precioActual - r.precioMedio) / r.precioMedio) * 100 : null;

  return (
    <div className="pv-dca">
      {/* ── Las cifras: la rentabilidad, y cuatro datos al lado ── */}
      <div className="pv-dca-cifras">
        <div className={`pv-kpi-principal pv-dca-principal${hayPrecio ? (sube ? " es-sube" : " es-baja") : ""}`}>
          <span className="pv-dca-principal-cab">
            <span className="pv-dca-moneda" aria-hidden="true"><Bitcoin size={20} strokeWidth={2.2} /></span>
            <span className="pv-etiqueta">Rentabilidad del DCA</span>
          </span>
          <span className="pv-kpi-grande">{hayPrecio ? <CifraAnimada valor={r.rentabilidadPct} formato={pct} /> : "—"}</span>
          {hayPrecio ? (
            <span className="pv-dca-principal-pie">
              <span className="pv-pill">
                {sube ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                {sube ? "+" : ""}{usd(r.ganancia, 0)}
              </span>
              <span className="pv-dca-principal-dato">
                <small>Vale hoy</small>
                <b>{usd(r.valorActual, 0)}</b>
              </span>
              <span className="pv-dca-principal-dato">
                <small>BTC hoy</small>
                <b>{usd(r.precioActual, 0)}</b>
              </span>
            </span>
          ) : (
            <span className="pv-kpi-pnl">Precio de mercado no disponible</span>
          )}
        </div>

        <div className="pv-dca-rejilla">
          <div className="pv-dca-dato" style={{ "--c": "#4f9dff" } as React.CSSProperties}>
            <span className="pv-dca-dato-icono" aria-hidden="true"><Wallet size={16} /></span>
            <span className="pv-etiqueta">Invertido</span>
            <b>{usd(r.invertido, 0)}</b>
            <small>{realizadas.length} aportaciones</small>
          </div>
          <div className="pv-dca-dato" style={{ "--c": "#f7931a" } as React.CSSProperties}>
            <span className="pv-dca-dato-icono" aria-hidden="true"><Bitcoin size={16} /></span>
            <span className="pv-etiqueta">Acumulado</span>
            <b className="es-btc">{formatoES(r.btc, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</b>
            <small>BTC en cartera</small>
          </div>
          <div className="pv-dca-dato" style={{ "--c": "#ffc37a" } as React.CSSProperties}>
            <span className="pv-dca-dato-icono" aria-hidden="true"><Scale size={16} /></span>
            <span className="pv-etiqueta">Precio medio</span>
            <b>{usd(r.precioMedio, 0)}</b>
            <small>
              {vsMedio === null ? "sin precio de mercado" : (
                <span className={vsMedio >= 0 ? "es-sube" : "es-baja"}>
                  hoy {pct(vsMedio)} {vsMedio >= 0 ? "por encima" : "por debajo"}
                </span>
              )}
            </small>
          </div>
          <div className="pv-dca-dato" style={{ "--c": "#a78bfa" } as React.CSSProperties}>
            <span className="pv-dca-dato-icono" aria-hidden="true"><CalendarClock size={16} /></span>
            <span className="pv-etiqueta">Ritmo</span>
            <b>{dias === null ? "—" : dias === 1 ? "A diario" : `Cada ${dias} días`}</b>
            <small>{usd(importeMedio, 0)} por compra, de media</small>
          </div>
        </div>
      </div>

      {/* ── El gráfico ── */}
      <DcaGrafico
        compras={r.compras}
        precioMedio={r.precioMedio}
        precioActual={hayPrecio ? r.precioActual : null}
      />

      {/* ── La proyección, separada y etiquetada ── */}
      <div className="pv-proyeccion">
        <span className="pv-proyeccion-icono" aria-hidden="true"><Target size={18} strokeWidth={2} /></span>
        <div>
          <p className="pv-proyeccion-titulo">
            Si Bitcoin llegara a {PRECIO_OBJETIVO.toLocaleString("es-ES")} $
          </p>
          <p className="pv-proyeccion-cifras">
            Estos {r.btc.toFixed(4)} BTC valdrían <strong>{usd(r.proyeccion.valor, 0)}</strong>{" "}
            — {pct(r.proyeccion.rentabilidadPct)} sobre lo invertido.
            {hayPrecio && ` Bitcoin tendría que subir un ${pct(r.proyeccion.subidaNecesariaPct)} desde hoy.`}
          </p>
          <p className="pv-proyeccion-aviso">
            <Info size={12} aria-hidden="true" />
            Es un supuesto para ver la escala, <strong>no una previsión ni un objetivo
            alcanzable</strong>. Nadie sabe a cuánto estará Bitcoin, y podría no llegar nunca.
          </p>
        </div>
      </div>

      {/* ── El histórico ── */}
      <div className="pv-tabla-cab">
        <span className="pv-etiqueta">Todas las compras</span>
        {isAdmin && (
          <button className="pv-btn" onClick={() => { setForm({ ...VACIO, fecha: new Date().toISOString().slice(0, 10) }); setAbierto(true); }}>
            <Plus size={15} strokeWidth={2.4} /> Añadir compra
          </button>
        )}
      </div>

      {abierto && (
        <div className="pv-form">
          <div className="pv-form-titulo">{form.id ? "Editar compra" : "Nueva compra"}</div>
          <div className="pv-form-rejilla pv-form-rejilla--tres">
            <label className="pv-campo">
              <span>Fecha</span>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </label>
            <label className="pv-campo">
              <span>Importe ($)</span>
              <input type="number" step="0.01" placeholder="100" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} />
            </label>
            <label className="pv-campo">
              <span>Precio de BTC ($)</span>
              <input type="number" step="0.01" placeholder="78414" value={form.precio_btc} onChange={(e) => setForm({ ...form, precio_btc: e.target.value })} />
            </label>
          </div>
          {form.importe && form.precio_btc && Number(form.precio_btc) > 0 && (
            <p className="pv-form-previo">
              Serían <strong>{(Number(form.importe) / Number(form.precio_btc)).toFixed(8)} BTC</strong>.
            </p>
          )}
          {error && <p className="pv-form-error">{error}</p>}
          <div className="pv-form-acciones">
            <button className="pv-btn" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button className="pv-btn pv-btn--ghost" onClick={() => { setAbierto(false); setError(""); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="pv-tabla-wrap">
        <table className="pv-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th className="es-num">Importe</th>
              <th className="es-num">Precio BTC</th>
              <th className="es-num">BTC</th>
              <th className="es-num">Rentabilidad</th>
              {isAdmin && <th aria-label="Acciones" />}
            </tr>
          </thead>
          <tbody>
            {enPantalla.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="pv-fecha">
                    <span className="pv-fecha-punto" aria-hidden="true" />
                    {fechaCorta(c.fecha)}
                  </span>
                </td>
                <td className="es-num es-fuerte">{usd(c.importe)}</td>
                <td className="es-num es-tenue">{usd(c.precio_btc, 0)}</td>
                <td className="es-num pv-btc">{c.btc.toFixed(8)}</td>
                <td className="es-num">
                  {hayPrecio ? (
                    <span className={`pv-chip ${c.ganancia >= 0 ? "es-sube" : "es-baja"}`}>{pct(c.rentabilidadPct)}</span>
                  ) : "—"}
                </td>
                {isAdmin && (
                  <td className="pv-acciones">
                    <button aria-label="Editar" onClick={() => {
                      setForm({ id: c.id, fecha: c.fecha, importe: String(c.importe), precio_btc: String(c.precio_btc), notas: c.notas ?? "" });
                      setAbierto(true);
                    }}><Pencil size={13} /></button>
                    <button className="es-borrar" aria-label="Borrar" onClick={() => borrar(c.id)}><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <nav className="pv-paginacion" aria-label="Páginas de compras">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={actual === 1}
            aria-label="Compras más recientes"
          >
            <ChevronLeft size={15} strokeWidth={2.4} aria-hidden="true" />
          </button>

          <span>
            Compras {(actual - 1) * POR_PAGINA + 1}–{Math.min(actual * POR_PAGINA, ordenadas.length)}
            {" "}de {ordenadas.length}
          </span>

          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={actual === totalPaginas}
            aria-label="Compras más antiguas"
          >
            <ChevronRight size={15} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </nav>
      )}

      <p className="pv-pie">
        Importes en dólares. El precio de Bitcoin viene de CoinGecko y se actualiza cada cinco minutos.
      </p>
    </div>
  );
}
