"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

/**
 * «Rehacer el curso» para mejorar la nota. Pide confirmación antes, porque
 * borra el progreso y las notas de los módulos de ese curso (el certificado se
 * conserva hasta que se apruebe otra vez el final). Ver api/cursos/rehacer.
 *
 * La confirmación es un aviso amarillo (riesgo) del sistema de diseño.
 */
export default function BotonRehacer({ curso, notaActual }: { curso: string; notaActual: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rehacer() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/cursos/rehacer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo reiniciar el curso.");
      setConfirmando(false);
      router.push(`/aula/${curso}`);
      router.refresh();
    } catch (err) {
      sonar("error");
      setError(err instanceof Error ? err.message : "No se pudo reiniciar el curso.");
    } finally {
      setEnviando(false);
    }
  }

  if (!confirmando) {
    return (
      <div className="aula-rehacer">
        <Tecla color="blanca" tamano="peq" onClick={() => { sonar("abrir"); setConfirmando(true); }}>
          <RotateCcw size={15} strokeWidth={2.6} aria-hidden="true" /> Rehacer el curso para mejorar tu nota
        </Tecla>
      </div>
    );
  }

  return (
    <div className="aula-rehacer-confirmar" role="alertdialog" aria-labelledby="aula-rehacer-titulo">
      <p id="aula-rehacer-titulo" className="aula-rehacer-titulo">¿Rehacer el curso desde el principio?</p>
      <ul className="aula-rehacer-lista">
        <li>Se borran tus lecciones completadas y las notas de los exámenes de este curso. Los módulos vuelven a abrirse de uno en uno.</li>
        <li>Tu certificado <strong>sigue siendo tuyo</strong>, con su código y su nota actual ({notaActual}), mientras lo rehaces.</li>
        <li>Al aprobar de nuevo el examen final, el certificado se actualiza con la <strong>nueva nota, aunque sea más baja</strong>, y conserva el mismo código.</li>
      </ul>
      {error && <p className="aula-error" role="alert">{error}</p>}
      <div className="aula-rehacer-acciones">
        <Tecla color="blanca" tamano="peq" onClick={() => { sonar("cerrar"); setConfirmando(false); }} disabled={enviando}>
          Cancelar
        </Tecla>
        <Tecla color="coral" tamano="peq" onClick={rehacer} disabled={enviando}>
          <RotateCcw size={15} strokeWidth={2.6} aria-hidden="true" /> {enviando ? "Reiniciando…" : "Sí, rehacer el curso"}
        </Tecla>
      </div>
    </div>
  );
}
