"use client";

import { useState } from "react";
import { pedirForo } from "@/components/foro/pedir";
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
      setInvitar(mio.motivo);
      return;
    }
    setEnviando(true);
    setError("");
    const r = await pedirForo<{ me_gusta: number }>("/api/foro/me-gusta", { respuesta: respuestaId, poner: !puesto });
    setEnviando(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setCuenta(r.me_gusta);
    cambiar((a) => ({
      ...a,
      meGusta: puesto ? a.meGusta.filter((x) => x !== respuestaId) : [...a.meGusta, respuestaId],
    }));
  }

  if (esMio) {
    return (
      <span className="fh-megusta">
        <b>{cuenta}</b> me gusta
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`fp-accion fp-megusta${puesto ? " is-puesto" : ""}`}
        aria-pressed={puesto}
        disabled={enviando || !mio}
        onClick={alternar}
      >
        <b>{cuenta}</b> Me gusta
      </button>
      {error && <span className="fp-error" role="alert">{error}</span>}
      {invitar !== null && <Invitacion motivo={invitar} onCerrar={() => setInvitar(null)} />}
    </>
  );
}
