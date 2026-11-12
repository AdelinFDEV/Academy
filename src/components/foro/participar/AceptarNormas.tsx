"use client";

import { useState } from "react";
import Link from "next/link";
import { pedirForo } from "@/components/foro/pedir";
import Invitacion from "./Invitacion";

/**
 * Aceptar las normas, al final de su página. El servidor guarda QUÉ versión
 * se aceptó: si las normas cambian, se vuelven a aceptar (FORO.md §13).
 */
export default function AceptarNormas({ version, conSesion }: { version: number; conSesion: boolean }) {
  const [enviando, setEnviando] = useState(false);
  const [aceptadas, setAceptadas] = useState(false);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!conSesion) return <Invitacion motivo="sin_sesion" />;

  async function aceptar() {
    setEnviando(true);
    setError("");
    setMotivo(null);
    const r = await pedirForo("/api/foro/normas", { version });
    setEnviando(false);
    if (r.ok) setAceptadas(true);
    // Quien no es Premium no «acepta» nada: se le enseña el paso que le falta.
    else if (r.error === "no_premium" || r.error === "falta_2fa") setMotivo(r.error);
    else setError(r.mensaje);
  }

  if (aceptadas) {
    return (
      <div className="fp-panel fn-aceptar">
        <p className="fp-hecho">Has aceptado las normas. Ya puedes participar en el foro.</p>
        <Link href="/foro" className="fp-btn fp-btn--firme">Ir al foro</Link>
      </div>
    );
  }

  return (
    <div className="fp-panel fn-aceptar">
      <p>Al aceptarlas confirmas que las has leído y que te comprometes a cumplirlas cuando participes en el foro.</p>
      <button type="button" className="fp-btn fp-btn--firme" disabled={enviando} onClick={aceptar}>
        {enviando ? "Guardando…" : "Acepto las normas"}
      </button>
      {motivo && <Invitacion motivo={motivo} />}
      {error && <p className="fp-error" role="alert">{error}</p>}
    </div>
  );
}
