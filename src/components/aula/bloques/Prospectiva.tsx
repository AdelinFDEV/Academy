"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Marco, formatear } from "./comun";

/**
 * El experimento de la moneda de la teoría prospectiva: apuestas 50/50 en las
 * que pierdes siempre lo mismo y la ganancia va subiendo. El alumno acepta o
 * rechaza cada una y al final ve a partir de qué ganancia acepta: su aversión
 * a la pérdida aproximada (ganancia mínima aceptada ÷ pérdida).
 *
 * No se guarda nada: es un espejo para el alumno, no una medición.
 *
 * datos: { titulo, perdida: 100, ganancias: [100, 125, 150, 200, 250, 300, 400], nota? }
 *        ← ganancias de menor a mayor
 */

export interface DatosProspectiva {
  titulo: string;
  perdida: number;
  ganancias: number[];
  nota?: string;
}

export function validarProspectiva(d: unknown): d is DatosProspectiva {
  const x = d as DatosProspectiva;
  return !!x && typeof x.titulo === "string" && typeof x.perdida === "number" && x.perdida > 0
    && Array.isArray(x.ganancias) && x.ganancias.length >= 3
    && x.ganancias.every((g, i) => typeof g === "number" && (i === 0 || g > x.ganancias[i - 1]));
}

const ratio = (n: number) => n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");

export default function Prospectiva({ datos }: { datos: DatosProspectiva }) {
  const [respuestas, setRespuestas] = useState<(boolean | undefined)[]>(() => datos.ganancias.map(() => undefined));
  const completas = respuestas.every((r) => r !== undefined);

  const primeraAceptada = respuestas.findIndex((r) => r === true);
  // Incoherente: rechazar una apuesta mejor que otra que sí aceptaste.
  const incoherente = primeraAceptada >= 0 && respuestas.slice(primeraAceptada).some((r) => r === false);

  let lectura: React.ReactNode = null;
  if (completas) {
    if (primeraAceptada < 0) {
      lectura = (
        <>No aceptaste ninguna. Tu aversión a la pérdida es mayor que <strong>{ratio(datos.ganancias.at(-1)! / datos.perdida)}</strong>: ni ganando {formatear(datos.ganancias.at(-1)!, "eur")} te compensa arriesgar {formatear(datos.perdida, "eur")}.</>
      );
    } else {
      const umbral = datos.ganancias[primeraAceptada] / datos.perdida;
      lectura = (
        <>
          Aceptas a partir de ganar <strong>{formatear(datos.ganancias[primeraAceptada], "eur")}</strong> por cada {formatear(datos.perdida, "eur")} que puedes perder.
          Tu aversión a la pérdida ronda <strong>{ratio(umbral)}</strong>
          {umbral <= 1 ? ": casi neutral ante el riesgo, algo poco habitual." : umbral < 1.5 ? ": por debajo de lo habitual." : umbral <= 2.5 ? ": dentro de lo que encontraron Kahneman y Tversky, en torno a 2." : ": por encima de la media de los estudios."}
        </>
      );
    }
  }

  return (
    <Marco clase="juego" titulo={datos.titulo} subtitulo="Lanzas una moneda. Si sale cruz, pierdes siempre lo mismo. Si sale cara, ganas lo que dice cada fila. ¿Aceptas la apuesta?">
      <ul className="aula-pros-lista">
        {datos.ganancias.map((g, i) => (
          <li key={g} className={respuestas[i] === undefined ? undefined : respuestas[i] ? "is-si" : "is-no"}>
            <span className="aula-pros-apuesta">
              Cruz: <b className="aula-pros-pierde">−{formatear(datos.perdida, "eur")}</b> · Cara: <b className="aula-pros-gana">+{formatear(g, "eur")}</b>
            </span>
            <span className="aula-pros-botones">
              <button type="button" className={`aula-btn aula-btn--small${respuestas[i] === true ? "" : " aula-btn--ghost"}`} aria-pressed={respuestas[i] === true}
                onClick={() => setRespuestas((r) => r.map((v, j) => (j === i ? true : v)))}>Acepto</button>
              <button type="button" className={`aula-btn aula-btn--small${respuestas[i] === false ? "" : " aula-btn--ghost"}`} aria-pressed={respuestas[i] === false}
                onClick={() => setRespuestas((r) => r.map((v, j) => (j === i ? false : v)))}>No</button>
            </span>
          </li>
        ))}
      </ul>

      {completas && (
        <div className="aula-feedback is-buena">
          <p>{lectura}</p>
          {incoherente && <p>Ojo: rechazaste alguna apuesta mejor que otra que sí aceptaste. Pasa mucho cuando se decide por intuición y no con una regla.</p>}
          <p>En una moneda justa, toda fila en la que la ganancia supera a la pérdida tiene esperanza positiva: repetida muchas veces, sale a cuenta. Lo que te frena no es la matemática, es lo que duele perder.</p>
        </div>
      )}

      <div className="aula-bloque-acciones">
        <button type="button" className="aula-btn aula-btn--ghost" onClick={() => setRespuestas(datos.ganancias.map(() => undefined))}>
          <RotateCcw size={14} aria-hidden="true" /> Empezar de nuevo
        </button>
      </div>
      {datos.nota && <p className="aula-bloque-nota">{datos.nota}</p>}
    </Marco>
  );
}
