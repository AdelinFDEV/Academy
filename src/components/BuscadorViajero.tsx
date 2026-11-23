"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bloquearScroll } from "@/lib/bloquearScroll";
import { sonar } from "@/lib/sonidos";

/**
 * El buscador del home que viaja al centro (23-11-2026, pedido por el admin:
 * «muy espectacular», SOLO en el ordenador).
 *
 * Envuelve la lupa, la nota y la barra. Al entrar en el campo, todo el grupo
 * sale volando con muelle hasta el centro de la pantalla, algo más grande, la
 * página se difumina detrás y la lupa da un salto de alegría. Se cierra
 * tocando fuera o con Escape, y el grupo vuelve a su sitio con el mismo
 * muelle. Se mueve con `transform` sobre el propio grupo (no se clona ni se
 * mueve en el DOM): el campo no pierde el foco ni lo que se ha escrito.
 *
 * En el móvil y la tableta no hace nada: ahí el buscador ya abre su hoja
 * (`GuideSearch ventanaEnMovil`). Con «reducir movimiento», tampoco.
 */

const PC = "(min-width: 1001px) and (hover: hover) and (prefers-reduced-motion: no-preference)";
/** Lo que dura el viaje de vuelta: el mismo que la transición de `.gh-viajero` (home.css). */
const VIAJE_MS = 650;

export default function BuscadorViajero({ children }: { children: React.ReactNode }) {
  const grupo = useRef<HTMLDivElement>(null);
  const [viajando, setViajando] = useState(false);
  const [velo, setVelo] = useState(false);
  const vuelta = useRef<ReturnType<typeof setTimeout> | null>(null);

  const volver = useCallback(() => {
    const el = grupo.current;
    if (!el || !el.classList.contains("is-viajando")) return;
    sonar("cerrar");
    setViajando(false);
    // Primero se marca como de vuelta: el Escape de abajo no vuelve a entrar aquí.
    el.classList.remove("is-viajando");
    el.style.transform = "";
    // Al cerrarse, el buscador se vacía, cierra sus sugerencias y suelta el
    // foco (23-11-2026, pedido por el admin): si no, el texto y el cursor se
    // quedaban en la barra y parecía que se podía seguir escribiendo sin la
    // ventana. El texto y el desplegable los guarda GuideSearch en su estado:
    // se borran con un `input` y un Escape de verdad, que es lo que escucha React.
    const campo = el.querySelector<HTMLInputElement>("input");
    if (campo) {
      if (campo.value) {
        const fijar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        fijar?.call(campo, "");
        campo.dispatchEvent(new Event("input", { bubbles: true }));
      }
      campo.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      campo.blur();
    }
    // Cuando ha vuelto, se quita el velo y el grupo deja de estar por encima.
    vuelta.current = setTimeout(() => {
      el.classList.remove("is-de-viaje");
      el.closest(".gh-cabecera")?.classList.remove("is-viaje");
      setVelo(false);
    }, VIAJE_MS);
  }, []);

  useEffect(() => {
    const el = grupo.current;
    if (!el) return;
    const mq = window.matchMedia(PC);

    function alFoco(e: FocusEvent) {
      if (!mq.matches || !el || el.classList.contains("is-viajando")) return;
      if (!(e.target instanceof HTMLInputElement)) return;
      if (vuelta.current) clearTimeout(vuelta.current);
      const r = el.getBoundingClientRect();
      const dx = window.innerWidth / 2 - (r.left + r.width / 2);
      const dy = window.innerHeight * 0.36 - (r.top + r.height / 2);
      el.closest(".gh-cabecera")?.classList.add("is-viaje");
      el.classList.add("is-de-viaje");
      setVelo(true);
      setViajando(true);
      sonar("abrir");
      // Un fotograma después, para que el navegador vea el punto de partida.
      requestAnimationFrame(() => {
        el.classList.add("is-viajando");
        el.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(1.22)`;
      });
    }

    el.addEventListener("focusin", alFoco);
    return () => el.removeEventListener("focusin", alFoco);
  }, []);

  // En el centro: la página quieta y Escape (o salir de la pantalla de PC) lo devuelve.
  useEffect(() => {
    if (!viajando) return;
    const soltar = bloquearScroll();
    const alTeclear = (e: KeyboardEvent) => { if (e.key === "Escape") volver(); };
    const alCambiar = () => volver();
    document.addEventListener("keydown", alTeclear);
    window.addEventListener("resize", alCambiar);
    return () => {
      soltar();
      document.removeEventListener("keydown", alTeclear);
      window.removeEventListener("resize", alCambiar);
    };
  }, [viajando, volver]);

  useEffect(() => () => { if (vuelta.current) clearTimeout(vuelta.current); }, []);

  return (
    <>
      <div ref={grupo} className="gh-viajero">
        {children}
      </div>
      {velo &&
        createPortal(
          <div className={`gh-viaje-velo${viajando ? " is-visible" : ""}`} onClick={volver} aria-hidden="true" />,
          document.body,
        )}
    </>
  );
}
