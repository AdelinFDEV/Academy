import { notFound } from "next/navigation";
import { entradaAlForo } from "@/lib/foro/permisos";
import "./foro.css";

/**
 * Todo `/foro/**`.
 *
 * Con el foro en modo `cerrado` (así nace, hasta la beta), para quien no es
 * admin estas páginas NO EXISTEN: 404, no «acceso denegado» (FORO.md §16).
 * Cada página lo vuelve a comprobar por su cuenta, porque Next no vuelve a
 * ejecutar un layout al navegar entre sus páginas hijas.
 *
 * Sin canónica aquí a propósito: en Next la heredarían todas las rutas hijas
 * (AGENTS.md). Cada página pone la suya.
 */
export default async function ForoLayout({ children }: { children: React.ReactNode }) {
  const { visible } = await entradaAlForo();
  if (!visible) notFound();
  return children;
}
