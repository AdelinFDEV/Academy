"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { sonar } from "@/lib/sonidos";
import { useHilo } from "./ContextoHilo";
import Invitacion from "./Invitacion";

/**
 * El me gusta de una respuesta o de una réplica.
 *
 * El número que llega es el público, el de todos. Si quien mira ya le dio,
 * se sabe por su estado personal (`useHilo`), no por la página. En lo propio
 * solo se enseña la cifra: nadie se valora a sí mismo (FORO.md §3).
 */
export default function MeGusta({ respuestaId, inicial }: { respuestaId: string; inicial: number }) {
  const { mio, cambiar } = useHilo();
  const [cuenta, setCuenta] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [invitar, setInvitar] = useState<string | null>(null);
  const [error, setError] = useState("");

  const puesto = mio?.meGusta.includes(respuestaId) ?? false;
  const esMio = mio?.mios.includes(respuestaId) ?? false;

  async function alternar() {
    if (!mio || enviando) return;
    if (!mio.puede) {
      sonar(invitar === null ? "abrir" : "cerrar");
      setInvitar(invitar === null ? mio.motivo : null);
      return;
    }
    setEnviando(true);
    setError("");
    const r = await pedirForo<{ me_gusta: number }>("/api/foro/me-gusta", { respuesta: respuestaId, poner: !puesto });
    setEnviando(false);
    if (!r.ok) {
      sonar("error");
      setError(r.mensaje);
      return;
    }
    // Es un conmutador (puesto / quitado): su sonido es el del interruptor.
    sonar("interruptor");
    setCuenta(r.me_gusta);
    cambiar((a) => ({
      ...a,
      meGusta: puesto ? a.meGusta.filter((x) => x !== respuestaId) : [...a.meGusta, respuestaId],
    }));
  }

  if (esMio) {
    return (
      <span className="fp-megusta es-propio" title="Los me gusta de tu mensaje">
        <Heart size={17} strokeWidth={2.6} aria-hidden="true" />
        <b>{cuenta}</b>
        <span className="fp-megusta-texto">me gusta</span>
      </span>
    );
  }

  return (
    <>
      <Tecla
        color={puesto ? "coral" : "blanca"}
        tamano="peq"
        className={`fp-megusta${puesto ? " is-puesto" : ""}`}
        aria-pressed={puesto}
        aria-label={`${cuenta} me gusta. ${puesto ? "Quitar el mío" : "Dar me gusta"}`}
        disabled={enviando || !mio}
        onClick={alternar}
      >
        <Heart size={17} strokeWidth={2.6} fill={puesto ? "currentColor" : "none"} aria-hidden="true" />
        <b>{cuenta}</b>
        <span className="fp-megusta-texto">me gusta</span>
      </Tecla>
      {error && <span className="fp-error" role="alert">{error}</span>}
      {invitar !== null && <Invitacion motivo={invitar} onCerrar={() => { sonar("cerrar"); setInvitar(null); }} />}
    </>
  );
}
