"use client";

import { useEffect, useRef } from "react";

/**
 * La línea fina bajo la barra del aula que se rellena al leer la lección: dice
 * cuánto queda sin tener que mirar la barra de scroll. Mide el avance sobre el
 * `<article>` de la lección (`objetivo`), no sobre la página entera.
 *
 * Se mueve con `transform` y escribe en el DOM directamente, sin estado: un
 * `setState` por cada evento de scroll repintaría la lección entera.
 */
export default function ProgresoLectura({ objetivo }: { objetivo: string }) {
  const barra = useRef<HTMLElement>(null);

  useEffect(() => {
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      const el = document.querySelector(objetivo);
      if (!el || !barra.current) return;
      const caja = el.getBoundingClientRect();
      const recorrido = caja.height - window.innerHeight;
      const avance = recorrido <= 0 ? 1 : Math.min(1, Math.max(0, -caja.top / recorrido));
      barra.current.style.transform = `scaleX(${avance.toFixed(4)})`;
    };
    const pedir = () => {
      if (!pendiente) pendiente = window.requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      if (pendiente) window.cancelAnimationFrame(pendiente);
    };
  }, [objetivo]);

  return (
    <div className="aula-lectura" aria-hidden="true">
      <i ref={barra} />
    </div>
  );
}
