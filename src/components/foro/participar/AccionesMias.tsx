"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";

/** Marcar todos los avisos como leídos. Solo los propios: lo decide el servidor. */
export function MarcarLeidos({ hay }: { hay: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  if (!hay) return null;

  async function marcar() {
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/foro/avisos", {});
    setEnviando(false);
    if (!r.ok) setError(r.mensaje);
    else router.refresh();
  }

  return (
    <>
      <button type="button" className="fp-btn" disabled={enviando} onClick={marcar}>
        {enviando ? "Marcando…" : "Marcar todos como leídos"}
      </button>
      {error && <span className="fp-error" role="alert">{error}</span>}
    </>
  );
}

/** Aparecer o no en el ranking. Quien sale sigue ganando puntos y nivel (FORO.md §10.4). */
export function PreferenciaRanking({ fuera }: { fuera: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cambiar() {
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/foro/ranking", { fuera: !fuera });
    setEnviando(false);
    if (!r.ok) setError(r.mensaje);
    else router.refresh();
  }

  return (
    <p className="fm-ranking">
      {fuera ? "No apareces en el ranking." : "Apareces en el ranking con tu alias."}{" "}
      <button type="button" className="fp-accion" disabled={enviando} onClick={cambiar}>
        {enviando ? "Guardando…" : fuera ? "Volver a aparecer" : "No aparecer"}
      </button>
      {error && <span className="fp-error" role="alert">{error}</span>}
    </p>
  );
}
