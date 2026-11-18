"use client";

import { useEffect, type RefObject } from "react";

/**
 * Lo que necesita una ventana del Diario o del Portfolio para usarse bien en el
 * móvil (17-11-2026, repaso de móvil).
 *
 * `bloquearScroll()`: la página de detrás no se desplaza mientras la ventana
 * está abierta. Hay que fijarlo en <html> Y en <body>: globals.css pone
 * `overflow-x: hidden` en <html>, y con eso el scroll es el de <html>; un
 * `overflow: hidden` solo en <body> no paraba nada y la página corría por
 * detrás del velo. Devuelve la función que lo deja como estaba.
 */
// Desde el 18-11-2026, el bloqueo común de toda la web (con contador:
// src/lib/bloquearScroll.ts). Se reexporta para quien ya lo importaba de aquí.
export { bloquearScroll } from "@/lib/bloquearScroll";

/**
 * Ajusta un velo fijo (`position: fixed`) a la parte de la pantalla que de
 * verdad se ve. Con el teclado del móvil abierto, el alto de la ventana del
 * navegador no cambia (ni `100svh` ni `100dvh` lo restan) y el pie de la
 * ventana —«Siguiente», «Guardar»— quedaba debajo del teclado. Con
 * `visualViewport` el velo se coloca en lo visible y la ventana, que mide como
 * mucho el velo, encoge: su pie queda siempre encima del teclado.
 *
 * Pone en el velo `--vv-alto`, `--vv-arriba` y `data-teclado` (el CSS usa las
 * variables con su valor por defecto, así que sin `visualViewport` todo sigue
 * como antes) y, si el campo con el foco queda tapado, lo trae a la vista
 * dentro de la ventana. Con la pantalla ampliada con dos dedos no se toca nada:
 * ahí lo visible es más pequeño por el zoom, no por el teclado.
 */
export function useAjusteTeclado(velo: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const vv = window.visualViewport;
    const el = velo.current;
    if (!vv || !el) return;
    let cuadro = 0;
    const ajustar = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        if (vv.scale > 1.05) {
          el.style.removeProperty("--vv-alto");
          el.style.removeProperty("--vv-arriba");
          el.removeAttribute("data-teclado");
          return;
        }
        el.style.setProperty("--vv-alto", `${Math.round(vv.height)}px`);
        el.style.setProperty("--vv-arriba", `${Math.round(vv.offsetTop)}px`);
        // Teclado abierto (lo visible es bastante más bajo que la ventana): el CSS
        // puede recoger lo accesorio para dejar sitio al campo y al pie.
        el.toggleAttribute("data-teclado", vv.height < window.innerHeight - 120);
        const foco = document.activeElement;
        if (foco instanceof HTMLElement && el.contains(foco) && /^(INPUT|TEXTAREA)$/.test(foco.tagName)) {
          foco.scrollIntoView({ block: "nearest" });
        }
      });
    };
    ajustar();
    vv.addEventListener("resize", ajustar);
    vv.addEventListener("scroll", ajustar);
    return () => {
      cancelAnimationFrame(cuadro);
      vv.removeEventListener("resize", ajustar);
      vv.removeEventListener("scroll", ajustar);
    };
  }, [velo]);
}
