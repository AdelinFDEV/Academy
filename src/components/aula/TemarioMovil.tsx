"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ListTree, X } from "lucide-react";

/**
 * En móvil el temario no cabe al lado del texto: va en un panel que se abre
 * con un botón. El contenido del temario se pinta en el servidor y llega como
 * `children`; esto solo abre y cierra. Se cierra solo al navegar.
 */
export default function TemarioMovil({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  useEffect(() => setAbierto(false), [ruta]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <button type="button" className="aula-temario-toggle" onClick={() => setAbierto(true)} aria-expanded={abierto}>
        <ListTree size={16} aria-hidden="true" /> Temario
      </button>
      <aside className={`aula-temario${abierto ? " is-abierto" : ""}`} aria-label="Temario del curso">
        <button type="button" className="aula-temario-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar temario">
          <X size={18} />
        </button>
        {children}
      </aside>
      {abierto && <div className="aula-temario-velo" onClick={() => setAbierto(false)} aria-hidden="true" />}
    </>
  );
}
