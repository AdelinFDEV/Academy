"use client";

import { useState } from "react";

/**
 * Lo que cuesta usar Solana, con los dos conceptos del texto: la comisión base
 * por operación y el depósito de cada cuenta de token que se abre. El precio
 * de SOL lo pone el lector: aquí no se consulta ninguna cotización.
 */
const COMISION = 0.000005; // SOL por firma
const DEPOSITO = 0.00203928; // SOL retenidos por cada cuenta de token

const num = (n: number, dec: number) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function GuideSolanaCostes() {
  const [operaciones, setOperaciones] = useState(100);
  const [monedas, setMonedas] = useState(3);
  const [precio, setPrecio] = useState("150");

  const p = Math.min(Math.max(Number(precio.replace(",", ".")) || 0, 0), 100_000);
  const comisiones = operaciones * COMISION;
  const depositos = monedas * DEPOSITO;

  return (
    <div className="sol-costes">
      <p className="sol-costes-titulo">Calculadora de costes</p>

      <div className="sol-costes-campos">
        <label htmlFor="sol-ops">
          <span>Operaciones que vas a hacer <strong>{num(operaciones, 0)}</strong></span>
          <input id="sol-ops" type="range" min={1} max={1000} step={1} value={operaciones} onChange={(e) => setOperaciones(Number(e.target.value))} />
        </label>
        <label htmlFor="sol-monedas">
          <span>Monedas distintas que vas a recibir <strong>{monedas}</strong></span>
          <input id="sol-monedas" type="range" min={0} max={20} step={1} value={monedas} onChange={(e) => setMonedas(Number(e.target.value))} />
        </label>
        <label htmlFor="sol-precio" className="sol-costes-precio">
          <span>Precio de 1 SOL, en euros</span>
          <input id="sol-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="sol-costes-filas" aria-live="polite">
        <div>
          <span>Comisiones<small>se gastan</small></span>
          <strong>{num(comisiones * p, 3)} €</strong>
          <em>{num(comisiones, 6)} SOL</em>
        </div>
        <div className="es-deposito">
          <span>Depósitos<small>se recuperan al cerrar la cuenta</small></span>
          <strong>{num(depositos * p, 2)} €</strong>
          <em>{num(depositos, 5)} SOL</em>
        </div>
      </div>
      <p className="sol-costes-nota">
        Con muchas operaciones y pocas monedas, las comisiones siguen siendo céntimos. Lo que de verdad retiene tu
        SOL son los depósitos: uno por cada moneda distinta. El precio es un ejemplo: pon el de hoy.
      </p>
    </div>
  );
}
