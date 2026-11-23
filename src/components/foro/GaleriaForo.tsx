"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { bloquearScroll } from "@/lib/bloquearScroll";
import type { ImagenForo } from "@/lib/foro/tipos";
import { sonar } from "@/lib/sonidos";

/**
 * Las imágenes de un mensaje, como fotos pegadas, que se abren EN GRANDE
 * dentro de la página (23-11-2026): un visor a pantalla completa con la
 * foto, el contador, las flechas (y las del teclado, y deslizar con el dedo)
 * y un enlace para abrir el original.
 *
 * Cada foto sigue siendo un enlace de verdad a su archivo: sin JavaScript, o
 * con Ctrl+clic, se abre en otra pestaña como antes. Las direcciones son
 * siempre las del almacén público del foro (las pone el servidor); aquí no se
 * abre nada que venga de un texto.
 */
export default function GaleriaForo({
  imagenes,
  de,
  pequenas = false,
}: {
  imagenes: ImagenForo[];
  /** De quién son, para el texto alternativo: «la pregunta “…”», «la respuesta de Ana». */
  de: string;
  /** En una réplica: miniaturas más pequeñas. */
  pequenas?: boolean;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const origen = useRef<HTMLAnchorElement | null>(null);
  const cerrarBoton = useRef<HTMLButtonElement>(null);
  const toque = useRef<number | null>(null);
  const total = imagenes.length;

  const cerrar = useCallback(() => {
    sonar("cerrar");
    setAbierta(null);
    origen.current?.focus();
  }, []);

  const mover = useCallback(
    (paso: number) => {
      if (total < 2) return;
      sonar("tecla");
      setAbierta((n) => (n === null ? n : (n + paso + total) % total));
    },
    [total],
  );

  const visorAbierto = abierta !== null;
  useEffect(() => {
    if (!visorAbierto) return;
    const soltar = bloquearScroll();
    cerrarBoton.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowRight") mover(1);
      else if (e.key === "ArrowLeft") mover(-1);
      // El foco no sale del visor mientras está abierto.
      else if (e.key === "Tab") {
        const botones = Array.from(document.querySelectorAll<HTMLElement>(".fv-velo button, .fv-velo a"));
        if (!botones.length) return;
        const primero = botones[0];
        const ultimo = botones[botones.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => { soltar(); document.removeEventListener("keydown", alTeclear); };
    // Solo al abrir y al cerrar: cambiar de foto no vuelve a bloquear nada.
  }, [visorAbierto, cerrar, mover]);

  if (!total) return null;
  const actual = abierta === null ? null : imagenes[abierta];

  return (
    <>
      <ul className={`fh-imagenes${pequenas ? " fh-imagenes--peq" : ""}`}>
        {imagenes.map((img, i) => (
          <li key={img.url}>
            <a
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver en grande la imagen ${i + 1} de ${de}`}
              onClick={(e) => {
                // Ctrl, Mayús o la rueda: que se abra en otra pestaña, como un enlace.
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                origen.current = e.currentTarget;
                sonar("abrir");
                setAbierta(i);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- ya recodificada a WebP de 1.600 px por el servidor (FORO.md §6.6) */}
              <img src={img.url} alt={`Imagen ${i + 1} de ${de}`} width={img.ancho} height={img.alto} loading="lazy" decoding="async" />
            </a>
          </li>
        ))}
      </ul>

      {actual &&
        abierta !== null &&
        createPortal(
          <div
            className="fv-velo"
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen ${abierta + 1} de ${total}, de ${de}`}
            onClick={cerrar}
            onTouchStart={(e) => { toque.current = e.touches[0]?.clientX ?? null; }}
            onTouchEnd={(e) => {
              const inicio = toque.current;
              toque.current = null;
              const fin = e.changedTouches[0]?.clientX;
              if (inicio === null || fin === undefined || Math.abs(fin - inicio) < 50) return;
              mover(fin < inicio ? 1 : -1);
            }}
          >
            <div className="fv-barra" onClick={(e) => e.stopPropagation()}>
              <span className="fv-cuenta">{total > 1 ? `${abierta + 1} / ${total}` : "Imagen"}</span>
              <a href={actual.url} target="_blank" rel="noopener noreferrer" className="fv-boton" aria-label="Abrir el original en otra pestaña" title="Abrir el original">
                <ExternalLink size={18} strokeWidth={2.6} aria-hidden="true" />
              </a>
              <button ref={cerrarBoton} type="button" className="fv-boton fv-cerrar" aria-label="Cerrar" onClick={cerrar}>
                <X size={20} strokeWidth={2.8} aria-hidden="true" />
              </button>
            </div>

            {total > 1 && (
              <button type="button" className="fv-flecha fv-flecha--antes" aria-label="Imagen anterior" onClick={(e) => { e.stopPropagation(); mover(-1); }}>
                <ChevronLeft size={26} strokeWidth={2.8} aria-hidden="true" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element -- la misma imagen del almacén público, a su tamaño */}
            <img
              key={actual.url}
              className="fv-imagen"
              src={actual.url}
              alt={`Imagen ${abierta + 1} de ${de}`}
              width={actual.ancho}
              height={actual.alto}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />

            {total > 1 && (
              <button type="button" className="fv-flecha fv-flecha--despues" aria-label="Imagen siguiente" onClick={(e) => { e.stopPropagation(); mover(1); }}>
                <ChevronRight size={26} strokeWidth={2.8} aria-hidden="true" />
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
