"use client";

import { Children, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./paginas.css";

const MOVIL = "(max-width: 640px)";
function suscribir(avisar: () => void) {
  const mq = window.matchMedia(MOVIL);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}
const esMovil = () => window.matchMedia(MOVIL).matches;
const enServidor = () => false;

/**
 * Un listado por páginas, con sus teclitas 1, 2, 3… (19-11-2026, pedido por
 * el admin: en el móvil las listas largas no se acababan nunca). Lo usan las
 * guías (3 en el móvil, 6 en el ordenador) y los cursos (2 y 4).
 *
 * Todos los elementos siguen en el HTML desde el servidor: los de otras
 * páginas solo se esconden. Así Google y los lectores de pantalla ven todos
 * los enlaces, y la página no cambia de URL (ni de canónica).
 *
 * Cada hijo va dentro de su propio <li>: los hijos no deben ser <li>.
 */
export default function Paginas({
  children,
  claseLista,
  movil,
  pc,
  etiqueta,
}: {
  children: ReactNode;
  claseLista: string;
  movil: number;
  pc: number;
  /** Para los lectores de pantalla: «Páginas de guías», «Páginas de cursos». */
  etiqueta: string;
}) {
  const porPagina = useSyncExternalStore(suscribir, esMovil, enServidor) ? movil : pc;
  const items = Children.toArray(children);
  const total = Math.max(1, Math.ceil(items.length / porPagina));
  const [elegida, setPagina] = useState(0);
  // Si al girar o estrechar la pantalla hay menos páginas, se queda en la última.
  const pagina = Math.min(elegida, total - 1);
  const lista = useRef<HTMLUListElement>(null);

  function ir(n: number) {
    setPagina(n);
    // Al cambiar de página, el listado vuelve a quedar arriba de la pantalla.
    const caja = lista.current;
    if (caja && caja.getBoundingClientRect().top < 0) {
      caja.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <>
      <ul className={claseLista} ref={lista}>
        {items.map((item, i) => (
          <li key={i} className="pag-item" hidden={Math.floor(i / porPagina) !== pagina}>
            {item}
          </li>
        ))}
      </ul>

      {total > 1 && (
        <nav className="pag" aria-label={etiqueta}>
          <button type="button" className="pag-tecla" onClick={() => ir(pagina - 1)} disabled={pagina === 0} aria-label="Página anterior">
            <ChevronLeft size={20} strokeWidth={2.8} aria-hidden="true" />
          </button>
          {Array.from({ length: total }, (_, n) => (
            <button
              key={n}
              type="button"
              className={`pag-tecla${n === pagina ? " is-actual" : ""}`}
              onClick={() => ir(n)}
              aria-current={n === pagina ? "page" : undefined}
              aria-label={`Página ${n + 1}`}
            >
              {n + 1}
            </button>
          ))}
          <button type="button" className="pag-tecla" onClick={() => ir(pagina + 1)} disabled={pagina === total - 1} aria-label="Página siguiente">
            <ChevronRight size={20} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}
