"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

/**
 * Elegir el ritmo: cuántas horas a la semana. De aquí sale el cronograma.
 * Cada opción enseña la fecha en que terminaría, para que el alumno elija
 * sabiendo qué compromete y no un número abstracto.
 */

const OPCIONES = [
  { minutos: 60, nombre: "Tranquilo", detalle: "1 h a la semana" },
  { minutos: 120, nombre: "Constante", detalle: "2 h a la semana" },
  { minutos: 180, nombre: "Decidido", detalle: "3 h a la semana" },
  { minutos: 300, nombre: "Intensivo", detalle: "5 h a la semana" },
];

const DIA_MS = 24 * 60 * 60 * 1000;

export default function RitmoSelector({
  curso,
  minutosTotales,
  actual,
  textoBoton = "Empezar el curso",
}: {
  curso: string;
  minutosTotales: number;
  /** El ritmo que ya tiene, si está cambiándolo. */
  actual?: number;
  textoBoton?: string;
}) {
  const router = useRouter();
  const [elegido, setElegido] = useState(actual ?? 120);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fin = (minutos: number) =>
    new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" }).format(
      new Date(Date.now() + (minutosTotales / (minutos / 7)) * DIA_MS),
    );

  async function guardar() {
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/cursos/inscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso, minutosSemana: elegido }),
      });
      const d: { error?: string } = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
      setEnviando(false);
    }
  }

  return (
    <div className="aula-ritmo">
      <div className="aula-ritmo-opciones" role="radiogroup" aria-label="Horas a la semana">
        {OPCIONES.map((o) => (
          <button
            key={o.minutos}
            type="button"
            role="radio"
            aria-checked={elegido === o.minutos}
            className={`aula-ritmo-opcion${elegido === o.minutos ? " is-elegida" : ""}`}
            onClick={() => setElegido(o.minutos)}
          >
            {elegido === o.minutos && <span className="aula-ritmo-check"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>}
            <span className="aula-ritmo-nombre">{o.nombre}</span>
            <span className="aula-ritmo-detalle">{o.detalle}</span>
            <span className="aula-ritmo-fin">Terminarías el {fin(o.minutos)}</span>
          </button>
        ))}
      </div>
      {error && <p className="aula-error" role="alert">{error}</p>}
      <button type="button" className="aula-btn aula-btn--grande" onClick={guardar} disabled={enviando || elegido === actual}>
        {enviando ? "Guardando…" : textoBoton}
        {!enviando && <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />}
      </button>
      <p className="aula-ritmo-pie">Puedes cambiarlo cuando quieras. Lo que lleves hecho no se pierde.</p>
    </div>
  );
}
