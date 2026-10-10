"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS_GASTO, FUENTES, GASTOS_DE_STRIPE, importeEnMes, type CategoriaGasto, type Fuente, type Movimiento, formatoES } from "@/lib/objetivos";
import type { DineroMes } from "@/lib/objetivosServidor";
import { Interruptor, Opciones, enviar, fechaCorta, nombreMes } from "../editor";
import { GraficaBeneficio, GraficaIngresosGastos } from "../crecimiento/Graficas";

/**
 * «Ganancias y gastos», sobre un solo libro de movimientos.
 *
 * - Los ingresos de cada mes salen de `dineroMeses`: todo lo ingresado, venga
 *   del cierre del día o de aquí (y los fijos de cada mes). Una sola cuenta.
 * - Los gastos, de los movimientos de tipo gasto.
 * - Aquí se apunta a mano, con concepto: un gasto o un ingreso, puntual o fijo
 *   cada mes. Lo del cierre del día se edita en el cierre, no aquí.
 */

function euros(n: number, decimales = 0): string {
  return formatoES(n, { style: "currency", currency: "EUR", maximumFractionDigits: decimales, minimumFractionDigits: decimales });
}

function mesDe(mesActual: string, salto: number): string {
  const [a, m] = mesActual.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + salto, 1)).toISOString().slice(0, 7);
}

/** Emoji y nombre de la categoría de un movimiento, sea ingreso o gasto. */
function etiquetaDe(m: Pick<Movimiento, "tipo" | "categoria">): { emoji: string; texto: string } {
  if (m.tipo === "ingreso") return FUENTES[m.categoria as Fuente] ?? { emoji: "💶", texto: "Ingreso" };
  return CATEGORIAS_GASTO[m.categoria as CategoriaGasto] ?? { emoji: "📦", texto: "Gasto" };
}

type Filtro = "todo" | "ingreso" | "gasto";

/** Filas de «Apuntado aquí» por página: la lista crece cada día y no puede estirar la página. */
const POR_PAGINA = 5;
type Props = { hoy: string; dineroMeses: DineroMes[]; movimientos: Movimiento[]; falta: boolean };

