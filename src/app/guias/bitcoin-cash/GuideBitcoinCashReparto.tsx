"use client";

import { useState } from "react";

/**
 * Lo que recibió quien tenía bitcoin el 1 de agosto de 2017, en cada una de las
 * tres divisiones, y lo que vale hoy. No consulta nada en vivo: los precios son
 * los de CoinGecko del 14-11-2026 y se revisan con la guía.
 *
 *   1 BTC  → 1 BCH            (1-8-2017)
 *   1 BCH  → 1 BSV            (15-11-2018, si seguías con el BCH)
 *   1 BCH  → 1 BCHA → 1.000.000 XEC (15-11-2020, redenominado en julio de 2021)
 */
const PRECIO_BTC = 60_558;
const PRECIO_BCH = 195.89;
const PRECIO_BSV = 13.49;
const PRECIO_XEC = 0.00000481;
const XEC_POR_BCH = 1_000_000;

const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function GuideBitcoinCashReparto() {
  const [texto, setTexto] = useState("0,5");
  const [bsv, setBsv] = useState(true);
  const [xec, setXec] = useState(true);

  const btc = Math.min(Math.max(Number(texto.replace(",", ".")) || 0, 0), 21_000_000);
  const vBtc = btc * PRECIO_BTC;
  const vBch = btc * PRECIO_BCH;
  const vBsv = bsv ? btc * PRECIO_BSV : 0;
  const vXec = xec ? btc * XEC_POR_BCH * PRECIO_XEC : 0;
  const total = vBch + vBsv + vXec;
  const pct = vBtc > 0 ? (total / vBtc) * 100 : 0;

  return (
    <div className="bch-calc">
      <p className="bch-calc-titulo">Calculadora: lo que te tocó en cada división</p>

      <label className="bch-calc-campo" htmlFor="bch-btc">
        <span>Bitcoin que tenías el 1 de agosto de 2017</span>
        <input id="bch-btc" inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>

      <label className="bch-calc-casilla">
        <input type="checkbox" checked={bsv} onChange={(e) => setBsv(e.target.checked)} />
        <span>Seguía con ese BCH el 15 de noviembre de 2018 (división de BSV)</span>
      </label>
      <label className="bch-calc-casilla">
        <input type="checkbox" checked={xec} onChange={(e) => setXec(e.target.checked)} />
        <span>Seguía con ese BCH el 15 de noviembre de 2020 (división de eCash)</span>
      </label>

      <ul className="bch-calc-filas" aria-live="polite">
        <li>
          <span>Bitcoin Cash</span>
          <strong>{num(btc, 4)} BCH</strong>
          <em>{num(vBch, 2)} €</em>
        </li>
        <li className={bsv ? "" : "is-apagada"}>
          <span>Bitcoin SV</span>
          <strong>{num(bsv ? btc : 0, 4)} BSV</strong>
          <em>{num(vBsv, 2)} €</em>
        </li>
        <li className={xec ? "" : "is-apagada"}>
          <span>eCash</span>
          <strong>{num(xec ? btc * XEC_POR_BCH : 0, 0)} XEC</strong>
          <em>{num(vXec, 2)} €</em>
        </li>
      </ul>

      <div className="bch-calc-total">
        <div>
          <span>Las tres divisiones, hoy</span>
          <strong>{num(total, 2)} €</strong>
        </div>
        <div>
          <span>Tus bitcoin, hoy</span>
          <strong>{num(vBtc, 2)} €</strong>
        </div>
        <div className="es-principal">
          <span>Lo recibido, frente a tus bitcoin</span>
          <strong>{num(pct, 2)} %</strong>
        </div>
      </div>
      <p className="bch-calc-nota">
        Precios fijos de CoinGecko del 14 de noviembre de 2026: la calculadora no los actualiza sola. Supone
        que tenías las claves o que tu exchange te abonó cada moneda, cosa que no hicieron todos.
      </p>
    </div>
  );
}
