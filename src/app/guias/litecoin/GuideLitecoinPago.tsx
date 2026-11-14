"use client";

import { useState } from "react";
import { Clock, Coins } from "lucide-react";

/**
 * Cuánto tarda y cuánto cuesta un pago en Litecoin frente a Bitcoin, según las
 * confirmaciones que pida quien cobra.
 *
 * El tiempo entre bloques es aleatorio (un proceso de Poisson): el tiempo hasta
 * N bloques sigue una distribución de Erlang. La media es N × intervalo, y el
 * percentil 90 se saca resolviendo su función de distribución por bisección.
 *
 * Las comisiones son las MEDIANAS de las últimas 24 h según Blockchair el
 * 14-11-2026 (0,000344 $ en Litecoin y 0,147 $ en Bitcoin), pasadas a euros con
 * el cambio de referencia del BCE del 13-11-2026 (1 € = 1,1052 $). Al revisar
 * la guía, se actualizan aquí y en el texto de la sección «pago».
 */
const REDES = [
  { id: "ltc", nombre: "Litecoin", minutos: 2.5, comisionEur: 0.00031 },
  { id: "btc", nombre: "Bitcoin", minutos: 10, comisionEur: 0.133 },
] as const;

/** Probabilidad de que N bloques hayan llegado antes de t minutos (Erlang). */
function probAntesDe(t: number, n: number, intervalo: number): number {
  const x = t / intervalo;
  let termino = Math.exp(-x);
  let suma = termino;
  for (let k = 1; k < n; k++) {
    termino *= x / k;
    suma += termino;
  }
  return 1 - suma;
}

/** Minutos dentro de los que llegan N bloques en 9 de cada 10 casos. */
function percentil90(n: number, intervalo: number): number {
  let lo = 0;
  let hi = intervalo * n * 6 + intervalo * 10;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (probAntesDe(mid, n, intervalo) < 0.9) lo = mid;
    else hi = mid;
  }
  return hi;
}

function minutos(m: number): string {
  if (m < 59.5) return `${m.toLocaleString("es-ES", { maximumFractionDigits: m < 10 ? 1 : 0 })} min`;
  // Se redondea el total antes de partirlo: así nunca sale «1 h 60 min».
  const total = Math.round(m);
  const h = Math.floor(total / 60);
  const r = total - h * 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

function euros(e: number): string {
  if (e < 0.01) return `${(e * 100).toLocaleString("es-ES", { maximumFractionDigits: 3 })} céntimos`;
  return `${e.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function GuideLitecoinPago() {
  const [confirmaciones, setConfirmaciones] = useState(6);
  const [importe, setImporte] = useState("20");

  const imp = Math.min(Math.max(Number(importe.replace(",", ".")) || 0, 0), 1_000_000);

  return (
    <div className="ltc-calc">
      <p className="ltc-calc-titulo">Calculadora de un pago</p>

      <div className="ltc-calc-campos">
        <label htmlFor="ltc-conf">
          <span>Confirmaciones que pide quien cobra <strong>{confirmaciones}</strong></span>
          <input
            id="ltc-conf"
            type="range"
            min={1}
            max={12}
            step={1}
            value={confirmaciones}
            onChange={(e) => setConfirmaciones(Number(e.target.value))}
          />
        </label>
        <label htmlFor="ltc-importe">
          <span>Importe del pago, en euros</span>
          <input id="ltc-importe" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} />
        </label>
      </div>

      <div className="ltc-calc-redes" aria-live="polite">
        {REDES.map((r) => {
          const media = confirmaciones * r.minutos;
          const p90 = percentil90(confirmaciones, r.minutos);
          const pct = imp > 0 ? (r.comisionEur / imp) * 100 : 0;
          return (
            <div key={r.id} className={`ltc-calc-red ltc-calc-red--${r.id}`}>
              <p className="ltc-calc-red-nombre">{r.nombre}</p>
              <div className="ltc-calc-dato">
                <Clock size={18} aria-hidden="true" />
                <div>
                  <span>Espera media</span>
                  <strong>{minutos(media)}</strong>
                  <small>9 de cada 10 pagos, antes de {minutos(p90)}</small>
                </div>
              </div>
              <div className="ltc-calc-dato">
                <Coins size={18} aria-hidden="true" />
                <div>
                  <span>Comisión típica de la red</span>
                  <strong>{euros(r.comisionEur)}</strong>
                  <small>
                    {imp > 0
                      ? `${pct.toLocaleString("es-ES", { maximumFractionDigits: pct < 0.01 ? 4 : 2 })} % de tu pago`
                      : "Escribe un importe"}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="ltc-calc-nota">
        Tiempos con el intervalo objetivo de cada red; los bloques llegan al azar, por eso se da también el
        margen del 90 %. Comisiones: mediana de las últimas 24 horas según Blockchair el 14 de noviembre de
        2026, en euros al cambio del BCE. No es lo que cobra un exchange por retirar, que suele ser más.
      </p>
    </div>
  );
}
