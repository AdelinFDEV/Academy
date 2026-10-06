"use client";

import { Download } from "lucide-react";

/** Abre el diálogo de impresión, donde se elige «Guardar como PDF». */
export default function BotonImprimir() {
  return (
    <button type="button" className="aula-btn aula-btn--grande" onClick={() => window.print()}>
      <Download size={17} aria-hidden="true" /> Descargar en PDF
    </button>
  );
}
