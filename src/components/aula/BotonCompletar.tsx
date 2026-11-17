"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

/**
 * «Completar y seguir» al final de una lección: la marca como hecha y lleva
 * a lo siguiente (otra lección o el examen del módulo). Si ya estaba hecha,
 * solo navega.
 *
 * Es la tecla grande del final de la lección: menta mientras falta marcarla
 * (lo «hecho» del sistema de diseño), naranja cuando solo queda seguir.
 * Completarla suena a `avance` (un paso más en el camino); si no se guarda,
 * a `error`, con el aviso a la vista.
 */
export default function BotonCompletar({
  curso,
  leccion,
  hecha,
  destino,
  etiqueta,
}: {
  curso: string;
  leccion: string;
  hecha: boolean;
  destino: string;
  etiqueta: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completar() {
    if (hecha) {
      router.push(destino);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/cursos/leccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso, leccion }),
      });
      const d: { error?: string } = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar el progreso.");
      sonar("avance");
      router.push(destino);
      router.refresh();
    } catch (e) {
      sonar("error");
      setError(e instanceof Error ? e.message : "No se pudo guardar el progreso.");
      setEnviando(false);
    }
  }

  return (
    <div className="aula-completar">
      <Tecla color={hecha ? "naranja" : "menta"} tamano="grande" onClick={completar} disabled={enviando}>
        {!hecha && <Check size={20} strokeWidth={3} aria-hidden="true" />}
        {enviando ? "Guardando…" : hecha ? etiqueta : `Completar y ${etiqueta.toLowerCase()}`}
        {!enviando && <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />}
      </Tecla>
      {error && <p className="aula-error" role="alert">{error}</p>}
    </div>
  );
}
