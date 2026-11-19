"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { bloquearScroll } from "@/components/trading/useVentanaMovil";

/**
 * La «i» del súper hito de la cabecera (19-11-2026, pedido por el admin): al
 * pulsarla se abre una ventanita que explica exactamente cómo se consigue el
 * logro. Las cifras llegan del servidor (`tjStats.ts`), las mismas que usa
 * el diario para darlo: si cambia una regla, esto la sigue.
 */
export default function InfoSuperHito({ meses, minOps, maxRojo }: { meses: number; minOps: number; maxRojo: number }) {
  const [abierta, setAbierta] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierta) return;
    // Con la ventanita abierta, la página de detrás no se mueve (como todas
    // las ventanas emergentes de la web).
    const soltar = bloquearScroll();
    cerrar.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      soltar();
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierta]);

  function salir() {
    setAbierta(false);
    boton.current?.focus();
  }

  return (
    <>
      <button
        ref={boton}
        type="button"
        className="dj-sh-info"
        aria-label="Cómo se consigue el súper hito"
        aria-haspopup="dialog"
        onClick={() => setAbierta(true)}
      >
        <Info size={20} strokeWidth={2.6} aria-hidden="true" />
      </button>

      {/* Al <body>: la ficha va girada, y dentro de ella «fixed» no cubriría
          la pantalla. */}
      {abierta && createPortal(
        <div className="dj-sh-velo" onClick={salir}>
          <div
            className="dj-sh-pop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dj-sh-pop-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <button ref={cerrar} type="button" className="dj-sh-pop-cerrar" aria-label="Cerrar" onClick={salir}>
              <X size={18} strokeWidth={2.8} aria-hidden="true" />
            </button>
            <p className="dj-sh-pop-nota">Así se consigue</p>
            <p id="dj-sh-pop-titulo" className="dj-sh-pop-titulo">«Conseguiste vivir del trading»</p>
            <ol className="dj-sh-pop-lista">
              <li><b>{meses} meses cerrados seguidos</b>, sin saltarte ninguno.</li>
              <li>En cada uno, <b>{minOps} operaciones o más</b>.</li>
              <li>El año entero, <b>en beneficio</b>.</li>
              <li>Como mucho, <b>{maxRojo} meses en rojo</b>.</li>
            </ol>
            <p className="dj-sh-pop-p">
              Un mes que no cumple <b>reinicia la cuenta</b> desde cero. Una vez conseguido, el logro es tuyo
              <b> para siempre</b>.
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
