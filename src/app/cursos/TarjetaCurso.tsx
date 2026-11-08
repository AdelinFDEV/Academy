"use client";

import { useRef } from "react";

/**
 * La tarjeta de un curso en el catálogo: un `<li>` que solo añade el brillo
 * que sigue al ratón (08-11-2026). Escribe la posición en `--mx` / `--my` y el
 * CSS pinta un degradado ahí; no hay estado de React ni re-renders.
 *
 * Solo con ratón: en pantallas táctiles no hay `pointermove` sin dedo, y el CSS
 * además lo limita a `(hover: hover)`. Un `requestAnimationFrame` por fotograma
 * como mucho, para que no se acumulen escrituras.
 */
export default function TarjetaCurso({
  className,
  style,
  children,
}: {
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const frame = useRef(0);

  function mover(e: React.PointerEvent<HTMLLIElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
    });
  }

  return (
    <li ref={ref} className={className} style={style} onPointerMove={mover}>
      {children}
    </li>
  );
}
