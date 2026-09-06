"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, TrendingUp, Target, Info } from "lucide-react";
import { calcularDCA, PRECIO_OBJETIVO, type CompraDCA } from "@/lib/dca";

interface Props {
  compras: CompraDCA[];
  precioInicial: number | null;
  isAdmin: boolean;
}

const VACIO = { id: "", fecha: "", importe: "", precio_btc: "", notas: "" };

const usd = (n: number, dec = 2) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " $";

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

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
 */
export default function DcaClient({ compras: iniciales, precioInicial, isAdmin }: Props) {
  const [compras, setCompras] = useState(iniciales);
  const [precio, setPrecio] = useState(precioInicial);
  const [form, setForm] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
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
      <div className="dca-vacio">
        <p>Todavía no hay ninguna compra cargada en el DCA.</p>
        {isAdmin && <p>Ejecuta <code>scripts/seed-dca-compras.sql</code> en Supabase.</p>}
      </div>
    );
  }

  return (
    <div className="dca">
      {/* ── Las cifras que importan ── */}
      <div className="dca-cifras">
        <div className="dca-cifra">
          <span className="dca-cifra-label">Invertido</span>
          <span className="dca-cifra-valor">{usd(r.invertido)}</span>
          <span className="dca-cifra-pie">{compras.length} aportaciones</span>
        </div>

        <div className="dca-cifra">
          <span className="dca-cifra-label">Bitcoin acumulado</span>
          <span className="dca-cifra-valor">{r.btc.toFixed(8)}</span>
          <span className="dca-cifra-pie">BTC</span>
        </div>

        <div className="dca-cifra">
          <span className="dca-cifra-label">Precio medio</span>
          <span className="dca-cifra-valor">{usd(r.precioMedio)}</span>
          <span className="dca-cifra-pie">
            {hayPrecio
              ? `BTC ahora: ${usd(r.precioActual)}`
              : "precio de mercado no disponible"}
          </span>
        </div>

        <div className="dca-cifra dca-cifra--destacada">
          <span className="dca-cifra-label">Rentabilidad</span>
          {hayPrecio ? (
            <>
              <span className={`dca-cifra-valor ${r.ganancia >= 0 ? "es-sube" : "es-baja"}`}>
                {pct(r.rentabilidadPct)}
              </span>
              <span className="dca-cifra-pie">
                {r.ganancia >= 0 ? "+" : ""}{usd(r.ganancia)} · vale {usd(r.valorActual)}
              </span>
            </>
          ) : (
            <>
              <span className="dca-cifra-valor">—</span>
              <span className="dca-cifra-pie">sin precio de mercado</span>
            </>
          )}
        </div>
      </div>

      {/* ── La proyección, separada y etiquetada ── */}
      <div className="dca-proyeccion">
        <span className="dca-proy-icon" aria-hidden="true"><Target size={17} strokeWidth={2} /></span>
        <div className="dca-proy-texto">
          <p className="dca-proy-title">
            Si Bitcoin llegara a {PRECIO_OBJETIVO.toLocaleString("es-ES")} $
          </p>
          <p className="dca-proy-cifras">
            Estos {r.btc.toFixed(4)} BTC valdrían <strong>{usd(r.proyeccion.valor, 0)}</strong>{" "}
            — {pct(r.proyeccion.rentabilidadPct)} sobre lo invertido.
            {hayPrecio && ` Bitcoin tendría que subir un ${pct(r.proyeccion.subidaNecesariaPct)} desde hoy.`}
          </p>
          <p className="dca-proy-aviso">
            <Info size={12} aria-hidden="true" />
            Es un supuesto para ver la escala, <strong>no una previsión ni un objetivo
            alcanzable</strong>. Nadie sabe a cuánto estará Bitcoin, y podría no llegar nunca.
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="dca-admin">
          <button className="dca-btn" onClick={() => { setForm({ ...VACIO, fecha: new Date().toISOString().slice(0, 10) }); setAbierto(true); }}>
            <Plus size={15} strokeWidth={2.4} /> Añadir compra
          </button>
        </div>
      )}

      {abierto && (
        <div className="dca-form">
          <div className="dca-form-campos">
            <label>Fecha
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </label>
            <label>Importe ($)
              <input type="number" step="0.01" placeholder="100" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} />
            </label>
            <label>Precio de BTC ($)
              <input type="number" step="0.01" placeholder="78414" value={form.precio_btc} onChange={(e) => setForm({ ...form, precio_btc: e.target.value })} />
            </label>
          </div>
          {form.importe && form.precio_btc && Number(form.precio_btc) > 0 && (
            <p className="dca-form-previo">
              Serían <strong>{(Number(form.importe) / Number(form.precio_btc)).toFixed(8)} BTC</strong>.
            </p>
          )}
          {error && <p className="dca-form-error">{error}</p>}
          <div className="dca-form-acciones">
            <button className="dca-btn" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button className="dca-btn dca-btn--ghost" onClick={() => { setAbierto(false); setError(""); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── El histórico ── */}
      <div className="dca-tabla-wrap">
        <table className="dca-tabla">
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
            {[...r.compras].reverse().map((c) => (
              <tr key={c.id}>
                <td>{fechaCorta(c.fecha)}</td>
                <td className="es-num">{usd(c.importe)}</td>
                <td className="es-num">{usd(c.precio_btc, 0)}</td>
                <td className="es-num dca-btc">{c.btc.toFixed(8)}</td>
                <td className="es-num">
                  {hayPrecio ? (
                    <span className={c.ganancia >= 0 ? "es-sube" : "es-baja"}>{pct(c.rentabilidadPct)}</span>
                  ) : "—"}
                </td>
                {isAdmin && (
                  <td className="dca-acciones">
                    <button aria-label="Editar" onClick={() => {
                      setForm({ id: c.id, fecha: c.fecha, importe: String(c.importe), precio_btc: String(c.precio_btc), notas: c.notas ?? "" });
                      setAbierto(true);
                    }}><Pencil size={13} /></button>
                    <button aria-label="Borrar" onClick={() => borrar(c.id)}><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="dca-pie">
        <TrendingUp size={13} aria-hidden="true" />
        De {fechaCorta(r.primera ?? "")} a {fechaCorta(r.ultima ?? "")}. Importes en dólares.
        El precio de Bitcoin viene de CoinGecko y se actualiza cada cinco minutos.
      </p>
    </div>
  );
}
