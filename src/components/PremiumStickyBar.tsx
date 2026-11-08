"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";

/**
 * La barra de compra de /premium, fija abajo. Aparece cuando el hero (y su
 * botón) sale de la vista, y se va al volver arriba.
 *
 * Rehecha el 06-11-2026 sin framer-motion: una transición de CSS hace lo
 * mismo y no carga una librería por una barra.
 */
export default function PremiumStickyBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [visible, setVisible] = useState(false);
  const sentinela = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinela.current;
    if (!el) return;
    // El margen de abajo enorme hace que la sentinela cuente como «dentro»
    // mientras esté en cualquier punto por debajo del borde de arriba. Así el
    // cambio de estado pasa justo al cruzar ese borde, aunque se baje de un
    // salto: con el margen normal, saltar de «debajo de la pantalla» a
    // «encima» no cambiaba nada y la barra no salía.
    const observador = new IntersectionObserver(
      ([entrada]) => setVisible(!entrada.isIntersecting),
      { rootMargin: "0px 0px 100000px 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinela} className="pr-barra-sentinela" aria-hidden="true" />
      <div className={`pr-barra${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
        <div className="pr-barra-dentro">
          <span className="pr-barra-info">
            <span className="pr-barra-corona" aria-hidden="true"><Crown size={15} /></span>
            <span>
              <strong>Premium</strong>
              <small>{precioEur(PREMIUM_PRICE_EUR)}/mes · Sin permanencia</small>
            </span>
          </span>
          <Link href="/api/checkout" prefetch={false} className="pr-barra-cta" tabIndex={visible ? 0 : -1}>
            {isLoggedIn ? "Desbloquear todo" : "Empezar ahora"} <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
