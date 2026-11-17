"use client";

import { useEffect, useState } from "react";

/**
 * El índice de las páginas de instrucciones (/admin/guias-instrucciones y
 * /admin/seo-instrucciones), como las pestañas de un cuaderno de apuntes: en
 * el escritorio se queda fijo a un lado y marca en qué bloque estás; en el
 * móvil va arriba, en fichas.
 *
 * Solo presenta: los textos y los destinos los pone cada página.
 */
export default function IndiceApuntes({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  const [actual, setActual] = useState<string | null>(null);

  useEffect(() => {
    const secciones = items
      .map(([id]) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!secciones.length) return;

    // El bloque «actual» es el último cuyo título ya ha pasado por el tercio
    // de arriba de la pantalla.
    const visibles = new Set<string>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visibles.add(e.target.id);
          else visibles.delete(e.target.id);
        }
        const primera = secciones.find((s) => visibles.has(s.id));
        if (primera) setActual(primera.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [items]);

  return (
    <nav className="agi-indice" aria-label="Índice">
      <p className="agi-indice-titulo">Índice</p>
      <ol>
        {items.map(([id, texto], i) => (
          <li key={id}>
            <a href={`#${id}`} className={actual === id ? "is-actual" : undefined} aria-current={actual === id ? "location" : undefined}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {texto}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
