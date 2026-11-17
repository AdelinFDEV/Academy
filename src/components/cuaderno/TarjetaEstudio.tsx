"use client";

import { useState } from "react";
import { sonar } from "@/lib/sonidos";
import "./tarjeta-estudio.css";

export type ColorTarjeta = "naranja" | "azul" | "menta" | "lila" | "amarillo" | "coral" | "cielo";

/**
 * La tarjeta de estudio del estilo «Cuaderno de estudio»: la pregunta delante y
 * la respuesta detrás. Se gira al pulsarla (también con el teclado: es un
 * botón) y, en escritorio, al pasar el ratón. Suena a papel al girar.
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
  respuesta: string;
  detalle?: string;
  color?: ColorTarjeta;
  className?: string;
}) {
  const [girada, setGirada] = useState(false);

  return (
    <button
      type="button"
      className={`te te--${color}${girada ? " is-girada" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={girada}
      onClick={() => {
        setGirada((g) => !g);
        sonar("girar");
      }}
    >
      <span className="te-giro">
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
