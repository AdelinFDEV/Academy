"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Target, ChevronLeft, ChevronRight, Bitcoin, Wallet, Scale, CalendarClock, Check, X,
} from "lucide-react";
import { calcularDCA, PRECIO_OBJETIVO, type CompraDCA } from "@/lib/dca";
import { formatoES } from "@/lib/formato";
import DcaGrafico from "@/components/DcaGrafico";
import CifraAnimada from "@/components/CifraAnimada";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

interface Props {
  compras: CompraDCA[];
  precioInicial: number | null;
  isAdmin: boolean;
}

/**
 * Compras por página.
 *
 * Con 39 aportaciones y subiendo cada semana, la lista entera obligaba a un
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
 * Rehecho el 17-11-2026 con el estilo «Cuaderno de estudio»: la rentabilidad
 * en grande con el color de su signo y cuatro fichas de papel al lado, el
 * gráfico (`DcaGrafico`), la proyección como un aviso de «dato» bien separado
 * y las compras como filas de cuaderno, con teclas para pasar de página. Todo
 * sale de las compras reales.
 */
export default function DcaClient({ compras: iniciales, precioInicial, isAdmin }: Props) {
  const [compras, setCompras] = useState(iniciales);
  const [precio, setPrecio] = useState(precioInicial);
  const [form, setForm] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  const [borrarError, setBorrarError] = useState("");

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
  // de rango y la lista saldría vacía sin explicar por qué.
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
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) { sonar("error"); setError(json?.error ?? "No se pudo guardar."); return; }
      setCompras((prev) => {
        const otras = editando ? prev.filter((c) => c.id !== form.id) : prev;
        return [...otras, json].sort((a, b) => a.fecha.localeCompare(b.fecha));
      });
      setForm(VACIO);
      setAbierto(false);
      sonar("guardado");
    } catch {
      sonar("error");
      setError("Sin conexión. Vuelve a intentarlo.");
    } finally {
      setGuardando(false);
    }
  }

  /** Abre el formulario (vacío para una compra nueva, o con una para editarla) y lo trae a la vista. */
  function abrir(datos: typeof VACIO) {
    if (!abierto) sonar("abrir");
    setError("");
    setForm(datos);
    setAbierto(true);
    setTimeout(() => document.getElementById("pv-form-dca")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function cerrar() {
    sonar("cerrar");
    setAbierto(false);
    setError("");
  }

  async function borrar(id: string) {
    if (!confirm("¿Borrar esta compra? El precio medio se recalcula.")) return;
    setBorrarError("");
    const res = await fetch(`/api/dca?id=${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      sonar("borrar");
      setCompras((prev) => prev.filter((c) => c.id !== id));
    } else {
      sonar("error");
      setBorrarError(res ? "El servidor no dejó borrarla. Vuelve a intentarlo." : "Sin conexión. Vuelve a intentarlo.");
    }
  }

  if (!compras.length) {
    return (
      <div className="pv-vacio">
        <span className="pv-vacio-ic pv-vacio-ic--btc" aria-hidden="true"><Bitcoin size={28} strokeWidth={2.2} /></span>
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
      {/* ── Las cifras: la rentabilidad, y cuatro fichas al lado ── */}
      <section className="pv-resumen pv-resumen--dca" aria-label="Resumen del DCA de Bitcoin">
        <div className={`pv-hoja${hayPrecio ? (sube ? " es-sube" : " es-baja") : ""}`}>
          <span className="pv-hoja-cab">
            <span className="pv-hoja-ic pv-hoja-ic--btc" aria-hidden="true"><Bitcoin size={22} strokeWidth={2.4} /></span>
            <span className="pv-etiqueta">Rentabilidad del DCA</span>
          </span>
          <span className="pv-grande">{hayPrecio ? <CifraAnimada valor={r.rentabilidadPct} formato={pct} /> : "—"}</span>
          {hayPrecio ? (
            <span className="pv-hoja-pie">
              <span className={`pv-chip-signo pv-chip-signo--grande ${sube ? "es-sube" : "es-baja"}`}>
                {sube ? "+" : ""}{usd(r.ganancia, 0)}
              </span>
              <span className="pv-hoja-dato">
                <small>Vale hoy</small>
                <b>{usd(r.valorActual, 0)}</b>
              </span>
              <span className="pv-hoja-dato">
                <small>BTC hoy</small>
                <b>{usd(r.precioActual, 0)}</b>
              </span>
            </span>
          ) : (
            <span className="pv-grande-pie">Precio de mercado no disponible</span>
          )}
        </div>

        <div className="pv-datos pv-datos--cuatro">
          <div className="pv-dato pv-dato--menta">
            <span className="pv-dato-ic" aria-hidden="true"><Wallet size={17} strokeWidth={2.4} /></span>
            <span className="pv-etiqueta">Invertido</span>
            <b>{usd(r.invertido, 0)}</b>
            <small>{realizadas.length} aportaciones</small>
          </div>
          <div className="pv-dato pv-dato--btc">
            <span className="pv-dato-ic" aria-hidden="true"><Bitcoin size={17} strokeWidth={2.4} /></span>
            <span className="pv-etiqueta">Acumulado</span>
            <b className="es-btc">{formatoES(r.btc, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</b>
            <small>BTC en cartera</small>
          </div>
          <div className="pv-dato pv-dato--lila">
            <span className="pv-dato-ic" aria-hidden="true"><Scale size={17} strokeWidth={2.4} /></span>
            <span className="pv-etiqueta">Precio medio</span>
            <b>{usd(r.precioMedio, 0)}</b>
            <small>
              {vsMedio === null ? "sin precio de mercado" : (
                <span className={`pv-signo ${vsMedio >= 0 ? "es-sube" : "es-baja"}`}>
                  hoy {pct(vsMedio)} {vsMedio >= 0 ? "por encima" : "por debajo"}
                </span>
              )}
            </small>
          </div>
          <div className="pv-dato pv-dato--cielo">
            <span className="pv-dato-ic" aria-hidden="true"><CalendarClock size={17} strokeWidth={2.4} /></span>
            <span className="pv-etiqueta">Ritmo</span>
            <b>{dias === null ? "—" : dias === 1 ? "A diario" : `Cada ${dias} días`}</b>
            <small>{usd(importeMedio, 0)} por compra, de media</small>
          </div>
        </div>
      </section>

      {/* ── El gráfico ── */}
      <DcaGrafico
        compras={r.compras}
        precioMedio={r.precioMedio}
        precioActual={hayPrecio ? r.precioActual : null}
      />

      {/* ── La proyección, separada y etiquetada ── */}
      <aside className="pv-proyeccion" aria-label="Proyección hipotética">
        <span className="pv-proyeccion-ic" aria-hidden="true"><Target size={20} strokeWidth={2.4} /></span>
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
            Es un supuesto para ver la escala, <strong>no una previsión ni un objetivo
            alcanzable</strong>. Nadie sabe a cuánto estará Bitcoin, y podría no llegar nunca.
          </p>
        </div>
      </aside>

      {/* ── El histórico ── */}
      <section className="pv-posiciones pv-compras" aria-labelledby="pv-compras-titulo">
        <header className="pv-bloque-cab">
          <div>
            <span className="pv-etiqueta">Una línea por aportación</span>
            <h2 id="pv-compras-titulo" className="pv-h2">Todas las compras</h2>
          </div>
          {isAdmin && (
            <Tecla
              color="menta"
              onClick={() => abrir({ ...VACIO, fecha: new Date().toISOString().slice(0, 10) })}
            >
              <Plus size={17} strokeWidth={2.8} aria-hidden="true" /> Añadir compra
            </Tecla>
          )}
        </header>

        {borrarError && (
          <div className="pv-aviso pv-aviso--coral" role="alert">
            <span className="pv-aviso-ic" aria-hidden="true"><X size={18} strokeWidth={3} /></span>
            <span><b>No se pudo borrar</b>{borrarError}</span>
          </div>
        )}

        {abierto && (
          <div className="pv-form" id="pv-form-dca">
            <h3 className="pv-form-titulo">{form.id ? "Editar compra" : "Nueva compra"}</h3>
            <div className="pv-form-rejilla pv-form-rejilla--tres">
              <label className="pv-campo">
                <span className="pv-campo-etq">Fecha</span>
                <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </label>
              <label className="pv-campo">
                <span className="pv-campo-etq">Importe ($)</span>
                <input type="number" inputMode="decimal" step="0.01" placeholder="100" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} />
              </label>
              <label className="pv-campo">
                <span className="pv-campo-etq">Precio de BTC ($)</span>
                <input type="number" inputMode="decimal" step="0.01" placeholder="78414" value={form.precio_btc} onChange={(e) => setForm({ ...form, precio_btc: e.target.value })} />
              </label>
            </div>
            {form.importe && form.precio_btc && Number(form.precio_btc) > 0 && (
              <p className="pv-form-previo">
                Serían <strong>{(Number(form.importe) / Number(form.precio_btc)).toFixed(8)} BTC</strong>.
              </p>
            )}
            {error && (
              <div className="pv-aviso pv-aviso--coral" role="alert">
                <span className="pv-aviso-ic" aria-hidden="true"><X size={18} strokeWidth={3} /></span>
                <span><b>No se pudo guardar</b>{error}</span>
              </div>
            )}
            <div className="pv-form-acciones">
              <Tecla color="menta" onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando…" : <><Check size={17} strokeWidth={2.8} aria-hidden="true" /> Guardar</>}
              </Tecla>
              <Tecla color="blanca" onClick={cerrar}>
                <X size={17} strokeWidth={2.8} aria-hidden="true" /> Cancelar
              </Tecla>
            </div>
          </div>
        )}

        <div className={`pv-libreta pv-libreta--dca${isAdmin ? " con-admin" : ""}`}>
          <div className="pv-fila pv-fila--cab" aria-hidden="true">
            <span>Fecha</span>
            <span>Importe</span>
            <span>Precio BTC</span>
            <span>BTC</span>
            <span>Rentabilidad</span>
            {isAdmin && <span />}
          </div>

          <ul className="pv-filas">
            {enPantalla.map((c) => (
              <li key={c.id} className="pv-fila">
                <span className="pv-c pv-c-fecha">
                  <span
                    className={`pv-fecha-punto${hayPrecio ? (c.ganancia >= 0 ? " es-sube" : " es-baja") : ""}`}
                    aria-hidden="true"
                  />
                  {fechaCorta(c.fecha)}
                </span>
                <span className="pv-c pv-c-importe">
                  <small className="pv-c-etq">Importe</small>
                  <span className="es-fuerte">{usd(c.importe)}</span>
                </span>
                <span className="pv-c pv-c-precio">
                  <small className="pv-c-etq">Precio BTC</small>
                  <span className="es-tenue">{usd(c.precio_btc, 0)}</span>
                </span>
                <span className="pv-c pv-c-btc">
                  <small className="pv-c-etq">BTC</small>
                  <span className="pv-btc">{c.btc.toFixed(8)}</span>
                </span>
                <span className="pv-c pv-c-rent">
                  <small className="pv-c-etq">Rentabilidad</small>
                  {hayPrecio ? (
                    <span className={`pv-chip-signo ${c.ganancia >= 0 ? "es-sube" : "es-baja"}`}>{pct(c.rentabilidadPct)}</span>
                  ) : <span>—</span>}
                </span>
                {isAdmin && (
                  <span className="pv-c-acciones">
                    <Tecla
                      color="blanca"
                      tamano="peq"
                      icono
                      aria-label={`Editar la compra del ${fechaCorta(c.fecha)}`}
                      onClick={() => abrir({ id: c.id, fecha: c.fecha, importe: String(c.importe), precio_btc: String(c.precio_btc), notas: c.notas ?? "" })}
                    >
                      <Pencil size={16} strokeWidth={2.5} aria-hidden="true" />
                    </Tecla>
                    <Tecla color="coral" tamano="peq" icono aria-label={`Borrar la compra del ${fechaCorta(c.fecha)}`} onClick={() => borrar(c.id)}>
                      <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
                    </Tecla>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {totalPaginas > 1 && (
          <nav className="pv-paginacion" aria-label="Páginas de compras">
            <Tecla
              color="blanca"
              tamano="peq"
              icono
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={actual === 1}
              aria-label="Compras más recientes"
            >
              <ChevronLeft size={20} strokeWidth={2.8} aria-hidden="true" />
            </Tecla>

            <span>
              Compras {(actual - 1) * POR_PAGINA + 1}–{Math.min(actual * POR_PAGINA, ordenadas.length)}
              {" "}de {ordenadas.length}
            </span>

            <Tecla
              color="blanca"
              tamano="peq"
              icono
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={actual === totalPaginas}
              aria-label="Compras más antiguas"
            >
              <ChevronRight size={20} strokeWidth={2.8} aria-hidden="true" />
            </Tecla>
          </nav>
        )}
      </section>

      <p className="pv-pie">
        Importes en dólares. El precio de Bitcoin viene de CoinGecko y se actualiza cada cinco minutos.
      </p>
    </div>
  );
}
