"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, ArrowRight } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { Marco, Opcion, useLetras } from "./comun";

/**
 * Minijuego de verdadero o falso: las afirmaciones salen de una en una, como
 * tarjetas, con la explicación al contestar y la puntuación al final.
 * Se contesta con las teclas «Verdadero» y «Falso», o con V y F en el teclado.
 * Acertar suena a `acierto` y fallar a `fallo`.
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
  const caja = useRef<HTMLDivElement>(null);
  const pulsada = useLetras(caja, ["V", "F"], (i) => contestar(i === 0), !terminado && respuesta === null);

  function contestar(valor: boolean) {
    if (respuesta !== null) return;
    const bien = valor === actual.verdadero;
    sonar(bien ? "acierto" : "fallo");
    setRespuesta(valor);
    if (bien) setAciertos((a) => a + 1);
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
      <div ref={caja}>
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
            role="status"
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
            <Tecla color="blanca" tamano="peq" onClick={reiniciar}>
              <RotateCcw size={14} strokeWidth={2.6} aria-hidden="true" /> Jugar otra vez
            </Tecla>
          </motion.div>
        ) : (
          <motion.div
            key={indice}
            className="aula-vf-carta"
            initial={{ opacity: 0, x: 40, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -40, rotate: -2 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <span className="aula-vf-num">{indice + 1} de {total}</span>
            <p className="aula-vf-texto">{actual.texto}</p>

            <div className="aula-vf-botones">
              {[true, false].map((v, i) => (
                <Opcion
                  key={String(v)}
                  marca={v ? "V" : "F"}
                  estado={respuesta === null ? undefined : v === actual.verdadero ? "buena" : v === respuesta ? "mala" : "neutra"}
                  pulsada={pulsada === i}
                  onClick={() => contestar(v)}
                  disabled={respuesta !== null}
                >
                  {v ? "Verdadero" : "Falso"}
                </Opcion>
              ))}
            </div>

            {respuesta !== null && (
              <motion.div
                className={`aula-feedback ${respuesta === actual.verdadero ? "is-buena" : "is-mala"}`}
                role="status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="aula-feedback-cab">
                  <span className="aula-feedback-ic">
                    {respuesta === actual.verdadero ? <Check size={16} strokeWidth={3.2} aria-hidden="true" /> : <X size={16} strokeWidth={3.2} aria-hidden="true" />}
                  </span>
                  {respuesta === actual.verdadero ? "Correcto" : "No"}: es {actual.verdadero ? "verdadero" : "falso"}
                </p>
                {actual.explicacion && <p>{actual.explicacion}</p>}
                <Tecla tamano="peq" onClick={siguiente}>
                  {indice + 1 < total ? "Siguiente" : "Ver resultado"} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </Marco>
  );
}
