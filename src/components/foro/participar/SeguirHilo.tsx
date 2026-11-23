"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { sonar } from "@/lib/sonidos";
import { useHilo } from "./ContextoHilo";
import Invitacion from "./Invitacion";

/**
 * Seguir un hilo (23-11-2026): quien lo sigue recibe un aviso con cada
 * respuesta nueva, aunque la pregunta no sea suya. Es un conmutador.
 *
 * Quien preguntó no lo ve: de su pregunta ya le llegan las respuestas. Quien
 * no puede participar ve el botón igual, y al pulsarlo sale la invitación
 * (FORO.md §3); la barrera de verdad es el servidor.
 */
export default function SeguirHilo() {
  const { preguntaId, mio, cambiar } = useHilo();
  const [enviando, setEnviando] = useState(false);
  const [invitar, setInvitar] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (mio?.esAutorDeLaPregunta) return null;
  const sigue = mio?.sigue ?? false;

  async function alternar() {
    if (!mio || enviando) return;
    if (!mio.puede) {
      if (invitar === null) sonar("abrir");
      setInvitar(mio.motivo);
      return;
    }
    setEnviando(true);
    setError("");
    const r = await pedirForo<{ siguiendo: boolean }>("/api/foro/seguir", { pregunta: preguntaId, poner: !sigue });
    setEnviando(false);
    if (!r.ok) {
      sonar("error");
      setError(r.mensaje);
      return;
    }
    sonar("interruptor");
    cambiar((antes) => ({ ...antes, sigue: r.siguiendo === true }));
  }

  return (
    <div className="fh-seguir">
      <Tecla
        color={sigue ? "menta" : "blanca"}
        tamano="peq"
        className={`fh-seguir-tecla${sigue ? " is-siguiendo" : ""}`}
        aria-pressed={sigue}
        title={sigue ? "Te avisamos de cada respuesta nueva. Pulsa para dejar de seguirlo." : "Te avisamos de cada respuesta nueva en este hilo"}
        disabled={!mio || enviando}
        onClick={alternar}
      >
        {sigue ? <BellRing size={16} strokeWidth={2.6} aria-hidden="true" /> : <Bell size={16} strokeWidth={2.6} aria-hidden="true" />}
        {sigue ? "Siguiendo" : "Seguir hilo"}
      </Tecla>
      {error && <p className="fp-error" role="alert">{error}</p>}
      {invitar !== null && <Invitacion motivo={invitar} onCerrar={() => { sonar("cerrar"); setInvitar(null); }} />}
    </div>
  );
}
