"use client";

import { useState } from "react";

/**
 * Staking frente a dilución en la red TON. Modelo simplificado:
 *   · La red emite cada año un % nuevo de monedas (inflación) y lo reparte
 *     entre quien hace staking. Rendimiento bruto ≈ inflación / parte en staking.
 *   · El servicio de staking se queda una comisión sobre la recompensa.
 *   · Se capitaliza una vez al año (la red paga en cada ronda: es aproximado).
 *
 * Valores de partida, medidos el 14-11-2026: inflación 3,9 % (recompensa de
 * 1,7 + 1 GRAM por bloque, configuración 14, con bloques cada 0,41 s sobre
 * 5.284 millones de monedas) y 23,6 % de la oferta en staking (Staking
 * Rewards: 3,95 % y 23,56 %). Al revisar la guía, se comprueban.
 */
const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const signo = (n: number, dec: number) => `${n >= 0 ? "+" : "−"}${num(Math.abs(n), dec)}`;

export default function GuideGramStaking() {
  const [cantidad, setCantidad] = useState("1000");
  const [anios, setAnios] = useState(3);
  const [inflacion, setInflacion] = useState(3.9);
  const [enStaking, setEnStaking] = useState(24);
  const [comision, setComision] = useState(0);

  const q = Math.min(Math.max(Number(cantidad.replace(/\./g, "").replace(",", ".")) || 0, 0), 1e10);
  const inf = inflacion / 100;
  const bruto = enStaking > 0 ? inf / (enStaking / 100) : 0;
  const neto = bruto * (1 - comision / 100);

  const oferta = Math.pow(1 + inf, anios);
  const conStaking = q * Math.pow(1 + neto, anios);
  const recompensas = conStaking - q;
  const parteCon = (Math.pow(1 + neto, anios) / oferta - 1) * 100;
  const parteSin = (1 / oferta - 1) * 100;

  return (
    <div className="gram-calc">
      <p className="gram-calc-titulo">Staking o quieto: qué pasa con tu parte de la red</p>

      <div className="gram-calc-campos">
        <label htmlFor="gram-cantidad">
          <span>Tus Gram</span>
          <input id="gram-cantidad" inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </label>
        <label htmlFor="gram-anios">
          <span>Años <strong>{anios}</strong></span>
          <input id="gram-anios" type="range" min={1} max={5} step={1} value={anios} onChange={(e) => setAnios(Number(e.target.value))} />
        </label>
        <label htmlFor="gram-inflacion">
          <span>Emisión anual de la red <strong>{num(inflacion, 1)} %</strong></span>
          <input id="gram-inflacion" type="range" min={0.5} max={8} step={0.1} value={inflacion} onChange={(e) => setInflacion(Number(e.target.value))} />
        </label>
        <label htmlFor="gram-staking">
          <span>Parte de la oferta en staking <strong>{enStaking} %</strong></span>
          <input id="gram-staking" type="range" min={10} max={70} step={1} value={enStaking} onChange={(e) => setEnStaking(Number(e.target.value))} />
        </label>
        <label htmlFor="gram-comision" className="gram-calc-ancho">
          <span>Comisión de tu servicio de staking, sobre la recompensa <strong>{comision} %</strong></span>
          <input id="gram-comision" type="range" min={0} max={30} step={1} value={comision} onChange={(e) => setComision(Number(e.target.value))} />
        </label>
      </div>

      <div className="gram-calc-resultados" aria-live="polite">
        <div className="es-principal">
          <span>Rendimiento anual estimado</span>
          <strong>{num(neto * 100, 1)} %</strong>
          <small>Bruto {num(bruto * 100, 1)} % antes de comisión</small>
        </div>
        <div>
          <span>Con staking, en {anios} {anios === 1 ? "año" : "años"}</span>
          <strong>{num(conStaking, 0)} GRAM</strong>
          <small>{num(recompensas, 0)} GRAM de recompensas que declarar</small>
        </div>
        <div>
          <span>Tu parte de la red</span>
          <strong className={parteCon >= 0 ? "es-sube" : "es-baja"}>{signo(parteCon, 1)} %</strong>
          <small>Sin staking: {signo(parteSin, 1)} %</small>
        </div>
      </div>

      <p className="gram-calc-nota">
        El rendimiento sale de dividir la emisión entre lo que está en staking: si más gente bloquea sus monedas,
        toca a menos. Las recompensas se cobran en GRAM, no en euros, y lo que valgan depende del precio. No
        incluye el riesgo de que tu validador sea multado ni el precio de la moneda.
      </p>
    </div>
  );
}
