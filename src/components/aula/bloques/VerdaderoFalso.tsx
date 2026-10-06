"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, ArrowRight } from "lucide-react";
import { Marco } from "./comun";

/**
 * Minijuego de verdadero o falso: las afirmaciones salen de una en una, como
 * tarjetas, con la explicación al contestar y la puntuación al final.
 *
 * datos: { titulo?, afirmaciones: [{ texto, verdadero: boolean, explicacion }] }
 */

export interface DatosVF {
  titulo?: string;
  afirmaciones: { texto: string; verdadero: boolean; explicacion: string }[];
}

export function validarVF(d: unknown): d is DatosVF {
  const x = d as DatosVF;
  return !!x && Array.isArray(x.afirmaciones) && x.afirmaciones.length > 0
    && x.afirmaciones.every((a) => typeof a.texto === "string" && typeof a.verdadero === "boolean");
}

export default function VerdaderoFalso({ datos }: { datos: DatosVF }) {
  const total = datos.afirmaciones.length;
  const [indice, setIndice] = useState(0);
  const [respuesta, setRespuesta] = useState<boolean | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const terminado = indice >= total;
  const actual = datos.afirmaciones[indice];

  function contestar(valor: boolean) {
    if (respuesta !== null) return;
    setRespuesta(valor);
    if (valor === actual.verdadero) setAciertos((a) => a + 1);
  }

  function siguiente() {
    setRespuesta(null);
    setIndice((i) => i + 1);
  }

  function reiniciar() {
    setIndice(0);
    setRespuesta(null);
    setAciertos(0);
  }

  return (
    <Marco clase="juego" titulo={datos.titulo ?? "¿Verdadero o falso?"}>
      <div className="aula-vf-progreso" aria-hidden="true">
        {datos.afirmaciones.map((_, i) => (
          <i key={i} className={i < indice ? "hecho" : i === indice ? "actual" : undefined} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {terminado ? (
          <motion.div
            key="fin"
            className="aula-vf-fin"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="aula-vf-marcador">{aciertos}/{total}</span>
            <p>
              {aciertos === total
                ? "Pleno. Lo tienes."
                : aciertos >= total / 2
                  ? "Bien, pero repasa las que fallaste antes del examen."
                  : "Conviene releer la lección antes de seguir."}
            </p>
            <button type="button" className="aula-btn aula-btn--ghost" onClick={reiniciar}>
              <RotateCcw size={14} aria-hidden="true" /> Jugar otra vez
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={indice}
            className="aula-vf-carta"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <span className="aula-vf-num">{indice + 1} de {total}</span>
            <p className="aula-vf-texto">{actual.texto}</p>

            <div className="aula-vf-botones">
              {[true, false].map((v) => {
                const estado =
                  respuesta === null ? "" : v === actual.verdadero ? " is-buena" : v === respuesta ? " is-mala" : " is-apagada";
                return (
                  <button
                    key={String(v)}
                    type="button"
                    className={`aula-vf-btn${estado}`}
                    onClick={() => contestar(v)}
                    disabled={respuesta !== null}
                  >
                    {v ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : <X size={16} strokeWidth={2.6} aria-hidden="true" />}
                    {v ? "Verdadero" : "Falso"}
                  </button>
                );
              })}
            </div>

            {respuesta !== null && (
              <motion.div
                className={`aula-feedback ${respuesta === actual.verdadero ? "is-buena" : "is-mala"}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <strong>{actual.verdadero ? "Verdadero." : "Falso."}</strong> {actual.explicacion}
                <button type="button" className="aula-btn aula-btn--small" onClick={siguiente}>
                  {indice + 1 < total ? "Siguiente" : "Ver resultado"} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Marco>
  );
}
