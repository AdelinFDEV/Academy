"use client";

import { useEffect } from "react";
import { acabaDeSonar, sonar } from "@/lib/sonidos";

/**
 * Los dos sonidos que no dependen de ninguna pieza (23-11-2026, pedidos por
 * el admin). Va una vez, en el layout raíz.
 *
 * 1. ESCRIBIR. Cada letra que se escribe en cualquier campo de la web suena
 *    con un «toc» suave (`escribir`). Se escucha el evento `input`, no las
 *    teclas: así suena igual con el teclado del móvil, y no suena con las
 *    flechas ni con atajos que no escriben nada. Solo lo que teclea la
 *    persona (`isTrusted`): un campo que la web rellena o vacía sola, calla.
 *
 * 2. LAS TARJETAS GRANDES. Las teclas (`Tecla`) ya suenan solas, pero muchas
 *    tarjetas son un enlace normal (un hilo del foro, una guía, un curso) y
 *    se pulsaban en silencio. Aquí, cualquier enlace o botón GRANDE que no
 *    haya sonado por su cuenta hace el mismo clic de tecla: `tecla` al bajar
 *    y `soltar` al subir. Los enlaces pequeños dentro de un texto, no.
 *
 * 🔴 Nada suena dos veces: este oyente va en `document`, después de los de
 * cada pieza, y si algo acaba de sonar (`acabaDeSonar`) no hace nada.
 */

/** Campos en los que se escribe texto. */
const TIPOS_DE_TEXTO = new Set(["text", "search", "email", "password", "url", "tel", "number", ""]);

function esCampoDeTexto(el: EventTarget | null): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return TIPOS_DE_TEXTO.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/** Lo que se pulsa y es «grande»: una tarjeta, una fila, un botón con cuerpo. */
function pulsableGrande(desde: EventTarget | null): HTMLElement | null {
  if (!(desde instanceof Element)) return null;
  const el = desde.closest<HTMLElement>("a[href], button, [role='button'], summary, label[for]");
  if (!el) return null;
  if (el.matches(":disabled, [aria-disabled='true']")) return null;
  const caja = el.getBoundingClientRect();
  // Un enlace dentro de un párrafo mide una línea: ese no suena.
  return caja.height >= 40 && caja.width >= 110 ? el : null;
}

export default function SonidosGlobales() {
  useEffect(() => {
    const alEscribir = (e: Event) => {
      if (!e.isTrusted || !esCampoDeTexto(e.target)) return;
      const tipo = (e as InputEvent).inputType ?? "";
      const dato = (e as InputEvent).data ?? "";
      // El espacio y el salto de línea, más graves, como sus teclas; borrar, un poco más apagado.
      const tono = tipo === "insertLineBreak" || tipo === "insertParagraph" ? 0.74 : dato === " " ? 0.8 : tipo.startsWith("delete") ? 0.9 : 1;
      sonar("escribir", tono);
    };

    const alBajar = (e: PointerEvent) => {
      if (e.button !== 0 || acabaDeSonar()) return;
      const el = pulsableGrande(e.target);
      if (!el) return;
      // Las tarjetas muy grandes, más graves, como una tecla grande.
      sonar("tecla", el.getBoundingClientRect().width > 420 ? 0.9 : 1);
    };

    const alPulsar = (e: MouseEvent) => {
      if (acabaDeSonar() || !pulsableGrande(e.target)) return;
      sonar("soltar");
    };

    document.addEventListener("input", alEscribir);
    document.addEventListener("pointerdown", alBajar);
    document.addEventListener("click", alPulsar);
    return () => {
      document.removeEventListener("input", alEscribir);
      document.removeEventListener("pointerdown", alBajar);
      document.removeEventListener("click", alPulsar);
    };
  }, []);

  return null;
}