export default function Finanzas({ hoy, dineroMeses, movimientos, falta }: Props) {
  const mesActual = hoy.slice(0, 7);
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const gastos = movimientos.filter((m) => m.tipo === "gasto");

  // Los últimos 12 meses, con huecos a cero.
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = mesDe(mesActual, i - 11);
    const ingresos = dineroMeses.find((d) => d.mes === mes)?.total ?? 0;
    const gasto = gastos.reduce((s, g) => s + importeEnMes(g, mes), 0);
    return { mes, etiqueta: nombreMes(mes, true), ingresos, gastos: Math.round(gasto * 100) / 100 };
  });
  const este = meses[meses.length - 1];
  const anterior = meses[meses.length - 2];
  const beneficio = este.ingresos - este.gastos;
  const beneficioAnt = anterior.ingresos - anterior.gastos;
  const margen = este.ingresos > 0 ? Math.round((beneficio / este.ingresos) * 100) : null;

  // En lo que va de año.
  const delAno = meses.filter((m) => m.mes.startsWith(hoy.slice(0, 4)));
  const ingresosAno = delAno.reduce((s, m) => s + m.ingresos, 0);
  const gastosAno = delAno.reduce((s, m) => s + m.gastos, 0);

  // Dónde se va el dinero este mes.
  const porCategoria = (Object.keys(CATEGORIAS_GASTO) as CategoriaGasto[])
    .map((c) => ({ c, total: gastos.filter((g) => g.categoria === c).reduce((s, g) => s + importeEnMes(g, mesActual), 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
  const fijosMes = gastos.filter((g) => g.recurrente).reduce((s, g) => s + importeEnMes(g, mesActual), 0);
  const ingresosFijosMes = movimientos.filter((m) => m.tipo === "ingreso" && m.recurrente).reduce((s, m) => s + importeEnMes(m, mesActual), 0);

  // Lo apuntado aquí (lo del cierre del día se ve y se edita en el cierre).
  const apuntados = movimientos.filter((m) => m.origen === "manual" && (filtro === "todo" || m.tipo === filtro));
  const paginas = Math.max(1, Math.ceil(apuntados.length / POR_PAGINA));
  // Si se borra la última fila de la última página, se queda en la que aún existe.
  const paginaVista = Math.min(pagina, paginas);
  const lista = apuntados.slice((paginaVista - 1) * POR_PAGINA, paginaVista * POR_PAGINA);

  return (
    <section className="crec-bloque fin">
      <h3 className="crec-bloque-titulo"><span aria-hidden="true">⚖️</span> Ganancias y gastos</h3>

      {falta ? (
        <p className="obj-vacio">Falta actualizar la base de datos: ejecuta <code>scripts/create-objetivos.sql</code> en el SQL Editor de Supabase.</p>
      ) : (
        <>
          <div className="fin-cifras">
            <div className="fin-cifra">
              <span>Ingresos · {nombreMes(mesActual, true)}</span>
              <strong className="fin-pos">{euros(este.ingresos)}</strong>
              <small>{ingresosFijosMes > 0 ? `${euros(ingresosFijosMes)} son fijos cada mes` : `En el año: ${euros(ingresosAno)}`}</small>
            </div>
            <div className="fin-cifra">
              <span>Gastos · {nombreMes(mesActual, true)}</span>
              <strong className="fin-neg">{euros(este.gastos)}</strong>
              <small>{fijosMes > 0 ? `${euros(fijosMes)} son fijos cada mes` : `En el año: ${euros(gastosAno)}`}</small>
            </div>
            <div className={`fin-cifra fin-cifra--resultado ${beneficio >= 0 ? "fin-cifra--gana" : "fin-cifra--pierde"}`}>
              <span>{beneficio >= 0 ? "Beneficio" : "Pérdida"} · {nombreMes(mesActual, true)}</span>
              <strong>{beneficio >= 0 ? "+" : ""}{euros(beneficio)}</strong>
              <small>
                {anterior.ingresos || anterior.gastos
                  ? `${nombreMes(anterior.mes, true)}: ${beneficioAnt >= 0 ? "+" : ""}${euros(beneficioAnt)}`
                  : "Sin datos del mes anterior"}
              </small>
            </div>
            <div className="fin-cifra">
              <span>Margen</span>
              <strong>{margen === null ? "—" : `${margen} %`}</strong>
              <small>En el año: {ingresosAno > 0 ? `${Math.round(((ingresosAno - gastosAno) / ingresosAno) * 100)} %` : "—"} · {euros(ingresosAno - gastosAno)}</small>
            </div>
          </div>

          <div className="obj-graficas-fila">
            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Ingresos frente a gastos · últimos 12 meses</figcaption>
              <GraficaIngresosGastos meses={meses} />
            </figure>
            <figure className="obj-grafica">
              <figcaption className="obj-grafica-titulo">Beneficio o pérdida de cada mes</figcaption>
              <GraficaBeneficio meses={meses.map((m) => ({ etiqueta: m.etiqueta, valor: Math.round((m.ingresos - m.gastos) * 100) / 100 }))} />
            </figure>
          </div>

          <div className="fin-abajo">
            <NuevoMovimiento hoy={hoy} />

            <div className="fin-lista-bloque">
              {porCategoria.length > 0 && (
                <div className="fin-categorias">
                  <span className="fin-subtitulo">En qué se va este mes</span>
                  {porCategoria.map((x) => (
                    <div key={x.c} className="fin-categoria">
                      <span>{CATEGORIAS_GASTO[x.c].emoji} {CATEGORIAS_GASTO[x.c].texto}</span>
                      <span className="fin-categoria-pista"><span style={{ width: `${(x.total / porCategoria[0].total) * 100}%` }} /></span>
                      <strong>{euros(x.total, x.total % 1 ? 2 : 0)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="fin-lista-cabeza">
                <span className="fin-subtitulo">Apuntado aquí</span>
                <div className="fin-filtro" role="radiogroup" aria-label="Filtrar movimientos">
                  {([["todo", "Todo"], ["ingreso", "Ingresos"], ["gasto", "Gastos"]] as const).map(([v, t]) => (
                    <button key={v} type="button" role="radio" aria-checked={filtro === v} className={filtro === v ? "fin-filtro--activo" : ""} onClick={() => { setFiltro(v); setPagina(1); }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {apuntados.length ? (
                <ul className="fin-lista">
                  {lista.map((m) => <FilaMovimiento key={m.id} m={m} hoy={hoy} />)}
                </ul>
              ) : (
                <p className="obj-vacio">
                  {filtro === "ingreso" ? "Ningún ingreso apuntado aquí. Lo del cierre del día ya cuenta solo." : filtro === "gasto" ? "Aún no has apuntado ningún gasto." : "Aún no has apuntado nada aquí."}
                </p>
              )}
              {paginas > 1 && (
                <nav className="fin-paginas" aria-label="Páginas de movimientos">
                  <button type="button" onClick={() => setPagina(paginaVista - 1)} disabled={paginaVista === 1} aria-label="Página anterior">‹</button>
                  <span>{paginaVista} de {paginas} · {apuntados.length} apuntes</span>
                  <button type="button" onClick={() => setPagina(paginaVista + 1)} disabled={paginaVista === paginas} aria-label="Página siguiente">›</button>
                </nav>
              )}
              <p className="fin-nota">Los ingresos que apuntas al cerrar cada día ya cuentan solos, y Premium llega solo desde Stripe con sus comisiones: aquí apunta lo que tenga nombre propio, sin repetirlo en el cierre.</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function NuevoMovimiento({ hoy }: { hoy: string }) {
  const router = useRouter();
  const vacio = { tipo: "gasto", concepto: "", categoria: "herramientas", importe: "", fecha: hoy, recurrente: false, hasta: "" };
  const [d, setD] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const esIngreso = d.tipo === "ingreso";

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const fallo = await enviar("movimiento", null, d);
    setGuardando(false);
    if (fallo) return setError(fallo);
    setD({ ...vacio, tipo: d.tipo, categoria: d.categoria });
    router.refresh();
  }

  // Premium, sus comisiones y sus devoluciones llegan solos desde Stripe.
  const opciones = esIngreso
    ? (Object.keys(FUENTES) as Fuente[]).filter((k) => k !== "premium").map((k) => ({ valor: k, emoji: FUENTES[k].emoji, texto: FUENTES[k].texto }))
    : (Object.keys(CATEGORIAS_GASTO) as CategoriaGasto[]).filter((k) => !GASTOS_DE_STRIPE.includes(k)).map((k) => ({ valor: k, emoji: CATEGORIAS_GASTO[k].emoji, texto: CATEGORIAS_GASTO[k].texto }));

  return (
    <form className={`fin-form fin-form--${d.tipo}`} onSubmit={guardar}>
      <div className="fin-tipo" role="radiogroup" aria-label="Qué apuntas">
        <button type="button" role="radio" aria-checked={!esIngreso} className={!esIngreso ? "fin-tipo--activo" : ""} onClick={() => setD({ ...d, tipo: "gasto", categoria: "herramientas" })}>
          − Gasto
        </button>
        <button type="button" role="radio" aria-checked={esIngreso} className={esIngreso ? "fin-tipo--activo" : ""} onClick={() => setD({ ...d, tipo: "ingreso", categoria: "asesorias" })}>
          ＋ Ingreso
        </button>
      </div>
      <div className="fin-form-fila">
        <input
          className="obj-input"
          value={d.concepto}
          onChange={(e) => setD({ ...d, concepto: e.target.value })}
          placeholder={esIngreso ? "Concepto: asesoría a Juan, patrocinio…" : "Concepto: Vercel Pro, micrófono…"}
          maxLength={120}
          required
        />
        <span className="fin-importe">
          <input className="obj-input" type="number" min="0.01" step="0.01" inputMode="decimal" value={d.importe} onChange={(e) => setD({ ...d, importe: e.target.value })} placeholder="0" required />
          <span aria-hidden="true">€</span>
        </span>
      </div>
      <Opciones etiqueta="" opciones={opciones} valor={d.categoria} onCambio={(v) => setD({ ...d, categoria: v || "otros" })} />
      <div className="fin-form-fila fin-form-fila--abajo">
        <label className="fin-campo">
          <span>{d.recurrente ? "Desde" : "Fecha"}</span>
          <input className="obj-input" type="date" value={d.fecha} onChange={(e) => setD({ ...d, fecha: e.target.value })} required />
        </label>
        {d.recurrente && (
          <label className="fin-campo">
            <span>Hasta (opcional)</span>
            <input className="obj-input" type="date" value={d.hasta} min={d.fecha} onChange={(e) => setD({ ...d, hasta: e.target.value })} />
          </label>
        )}
        <Interruptor activo={d.recurrente} onCambio={(v) => setD({ ...d, recurrente: v })}>🔁 Se repite cada mes</Interruptor>
      </div>
      {error && <p className="obj-error">⚠️ {error}</p>}
      <button type="submit" className="obj-boton obj-boton--principal" disabled={guardando}>
        {guardando ? "Guardando…" : esIngreso ? "＋ Apuntar ingreso" : "− Apuntar gasto"}
      </button>
    </form>
  );
}

function FilaMovimiento({ m, hoy }: { m: Movimiento; hoy: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const activo = m.recurrente && (!m.hasta || m.hasta >= hoy);
  const etiqueta = etiquetaDe(m);

  async function cambiar(datos: Record<string, string | boolean> | null) {
    setOcupado(true);
    const fallo = await enviar("movimiento", m.id, datos);
    setOcupado(false);
    if (fallo) alert(fallo);
    else router.refresh();
  }

  return (
    <li className={`fin-fila fin-fila--${m.tipo}`}>
      <span className="fin-fila-emoji" aria-hidden="true">{etiqueta.emoji}</span>
      <span className="fin-fila-textos">
        <strong>{m.concepto ?? etiqueta.texto}</strong>
        <small>
          {/* La categoría solo si no es ya el título («Trabajo · Trabajo»). */}
          {m.concepto && m.concepto.trim().toLowerCase() !== etiqueta.texto.toLowerCase() && <>{etiqueta.texto} · </>}
          {m.recurrente ? `🔁 cada mes desde ${fechaCorta(m.fecha)}${m.hasta ? ` hasta ${fechaCorta(m.hasta)}` : ""}` : fechaCorta(m.fecha)}
        </small>
      </span>
      <span className="fin-fila-importe">
        {m.tipo === "ingreso" ? "+" : "−"}{euros(m.importe, m.importe % 1 ? 2 : 0)}{m.recurrente && <small>/mes</small>}
      </span>
      <span className="fin-fila-acciones">
        {activo && (
          <button
            type="button"
            onClick={() =>
              cambiar({ tipo: m.tipo, concepto: m.concepto ?? "", categoria: m.categoria, importe: String(m.importe), fecha: m.fecha, recurrente: true, hasta: hoy < m.fecha ? m.fecha : hoy })
            }
            disabled={ocupado}
            title="Deja de contar a partir del mes que viene"
          >
            Terminar
          </button>
        )}
        <button type="button" onClick={() => confirm(`¿Borrar «${m.concepto ?? etiqueta.texto}»?`) && cambiar(null)} disabled={ocupado} aria-label={`Borrar ${m.concepto ?? etiqueta.texto}`} title="Borrar">✕</button>
      </span>
    </li>
  );
}
