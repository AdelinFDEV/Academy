"use client";

import { useState } from "react";
import { Bookmark, Check } from "lucide-react";

/**
 * «Guardar en mi diccionario», junto al título de la ficha.
 *
 * ── Por qué esto y no una banda ────────────────────────────────────────────
 *
 * Arriba de cada ficha hay una llamada a crear cuenta, pero solo para quien no
 * la tiene. A quien ya ha entrado no se le pone nada: **ya convirtió**, y una
 * banda ahí solo compite con lo que ha venido a leer. Estuvo unas horas
 * enseñándole «¿te ha servido?» antes siquiera de que leyera el texto, que es
 * una pregunta sin sentido en ese punto.
 *
 * Lo que sí le sirve es esto: guardar el término. Es la única acción de esta
 * página que necesita cuenta, y ocupa un botón, no un bloque.
 *
 * Reutiliza `/api/terms`, el mismo que el listado del diccionario. La clave es
 * `term`, no el slug — así lo guarda la tabla `saved_terms` desde el principio.
 */
export default function GuardarTermino({
  term,
  definition,
  category,
  guardadoInicial,
}: {
  term: string;
  definition: string;
  category: string;
  guardadoInicial: boolean;
}) {
  const [guardado, setGuardado] = useState(guardadoInicial);
  const [enCurso, setEnCurso] = useState(false);

  async function alternar() {
    setEnCurso(true);
    // Se pinta el cambio antes de que responda el servidor: es una acción
    // trivial y esperar medio segundo a un tic hace que parezca rota.
    const previo = guardado;
    setGuardado(!previo);
    try {
      const res = await fetch("/api/terms", {
        method: previo ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, definition, category }),
      });
      if (!res.ok) setGuardado(previo);
    } catch {
      setGuardado(previo);
    } finally {
      setEnCurso(false);
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={enCurso}
      className={`termino-guardar${guardado ? " is-guardado" : ""}`}
      aria-pressed={guardado}
    >
      {guardado ? (
        <Check size={14} strokeWidth={2.8} aria-hidden="true" />
      ) : (
        <Bookmark size={14} strokeWidth={2.4} aria-hidden="true" />
      )}
      {guardado ? "Guardado" : "Guardar"}
    </button>
  );
}
