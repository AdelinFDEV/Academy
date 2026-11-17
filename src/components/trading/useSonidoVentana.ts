"use client";

import { useEffect, useRef } from "react";
import { sonar } from "@/lib/sonidos";

/**
 * `abrir` y `cerrar` (ESTILO.md, «Los sonidos») para una ventana, un menú o un
 * desplegable del Diario. Suena solo cuando CAMBIA el estado, nunca al montar:
 * así da igual por dónde se abra o se cierre (la tecla, Escape, pulsar fuera)
 * y no suena nada que la persona no haya hecho. En el modo estricto de React el
 * efecto de montaje se repite, pero el estado no cambia y no suena dos veces.
 */
export function useSonidoVentana(abierta: boolean) {
  const antes = useRef(abierta);
  useEffect(() => {
    if (antes.current === abierta) return;
    antes.current = abierta;
    sonar(abierta ? "abrir" : "cerrar");
  }, [abierta]);
}
