"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { destinoPorRuta } from "@/lib/herramientas";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import NovaNav from "@/components/trading/NovaNav";
import { MOSTRAR_NOVA } from "@/components/trading/nova-visible";
import { sonar } from "@/lib/sonidos";

/**
 * Las tres piezas de pago, en el centro de la barra de escritorio. Sustituyen
 * el 31-10-2026 al buscador, que se fue a la vista en la sección de guías, en
 * /guias y en el menú.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): cada pieza lleva el color de su
 * sección (ESTILO.md: Cursos lila, Portfolio menta, Diario azul). Una ficha de
 * papel de su tono suave se desliza (framer-motion, `layoutId`) hasta la que
 * tiene el ratón encima; la de la página en la que estás es una tecla de su
 * color, con su canto.
 *
 * A dónde lleva cada una lo decide el catálogo según quién mire: la ficha
 * pública a quien no tiene acceso, la herramienta a quien sí.
 */
const PIEZAS = [
  { id: "cursos", ruta: "/cursos", label: "Cursos", tono: "lila", Icono: IconoCursos },
  { id: "portfolio", ruta: "/portfolio", label: "Portfolio Adelin", tono: "menta", Icono: IconoPortfolio },
  { id: "diario", ruta: "/dashboard/trading", label: "Diario de Trading", tono: "azul", Icono: IconoDiario },
] as const;

export default function NavPrincipal({ logueado, premium, conNova = false }: {
  logueado: boolean;
  premium: boolean;
  /** Tiene el Diario de Trading. Sin él, Nova sale igual en la barra, pero bloqueada. */
  conNova?: boolean;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [encima, setEncima] = useState<string | null>(null);

  const enlaces = PIEZAS.map((p) => {
    const href = destinoPorRuta(p.ruta, { logueado, premium });
    const activo = pathname === href || pathname.startsWith(href + "/");
    return { ...p, href, activo };
  });

  return (
    <ul className="nav-principal" onPointerLeave={() => setEncima(null)}>
      {enlaces.map((e) => (
        <li key={e.id}>
          <Link
            href={e.href}
            className={`nav-principal-enlace nav-tono--${e.tono}${e.activo ? " is-activo" : ""}`}
            aria-current={e.activo ? "page" : undefined}
            onPointerEnter={() => setEncima(e.id)}
            onPointerDown={() => sonar("tecla")}
            onFocus={() => setEncima(e.id)}
            onBlur={() => setEncima(null)}
          >
            {encima === e.id && !e.activo && (
              <motion.span
                layoutId="nav-principal-ficha"
                className="nav-principal-ficha"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
                aria-hidden="true"
              />
            )}
            <span className="nav-principal-icono" aria-hidden="true">
              <e.Icono size={15} />
            </span>
            <span className="nav-principal-texto">{e.label}</span>
          </Link>
          {/* Nova, la asistente del Diario, al lado de su enlace. La ve todo el
              mundo; quien no tiene el Diario la ve bloqueada (08-11-2026). */}
          {/* Oculta mientras llega la mascota (17-11-2026): ver nova-visible.ts. */}
          {MOSTRAR_NOVA && e.id === "diario" && <NovaNav href={e.href} bloqueada={!conNova} />}
        </li>
      ))}
    </ul>
  );
}
