"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { alVerse } from "@/lib/alVerse";

/**
 * El envoltorio que hace que un símbolo dibujado (SimboloEstudio, Llave) se
 * trace solo al entrar en pantalla, una vez. Sin JavaScript, o con «reducir
 * movimiento», el símbolo está dibujado desde el principio: la animación es un
 * adorno, nunca la condición para verlo.
 *
 * Solo toca un atributo del DOM (`data-trazo`), sin estado de React: el HTML
 * del servidor y el del primer render son idénticos.
 */
export default function TrazoVisible({
  className,
  style,
  retraso = 0,
  children,
}: {
  className: string;
  style?: CSSProperties;
  /** Milisegundos de espera tras entrar en pantalla. */
  retraso?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.trazo = "espera";
    let espera = 0;
    // Cuando se ve de verdad, no cuando roza la pantalla (src/lib/alVerse.ts).
    const cancelar = alVerse(
      el,
      () => {
        espera = window.setTimeout(() => {
          el.dataset.trazo = "dibuja";
        }, retraso);
      },
      { umbral: 0.5 },
    );
    return () => {
      cancelar();
      window.clearTimeout(espera);
      delete el.dataset.trazo;
    };
  }, [retraso]);

  return (
    <span ref={ref} aria-hidden="true" className={className} style={style}>
      {children}
    </span>
  );
}
