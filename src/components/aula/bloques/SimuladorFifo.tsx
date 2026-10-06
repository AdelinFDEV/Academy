"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Marco, formatear } from "./comun";

/**
 * Simulador FIFO: se venden primero las unidades que se compraron primero.
 * El alumno elige cuánto vende y a qué precio, y ve qué lotes se consumen
 * —la barra de cada lote se vacía— y la ganancia que sale.
 *
 * Las comisiones, si las hay, suman al coste de la compra y restan del valor
 * de la venta, que es como se computan.
 *
 * datos: {
 *   titulo, activo: "BTC",
 *   compras: [{ fecha: "Mar 2021", cantidad: 0.5, precio: 45000, comision?: 20 }, …],
 *   venta: { cantidad: 0.7, precio: 60000, comision?: 30 }
 * }
 */

export interface DatosFifo {
  titulo: string;
  activo: string;
  compras: { fecha: string; cantidad: number; precio: number; comision?: number }[];
  venta: { cantidad: number; precio: number; comision?: number };
}

export function validarFifo(d: unknown): d is DatosFifo {
  const x = d as DatosFifo;
  return !!x && typeof x.activo === "string" && Array.isArray(x.compras) && x.compras.length > 0 && !!x.venta
    && x.compras.every((c) => c.cantidad > 0 && c.precio > 0);
}

export default function SimuladorFifo({ datos }: { datos: DatosFifo }) {
  const totalComprado = datos.compras.reduce((s, c) => s + c.cantidad, 0);
  const [cantidad, setCantidad] = useState(Math.min(datos.venta.cantidad, totalComprado));
  const [precio, setPrecio] = useState(datos.venta.precio);

  const calculo = useMemo(() => {
    let queda = cantidad;
    const lotes = datos.compras.map((c) => {
      const usada = Math.max(0, Math.min(c.cantidad, queda));
      queda -= usada;
      // La comisión de la compra se reparte en proporción a lo que se vende del lote.
      const coste = usada * c.precio + (c.comision ?? 0) * (usada / c.cantidad);
      return { ...c, usada, coste };
    });
    const coste = lotes.reduce((s, l) => s + l.coste, 0);
    const venta = cantidad * precio - (cantidad > 0 ? datos.venta.comision ?? 0 : 0);
    return { lotes, coste, venta, resultado: venta - coste };
  }, [cantidad, precio, datos]);

  const r = Math.round(calculo.resultado * 100) / 100;

  return (
    <Marco clase="calculadora" titulo={datos.titulo} subtitulo="Cambia cuánto vendes y a qué precio: los lotes se consumen del más antiguo al más nuevo.">
      <div className="aula-fifo-campos">
        <label className="aula-calc-campo">
          <span>Vendes ({datos.activo})</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={totalComprado}
            step="any"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(0, Math.min(totalComprado, Number(e.target.value) || 0)))}
          />
        </label>
        <label className="aula-calc-campo">
          <span>A (€ por {datos.activo})</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={precio}
            onChange={(e) => setPrecio(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
      </div>

      <ol className="aula-fifo-lotes">
        {calculo.lotes.map((l, i) => {
          const pct = (l.usada / l.cantidad) * 100;
          return (
            <li key={i} className={l.usada > 0 ? "is-usado" : undefined}>
              <div className="aula-fifo-lote-cab">
                <span className="aula-fifo-lote-num">Lote {i + 1}</span>
                <span>{l.fecha}</span>
                <span>{formatear(l.cantidad)} {datos.activo} a {formatear(l.precio, "eur")}</span>
              </div>
              <div className="aula-fifo-barra">
                <motion.span animate={{ width: `${pct}%` }} initial={false} transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
              <span className="aula-fifo-lote-pie">
                {l.usada > 0
                  ? `Se venden ${formatear(l.usada)} ${datos.activo} · coste ${formatear(Math.round(l.coste * 100) / 100, "eur")}`
                  : "No se toca"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="aula-calc-total aula-calc-total--3">
        <div><span>Valor de transmisión</span><strong>{formatear(Math.round(calculo.venta * 100) / 100, "eur")}</strong></div>
        <div><span>Valor de adquisición (FIFO)</span><strong>{formatear(Math.round(calculo.coste * 100) / 100, "eur")}</strong></div>
        <div className={r >= 0 ? "is-ganancia" : "is-perdida"}>
          <span>{r >= 0 ? "Ganancia patrimonial" : "Pérdida patrimonial"}</span>
          <strong>{formatear(r, "eur")}</strong>
        </div>
      </div>
    </Marco>
  );
}
