"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { ListTree, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { bloquearScroll } from "@/components/trading/useVentanaMovil";

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
 *    navegar, con Escape o tocando fuera. Al abrirlo, el foco entra en él y
 *    la página de detrás deja de hacer scroll; al cerrarlo, el foco vuelve a
 *    la tecla que lo abrió. Cerrado, el panel queda `inert`: fuera de la
 *    pantalla, sus enlaces no se alcanzan con el tabulador ni con un lector.
 *
 * Abrir y cerrar suenan (`abrir` / `cerrar`), también al plegar con la «T».
 * Cerrar solo al navegar no suena: no lo ha hecho la persona.
 *
 * La cabecera y el cierre quedan quietos; solo la lista hace scroll, con un
 * difuminado arriba y abajo para que no se vea un corte seco.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): el temario es una hoja de papel
 * pegada al borde, y todos sus controles son teclas (`<Tecla>`). Todo lo que
 * anima framer-motion dentro del aula (bloques, examen, resultado) respeta
 * «reducir movimiento» del sistema gracias al `MotionConfig` de aquí.
 */

const CLAVE = "aula-temario-plegado";

/** El mismo corte que el CSS (960px): por debajo, el temario es un panel. */
const MQ_MOVIL = "(max-width: 960px)";
function suscribirMovil(avisar: () => void) {
  const mq = window.matchMedia(MQ_MOVIL);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

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
  const movil = useSyncExternalStore(suscribirMovil, () => window.matchMedia(MQ_MOVIL).matches, () => false);
  const ruta = usePathname();
  // Al navegar, el panel del móvil se cierra (sin sonido: no lo ha hecho la persona).
  const [rutaVista, setRutaVista] = useState(ruta);
  if (ruta !== rutaVista) {
    setRutaVista(ruta);
    setAbierto(false);
  }
  const panel = useRef<HTMLElement>(null);
  const raiz = useRef<HTMLDivElement>(null);

  // La preferencia se lee después de montar: en el servidor no hay navegador.
  useEffect(() => {
    if (window.localStorage.getItem(CLAVE) === "1") setPlegado(true);
  }, []);

  // Con el panel abierto en el móvil, la página de detrás no se mueve.
  const panelAbierto = abierto && movil;
  useEffect(() => {
    if (!panelAbierto) return;
    // En <html> y en <body>: con solo <body>, la página seguía corriendo detrás.
    return bloquearScroll();
  }, [panelAbierto]);

  const abrir = () => {
    sonar("abrir");
    setAbierto(true);
  };

  const cerrar = useCallback(() => {
    sonar("cerrar");
    setAbierto(false);
    raiz.current?.querySelector<HTMLElement>(".aula-temario-toggle")?.focus();
  }, []);

  // Con el panel abierto en el móvil, el foco entra en él (en la tecla de cerrar).
  useEffect(() => {
    if (abierto) panel.current?.querySelector<HTMLElement>(".aula-temario-cerrar")?.focus();
  }, [abierto]);

  const alternar = useCallback(() => {
    sonar(plegado ? "abrir" : "cerrar");
    window.localStorage.setItem(CLAVE, plegado ? "0" : "1");
    setPlegado(!plegado);
  }, [plegado]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abierto) cerrar();
      const t = e.target as HTMLElement | null;
      const escribiendo = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      // La «T» solo pliega en escritorio (en el móvil no hay nada que plegar)
      // y nunca con una ventana abierta encima.
      if (escribiendo || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "t") return;
      if (document.querySelector('[aria-modal="true"]') || !window.matchMedia("(min-width: 961px)").matches) return;
      alternar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alternar, abierto, cerrar]);

  return (
    <div ref={raiz} className={`aula-cuerpo${plegado ? " is-plegado" : ""}`}>
      <Tecla
        color="blanca"
        tamano="peq"
        className="aula-temario-toggle"
        onClick={abrir}
        aria-expanded={abierto}
        aria-controls="aula-temario"
      >
        <ListTree size={16} strokeWidth={2.4} aria-hidden="true" /> Temario
      </Tecla>

      <aside
        ref={panel}
        id="aula-temario"
        className={`aula-temario${abierto ? " is-abierto" : ""}`}
        aria-label="Temario del curso"
        inert={movil && !abierto}
      >
        {/* Franja plegada: solo el botón de abrir y el progreso en vertical. */}
        <div className="aula-temario-franja" aria-hidden={!plegado}>
          <Tecla
            color="blanca"
            tamano="peq"
            icono
            className="aula-temario-mostrar"
            onClick={alternar}
            title="Mostrar el temario (tecla T)"
            aria-label="Mostrar el temario"
            tabIndex={plegado ? undefined : -1}
          >
            <PanelLeftOpen size={18} aria-hidden="true" />
          </Tecla>
          <span className="aula-temario-franja-rotulo">Temario</span>
          <span className="aula-temario-franja-barra" aria-hidden="true"><i style={{ height: `${porcentaje}%` }} /></span>
          <span className="aula-temario-franja-pct">{porcentaje}%</span>
        </div>

        {/* Plegado solo existe en escritorio: con el panel abierto en el móvil, se lee. */}
        <div className="aula-temario-panel" aria-hidden={(plegado && !abierto) || undefined}>
          <div className="aula-temario-cab">
            {/* Una fila propia para el control, encima de la tarjeta del curso:
                con texto, para que se entienda a la primera qué hace. */}
            <div className="aula-temario-barra-ctl">
              <span className="aula-temario-rotulo"><ListTree size={14} aria-hidden="true" /> Temario</span>
              <Tecla color="blanca" tamano="peq" className="aula-temario-ocultar" onClick={alternar} title="Ocultar el temario (tecla T)">
                <PanelLeftClose size={15} aria-hidden="true" />
                <span>Ocultar</span>
                <kbd>T</kbd>
              </Tecla>
              <Tecla color="blanca" tamano="peq" icono className="aula-temario-cerrar" onClick={cerrar} aria-label="Cerrar temario">
                <X size={18} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
            {cabecera}
          </div>
          <div className="aula-temario-scroll">{lista}</div>
          <div className="aula-temario-pie">{cierre}</div>
        </div>
      </aside>
      {panelAbierto && <div className="aula-temario-velo" onClick={cerrar} aria-hidden="true" />}

      <main className="aula-principal">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </main>
    </div>
  );
}
