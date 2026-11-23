"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Lightbulb, MessageCircle } from "lucide-react";
import { colorDe } from "@/components/foro/categorias";
import type { HiloSugerido } from "@/lib/foro/tipos";

/**
 * «¿Es alguna de estas?» (23-11-2026): mientras se escribe el título de una
 * pregunta nueva, las que ya hay en el foro y se le parecen. Es lo que más
 * evita las preguntas repetidas.
 *
 * Se piden un momento después de dejar de teclear (`/api/foro/buscar` en modo
 * `parecidas`: solo lo publicado). Se abren en OTRA pestaña, para no perder
 * lo que se lleva escrito. Si no hay ninguna parecida, no se pinta nada.
 */
export default function PreguntasParecidas({ titulo }: { titulo: string }) {
  const [hilos, setHilos] = useState<HiloSugerido[]>([]);
  const consulta = titulo.trim();

  useEffect(() => {
    if (consulta.length < 10) {
      const t = setTimeout(() => setHilos([]), 0);
      return () => clearTimeout(t);
    }
    const corte = new AbortController();
    const espera = setTimeout(() => {
      fetch(`/api/foro/buscar?modo=parecidas&q=${encodeURIComponent(consulta.slice(0, 80))}`, { cache: "no-store", signal: corte.signal })
        .then((r) => r.json())
        .then((d: unknown) => {
          const r = d as { ok?: boolean; hilos?: unknown };
          setHilos(r.ok === true && Array.isArray(r.hilos) ? (r.hilos as HiloSugerido[]) : []);
        })
        .catch(() => { /* Abortada o sin red: se queda lo que hubiera. */ });
    }, 450);
    return () => { clearTimeout(espera); corte.abort(); };
  }, [consulta]);

  if (!hilos.length) return null;

  return (
    <aside className="fq-parecidas" aria-live="polite" aria-label="Preguntas parecidas que ya están en el foro">
      <p className="fq-parecidas-titulo">
        <span className="fq-parecidas-icono" aria-hidden="true"><Lightbulb size={16} strokeWidth={2.6} /></span>
        ¿Es alguna de estas?
        <small>puede que ya esté respondida</small>
      </p>
      <ul>
        {hilos.map((h) => (
          <li key={h.id} style={colorDe(h.categoria.slug)}>
            <a href={`/foro/${h.id}-${h.slug}`} target="_blank" rel="noopener" className="fq-parecida">
              <span className={`fq-parecida-estado${h.resuelto ? " is-resuelta" : ""}`}>
                {h.resuelto ? <Check size={13} strokeWidth={3.4} aria-hidden="true" /> : <MessageCircle size={13} strokeWidth={2.8} aria-hidden="true" />}
                {h.resuelto ? "resuelta" : h.respuestas === 1 ? "1 respuesta" : `${h.respuestas} respuestas`}
              </span>
              <b>{h.titulo}</b>
              <ExternalLink size={14} strokeWidth={2.6} aria-hidden="true" className="fq-parecida-fuera" />
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
