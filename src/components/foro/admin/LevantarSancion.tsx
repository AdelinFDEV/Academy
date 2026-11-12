"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";

/** Levantar una sanción antes de tiempo. Los puntos que costó no vuelven. */
export default function LevantarSancion({ sancionId }: { sancionId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function levantar() {
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/admin/foro/levantar", { sancion: sancionId });
    setEnviando(false);
    if (!r.ok) setError(r.mensaje);
    else router.refresh();
  }

  return (
    <>
      <button type="button" className="fa-btn" disabled={enviando} onClick={levantar}>
        {enviando ? "Levantando…" : "Levantar"}
      </button>
      {error && <span className="fa-error" role="alert">{error}</span>}
    </>
  );
}
