"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookA, ExternalLink, X } from "lucide-react";
import "./glosario-popup.css";

/**
 * El popup del diccionario, en TODA la web (10-11-2026, pedido por el admin).
 *
 * Es el mismo que estrenaron las lecciones (`aula/GlosarioPopup.tsx`): al
 * pulsar un enlace a `/glosario/<slug>`, en vez de navegar se abre la
 * definición corta en el centro de la pantalla, con «Cerrar» y «Ver
 * explicación detallada», que abre la ficha en otra pestaña para no perder la
 * página en la que se estaba.
 *
 * Vive en el layout raíz y escucha los clics de todo el documento en fase de
 * captura, así que vale igual para un `<a>` escrito en HTML que para un
 * `<Link>` de Next: el `preventDefault` llega antes que el de Next, y Next no
 * navega si el evento ya viene cancelado.
 *
 * No se mete donde no toca:
 * - Dentro de una lección (`.aula-glosario`) manda el popup del aula, que
 *   lleva el color del curso.
 * - Un enlace con `data-sin-popup` navega normal: el listado de /glosario ya
 *   enseña la definición al lado, y repetirla en un popup sería un paso de más.
 * - Un término sin ficha ampliada no está en `terminos`: el enlace se comporta
 *   como siempre (aunque ese enlace, por las reglas del diccionario, no debería
 *   existir).
 * - Ctrl/Cmd/Mayús o el botón central abren en otra pestaña, como siempre.
 */

export type TerminoCorto = { term: string; definition: string };

export default function GlosarioPopupGlobal({ terminos }: { terminos: Record<string, TerminoCorto> }) {
  const [abierto, setAbierto] = useState<{ slug: string; t: TerminoCorto } | null>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const origenRef = useRef<HTMLElement | null>(null);

  const cerrar = useCallback(() => {
    setAbierto(null);
    // Devuelve el foco al enlace que lo abrió: quien navega con teclado sigue donde estaba.
    origenRef.current?.focus();
  }, []);

  useEffect(() => {
    const alPulsar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (!(e.target instanceof Element)) return;
      const enlace = e.target.closest<HTMLAnchorElement>('a[href^="/glosario/"]');
      if (!enlace || enlace.hasAttribute("data-sin-popup") || enlace.closest(".aula-glosario")) return;
      if (enlace.target && enlace.target !== "_self") return;
      const slug = enlace.getAttribute("href")!.slice("/glosario/".length).split(/[?#]/)[0];
      const t = terminos[slug];
      if (!t) return;
      e.preventDefault();
      origenRef.current = enlace;
      setAbierto({ slug, t });
    };
    document.addEventListener("click", alPulsar, true);
    return () => document.removeEventListener("click", alPulsar, true);
  }, [terminos]);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [abierto, cerrar]);

  if (!abierto) return null;

  return (
    <div className="gpop-velo" onClick={cerrar}>
      <div
        className="gpop-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gpop-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={cerrarRef} type="button" className="gpop-x" onClick={cerrar} aria-label="Cerrar">
          <X size={18} />
        </button>
        <span className="gpop-kicker"><BookA size={14} aria-hidden="true" /> Diccionario</span>
        <h3 id="gpop-titulo" className="gpop-termino">{abierto.t.term}</h3>
        <p className="gpop-def">{abierto.t.definition}</p>
        <div className="gpop-acciones">
          <button type="button" className="gpop-btn gpop-btn--ghost" onClick={cerrar}>Cerrar</button>
          <a
            href={`/glosario/${abierto.slug}`}
            target="_blank"
            rel="noopener"
            className="gpop-btn"
            data-sin-popup
            onClick={() => setAbierto(null)}
          >
            Ver explicación detallada <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
        <p className="gpop-nota">La explicación detallada se abre en otra pestaña: esta página sigue aquí.</p>
      </div>
    </div>
  );
}
