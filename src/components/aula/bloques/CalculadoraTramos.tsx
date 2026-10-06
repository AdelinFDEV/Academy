"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Marco, formatear } from "./comun";

/**
 * Calculadora de una escala por tramos (un impuesto progresivo): el alumno
 * mueve la cantidad y ve, tramo a tramo y animado, cuánto paga en cada uno.
 * Sirve para cualquier escala; los tramos vienen en los datos.
 *
 * datos: {
 *   titulo, etiqueta: "Ganancia del año",
 *   tramos: [{ hasta: 6000, tipo: 19 }, { hasta: 50000, tipo: 21 }, …, { hasta: null, tipo: 30 }],
 *   valorInicial: 12000, max: 400000, paso?: 500, nota?
 * }
 */

export interface DatosTramos {
  titulo: string;
  etiqueta: string;
  tramos: { hasta: number | null; tipo: number }[];
  valorInicial: number;
  max: number;
  paso?: number;
  nota?: string;
}

export function validarTramos(d: unknown): d is DatosTramos {
  const x = d as DatosTramos;
  return !!x && Array.isArray(x.tramos) && x.tramos.length > 0 && typeof x.max === "number"
    && x.tramos.every((t) => typeof t.tipo === "number" && (t.hasta === null || typeof t.hasta === "number"));
}

const COLORES = ["#4ade80", "#a3e635", "#e6b455", "#fb923c", "#f87171", "#f472b6"];

export default function CalculadoraTramos({ datos }: { datos: DatosTramos }) {
  const [valor, setValor] = useState(datos.valorInicial);

  const desglose = useMemo(() => {
    let desde = 0;
    return datos.tramos.map((t) => {
      const techo = t.hasta ?? Infinity;
      const base = Math.max(0, Math.min(valor, techo) - desde);
      const fila = { desde, hasta: t.hasta, tipo: t.tipo, base, cuota: (base * t.tipo) / 100 };
      desde = techo;
      return fila;
    });
  }, [valor, datos.tramos]);

  const cuota = desglose.reduce((s, f) => s + f.cuota, 0);
  const efectivo = valor > 0 ? (cuota / valor) * 100 : 0;

  return (
    <Marco clase="calculadora" titulo={datos.titulo}>
      <label className="aula-calc-campo">
        <span>{datos.etiqueta}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={datos.max}
          step={datos.paso ?? 100}
          value={valor}
          onChange={(e) => setValor(Math.max(0, Math.min(datos.max, Number(e.target.value) || 0)))}
        />
      </label>
      <input
        className="aula-calc-slider"
        type="range"
        min={0}
        max={datos.max}
        step={datos.paso ?? 100}
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        aria-label={datos.etiqueta}
      />

      <div className="aula-calc-barra" aria-hidden="true">
        {desglose.map((f, i) =>
          f.base > 0 ? (
            <motion.span
              key={i}
              style={{ background: COLORES[i % COLORES.length] }}
              animate={{ flexGrow: f.base }}
              initial={false}
              transition={{ type: "spring", stiffness: 160, damping: 24 }}
            />
          ) : null,
        )}
      </div>

      <table className="aula-calc-tabla">
        <thead>
          <tr><th>Tramo</th><th>Tipo</th><th>Base en el tramo</th><th>Cuota</th></tr>
        </thead>
        <tbody>
          {desglose.map((f, i) => (
            <tr key={i} className={f.base > 0 ? "is-activo" : undefined}>
              <td>
                <i style={{ background: COLORES[i % COLORES.length] }} />
                {f.hasta === null ? `Más de ${formatear(f.desde, "eur")}` : `${formatear(f.desde, "eur")} – ${formatear(f.hasta, "eur")}`}
              </td>
              <td>{formatear(f.tipo, "pct")}</td>
              <td>{formatear(f.base, "eur")}</td>
              <td>{formatear(f.cuota, "eur")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="aula-calc-total">
        <div><span>Pagas en total</span><strong>{formatear(Math.round(cuota * 100) / 100, "eur")}</strong></div>
        <div><span>Tipo efectivo</span><strong>{formatear(Math.round(efectivo * 100) / 100, "pct")}</strong></div>
      </div>
      {datos.nota && <p className="aula-bloque-nota">{datos.nota}</p>}
    </Marco>
  );
}
