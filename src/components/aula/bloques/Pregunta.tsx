"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { Marco, Opcion, letra, useLetras } from "./comun";

/**
 * Pregunta de repaso dentro de una lección. No puntúa nada: sirve para que
 * el alumno compruebe al momento si lo ha entendido, con la explicación.
 *
 * Cada respuesta es una tecla con su letra, y se pulsa también con el teclado
 * físico (A, B, C…). Al contestar se marcan la buena (menta) y, si falló, la
 * que eligió (coral). **Las demás se quedan legibles** (`neutra`): hasta el
 * 12-11-2026 bajaban al 45 % de opacidad y parecía que habían desaparecido.
 * Acertar suena a `acierto` y fallar a `fallo`.
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
  const grupo = useRef<HTMLDivElement>(null);

  function contestar(i: number) {
    if (elegida !== null) return;
    sonar(i === p.correcta ? "acierto" : "fallo");
    setElegida(i);
  }

  const pulsada = useLetras(grupo, p.opciones.map((_, i) => letra(i)), contestar, elegida === null);

  return (
    <Marco clase="pregunta" titulo={p.enunciado}>
      <div ref={grupo} className="aula-opciones" role="radiogroup" aria-label={p.enunciado}>
        {p.opciones.map((o, i) => (
          <Opcion
            key={i}
            marca={letra(i)}
            role="radio"
            aria-checked={elegida === i}
            estado={elegida === null ? undefined : i === p.correcta ? "buena" : i === elegida ? "mala" : "neutra"}
            pulsada={pulsada === i}
            disabled={elegida !== null}
            onClick={() => contestar(i)}
          >
            {o}
          </Opcion>
        ))}
      </div>

      <AnimatePresence>
        {elegida !== null && (
          <motion.div
            className={`aula-feedback ${acierto ? "is-buena" : "is-mala"}`}
            role="status"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
          >
            <p className="aula-feedback-cab">
              <span className="aula-feedback-ic">
                {acierto ? <Check size={16} strokeWidth={3.2} aria-hidden="true" /> : <X size={16} strokeWidth={3.2} aria-hidden="true" />}
              </span>
              {acierto ? "Correcto" : "No es esa"}
            </p>
            {p.explicacion && <p>{p.explicacion}</p>}
            <Tecla color="blanca" tamano="peq" onClick={() => setElegida(null)}>
              <RotateCcw size={14} strokeWidth={2.6} aria-hidden="true" /> Intentarlo otra vez
            </Tecla>
          </motion.div>
        )}
      </AnimatePresence>
    </Marco>
  );
}
