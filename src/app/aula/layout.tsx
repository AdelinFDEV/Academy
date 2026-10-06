import type { Metadata } from "next";
import "./aula.css";

/**
 * El aula es de pago y personal: nada aquí se indexa. Va en el layout porque
 * es un `noindex` para TODAS las rutas hijas, que es justo lo que se quiere
 * (lo que nunca va en un layout es una canónica: ver PLATAFORMA.md).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AulaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
