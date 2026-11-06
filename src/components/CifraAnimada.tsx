"use client";

import { useEffect, useRef } from "react";

interface Props {
  valor: number;
  /** Cómo se escribe el número: la misma función que el texto final. */
  formato: (n: number) => string;
  /** Lo que tarda en llegar, en milisegundos. */
  duracion?: number;
}

/**
 * Una cifra que sube contando desde cero hasta su valor la primera vez que se
 * pinta, y que salta suave cuando el valor cambia (los precios se refrescan
 * cada 30 segundos en el portfolio).
 *
 * Escribe en el DOM y no en el estado: son sesenta pasos por segundo que no
 * tienen por qué volver a pintar el componente que la contiene. Con el
 * movimiento reducido activado, el número sale ya puesto.
 */
export default function CifraAnimada({ valor, formato, duracion = 1100 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desde = anterior.current;
    anterior.current = valor;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || desde === valor) {
      el.textContent = formato(valor);
      return;
    }
    const inicio = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - inicio) / duracion);
      // Arranca rápido y frena al final.
      const suave = 1 - Math.pow(1 - k, 3);
      el.textContent = formato(desde + (valor - desde) * suave);
      if (k < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(id);
      el.textContent = formato(valor);
    };
  }, [valor, formato, duracion]);

  return <span ref={ref}>{formato(valor)}</span>;
}
