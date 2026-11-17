"use client";

import { useEffect } from "react";

/**
 * Con el teclado del móvil abierto, la tecla de enviar suele quedar debajo,
 * tapada: la persona escribe y no ve cómo seguir. Al enfocar un campo (y cada
 * vez que el teclado cambia el alto visible) se desplaza lo justo para que la
 * tecla de enviar asome, sin sacar de la vista el campo que se está
 * escribiendo. Desplaza la caja que tenga scroll propio (el fondo de una
 * ventana modal) o, si no hay, la página.
 *
 * La tecla de enviar es la `type="submit"` del formulario del campo o, donde
 * no hay formulario, la que lleve `data-enviar` dentro de la misma ventana.
 * Solo en pantallas táctiles: en escritorio no hay teclado que tape nada.
 *
 * Lo usan las pantallas de acceso (AccesoShell) y las ventanas de la cuenta
 * (ChangePasswordModal, DeleteAccountModal).
 */
export function useEnviarALaVista() {
  useEffect(() => {
    const visor = window.visualViewport;
    if (!visor || !window.matchMedia("(pointer: coarse)").matches) return;
    const vv = visor;
    let espera: number | undefined;

    function cajaConScroll(desde: HTMLElement): HTMLElement | null {
      for (let el = desde.parentElement; el; el = el.parentElement) {
        const { overflowY } = getComputedStyle(el);
        if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) return el;
      }
      return null;
    }

    function ajustar() {
      const activo = document.activeElement;
      if (!(activo instanceof HTMLInputElement)) return;
      const enviar =
        activo.closest("form")?.querySelector<HTMLElement>('[type="submit"]') ??
        activo.closest('[role="dialog"]')?.querySelector<HTMLElement>("[data-enviar]");
      if (!enviar) return;
      const fondoVisible = vv.offsetTop + vv.height;
      const falta = enviar.getBoundingClientRect().bottom + 12 - fondoVisible;
      if (falta <= 0) return;
      // Nunca más de lo que deja el campo a la vista por arriba.
      const margen = activo.getBoundingClientRect().top - vv.offsetTop - 12;
      const subir = Math.min(falta, margen);
      if (subir <= 0) return;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      const caja = cajaConScroll(activo);
      if (caja) caja.scrollBy({ top: subir, behavior });
      else window.scrollBy({ top: subir, behavior });
    }

    function programar() {
      window.clearTimeout(espera);
      espera = window.setTimeout(ajustar, 150);
    }

    vv.addEventListener("resize", programar);
    document.addEventListener("focusin", programar);
    return () => {
      window.clearTimeout(espera);
      vv.removeEventListener("resize", programar);
      document.removeEventListener("focusin", programar);
    };
  }, []);
}

/** La misma ayuda, para colgarla de un componente de servidor (AccesoShell). */
export default function EnviarALaVista() {
  useEnviarALaVista();
  return null;
}
