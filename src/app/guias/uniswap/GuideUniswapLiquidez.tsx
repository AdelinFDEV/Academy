"use client";

import { useState } from "react";

/**
 * Lo que queda de una aportación de liquidez en un fondo de producto constante
 * (x · y = k, el de Uniswap v2 o un fondo v3 de rango completo), frente a haber
 * guardado los dos tokens en la cartera. Supone una mitad en un token volátil y
 * la otra en una stablecoin cuyo precio no cambia.
 *
 * Las cuentas son las del texto de la guía:
 *   guardado = mitad × r + mitad
 *   en el fondo = aportación × √r
 *   pérdida impermanente = 2√r / (1 + r) − 1
 * donde r es el precio final dividido entre el inicial.
 *
 * No consulta ningún precio ni ninguna comisión real: los pone el lector.
 */
const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const conSigno = (n: number, dec: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n), dec)}`;

export default function GuideUniswapLiquidez() {
  const [aportacion, setAportacion] = useState("1000");
  const [cambio, setCambio] = useState(100);
  const [comisiones, setComisiones] = useState("3");

  const v = Math.min(Math.max(Number(aportacion.replace(/\./g, "").replace(",", ".")) || 0, 0), 100_000_000);
  const c = Math.min(Math.max(Number(comisiones.replace(",", ".")) || 0, 0), 500);
  const r = 1 + cambio / 100;

  const guardado = (v / 2) * r + v / 2;
  const enFondo = v * Math.sqrt(r);
  const perdida = enFondo - guardado;
  const perdidaPct = guardado > 0 ? (perdida / guardado) * 100 : 0;
  const cobrado = (v * c) / 100;
  const balance = perdida + cobrado;
  const necesario = v > 0 ? (-perdida / v) * 100 : 0;

  return (
    <div className="uni-calc">
      <p className="uni-calc-titulo">Calculadora de pérdida impermanente</p>

      <div className="uni-calc-campos">
        <label htmlFor="uni-aportacion">
          <span>Lo que aportas, en euros</span>
          <input id="uni-aportacion" inputMode="decimal" value={aportacion} onChange={(e) => setAportacion(e.target.value)} />
        </label>
        <label htmlFor="uni-comisiones">
          <span>Comisiones cobradas, en % de lo aportado</span>
          <input id="uni-comisiones" inputMode="decimal" value={comisiones} onChange={(e) => setComisiones(e.target.value)} />
        </label>
        <label htmlFor="uni-cambio" className="uni-calc-rango">
          <span>
            Cambio de precio del token volátil <strong>{conSigno(cambio, 0)} %</strong>
          </span>
          <input id="uni-cambio" type="range" min={-90} max={400} step={5} value={cambio} onChange={(e) => setCambio(Number(e.target.value))} />
        </label>
      </div>

      <div className="uni-calc-resultados" aria-live="polite">
        <div>
          <span>Si los hubieras guardado</span>
          <strong>{num(guardado, 0)} €</strong>
        </div>
        <div>
          <span>Dentro del fondo, sin comisiones</span>
          <strong>{num(enFondo, 0)} €</strong>
        </div>
        <div className="es-perdida">
          <span>Pérdida impermanente</span>
          <strong>{conSigno(perdida, 0)} €</strong>
          <small>{conSigno(perdidaPct, 2)} % frente a guardarlos</small>
        </div>
        <div className={balance >= 0 ? "es-principal es-positivo" : "es-principal es-negativo"}>
          <span>Con las comisiones, frente a guardarlos</span>
          <strong>{conSigno(balance, 0)} €</strong>
          <small>Ganas {num(cobrado, 0)} € en comisiones</small>
        </div>
      </div>

      <p className="uni-calc-nota">
        {necesario < 0.005
          ? "Con el precio donde empezó no hay pérdida impermanente: todo lo que cobras en comisiones es ventaja."
          : `Para igualar a quien se quedó quieto, las comisiones tienen que sumar al menos un ${num(necesario, 2)} % de lo que aportaste.`}{" "}
        Supone un fondo de rango completo, con la mitad en una stablecoin. En un rango concentrado la pérdida es mayor.
      </p>
    </div>
  );
}
