"use client";

import { useEffect, useState } from "react";
import Tecla from "@/components/cuaderno/Tecla";

export interface ApartadoLegal {
  id: string;
  numero: string;
  titulo: string;
}

/**
 * El índice de las páginas legales (LegalShell): una tecla por apartado. La
 * del apartado que se está leyendo se enciende en naranja, como el nodo
 * «actual» del camino de los cursos. Su CSS vive en legal-shell.css.
 */
export default function IndiceLegal({ apartados }: { apartados: ApartadoLegal[] }) {
  const [actual, setActual] = useState<string | null>(null);

  useEffect(() => {
    const secciones = apartados
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null);
    if (secciones.length === 0) return;

    // El apartado actual es el primero que asoma en la mitad de arriba de la
    // pantalla.
    const visibles = new Set<string>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visibles.add(e.target.id);
          else visibles.delete(e.target.id);
        }
        const primero = apartados.find((a) => visibles.has(a.id));
        if (primero) setActual(primero.id);
      },
      { rootMargin: "-24px 0px -55% 0px" },
    );
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [apartados]);

  return (
    <nav className="lg-indice" aria-label="Índice del documento">
      <p className="lg-indice-nota" aria-hidden="true">índice</p>
      <ol className="lg-indice-lista">
        {apartados.map((a) => (
          <li key={a.id}>
            <Tecla
              href={`#${a.id}`}
              color={actual === a.id ? "naranja" : "blanca"}
              tamano="peq"
              ancho
              className="lg-indice-tecla"
              aria-current={actual === a.id ? "location" : undefined}
            >
              <span className="lg-indice-num">{a.numero}</span>
              <span className="lg-indice-txt">{a.titulo}</span>
            </Tecla>
          </li>
        ))}
      </ol>
    </nav>
  );
}
