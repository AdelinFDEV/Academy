"use client";

import { useState } from "react";

/**
 * Cuánto falta para que BNB llegue a los 100 millones, según el ritmo de quema
 * que elija el lector. Una sola cuenta: (lo que queda − 100 millones) ÷ lo que
 * se quema por trimestre. No predice nada: el ritmo real cambia con el precio.
 *
 * `QUEDAN` es lo que publicó BNB Chain tras la quema del 19-10-2026. Al revisar
 * la guía, se actualiza con el último aviso.
 */
const QUEDAN = 131_512_085;
const OBJETIVO = 100_000_000;
const num = (n: number, dec = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function GuideBnbQuema() {
  const [ritmo, setRitmo] = useState(1.6);

  const sobran = QUEDAN - OBJETIVO;
  const trimestres = Math.ceil(sobran / (ritmo * 1_000_000));
  const anos = trimestres / 4;
  const hecho = ((200_000_000 - QUEDAN) / (200_000_000 - OBJETIVO)) * 100;

  return (
    <div className="bnb-quema">
      <p className="bnb-quema-titulo">Cuánto falta para los 100 millones</p>

      <div className="bnb-quema-barra" role="img" aria-label={`Quemado el ${num(hecho)} % del camino entre 200 y 100 millones`}>
        <span style={{ width: `${hecho}%` }} />
      </div>
      <div className="bnb-quema-escala">
        <span>200 M en 2017</span>
        <span>Hoy: {num(QUEDAN / 1_000_000, 1)} M</span>
        <span>Objetivo: 100 M</span>
      </div>

      <label htmlFor="bnb-ritmo" className="bnb-quema-campo">
        <span>BNB quemados cada trimestre <strong>{num(ritmo, 1)} millones</strong></span>
        <input id="bnb-ritmo" type="range" min={0.8} max={2.4} step={0.1} value={ritmo} onChange={(e) => setRitmo(Number(e.target.value))} />
      </label>

      <div className="bnb-quema-resultados" aria-live="polite">
        <div className="es-principal">
          <span>A ese ritmo se llegaría en</span>
          <strong>{num(anos, anos % 1 === 0 ? 0 : 1)} años</strong>
        </div>
        <div>
          <span>Quemas que faltan</span>
          <strong>{num(trimestres)}</strong>
        </div>
        <div>
          <span>BNB por destruir</span>
          <strong>{num(sobran / 1_000_000, 1)} M</strong>
        </div>
      </div>
      <p className="bnb-quema-nota">
        En 2026 se han quemado entre 1,4 y 1,7 millones por trimestre. La fórmula quema más monedas cuando el
        precio baja y menos cuando sube, así que el ritmo no es fijo.
      </p>
    </div>
  );
}
