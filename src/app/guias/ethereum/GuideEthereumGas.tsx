"use client";

import { useState } from "react";

/**
 * Calculadora de gas de la guía de Ethereum. La cuenta es la del texto:
 * comisión = gas de la operación × precio del gas. El precio del ETH lo pone
 * el lector: aquí no se consulta ninguna cotización, para que la guía no
 * enseñe un precio que ya no es verdad.
 */
const OPERACIONES = [
  { id: "eth", nombre: "Enviar ETH", gas: 21_000 },
  { id: "token", nombre: "Enviar un token", gas: 65_000 },
  { id: "swap", nombre: "Cambiar una moneda por otra", gas: 150_000 },
] as const;

const num = (n: number, dec: number) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function limpiar(texto: string, max: number): number {
  const n = Number(texto.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export default function GuideEthereumGas() {
  const [operacion, setOperacion] = useState<(typeof OPERACIONES)[number]["id"]>("eth");
  const [gwei, setGwei] = useState("5");
  const [precio, setPrecio] = useState("3000");

  const gas = OPERACIONES.find((o) => o.id === operacion)?.gas ?? 21_000;
  const enEth = (gas * limpiar(gwei, 10_000)) / 1_000_000_000;
  const enEuros = enEth * limpiar(precio, 1_000_000);

  return (
    <div className="eth-gas">
      <p className="eth-gas-titulo">Calculadora de comisiones</p>

      <div className="eth-gas-ops" role="radiogroup" aria-label="Operación">
        {OPERACIONES.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === operacion}
            className={`eth-gas-op${o.id === operacion ? " is-activa" : ""}`}
            onClick={() => setOperacion(o.id)}
          >
            {o.nombre}
            <small>{num(o.gas, 0)} de gas</small>
          </button>
        ))}
      </div>

      <div className="eth-gas-campos">
        <label htmlFor="eth-gas-gwei">
          Precio del gas, en gwei
          <input id="eth-gas-gwei" inputMode="decimal" value={gwei} onChange={(e) => setGwei(e.target.value)} />
        </label>
        <label htmlFor="eth-gas-precio">
          Precio de 1 ETH, en euros
          <input id="eth-gas-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="eth-gas-resultado" aria-live="polite">
        <span>La comisión sería de</span>
        <strong>{num(enEuros, enEuros < 1 ? 3 : 2)} €</strong>
        <small>{num(enEth, 6)} ETH · {num(gas, 0)} × {gwei || "0"} gwei</small>
      </div>
      <p className="eth-gas-nota">
        Los dos precios son de ejemplo: cámbialos por los de hoy. El gas de «token» y de «cambiar» es orientativo.
      </p>
    </div>
  );
}
