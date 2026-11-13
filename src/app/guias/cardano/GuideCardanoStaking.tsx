"use client";

import { useState } from "react";

/**
 * Calculadora de staking de la guía de Cardano. Hace una sola cuenta, la del
 * texto: ADA × rendimiento anual, y lo reparte en las 73 épocas de cinco días
 * que tiene un año. No consulta precios ni rendimientos reales: el porcentaje
 * lo elige el lector dentro del rango que da la guía.
 */
const EPOCAS_AL_ANO = 73;
const num = (n: number, dec: number) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function GuideCardanoStaking() {
  const [ada, setAda] = useState("5000");
  const [pct, setPct] = useState(2.5);

  const cantidad = Math.min(Math.max(Number(ada.replace(/\./g, "").replace(",", ".")) || 0, 0), 1_000_000_000);
  const alAno = cantidad * (pct / 100);
  const porEpoca = alAno / EPOCAS_AL_ANO;

  return (
    <div className="ada-calc">
      <p className="ada-calc-titulo">Calculadora de staking</p>

      <div className="ada-calc-campos">
        <label htmlFor="ada-cantidad">
          <span>ADA que vas a delegar</span>
          <input id="ada-cantidad" inputMode="decimal" value={ada} onChange={(e) => setAda(e.target.value)} />
        </label>
        <label htmlFor="ada-pct">
          <span>Rendimiento anual <strong>{num(pct, 1)} %</strong></span>
          <input id="ada-pct" type="range" min={1.5} max={3.5} step={0.1} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        </label>
      </div>

      <div className="ada-calc-resultados" aria-live="polite">
        <div className="es-principal">
          <span>En un año</span>
          <strong>{num(alAno, alAno < 100 ? 1 : 0)} ADA</strong>
        </div>
        <div>
          <span>Cada época (5 días)</span>
          <strong>{num(porEpoca, 2)} ADA</strong>
        </div>
        <div>
          <span>Tendrías al cabo del año</span>
          <strong>{num(cantidad + alAno, 0)} ADA</strong>
        </div>
      </div>
      <p className="ada-calc-nota">
        Es una estimación: lo que cobra cada época varía con la suerte del pool y con su comisión. El resultado
        está en ADA, no en euros.
      </p>
    </div>
  );
}
