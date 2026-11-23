"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { bloquearScroll } from "@/lib/bloquearScroll";
import { sonar } from "@/lib/sonidos";
import "@/components/buscador-popup.css";

export type CategoriaMovil = {
  /** `null` = «Todas». */
  slug: string | null;
  nombre: string;
  hilos: number;
  activa: boolean;
  /** Sus colores (`--cat`, `--cat-o`, `--cat-s`, `--cat-t`), de `colorDe`. */
  estilo?: React.CSSProperties;
  icono: React.ReactNode;
};

/**
 * Las categorías del foro en el móvil (23-11-2026, pedido por el admin): en
 * vez de la tira de teclas, una sola tecla con la categoría en la que estás
 * que abre la misma ventana de libreta que el buscador del diccionario
 * (buscador-popup.css), con una fila grande por categoría, su color y su
 * cuenta. En el ordenador sigue la tira de teclas (listado.css).
 */
export default function CategoriasMovil({ categorias }: { categorias: CategoriaMovil[] }) {
  const [abierta, setAbierta] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const actual = categorias.find((c) => c.activa) ?? categorias[0];

  useEffect(() => {
    if (!abierta) return;
    const soltar = bloquearScroll();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      sonar("cerrar");
      setAbierta(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => { soltar(); document.removeEventListener("keydown", alTeclear); };
  }, [abierta]);

  function abrir() {
    sonar("abrir");
    setAbierta(true);
  }

  function cerrar() {
    sonar("cerrar");
    setAbierta(false);
    boton.current?.focus();
  }

  return (
    <>
      <Tecla
        ref={boton}
        color="blanca"
        className="flc-cat-movil"
        style={actual.estilo}
        onClick={abrir}
        aria-haspopup="dialog"
        aria-expanded={abierta}
      >
        <span className="fl-categoria-icono" aria-hidden="true">{actual.icono}</span>
        <span className="flc-cat-movil-texto">
          <small>Categoría</small>
          {actual.nombre}
        </span>
        <span className="fl-categoria-cuenta">{actual.hilos}</span>
        <ChevronDown size={18} strokeWidth={2.8} aria-hidden="true" className="flc-cat-movil-flecha" />
      </Tecla>

      {abierta &&
        createPortal(
          <div className="bp-velo" onClick={cerrar}>
            <div
              className="bp-hoja flc-cat-hoja"
              role="dialog"
              aria-modal="true"
              aria-label="Elegir una categoría del foro"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="bp-cerrar" aria-label="Cerrar" onClick={cerrar}>
                <X size={18} strokeWidth={2.8} aria-hidden="true" />
              </button>
              <p className="bp-nota" aria-hidden="true">¿de qué quieres hablar?</p>

              <ul className="flc-cat-lista">
                {categorias.map((c, i) => (
                  <li key={c.slug ?? "todas"} style={{ "--i": i } as React.CSSProperties}>
                    <Link
                      href={c.slug ? `/foro/${c.slug}` : "/foro"}
                      className={`flc-cat-fila${c.activa ? " is-activa" : ""}`}
                      style={c.estilo}
                      aria-current={c.activa ? "page" : undefined}
                      onClick={() => { sonar("elegir"); setAbierta(false); }}
                    >
                      <span className="flc-cat-fila-icono" aria-hidden="true">{c.icono}</span>
                      <span className="flc-cat-fila-nombre">{c.nombre}</span>
                      <span className="flc-cat-fila-cuenta">{c.hilos}</span>
                      {c.activa && <Check className="flc-cat-fila-check" size={18} strokeWidth={3} aria-hidden="true" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
