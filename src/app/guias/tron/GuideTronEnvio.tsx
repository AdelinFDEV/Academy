"use client";

import { useState } from "react";

/**
 * Lo que cuesta un envío de USDT por TRON cuando no se tienen recursos y la red
 * quema TRX. Las cuentas son las del recibo de la guía:
 *   energía × precio de la energía + ancho de banda × precio del ancho de banda.
 * El precio de TRX lo pone el lector: aquí no se consulta ninguna cotización.
 *
 * Los cuatro parámetros los fija la red (documentación de TRON, noviembre de
 * 2026). Al revisar la guía, se comprueban.
 */
const ENERGIA_NORMAL = 65_000;
const ENERGIA_DESTINO_NUEVO = 130_000;
const TRX_POR_ENERGIA = 0.0001;
const TRX_ANCHO_DE_BANDA = 0.345;

const num = (n: number, dec: number) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function GuideTronEnvio() {
  const [precio, setPrecio] = useState("0,30");
  const [nuevo, setNuevo] = useState(false);
  const [envios, setEnvios] = useState(4);

  const p = Math.min(Math.max(Number(precio.replace(",", ".")) || 0, 0), 1000);
  const trx = (nuevo ? ENERGIA_DESTINO_NUEVO : ENERGIA_NORMAL) * TRX_POR_ENERGIA + TRX_ANCHO_DE_BANDA;
  const euros = trx * p;

  return (
    <div className="tron-calc">
      <p className="tron-calc-titulo">Calculadora de un envío de USDT</p>

      <div className="tron-calc-campos">
        <label htmlFor="tron-precio">
          <span>Precio de 1 TRX, en euros</span>
          <input id="tron-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
        <label htmlFor="tron-envios">
          <span>Envíos al mes <strong>{envios}</strong></span>
          <input id="tron-envios" type="range" min={1} max={60} step={1} value={envios} onChange={(e) => setEnvios(Number(e.target.value))} />
        </label>
      </div>

      <label className="tron-calc-casilla">
        <input type="checkbox" checked={nuevo} onChange={(e) => setNuevo(e.target.checked)} />
        <span>La dirección de destino nunca ha tenido USDT</span>
      </label>

      <div className="tron-calc-resultados" aria-live="polite">
        <div className="es-principal">
          <span>Cada envío te cuesta</span>
          <strong>{num(euros, 2)} €</strong>
          <small>{num(trx, 2)} TRX quemados</small>
        </div>
        <div>
          <span>Al mes</span>
          <strong>{num(euros * envios, 2)} €</strong>
          <small>{num(trx * envios, 1)} TRX</small>
        </div>
        <div>
          <span>Al año</span>
          <strong>{num(euros * envios * 12, 0)} €</strong>
          <small>{num(trx * envios * 12, 0)} TRX</small>
        </div>
      </div>
      <p className="tron-calc-nota">
        Supone que no tienes energía ni ancho de banda y que la red quema TRX. Da igual que envíes 5 USDT o
        50.000: el coste es el mismo.
      </p>
    </div>
  );
}
