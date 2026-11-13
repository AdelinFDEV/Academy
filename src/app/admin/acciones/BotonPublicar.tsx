"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Publica una guía o un curso, o lo devuelve a borrador. Pide confirmación en
 * el propio botón: publicar es visible para todo el mundo al instante.
 */
export default function BotonPublicar({ tipo, slug, publicar }: { tipo: "guia" | "curso"; slug: string; publicar: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"reposo" | "confirmar" | "enviando">("reposo");
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setPaso("enviando");
    setError(null);
    try {
      const res = await fetch("/api/admin/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, slug, publicar }),
      });
      if (!res.ok) {
        const datos = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(datos?.error ?? "No se pudo guardar. Inténtalo de nuevo.");
        setPaso("reposo");
        return;
      }
      router.refresh();
      setPaso("reposo");
    } catch {
      setError("No se pudo conectar. Inténtalo de nuevo.");
      setPaso("reposo");
    }
  }

  if (paso === "reposo") {
    return (
      <div className="ac-boton-caja">
        <button type="button" className={`ac-boton${publicar ? " ac-boton--publicar" : ""}`} onClick={() => setPaso("confirmar")}>
          {publicar ? "Publicar" : "Volver a borrador"}
        </button>
        {error && <p className="ac-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="ac-boton-caja">
      <p className="ac-confirmar">
        {publicar ? "Será visible para todos y Google podrá indexarlo." : "Dejará de verse en la web."}
      </p>
      <div className="ac-confirmar-botones">
        <button type="button" className={`ac-boton${publicar ? " ac-boton--publicar" : " ac-boton--peligro"}`} onClick={enviar} disabled={paso === "enviando"}>
          {paso === "enviando" ? "Guardando…" : publicar ? "Sí, publicar" : "Sí, retirar"}
        </button>
        <button type="button" className="ac-boton" onClick={() => setPaso("reposo")} disabled={paso === "enviando"}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
