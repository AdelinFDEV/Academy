"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";
import { Marco } from "./comun";

/**
 * Pregunta de repaso dentro de una lección. No puntúa nada: sirve para que
 * el alumno compruebe al momento si lo ha entendido, con la explicación.
 * (La solución viaja al navegador, y no pasa nada: esto no es el examen.
 * Las preguntas del examen NO van nunca en un bloque.)
 *
 * datos: { enunciado, opciones: string[], correcta: número (desde 0), explicacion }
 */

export interface DatosPregunta {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

export function validarPregunta(d: unknown): d is DatosPregunta {
  const x = d as DatosPregunta;
  return !!x && typeof x.enunciado === "string" && Array.isArray(x.opciones) && x.opciones.length >= 2
    && Number.isInteger(x.correcta) && x.correcta >= 0 && x.correcta < x.opciones.length;
}

export default function Pregunta({ datos: p }: { datos: DatosPregunta }) {
  const [elegida, setElegida] = useState<number | null>(null);
  const acierto = elegida === p.correcta;

  return (
    <Marco clase="pregunta" titulo={p.enunciado}>
      <div className="aula-opciones" role="radiogroup" aria-label={p.enunciado}>
        {p.opciones.map((o, i) => {
          const estado =
            elegida === null ? "" : i === p.correcta ? " is-buena" : i === elegida ? " is-mala" : " is-apagada";
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={elegida === i}
              className={`aula-opcion${estado}`}
              disabled={elegida !== null}
              onClick={() => setElegida(i)}
            >
              <span className="aula-opcion-letra">{String.fromCharCode(65 + i)}</span>
              <span className="aula-opcion-texto">{o}</span>
              {elegida !== null && i === p.correcta && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
              {elegida === i && i !== p.correcta && <X size={16} strokeWidth={2.6} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {elegida !== null && (
          <motion.div
            className={`aula-feedback ${acierto ? "is-buena" : "is-mala"}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <strong>{acierto ? "Correcto." : "No es esa."}</strong> {p.explicacion}
            <button type="button" className="aula-btn-texto" onClick={() => setElegida(null)}>
              <RotateCcw size={13} aria-hidden="true" /> Repetir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Marco>
  );
}
