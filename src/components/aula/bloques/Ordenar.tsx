"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Marco, barajarFijo } from "./comun";

/**
 * Minijuego de ordenar: los pasos salen desordenados y el alumno los coloca
 * con las flechas. Sirve para procesos (cómo se declara, qué va antes).
 *
 * datos: { titulo, instrucciones?, pasos: string[] }  ← en el orden CORRECTO
 */

export interface DatosOrdenar {
  titulo: string;
  instrucciones?: string;
  pasos: string[];
}

export function validarOrdenar(d: unknown): d is DatosOrdenar {
  const x = d as DatosOrdenar;
  return !!x && typeof x.titulo === "string" && Array.isArray(x.pasos) && x.pasos.length >= 3;
}

export default function Ordenar({ datos }: { datos: DatosOrdenar }) {
  const inicial = useMemo(() => {
    const indices = datos.pasos.map((_, i) => i);
    let barajado = barajarFijo(indices, datos.titulo);
    // Si por casualidad sale ya ordenado, se rota uno: no tendría gracia.
    if (barajado.every((v, i) => v === i)) barajado = [...barajado.slice(1), barajado[0]];
    return barajado;
  }, [datos]);
  const [orden, setOrden] = useState(inicial);
  const [comprobado, setComprobado] = useState(false);
  const aciertos = orden.filter((v, i) => v === i).length;

  function mover(pos: number, delta: -1 | 1) {
    const destino = pos + delta;
    if (destino < 0 || destino >= orden.length) return;
    setComprobado(false);
    setOrden((o) => {
      const copia = [...o];
      [copia[pos], copia[destino]] = [copia[destino], copia[pos]];
      return copia;
    });
  }

  return (
    <Marco clase="juego" titulo={datos.titulo} subtitulo={datos.instrucciones ?? "Ordena los pasos con las flechas."}>
      <ol className="aula-orden">
        {orden.map((paso, pos) => {
          const estado = comprobado ? (paso === pos ? " is-buena" : " is-mala") : "";
          return (
            <motion.li layout key={paso} className={`aula-orden-paso${estado}`} transition={{ type: "spring", stiffness: 500, damping: 38 }}>
              <span className="aula-orden-num">{pos + 1}</span>
              <span className="aula-orden-texto">{datos.pasos[paso]}</span>
              <span className="aula-orden-flechas">
                <button type="button" onClick={() => mover(pos, -1)} disabled={pos === 0} aria-label="Subir">
                  <ArrowUp size={15} />
                </button>
                <button type="button" onClick={() => mover(pos, 1)} disabled={pos === orden.length - 1} aria-label="Bajar">
                  <ArrowDown size={15} />
                </button>
              </span>
            </motion.li>
          );
        })}
      </ol>

      {comprobado && (
        <div className={`aula-feedback ${aciertos === orden.length ? "is-buena" : "is-mala"}`}>
          <strong>{aciertos === orden.length ? "Orden perfecto." : `${aciertos} de ${orden.length} en su sitio.`}</strong>{" "}
          {aciertos === orden.length ? "" : "Mueve las rojas y vuelve a comprobar."}
        </div>
      )}

      <div className="aula-bloque-acciones">
        <button type="button" className="aula-btn" onClick={() => setComprobado(true)}>Comprobar</button>
        <button type="button" className="aula-btn aula-btn--ghost" onClick={() => { setOrden(inicial); setComprobado(false); }}>
          <RotateCcw size={14} aria-hidden="true" /> Empezar de nuevo
        </button>
      </div>
    </Marco>
  );
}
