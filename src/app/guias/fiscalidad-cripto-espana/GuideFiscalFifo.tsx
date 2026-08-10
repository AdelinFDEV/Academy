"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";

/** Lotes de compra de ejemplo — ordenados del más antiguo al más reciente. */
const LOTS = [
  { id: 1, date: "Ene 2023", qty: 0.20, price: 18000 },
  { id: 2, date: "Nov 2023", qty: 0.15, price: 32000 },
  { id: 3, date: "Mar 2024", qty: 0.10, price: 55000 },
  { id: 4, date: "Dic 2024", qty: 0.05, price: 88000 },
];

const TOTAL_QTY = LOTS.reduce((a, l) => a + l.qty, 0);

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const eur2 = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
const btc = (n: number) => `${n.toFixed(3).replace(".", ",")} BTC`;

export default function GuideFiscalFifo() {
  const [sellQty, setSellQty] = useState(0.30);
  const [sellPrice, setSellPrice] = useState(95000);

  const calc = useMemo(() => {
    // Consumo FIFO: se gastan primero los lotes más antiguos.
    let remaining = sellQty;
    const consumed: { lot: typeof LOTS[number]; used: number; cost: number }[] = [];
    for (const lot of LOTS) {
      if (remaining <= 0.0000001) break;
      const used = Math.min(lot.qty, remaining);
      consumed.push({ lot, used, cost: used * lot.price });
      remaining -= used;
    }
    const costFifo = consumed.reduce((a, c) => a + c.cost, 0);
    const proceeds = sellQty * sellPrice;
    const gainFifo = proceeds - costFifo;

    // Contrafactual: si pudieras elegir los lotes MÁS CAROS (no está permitido).
    let rem2 = sellQty;
    let costExpensive = 0;
    for (const lot of [...LOTS].sort((a, b) => b.price - a.price)) {
      if (rem2 <= 0.0000001) break;
      const used = Math.min(lot.qty, rem2);
      costExpensive += used * lot.price;
      rem2 -= used;
    }
    const gainExpensive = proceeds - costExpensive;

    return { consumed, costFifo, proceeds, gainFifo, gainExpensive };
  }, [sellQty, sellPrice]);

  const diff = calc.gainFifo - calc.gainExpensive;

  return (
    <div className="fisc-sim">
      <div className="fisc-sim-head">
        <Layers size={18} />
        <div>
          <div className="fisc-sim-title">Simulador FIFO</div>
          <div className="fisc-sim-sub">
            Cartera de ejemplo: {btc(TOTAL_QTY)} comprados en cuatro momentos distintos.
            Mueve los controles y mira qué lotes consume Hacienda.
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="fisc-controls">
        <label className="fisc-control">
          <span className="fisc-control-lbl">
            Cantidad que vendes <strong>{btc(sellQty)}</strong>
          </span>
          {/* El slider trabaja en centésimas de BTC: con pasos decimales,
              el redondeo de coma flotante impide alcanzar el máximo exacto. */}
          <input
            type="range"
            min={1}
            max={Math.round(TOTAL_QTY * 100)}
            step={1}
            value={Math.round(sellQty * 100)}
            onChange={(e) => setSellQty(parseInt(e.target.value, 10) / 100)}
            className="fisc-range"
            aria-label="Cantidad de BTC que vendes"
          />
        </label>
        <label className="fisc-control">
          <span className="fisc-control-lbl">
            Precio de venta <strong>{eur(sellPrice)}</strong> / BTC
          </span>
          <input
            type="range"
            min={20000}
            max={150000}
            step={1000}
            value={sellPrice}
            onChange={(e) => setSellPrice(parseFloat(e.target.value))}
            className="fisc-range"
            aria-label="Precio de venta por BTC"
          />
        </label>
      </div>

      {/* Lotes */}
      <div className="fisc-lots">
        {LOTS.map((lot) => {
          const hit = calc.consumed.find((c) => c.lot.id === lot.id);
          const usedPct = hit ? (hit.used / lot.qty) * 100 : 0;
          const full = usedPct >= 99.9;
          return (
            <div key={lot.id} className={`fisc-lot ${hit ? "is-used" : ""} ${full ? "is-full" : ""}`}>
              <div className="fisc-lot-bar" aria-hidden="true">
                <motion.div
                  className="fisc-lot-fill"
                  initial={false}
                  animate={{ width: `${usedPct}%` }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="fisc-lot-body">
                <div className="fisc-lot-top">
                  <span className="fisc-lot-date">{lot.date}</span>
                  {full ? (
                    <span className="fisc-lot-tag fisc-lot-tag--full">Consumido entero</span>
                  ) : hit ? (
                    <span className="fisc-lot-tag fisc-lot-tag--part">Consumido en parte</span>
                  ) : (
                    <span className="fisc-lot-tag">Intacto</span>
                  )}
                </div>
                <div className="fisc-lot-main">
                  {btc(lot.qty)} a <strong>{eur(lot.price)}</strong>
                </div>
                {hit && (
                  <div className="fisc-lot-used">
                    Se venden {btc(hit.used)} → coste de adquisición {eur2(hit.cost)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resultado */}
      <div className="fisc-result">
        <div className="fisc-result-row">
          <span>Valor de transmisión</span>
          <strong>{eur2(calc.proceeds)}</strong>
        </div>
        <div className="fisc-result-row">
          <span>Valor de adquisición (FIFO)</span>
          <strong>− {eur2(calc.costFifo)}</strong>
        </div>
        <div className={`fisc-result-row fisc-result-row--total ${calc.gainFifo >= 0 ? "is-gain" : "is-loss"}`}>
          <span>{calc.gainFifo >= 0 ? "Ganancia patrimonial" : "Pérdida patrimonial"}</span>
          <strong>{eur2(calc.gainFifo)}</strong>
        </div>
      </div>

      {diff > 1 && (
        <div className="fisc-counter">
          <ArrowRight size={15} />
          <span>
            Si pudieras elegir los lotes más caros, tu ganancia sería de {eur2(calc.gainExpensive)} —
            es decir, <strong>{eur2(diff)} menos</strong> de base imponible. Pero no puedes:
            el FIFO es obligatorio y siempre empieza por lo más antiguo, que suele ser lo más barato.
          </span>
        </div>
      )}

      <p className="fisc-sim-foot">
        Cifras de ejemplo con fines didácticos. El resultado real depende de tus operaciones,
        de las comisiones deducibles y del resto de tu declaración.
      </p>
    </div>
  );
}
