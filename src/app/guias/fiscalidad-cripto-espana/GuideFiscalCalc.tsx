"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

/** Escala estatal de la base liquidable del ahorro vigente desde el 1 de enero de 2025 (Ley 7/2024). */
const BRACKETS = [
  { from: 0, to: 6000, rate: 0.19, color: "#5fd39a" },
  { from: 6000, to: 50000, rate: 0.21, color: "#e6b455" },
  { from: 50000, to: 200000, rate: 0.23, color: "#ff9f43" },
  { from: 200000, to: 300000, rate: 0.27, color: "#ff6b2b" },
  { from: 300000, to: Infinity, rate: 0.30, color: "#f87171" },
];

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const eur2 = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

const PRESETS = [3000, 12000, 45000, 120000, 350000];

export default function GuideFiscalCalc() {
  const [gain, setGain] = useState(12000);

  const calc = useMemo(() => {
    const rows = BRACKETS.map((b) => {
      const amount = Math.max(0, Math.min(gain, b.to) - b.from);
      return { ...b, amount, tax: amount * b.rate };
    }).filter((r) => r.amount > 0);
    const total = rows.reduce((a, r) => a + r.tax, 0);
    const effective = gain > 0 ? (total / gain) * 100 : 0;
    const marginal = rows.length ? rows[rows.length - 1].rate * 100 : 19;
    return { rows, total, effective, marginal, net: gain - total };
  }, [gain]);

  return (
    <div className="fisc-calc">
      <div className="fisc-sim-head">
        <Calculator size={18} />
        <div>
          <div className="fisc-sim-title">Calculadora de la base del ahorro</div>
          <div className="fisc-sim-sub">
            Introduce tu ganancia neta del año y mira cómo se reparte por tramos.
            Escala estatal vigente desde 2025.
          </div>
        </div>
      </div>

      <div className="fisc-calc-input-wrap">
        <label className="fisc-control">
          <span className="fisc-control-lbl">
            Ganancia patrimonial neta del ejercicio <strong>{eur(gain)}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={400000}
            step={500}
            value={gain}
            onChange={(e) => setGain(parseFloat(e.target.value))}
            className="fisc-range"
            aria-label="Ganancia patrimonial neta"
          />
        </label>
        <div className="fisc-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`fisc-preset ${gain === p ? "is-active" : ""}`}
              onClick={() => setGain(p)}
              type="button"
            >
              {eur(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Barra por tramos */}
      <div className="fisc-calc-bar" aria-hidden="true">
        {calc.rows.map((r) => (
          <motion.div
            key={r.from}
            className="fisc-calc-seg"
            style={{ background: r.color }}
            initial={false}
            animate={{ flexGrow: r.amount }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            title={`${(r.rate * 100).toFixed(0)}%`}
          />
        ))}
      </div>

      {/* Desglose */}
      <div className="fisc-calc-rows">
        {calc.rows.map((r) => (
          <div key={r.from} className="fisc-calc-row">
            <span className="fisc-calc-dot" style={{ background: r.color }} aria-hidden="true" />
            <span className="fisc-calc-range">
              {r.to === Infinity ? `Más de ${eur(r.from)}` : `${eur(r.from)} – ${eur(r.to)}`}
            </span>
            <span className="fisc-calc-rate">{(r.rate * 100).toFixed(0)}%</span>
            <span className="fisc-calc-amount">{eur2(r.amount)}</span>
            <span className="fisc-calc-tax">{eur2(r.tax)}</span>
          </div>
        ))}
      </div>

      <div className="fisc-calc-totals">
        <div className="fisc-calc-total">
          <span className="fisc-calc-total-lbl">Impuesto total</span>
          <span className="fisc-calc-total-val fisc-calc-total-val--tax">{eur2(calc.total)}</span>
        </div>
        <div className="fisc-calc-total">
          <span className="fisc-calc-total-lbl">Te quedas con</span>
          <span className="fisc-calc-total-val">{eur2(calc.net)}</span>
        </div>
        <div className="fisc-calc-total">
          <span className="fisc-calc-total-lbl">Tipo efectivo</span>
          <span className="fisc-calc-total-val">{calc.effective.toFixed(1).replace(".", ",")}%</span>
        </div>
        <div className="fisc-calc-total">
          <span className="fisc-calc-total-lbl">Tipo marginal</span>
          <span className="fisc-calc-total-val">{calc.marginal.toFixed(0)}%</span>
        </div>
      </div>

      <div className="fisc-calc-note">
        <strong>Fíjate en la diferencia entre el tipo marginal y el efectivo.</strong> Mucha gente cree que
        si entra en el tramo del 30% paga el 30% de todo — y es falso. Cada tramo se aplica solo a la parte
        de ganancia que cae dentro de él. Con {eur(gain)} de ganancia, tu último euro tributa al{" "}
        {calc.marginal.toFixed(0)}%, pero de media pagas el {calc.effective.toFixed(1).replace(".", ",")}%.
      </div>

      <p className="fisc-sim-foot">
        Cálculo orientativo sobre la escala estatal. El tipo final puede variar según tu comunidad autónoma
        y el resto de rentas del ahorro (dividendos, intereses, staking) que integren la misma base.
      </p>
    </div>
  );
}
