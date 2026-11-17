"use client";

import { useRef, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { alCambiarSonido, fijarSonido, sonar, sonidoActivo } from "@/lib/sonidos";
import Tecla from "@/components/cuaderno/Tecla";

/**
 * El altavoz para silenciar (o volver a encender) los sonidos de toda la web.
 * Los sonidos vienen encendidos por defecto, así que esto tiene que estar
 * siempre a la vista (ESTILO.md, «Los sonidos»). La elección se recuerda.
 */
export default function InterruptorSonido({ tamano = "peq" }: { tamano?: "peq" | "normal" }) {
  // En el servidor no hay preferencia guardada: se pinta encendido y el
  // navegador lo corrige al hidratar.
  const activo = useSyncExternalStore(
    (avisar) => alCambiarSonido(() => avisar()),
    sonidoActivo,
    () => true,
  );
  // El temporizador que quita la nota a mano de la barra.
  const nota = useRef(0);

  return (
    <>
      <Tecla
        color="blanca"
        tamano={tamano}
        icono
        // Hace su propio sonido (distinto al encender y al apagar): sin el clic de tecla.
        muda
        // Nombre fijo y el estado en `aria-pressed` («Silenciar», pulsado o no):
        // cambiar a la vez el nombre y el estado lo leería al revés.
        aria-label="Silenciar los sonidos"
        aria-pressed={!activo}
        title={activo ? "Silenciar los sonidos" : "Activar los sonidos"}
        onClick={(e) => {
          // Colgado de la barra (site-nav.css), la etiqueta se balancea. Se quita
          // y se vuelve a poner la clase para que se balancee en cada pulsación.
          const colgante = e.currentTarget.closest(".nav-sonido");
          if (colgante) {
            colgante.classList.remove("is-meciendo");
            void (colgante as HTMLElement).offsetWidth;
            colgante.classList.add("is-meciendo");
            // Al acabar, vuelve a su vaivén suave de siempre.
            colgante.addEventListener("animationend", () => colgante.classList.remove("is-meciendo"), { once: true });
            // Y la nota a mano que confirma el cambio, unos segundos.
            colgante.classList.add("con-nota");
            window.clearTimeout(nota.current);
            nota.current = window.setTimeout(() => colgante.classList.remove("con-nota"), 2200);
          }
          // Un sonido para cada cosa: al apagar suena ANTES de silenciar (si no,
          // ya no se oiría) y al encender, DESPUÉS (confirma que ya suena).
          if (activo) {
            sonar("apagar");
            fijarSonido(false);
          } else {
            fijarSonido(true);
            sonar("encender");
          }
        }}
      >
        {activo ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
      </Tecla>
      {/* Solo se ve colgada de la barra (site-nav.css); el estado ya lo dice
          `aria-pressed` a quien usa lector de pantalla. */}
      <span className="sonido-nota" aria-hidden="true">{activo ? "sonido activado" : "en silencio"}</span>
    </>
  );
}
