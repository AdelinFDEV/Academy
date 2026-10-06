"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS_GASTO, gastoEnMes, type CategoriaGasto, type Gasto } from "@/lib/objetivos";
import type { DineroMes } from "@/lib/objetivosServidor";
import { Interruptor, Opciones, enviar, fechaCorta, nombreMes } from "../editor";
import { GraficaBeneficio, GraficaIngresosGastos } from "./Graficas";

/**
 * «Ganancias y gastos»: lo que entra (lo apuntado en el cierre del día, la
 * misma fuente que «Tu dinero») frente a lo que sale (los gastos de aquí),
 * mes a mes, con el beneficio o la pérdida de cada uno.
 */

function euros(n: number, decimales = 0): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: decimales, minimumFractionDigits: decimales });
}

function mesDe(mesActual: string, salto: number): string {
  const [a, m] = mesActual.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + salto, 1)).toISOString().slice(0, 7);
}

type Props = { hoy: string; dineroMeses: DineroMes[]; gastos: Gasto[]; falta: boolean };

export default function Finanzas({ hoy, dineroMeses, gastos, falta }: Props) {
  const mesActual = hoy.slice(0, 7);
  const [verTodos, setVerTodos] = useState(false);

  // Los últimos 12 meses, con huecos a cero.
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = mesDe(mesActual, i - 11);
    const ingresos = dineroMeses.find((d) => d.mes === mes)?.total ?? 0;
    const gasto = gastos.reduce((s, g) => s + gastoEnMes(g, mes), 0);
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
    .map((c) => ({ c, total: gastos.filter((g) => g.categoria === c).reduce((s, g) => s + gastoEnMes(g, mesActual), 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
  const fijos = gastos.filter((g) => g.recurrente && gastoEnMes(g, mesActual) > 0);
  const fijosMes = fijos.reduce((s, g) => s + g.importe, 0);

  const lista = verTodos ? gastos : gastos.slice(0, 8);

  return (
    <section className="crec-bloque fin">
      <h3 className="crec-bloque-titulo"><span aria-hidden="true">⚖️</span> Ganancias y gastos</h3>

      {falta ? (
        <p className="obj-vacio">Falta crear la tabla de gastos: ejecuta <code>scripts/create-objetivos.sql</code> en el SQL Editor de Supabase.</p>
      ) : (
        <>
          <div className="fin-cifras">
            <div className="fin-cifra">
              <span>Ingresos · {nombreMes(mesActual, true)}</span>
              <strong className="fin-pos">{euros(este.ingresos)}</strong>
              <small>En el año: {euros(ingresosAno)}</small>
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
            <NuevoGasto hoy={hoy} />

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

              <span className="fin-subtitulo">Gastos apuntados</span>
              {gastos.length ? (
                <ul className="fin-lista">
                  {lista.map((g) => <FilaGasto key={g.id} g={g} hoy={hoy} />)}
                </ul>
              ) : (
                <p className="obj-vacio">Aún no has apuntado ningún gasto.</p>
              )}
              {gastos.length > 8 && (
                <button type="button" className="fin-ver" onClick={() => setVerTodos((v) => !v)}>
                  {verTodos ? "Ver menos" : `Ver los ${gastos.length}`}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function NuevoGasto({ hoy }: { hoy: string }) {
  const router = useRouter();
  const vacio = { concepto: "", categoria: "herramientas", importe: "", fecha: hoy, recurrente: false, hasta: "" };
  const [d, setD] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const fallo = await enviar("gasto", null, d);
    setGuardando(false);
    if (fallo) return setError(fallo);
    setD({ ...vacio, categoria: d.categoria });
    router.refresh();
  }

  return (
    <form className="fin-form" onSubmit={guardar}>
      <span className="fin-subtitulo">Apuntar un gasto</span>
      <div className="fin-form-fila">
        <input className="obj-input" value={d.concepto} onChange={(e) => setD({ ...d, concepto: e.target.value })} placeholder="Concepto: Vercel Pro, micrófono…" maxLength={120} required />
        <span className="fin-importe">
          <input className="obj-input" type="number" min="0.01" step="0.01" inputMode="decimal" value={d.importe} onChange={(e) => setD({ ...d, importe: e.target.value })} placeholder="0" required />
          <span aria-hidden="true">€</span>
        </span>
      </div>
      <Opciones
        etiqueta=""
        opciones={(Object.keys(CATEGORIAS_GASTO) as CategoriaGasto[]).map((k) => ({ valor: k, emoji: CATEGORIAS_GASTO[k].emoji, texto: CATEGORIAS_GASTO[k].texto }))}
        valor={d.categoria}
        onCambio={(v) => setD({ ...d, categoria: v || "otros" })}
      />
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
      <button type="submit" className="obj-boton obj-boton--principal" disabled={guardando}>{guardando ? "Guardando…" : "＋ Apuntar gasto"}</button>
    </form>
  );
}

function FilaGasto({ g, hoy }: { g: Gasto; hoy: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const activo = g.recurrente && (!g.hasta || g.hasta >= hoy);

  async function cambiar(datos: Record<string, string | boolean> | null) {
    setOcupado(true);
    const fallo = await enviar("gasto", g.id, datos);
    setOcupado(false);
    if (fallo) alert(fallo);
    else router.refresh();
  }

  return (
    <li className="fin-fila">
      <span className="fin-fila-emoji" aria-hidden="true">{CATEGORIAS_GASTO[g.categoria]?.emoji ?? "📦"}</span>
      <span className="fin-fila-textos">
        <strong>{g.concepto}</strong>
        <small>
          {g.recurrente
            ? `🔁 Cada mes desde ${fechaCorta(g.fecha)}${g.hasta ? ` hasta ${fechaCorta(g.hasta)}` : ""}`
            : fechaCorta(g.fecha)}
        </small>
      </span>
      <span className="fin-fila-importe">{euros(g.importe, g.importe % 1 ? 2 : 0)}{g.recurrente && <small>/mes</small>}</span>
      <span className="fin-fila-acciones">
        {activo && (
          <button
            type="button"
            onClick={() => cambiar({ concepto: g.concepto, categoria: g.categoria, importe: String(g.importe), fecha: g.fecha, recurrente: true, hasta: hoy < g.fecha ? g.fecha : hoy })}
            disabled={ocupado}
            title="Deja de contar a partir del mes que viene"
          >
            Terminar
          </button>
        )}
        <button type="button" onClick={() => confirm(`¿Borrar «${g.concepto}»?`) && cambiar(null)} disabled={ocupado} aria-label={`Borrar ${g.concepto}`} title="Borrar">✕</button>
      </span>
    </li>
  );
}
