"use client";

import { Download } from "lucide-react";
import Tecla, { type ColorTecla } from "@/components/cuaderno/Tecla";

/**
 * «Descargar en PDF»: abre el diálogo de impresión, donde se elige «Guardar
 * como PDF». Es la única tecla de imprimir de la web: la usan el certificado
 * del aula y el de la vitrina (/dashboard/certificados/<codigo>).
 */
export default function BotonImprimir({ color = "naranja" }: { color?: ColorTecla }) {
  return (
    <Tecla color={color} onClick={() => window.print()}>
      <Download size={17} strokeWidth={2.6} aria-hidden="true" /> Descargar en PDF
    </Tecla>
  );
}
