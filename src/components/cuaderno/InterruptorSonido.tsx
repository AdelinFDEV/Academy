"use client";

import { useSyncExternalStore } from "react";
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

  return (
    <Tecla
      color="blanca"
      tamano={tamano}
      icono
      // Nombre fijo y el estado en `aria-pressed` («Silenciar», pulsado o no):
      // cambiar a la vez el nombre y el estado lo leería al revés.
      aria-label="Silenciar los sonidos"
      aria-pressed={!activo}
      title={activo ? "Silenciar los sonidos" : "Activar los sonidos"}
      onClick={() => {
        const nuevo = !activo;
        fijarSonido(nuevo);
        // Al encenderlo, el clic doble del interruptor confirma que ya suena.
        // Al apagarlo no suena nada más que la propia tecla al pulsarla.
        if (nuevo) sonar("interruptor");
      }}
    >
      {activo ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
    </Tecla>
  );
}
