"use client";

import { useEffect } from "react";

/**
 * Apertura y cierre suaves para TODOS los acordeones de la web (10-11-2026,
 * pedido por el admin): las preguntas frecuentes, el temario de los cursos y
 * del aula, «Cambiar mi ritmo» y cualquier `<details>` que se añada después.
 *
 * Vive en el layout raíz y escucha los clics del documento: no hay que tocar
 * cada acordeón ni acordarse de usar un componente especial. El navegador abre
 * y cierra un `<details>` de golpe; aquí se cancela ese salto y se anima la
 * altura con la Web Animations API, con la misma curva que el desplegable de
 * las operaciones del Diario (`TjTradeLog`).
 *
 * - Se puede pulsar a mitad de animación: sigue desde donde está, sin saltos.
 * - El teclado (Intro o Espacio sobre el título) dispara el mismo clic.
 * - Con «reducir movimiento» activado en el sistema, se abre de golpe.
 * - Un `<details data-sin-animacion>` queda fuera.
 * - Un enlace o un botón DENTRO del título siguen funcionando como siempre.
 */

const DURACION = 340;
const CURVA = "cubic-bezier(0.22, 1, 0.36, 1)";

const animaciones = new WeakMap<HTMLDetailsElement, Animation>();

/** Alto del acordeón cerrado: el título más el relleno y el borde del propio `<details>`. */
function altoCerrado(d: HTMLDetailsElement, summary: HTMLElement): number {
  const cs = getComputedStyle(d);
  const ss = getComputedStyle(summary);
  const px = (v: string) => parseFloat(v) || 0;
  return (
    summary.getBoundingClientRect().height +
    px(ss.marginTop) + px(ss.marginBottom) +
    px(cs.paddingTop) + px(cs.paddingBottom) +
    px(cs.borderTopWidth) + px(cs.borderBottomWidth)
  );
}

function animar(d: HTMLDetailsElement, summary: HTMLElement) {
  const previa = animaciones.get(d);
  const desde = d.getBoundingClientRect().height;
  // A mitad de animación, el destino es el contrario del que llevaba.
  const abriendo = previa ? d.dataset.acordeon === "cerrando" : !d.open;
  previa?.cancel();

  d.style.overflow = "hidden";
  d.dataset.acordeon = abriendo ? "abriendo" : "cerrando";

  let hasta: number;
  if (abriendo) {
    d.open = true;
    hasta = d.getBoundingClientRect().height;
    // El contenido entra con un fundido corto, para que no aparezca recortado.
    for (const hijo of Array.from(d.children)) {
      if (hijo === summary) continue;
      hijo.animate(
        [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }],
        { duration: DURACION, easing: CURVA },
      );
    }
  } else {
    hasta = altoCerrado(d, summary);
  }

  const anim = d.animate([{ height: `${desde}px` }, { height: `${hasta}px` }], { duration: DURACION, easing: CURVA });
  animaciones.set(d, anim);

  const limpiar = () => {
    if (animaciones.get(d) !== anim) return;
    animaciones.delete(d);
    delete d.dataset.acordeon;
    d.style.overflow = "";
  };
  anim.onfinish = () => {
    if (!abriendo) d.open = false;
    limpiar();
  };
  anim.oncancel = limpiar;
}

export default function AcordeonesSuaves() {
  useEffect(() => {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");

    const alPulsar = (e: MouseEvent) => {
      if (e.defaultPrevented || reducir.matches) return;
      if (!(e.target instanceof Element)) return;
      const summary = e.target.closest("summary");
      if (!summary) return;
      const d = summary.parentElement;
      if (!(d instanceof HTMLDetailsElement) || d.querySelector(":scope > summary") !== summary) return;
      if (d.hasAttribute("data-sin-animacion")) return;
      // Un enlace o un botón dentro del título hacen lo suyo, no abren.
      const interactivo = e.target.closest("a, button, input, select, textarea, label");
      if (interactivo && summary.contains(interactivo)) return;

      e.preventDefault();
      animar(d, summary);
    };

    document.addEventListener("click", alPulsar);
    return () => document.removeEventListener("click", alPulsar);
  }, []);

  return null;
}
