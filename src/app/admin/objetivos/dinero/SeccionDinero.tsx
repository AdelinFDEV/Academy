"use client";

import Link from "next/link";
import { RANGOS, type DatosPremium, type Punto, type Rango } from "@/lib/crecimiento";
import type { Movimiento } from "@/lib/objetivos";
import type { DineroMes } from "@/lib/objetivosServidor";
import { GraficaBarras, GraficaLinea } from "../crecimiento/Graficas";
import TuDinero from "./TuDinero";
import Finanzas from "./Finanzas";
import { fechaCorta, nombreMes } from "../editor";
import { formatoES } from "@/lib/objetivos";

/**
 * Pestaña Dinero: todo lo que ganas y gastas, en un sitio. Antes vivía
 * repartido por Crecimiento, con tres gráficas de ingresos por mes; ahora:
 *
 * 1. Tu dinero — el total, el récord, la media y de dónde viene cada euro.
 * 2. Ganancias y gastos — lo que entra frente a lo que sale, y el beneficio.
 * 3. Premium — suscripciones (lo que se va a cobrar) y lo cobrado por Stripe.
 *
 * El periodo solo afecta a Premium; lo demás va por meses.
 */

function euros(n: number): string {
  return formatoES(n, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/** El precio con sus céntimos: «49,99 €», no «50 €». */
function precio(n: number): string {
  return formatoES(n, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const aPuntos = (puntos: Punto[]) => puntos.map((p) => ({ etiqueta: fechaCorta(p.fecha), valor: p.valor }));

export default function SeccionDinero({ premium: d, rango, dineroMeses, finanzas }: {
  premium: DatosPremium;
  rango: Rango;
  dineroMeses: DineroMes[];
  finanzas: { movimientos: Movimiento[]; falta: boolean };
}) {
  const renuevan = d.activos - d.cancelan;
  return (
    <>
      <div className="obj-barra-seccion">
        <div>
          <h2 className="obj-titulo-seccion">💶 Dinero</h2>
          <p className="obj-sub-seccion">
            Lo que ganas, lo que gastas y lo que te deja. Premium llega solo desde Stripe; lo demás, del cierre de cada día y de lo que apuntas aquí.
          </p>
        </div>
      </div>

      <TuDinero meses={dineroMeses} hoy={d.hoy} />

      <Finanzas hoy={d.hoy} dineroMeses={dineroMeses} movimientos={finanzas.movimientos} falta={finanzas.falta} />

      <section className="crec-bloque crec-bloque--dinero">
        <div className="obj-barra-seccion">
          <h3 className="crec-bloque-titulo"><span aria-hidden="true">👑</span> Premium · suscripciones y lo cobrado</h3>
          <nav className="crec-rangos" aria-label="Periodo de Premium">
            {(Object.keys(RANGOS) as Rango[]).map((r) => (
              <Link
                key={r}
                href={`/admin/objetivos/dinero${r !== "30" ? `?rango=${r}` : ""}`}
                className={`crec-rango${r === rango ? " crec-rango--activo" : ""}`}
                aria-current={r === rango ? "page" : undefined}
                scroll={false}
              >
                {RANGOS[r]}
              </Link>
            ))}
          </nav>
        </div>
        <div className="obj-tiles crec-tiles--dinero">
          <div className="obj-tile obj-tile--destacado">
            <span className="obj-tile-emoji" aria-hidden="true">💰</span>
            <span className="cp-card-label">Ingreso mensual (MRR)</span>
            <strong className="cp-card-value">{euros(d.mrr)}</strong>
            <span className="cp-card-foot">
              {renuevan} suscripci{renuevan === 1 ? "ón" : "ones"} que renuevan × {precio(d.precio)}
            </span>
          </div>
          <div className="obj-tile">
            <span className="obj-tile-emoji" aria-hidden="true">👑</span>
            <span className="cp-card-label">Premium activos</span>
            <strong className="cp-card-value">{d.activos}</strong>
            <span className="cp-card-foot">{d.cancelan ? `${d.cancelan} ya han cancelado` : "ninguno ha cancelado"}</span>
          </div>
          <div className="obj-tile">
            <span className="obj-tile-emoji" aria-hidden="true">📅</span>
            <span className="cp-card-label">Cobrado en el periodo</span>
            <strong className="cp-card-value">{euros(d.ingresosRango)}</strong>
            <span className="cp-card-foot">
              {RANGOS[rango].toLowerCase()}
              {d.descuentosRango > 0 && ` · ${euros(d.ingresosRango - d.descuentosRango)} tras comisiones y devoluciones`}
            </span>
          </div>
          <div className="obj-tile">
            <span className="obj-tile-emoji" aria-hidden="true">🏦</span>
            <span className="cp-card-label">Cobrado en total</span>
            <strong className="cp-card-value">{euros(d.ingresosTotales)}</strong>
            <span className="cp-card-foot">según Stripe, desde el primer cobro</span>
          </div>
        </div>

        <div className="obj-graficas-fila">
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">Cobrado por Stripe cada mes</figcaption>
            <GraficaBarras
              puntos={d.porMes.map((m) => ({ etiqueta: nombreMes(m.mes, true), valor: m.valor }))}
              euros
              vacio="Todavía no hay cobros de Premium. En cuanto entre el primero, aquí verás mes a mes lo que deja."
              tono="dinero"
            />
          </figure>
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">Premium activos</figcaption>
            <GraficaLinea
              puntos={d.activosPorDia.some((p) => p.valor > 0) ? aPuntos(d.activosPorDia) : []}
              vacio="Todavía no hay ningún Premium de pago. Con el primero, aquí verás cómo crece."
              tono="dinero"
            />
          </figure>
        </div>
      </section>

      <p className="obj-truco">
        ℹ️ Lo <strong>cobrado</strong> es dinero real: cada cobro de Stripe, en bruto, con sus comisiones y devoluciones como
        gastos. El <strong>MRR</strong> y los activos miran hacia delante: las suscripciones de hoy por {precio(d.precio)}.
        Los administradores no cuentan. Los impuestos no se descuentan en ningún sitio.
      </p>
    </>
  );
}
