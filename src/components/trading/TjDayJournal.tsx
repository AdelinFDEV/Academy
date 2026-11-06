"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ANIMOS, NOTA_MAX, type Animo, type DiaDiario } from "./tjDias";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "No se pudo guardar");

/**
 * Sensaciones de un día (ánimo y nota), dentro del formulario de operación: es el
 * único sitio donde se apuntan. El ánimo se guarda al pulsarlo; la nota, sola al
 * salir del campo (que es lo que pasa al pulsar «Guardar operación»). No a cada
 * tecla: sería una petición por letra.
 * Se monta con key={fecha}: cambiar de día empieza con el borrador limpio.
 */
export default function TjDayJournal({
  fecha,
  dia,
  isToday,
  onSave,
}: {
  fecha: string;
  dia: DiaDiario | undefined;
  isToday: boolean;
  onSave: (d: DiaDiario) => Promise<void>;
}) {
  const animo = dia?.animo ?? null;
  const guardada = dia?.nota ?? "";
  const [nota, setNota] = useState(guardada);
  const [saving, setSaving] = useState<"animo" | "nota" | null>(null);
  const [savedAt, setSavedAt] = useState<"animo" | "nota" | null>(null);
  const [error, setError] = useState("");

  async function save(next: { animo: Animo | null; nota: string }, what: "animo" | "nota") {
    setSaving(what);
    setError("");
    try {
      await onSave({ fecha, animo: next.animo, nota: next.nota.trim() || null });
      setSavedAt(what);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  const dirty = nota.trim() !== guardada.trim();

  return (
    <div className="tjd">
      <div className="tjd-mood">
        <span className="tjd-q">{isToday ? "¿Cómo te sientes hoy?" : "¿Cómo te sentiste este día?"}</span>
        <div className="tjd-moods" role="radiogroup" aria-label="Tu ánimo del día">
          {ANIMOS.map(a => (
            <button
              key={a.value}
              type="button"
              role="radio"
              aria-checked={animo === a.value}
              className={`tjd-mood-btn mood-${a.value}${animo === a.value ? " is-on" : ""}`}
              disabled={saving === "animo"}
              // Pulsar el que ya está elegido lo quita.
              onClick={() => save({ animo: animo === a.value ? null : a.value, nota: guardada }, "animo")}
            >
              <span className="tjd-emoji" aria-hidden="true">{a.emoji}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tjd-note">
        <label htmlFor={`tjd-nota-${fecha}`} className="tjd-q">
          {isToday ? "Tu nota de hoy" : "Tu nota del día"}
          <span className="tjd-hint">Lo que pasó, lo que sentiste, lo que aprendiste</span>
        </label>
        <textarea
          id={`tjd-nota-${fecha}`}
          value={nota}
          maxLength={NOTA_MAX}
          rows={3}
          placeholder={isToday ? "Desahógate un poco: ¿qué tal ha ido el día?" : "¿Qué recuerdas de este día?"}
          onChange={e => { setNota(e.target.value); setSavedAt(null); }}
          onBlur={dirty ? () => save({ animo, nota }, "nota") : undefined}
        />
        <div className="tjd-note-foot">
          <span className={`tjd-count${nota.length > NOTA_MAX - 60 ? " is-near" : ""}`}>{nota.length}/{NOTA_MAX}</span>
          {error && <span className="tjd-error" role="alert">{error}</span>}
          {savedAt && !dirty && !error && <span className="tjd-saved"><Check size={13} /> Guardado</span>}
          {saving === "nota" && <span className="tjd-count">Guardando...</span>}
        </div>
      </div>
    </div>
  );
}
