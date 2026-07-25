"use client";

import { useMemo, useState } from "react";
import { BookOpen, ArrowUpRight } from "lucide-react";

interface Level {
  price: number;
  size: number; // en BTC
}

// Libro de órdenes de ejemplo para BTC-PERP (didáctico, no datos reales).
const ASKS: Level[] = [
  { price: 60005, size: 0.8 },
  { price: 60012, size: 1.5 },
  { price: 60025, size: 2.2 },
  { price: 60050, size: 3.0 },
  { price: 60090, size: 4.5 },
];
const BIDS: Level[] = [
  { price: 59995, size: 0.9 },
  { price: 59988, size: 1.6 },
  { price: 59975, size: 2.4 },
  { price: 59950, size: 3.2 },
  { price: 59910, size: 4.6 },
];

const MAX_SIZE = ASKS.reduce((s, l) => s + l.size, 0); // liquidez total de venta
const MAX_DEPTH = Math.max(...ASKS.map((l) => l.size), ...BIDS.map((l) => l.size));

const eur = (n: number) =>
  "$" + n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function GuideHyperliquidOrderBook() {
  const [size, setSize] = useState(1.2);

  const fill = useMemo(() => {
    let remaining = size;
    let cost = 0;
    let filled = 0;
    const consumed: number[] = [];
    for (const level of ASKS) {
      if (remaining <= 0.0001) {
        consumed.push(0);
        continue;
      }
      const take = Math.min(remaining, level.size);
      cost += take * level.price;
      filled += take;
      remaining -= take;
      consumed.push(take / level.size);
    }
    const bestAsk = ASKS[0].price;
    const avg = filled > 0 ? cost / filled : bestAsk;
    const slippage = ((avg - bestAsk) / bestAsk) * 100;
    return { consumed, avg, slippage, filled, partial: remaining > 0.0001, cost };
  }, [size]);

  return (
    <div className="hl-ob">
      <div className="hl-ob-head">
        <span className="hl-ob-eyebrow">
          <BookOpen size={14} /> Libro de órdenes · BTC-PERP
        </span>
        <span className="hl-ob-live">on-chain</span>
      </div>

      {/* Asks (ventas) — de mayor a menor precio, el mejor ask pegado al centro */}
      <div className="hl-ob-side">
        {ASKS.map((l, i) => i).reverse().map((i) => {
          const l = ASKS[i];
          const eaten = fill.consumed[i];
          return (
            <div key={`a${i}`} className={`hl-ob-row ask${eaten > 0 ? " is-eaten" : ""}`}>
              <span className="hl-ob-depth ask" style={{ width: `${(l.size / MAX_DEPTH) * 100}%` }} />
              {eaten > 0 && <span className="hl-ob-eat" style={{ width: `${(l.size / MAX_DEPTH) * 100 * eaten}%` }} />}
              <span className="hl-ob-price ask">{eur(l.price)}</span>
              <span className="hl-ob-size">{l.size.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {/* Spread / precio medio */}
      <div className="hl-ob-mid">
        <span>Spread</span>
        <strong>{eur(ASKS[0].price - BIDS[0].price)}</strong>
        <span>{eur((ASKS[0].price + BIDS[0].price) / 2)}</span>
      </div>

      {/* Bids (compras) */}
      <div className="hl-ob-side">
        {BIDS.map((l, i) => (
          <div key={`b${i}`} className="hl-ob-row bid">
            <span className="hl-ob-depth bid" style={{ width: `${(l.size / MAX_DEPTH) * 100}%` }} />
            <span className="hl-ob-price bid">{eur(l.price)}</span>
            <span className="hl-ob-size">{l.size.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Control: tamaño de la orden de compra a mercado */}
      <div className="hl-ob-control">
        <label className="hl-ob-control-lbl">
          Compras a mercado <strong>{size.toFixed(1)} BTC</strong> — arrastra para ver cuánta liquidez te comes
        </label>
        <input
          className="hl-ob-slider"
          type="range"
          min={0.2}
          max={MAX_SIZE}
          step={0.1}
          value={size}
          onChange={(e) => setSize(parseFloat(e.target.value))}
        />
        <div className="hl-ob-control-scale">
          <span>Orden pequeña</span>
          <span>Orden grande</span>
        </div>
      </div>

      {/* Resultado */}
      <div className="hl-ob-result">
        <div className="hl-ob-res-item">
          <span className="hl-ob-res-lbl">Precio medio de ejecución</span>
          <span className="hl-ob-res-val">{eur(fill.avg)}</span>
        </div>
        <div className="hl-ob-res-item">
          <span className="hl-ob-res-lbl">Slippage</span>
          <span className={`hl-ob-res-val ${fill.slippage > 0.05 ? "bad" : "good"}`}>
            +{fill.slippage.toFixed(3)}%
          </span>
        </div>
      </div>

      <p className="hl-ob-note">
        <ArrowUpRight size={13} />
        {fill.partial
          ? "Tu orden es tan grande que se come toda la liquidez visible: en un mercado real seguirías subiendo de precio. Cuanto más grande la orden, peor el precio medio."
          : "Cuanto más grande es tu orden, más niveles del libro tienes que 'comerte' y peor es tu precio medio. Eso es el slippage — y ocurre igual en un exchange centralizado, solo que aquí todo el libro es verificable on-chain."}
      </p>
    </div>
  );
}
