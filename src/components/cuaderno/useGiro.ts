"use client";

import { useCallback, useState } from "react";
import { sonar } from "@/lib/sonidos";
import "./giro.css";

/**
 * El estado de una tarjeta que se da la vuelta, y lo que pasa al girarla:
 * suena a papel y, en los móviles que lo permiten, vibra un instante. Lo usan
 * TODAS las tarjetas que giran, para que todas se sientan igual (giro.css).
 *
 * `claseGiro` va en el elemento que rota. Lleva `is-vuelta` solo después de
 * haberla girado alguna vez: recién cargada la página, la tarjeta está de
 * frente y quieta, sin la animación de volver.
 */
export function useGiro() {
  const [girada, setGirada] = useState(false);
  const [tocada, setTocada] = useState(false);

  const alternar = useCallback(() => {
    setGirada((g) => !g);
    setTocada(true);
    sonar("girar");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
  }, []);

  const claseGiro = `giro${girada ? " is-girada" : tocada ? " is-vuelta" : ""}`;

  return { girada, alternar, claseGiro };
}
