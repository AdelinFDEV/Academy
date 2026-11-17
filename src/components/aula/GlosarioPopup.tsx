"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookA, ExternalLink, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { bloquearScroll } from "@/components/trading/useVentanaMovil";

/**
 * Los términos del diccionario, sin salir de la lección (08-11-2026, pedido por
 * el admin).
 *
 * Envuelve el cuerpo de una lección. Al pulsar un enlace a `/glosario/<slug>`,
 * en vez de navegar abre un popup en el centro de la pantalla con la
 * definición corta del término y dos salidas: «Cerrar» y «Ver explicación
 * detallada», que abre la ficha completa del diccionario en otra pestaña para
 * que el alumno no pierda su sitio en la lección.
 *
 * Las definiciones las manda el servidor, y solo las de los términos que esa
 * lección enlaza (ver la página de la lección). Un enlace a un término que no
 * esté en `terminos` se comporta como un enlace normal.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): una ficha de papel con la
 * pestaña amarilla del Diccionario y sus dos salidas como teclas. Suena al
 * abrirse (`abrir`) y al cerrarse (`cerrar`).
 */

export type TerminoCorto = { term: string; definition: string };

export default function GlosarioPopup({
  terminos,
  children,
}: {
  terminos: Record<string, TerminoCorto>;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState<{ slug: string; t: TerminoCorto } | null>(null);
  const tarjetaRef = useRef<HTMLDivElement>(null);
  const origenRef = useRef<HTMLElement | null>(null);

  const cerrar = useCallback(() => {
    sonar("cerrar");
    setAbierto(null);
    // Devuelve el foco al enlace que lo abrió: quien navega con teclado sigue donde estaba.
    origenRef.current?.focus();
  }, []);

  const alPulsar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const enlace = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/glosario/"]');
    if (!enlace) return;
    const slug = enlace.getAttribute("href")!.slice("/glosario/".length).split(/[?#]/)[0];
    const t = terminos[slug];
    if (!t) return;
    e.preventDefault();
    origenRef.current = enlace;
    sonar("abrir");
    setAbierto({ slug, t });
  };

  useEffect(() => {
    if (!abierto) return;
    // El foco entra en la ficha (en su primer botón: la equis de cerrar).
    tarjetaRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    // En <html> y en <body>: con solo <body>, la lección seguía corriendo detrás.
    const soltar = bloquearScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      soltar();
    };
  }, [abierto, cerrar]);

  return (
    <div className="aula-glosario" onClick={alPulsar}>
      {children}

      {abierto && (
        <div className="aula-glosario-velo" onClick={cerrar}>
          <div
            ref={tarjetaRef}
            className="aula-glosario-tarjeta"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aula-glosario-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <Tecla color="blanca" tamano="peq" icono className="aula-glosario-x" onClick={cerrar} aria-label="Cerrar">
              <X size={18} strokeWidth={2.6} aria-hidden="true" />
            </Tecla>
            <span className="aula-glosario-kicker"><BookA size={14} aria-hidden="true" /> Diccionario</span>
            <h3 id="aula-glosario-titulo" className="aula-glosario-termino">{abierto.t.term}</h3>
            <p className="aula-glosario-def">{abierto.t.definition}</p>
            <div className="aula-glosario-acciones">
              <Tecla color="blanca" tamano="peq" onClick={cerrar}>Cerrar</Tecla>
              <Tecla
                href={`/glosario/${abierto.slug}`}
                target="_blank"
                rel="noopener"
                color="amarillo"
                tamano="peq"
                prefetch={false}
                onClick={() => setAbierto(null)}
              >
                Ver explicación detallada <ExternalLink size={14} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
            <p className="aula-glosario-nota">La explicación detallada se abre en otra pestaña: tu lección sigue aquí.</p>
          </div>
        </div>
      )}
    </div>
  );
}
