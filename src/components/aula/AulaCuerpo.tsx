"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ListTree, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

/**
 * El cuerpo del aula: el temario a la izquierda y la lección al lado.
 *
 * Sustituye a TemarioMovil (08-11-2026). El temario se pinta en el servidor y
 * llega en tres piezas —cabecera, lista y cierre—; esto solo decide cómo se
 * enseñan:
 *
 *  · En escritorio, el alumno puede PLEGARLO a una franja fina para centrarse
 *    en la lección, y desplegarlo con el mismo botón (o con la tecla «T»).
 *    La elección se guarda en el navegador y se respeta en todas las lecciones.
 *  · En móvil va en un panel que se abre con un botón y se cierra solo al
 *    navegar, con Escape o tocando fuera.
 *
 * La cabecera y el cierre quedan fijos; solo la lista hace scroll, con un
 * difuminado arriba y abajo para que no se vea un corte seco.
 */

const CLAVE = "aula-temario-plegado";

export default function AulaCuerpo({
  cabecera,
  lista,
  cierre,
  porcentaje,
  children,
}: {
  cabecera: React.ReactNode;
  lista: React.ReactNode;
  cierre: React.ReactNode;
  porcentaje: number;
  children: React.ReactNode;
}) {
  const [plegado, setPlegado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  // La preferencia se lee después de montar: en el servidor no hay navegador.
  useEffect(() => {
    if (window.localStorage.getItem(CLAVE) === "1") setPlegado(true);
  }, []);

  useEffect(() => setAbierto(false), [ruta]);

  const alternar = useCallback(() => {
    setPlegado((p) => {
      window.localStorage.setItem(CLAVE, p ? "0" : "1");
      return !p;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
      const t = e.target as HTMLElement | null;
      const escribiendo = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (!escribiendo && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "t") alternar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alternar]);

  return (
    <div className={`aula-cuerpo${plegado ? " is-plegado" : ""}`}>
      <button type="button" className="aula-temario-toggle" onClick={() => setAbierto(true)} aria-expanded={abierto}>
        <ListTree size={16} aria-hidden="true" /> Temario
      </button>

      <aside className={`aula-temario${abierto ? " is-abierto" : ""}`} aria-label="Temario del curso">
        {/* Franja plegada: solo el botón de abrir y el progreso en vertical. */}
        <div className="aula-temario-franja" aria-hidden={!plegado}>
          <button type="button" className="aula-temario-mostrar" onClick={alternar} title="Mostrar el temario (tecla T)">
            <PanelLeftOpen size={18} aria-hidden="true" />
            <span>Temario</span>
          </button>
          <span className="aula-temario-franja-barra" aria-hidden="true"><i style={{ height: `${porcentaje}%` }} /></span>
          <span className="aula-temario-franja-pct">{porcentaje}%</span>
        </div>

        <div className="aula-temario-panel" aria-hidden={plegado || undefined}>
          <div className="aula-temario-cab">
            {/* Una fila propia para el control, encima de la tarjeta del curso:
                con texto, para que se entienda a la primera qué hace. */}
            <div className="aula-temario-barra-ctl">
              <span className="aula-temario-rotulo"><ListTree size={14} aria-hidden="true" /> Temario</span>
              <button type="button" className="aula-temario-ocultar" onClick={alternar} title="Ocultar el temario (tecla T)">
                <PanelLeftClose size={15} aria-hidden="true" />
                <span>Ocultar</span>
                <kbd>T</kbd>
              </button>
              <button type="button" className="aula-temario-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar temario">
                <X size={18} />
              </button>
            </div>
            {cabecera}
          </div>
          <div className="aula-temario-scroll">{lista}</div>
          <div className="aula-temario-pie">{cierre}</div>
        </div>
      </aside>
      {abierto && <div className="aula-temario-velo" onClick={() => setAbierto(false)} aria-hidden="true" />}

      <main className="aula-principal">{children}</main>
    </div>
  );
}
