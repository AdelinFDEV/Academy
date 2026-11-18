"use client";

import type { ReactNode } from "react";
import { useGiro } from "./useGiro";
import "./tarjeta-estudio.css";

export type ColorTarjeta = "naranja" | "azul" | "menta" | "lila" | "amarillo" | "coral" | "cielo";

/**
 * La tarjeta de estudio del estilo «Cuaderno de estudio»: la pregunta delante y
 * la respuesta detrás. Se gira al pulsarla (también con el teclado: es un
 * botón); con el ratón encima se levanta y se ladea, pero no gira. El giro,
 * su sonido y su vibración son los de todas las tarjetas de la web
 * (useGiro.ts y giro.css).
 *
 * El texto de las dos caras está en el HTML desde el principio: lo leen Google
 * y los lectores de pantalla aunque nadie la gire.
 */
export default function TarjetaEstudio({
  tema,
  pregunta,
  respuesta,
  detalle,
  color = "naranja",
  className,
}: {
  tema: string;
  pregunta: string;
  /** Texto, o texto con su propio marcado (p. ej. la palabra clave en negrita). */
  respuesta: ReactNode;
  detalle?: string;
  color?: ColorTarjeta;
  className?: string;
}) {
  const { girada, alternar, claseGiro } = useGiro();

  return (
    <button
      type="button"
      className={`te giro-zona te--${color}${className ? ` ${className}` : ""}`}
      aria-pressed={girada}
      onClick={alternar}
    >
      <span className={`te-giro ${claseGiro}`}>
        <span className="te-cara te-frente">
          <span className="te-tema">{tema}</span>
          <span className="te-pregunta">{pregunta}</span>
          <span className="te-pista" aria-hidden="true">↻ gírame</span>
        </span>
        <span className="te-cara te-dorso">
          <span className="te-tema">Respuesta</span>
          <span className="te-respuesta">{respuesta}</span>
          {detalle && <span className="te-detalle">{detalle}</span>}
        </span>
      </span>
    </button>
  );
}
