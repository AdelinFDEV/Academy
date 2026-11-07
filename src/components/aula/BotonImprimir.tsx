"use client";

import { Download } from "lucide-react";

/**
 * Abre el diálogo de impresión, donde se elige «Guardar como PDF». Lo usan el
 * aula y la vitrina de certificados del dashboard, cada uno con sus clases.
 */
export default function BotonImprimir({ className = "aula-btn aula-btn--grande" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <Download size={17} aria-hidden="true" /> Descargar en PDF
    </button>
  );
}
