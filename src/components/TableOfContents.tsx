"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Índice del artículo.
 *
 * **Una sola instancia sirve a los dos diseños.** Por debajo de 1280 px sale en
 * línea, justo antes del texto, como una tarjeta más. A partir de ahí el CSS lo
 * saca al margen izquierdo —que en una entrada de 780 px está vacío— y lo deja
 * fijo mientras se lee. No se pinta dos veces a propósito: duplicarlo repetiría
 * los `id`, y un lector de pantalla anunciaría dos navegaciones idénticas.
 *
 * El seguimiento del apartado activo ya existía, pero no lo veía nadie: estando
 * en el flujo del artículo, el lector lo pasaba a los tres segundos y no volvía
 * a mirarlo. Es la función que el carril viene a aprovechar.
 */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-15% 0% -75% 0%" }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    // Las dos envolturas son `display: contents` hasta 1280 px: existen en el
    // DOM pero no crean caja, así que el diseño en línea es exactamente el de
    // antes. Solo en escritorio pasan a ser el carril.
    <div className="toc-rail">
      <div className="toc-rail-inner">
        <nav className="toc-box" aria-label="Tabla de contenidos">
          <span className="toc-label">En este artículo</span>
          <ol className="toc-list">
            {headings.map((h) => (
              <li
                key={h.id}
                className={`toc-item toc-item--h${h.level}${active === h.id ? " active" : ""}`}
              >
                <a href={`#${h.id}`} aria-current={active === h.id ? "location" : undefined}>
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
