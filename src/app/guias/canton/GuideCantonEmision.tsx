"use client";

import { useState } from "react";

/**
 * Cuánto puede crecer la oferta de Canton Coin en el plazo que elija el
 * lector. Usa la curva máxima de acuñación del libro blanco MiCA de Canton
 * Coin (notificado el 09-09-2025) y la oferta circulante de CoinGecko a 14 de
 * noviembre de 2026. No consulta nada en vivo.
 *
 * Fases, en años desde el arranque del Global Synchronizer (1 de julio de
 * 2024): 0-0,5 → 40.000 M/año · 0,5-1,5 → 20.000 M · 1,5-5 → 10.000 M ·
 * 5-10 → 5.000 M · más de 10 → 2.500 M. Es un techo: lo acuñado de verdad
 * puede quedar por debajo, y los super validadores pueden cambiar la curva.
 *
 * Al revisar la guía: actualizar OFERTA_HOY y FECHA_HOY.
 */
const GENESIS = Date.UTC(2024, 6, 1);
const FECHA_HOY = Date.UTC(2026, 10, 14);
const OFERTA_HOY = 40_052; // millones de CC
const ANIO_MS = 365.25 * 24 * 3600 * 1000;

const FASES: { desde: number; hasta: number; ritmo: number }[] = [
  { desde: 0, hasta: 0.5, ritmo: 40_000 },
  { desde: 0.5, hasta: 1.5, ritmo: 20_000 },
  { desde: 1.5, hasta: 5, ritmo: 10_000 },
  { desde: 5, hasta: 10, ritmo: 5_000 },
  { desde: 10, hasta: Infinity, ritmo: 2_500 },
];

function acunacionMaxima(desdeAnio: number, hastaAnio: number): number {
  return FASES.reduce((total, f) => {
    const solape = Math.min(hastaAnio, f.hasta) - Math.max(desdeAnio, f.desde);
    return solape > 0 ? total + solape * f.ritmo : total;
  }, 0);
}

const num = (n: number, dec = 0) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const PLAZOS = [1, 2, 3, 5, 10];

export default function GuideCantonEmision() {
  const [plazo, setPlazo] = useState(3);
  const [quema, setQuema] = useState(0);

  const inicio = (FECHA_HOY - GENESIS) / ANIO_MS;
  const bruto = acunacionMaxima(inicio, inicio + plazo);
  const neto = bruto * (1 - quema / 100);
  const ofertaFinal = OFERTA_HOY + neto;
  const crecimiento = (neto / OFERTA_HOY) * 100;
  const dilucion = (1 - OFERTA_HOY / ofertaFinal) * 100;
  const anioFinal = new Date(FECHA_HOY + plazo * ANIO_MS).getUTCFullYear();

  return (
    <div className="cc-sim">
      <p className="cc-sim-titulo">Simulador de emisión de Canton Coin</p>

      <div className="cc-sim-campo">
        <span id="cc-plazo-lbl" className="cc-sim-etiqueta">Plazo desde noviembre de 2026</span>
        <div className="cc-sim-plazos" role="group" aria-labelledby="cc-plazo-lbl">
          {PLAZOS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={plazo === p}
              className={plazo === p ? "is-activo" : ""}
              onClick={() => setPlazo(p)}
            >
              {p} {p === 1 ? "año" : "años"}
            </button>
          ))}
        </div>
      </div>

      <label className="cc-sim-campo" htmlFor="cc-quema">
        <span className="cc-sim-etiqueta">
          Parte de lo acuñado que se quema por uso de la red: <strong>{quema} %</strong>
        </span>
        <input
          id="cc-quema"
          type="range"
          min={0}
          max={100}
          step={5}
          value={quema}
          onChange={(e) => setQuema(Number(e.target.value))}
        />
        <span className="cc-sim-ayuda">0 % es el peor caso para quien tiene CC; 100 % sería el equilibrio perfecto.</span>
      </label>

      <div className="cc-sim-resultados" aria-live="polite">
        <div>
          <span>Acuñación máxima hasta {anioFinal}</span>
          <strong>{num(bruto / 1000, 1)} mil M CC</strong>
          <small>Según la curva oficial</small>
        </div>
        <div>
          <span>Oferta al final</span>
          <strong>{num(ofertaFinal / 1000, 1)} mil M CC</strong>
          <small>{crecimiento > 0 ? `+${num(crecimiento, 0)} % sobre los ${num(OFERTA_HOY / 1000, 1)} mil M de hoy` : "La misma que hoy"}</small>
        </div>
        <div className="es-principal">
          <span>Tu parte de la red se reduce</span>
          <strong>{num(dilucion, 0)} %</strong>
          <small>Si mantienes las mismas monedas</small>
        </div>
      </div>
      <p className="cc-sim-nota">
        Es un techo, no una previsión: lo acuñado de verdad puede quedar por debajo, y los super validadores
        pueden cambiar la curva por votación. Oferta de partida: CoinGecko, 14 de noviembre de 2026.
      </p>
    </div>
  );
}
