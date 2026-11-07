"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Marco, formatear } from "./comun";

/**
 * Simulador de rachas: N operaciones al azar con un acierto fijo. Enseña lo
 * largas que salen las rachas de pérdidas por puro azar en un método que gana
 * a la larga, y que el resultado se reparte de forma desigual.
 *
 * La simulación solo corre al pulsar (con `Math.random`, en el navegador):
 * antes no se pinta nada, así que el servidor y el cliente no discrepan.
 *
 * datos: { titulo, operaciones: 100, acierto: 55, ganancia_r?: 1, perdida_r?: 1, nota? }
 */

export interface DatosRachas {
  titulo: string;
  operaciones: number;
  acierto: number;
  ganancia_r?: number;
  perdida_r?: number;
  nota?: string;
}

export function validarRachas(d: unknown): d is DatosRachas {
  const x = d as DatosRachas;
  return !!x && typeof x.titulo === "string"
    && Number.isInteger(x.operaciones) && x.operaciones >= 10 && x.operaciones <= 500
    && typeof x.acierto === "number" && x.acierto > 0 && x.acierto < 100;
}

interface Tirada {
  serie: boolean[];
  rachaPerdidas: number;
  rachaGanadas: number;
  totalR: number;
  peorR: number;
}

function simular(d: DatosRachas): Tirada {
  const g = d.ganancia_r ?? 1;
  const p = d.perdida_r ?? 1;
  const serie = Array.from({ length: d.operaciones }, () => Math.random() * 100 < d.acierto);
  let rachaPerdidas = 0, rachaGanadas = 0, rp = 0, rg = 0, total = 0, pico = 0, peor = 0;
  for (const gana of serie) {
    if (gana) { rg++; rp = 0; total += g; } else { rp++; rg = 0; total -= p; }
    rachaPerdidas = Math.max(rachaPerdidas, rp);
    rachaGanadas = Math.max(rachaGanadas, rg);
    pico = Math.max(pico, total);
    peor = Math.min(peor, total - pico);
  }
  return { serie, rachaPerdidas, rachaGanadas, totalR: total, peorR: peor };
}

const r = (n: number) => `${n > 0 ? "+" : ""}${formatear(Math.round(n * 10) / 10)} R`;

export default function Rachas({ datos }: { datos: DatosRachas }) {
  const [tirada, setTirada] = useState<Tirada | null>(null);
  const [historial, setHistorial] = useState<number[]>([]);
  const esperanza = (datos.acierto / 100) * (datos.ganancia_r ?? 1) - (1 - datos.acierto / 100) * (datos.perdida_r ?? 1);

  function lanzar() {
    const t = simular(datos);
    setTirada(t);
    setHistorial((h) => [...h, t.rachaPerdidas].slice(-20));
  }

  return (
    <Marco
      clase="juego"
      titulo={datos.titulo}
      subtitulo={`${datos.operaciones} operaciones con un ${formatear(datos.acierto, "pct")} de acierto. La esperanza es de ${r(esperanza)} por operación: el método gana a la larga.`}
    >
      {tirada && (
        <>
          <div className="aula-rachas-serie" aria-label={`Serie de ${datos.operaciones} operaciones`}>
            {tirada.serie.map((gana, i) => <i key={i} className={gana ? "is-gana" : "is-pierde"} />)}
          </div>
          <div className="aula-calc-total aula-calc-total--3">
            <div className="is-perdida"><span>Peor racha de pérdidas</span><strong>{tirada.rachaPerdidas} seguidas</strong></div>
            <div className="is-perdida"><span>Peor caída desde un máximo</span><strong>{r(tirada.peorR)}</strong></div>
            <div className={tirada.totalR >= 0 ? "is-ganancia" : "is-perdida"}><span>Resultado de la serie</span><strong>{r(tirada.totalR)}</strong></div>
          </div>
          {historial.length > 1 && (
            <p className="aula-bloque-nota">
              Peor racha de pérdidas en tus {historial.length} simulaciones: {historial.join(" · ")}. La más larga, {Math.max(...historial)} seguidas, sin que el método haya cambiado.
            </p>
          )}
        </>
      )}
      <div className="aula-bloque-acciones">
        <button type="button" className="aula-btn" onClick={lanzar}>
          <Shuffle size={14} aria-hidden="true" /> {tirada ? "Otra serie" : "Simular"}
        </button>
      </div>
      {datos.nota && <p className="aula-bloque-nota">{datos.nota}</p>}
    </Marco>
  );
}
