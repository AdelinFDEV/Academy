"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
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
      <span className="fp-megusta es-propio" title="Los me gusta de tu mensaje">
        <Heart size={17} strokeWidth={2.2} aria-hidden="true" />
        <b>{cuenta}</b>
        <span className="fp-megusta-texto">me gusta</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`fp-megusta${puesto ? " is-puesto" : ""}`}
        aria-pressed={puesto}
        aria-label={`${cuenta} me gusta. ${puesto ? "Quitar el mío" : "Dar me gusta"}`}
        disabled={enviando || !mio}
        onClick={alternar}
      >
        <Heart size={17} strokeWidth={2.2} fill={puesto ? "currentColor" : "none"} aria-hidden="true" />
        <b>{cuenta}</b>
        <span className="fp-megusta-texto">me gusta</span>
      </button>
      {error && <span className="fp-error" role="alert">{error}</span>}
      {invitar !== null && <Invitacion motivo={invitar} onCerrar={() => setInvitar(null)} />}
    </>
  );
}
