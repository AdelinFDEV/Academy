"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { destinoPorRuta, herramienta } from "@/lib/herramientas";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import NovaNav from "@/components/trading/NovaNav";

/**
 * Las tres piezas de pago, en el centro de la barra de escritorio. Sustituyen
 * el 31-10-2026 al buscador, que se fue a la vista en la sección de guías, en
 * /guias y en el menú.
 *
 * Van en una cápsula de cristal, cada una con su icono animado
 * (`IconosAnimados`) y el color de su pieza en el catálogo. Una burbuja de luz
 * se desliza hasta la que tiene el ratón encima y, si no hay ninguna, descansa
 * en la página en la que estás.
 *
 * A dónde lleva cada una lo decide el catálogo según quién mire: la ficha
 * pública a quien no tiene acceso, la herramienta a quien sí.
 */
const PIEZAS = [
  { id: "cursos", ruta: "/cursos", label: "Cursos", Icono: IconoCursos },
  { id: "portfolio", ruta: "/portfolio", label: "Portfolio Adelin", Icono: IconoPortfolio },
  { id: "diario", ruta: "/dashboard/trading", label: "Diario de Trading", Icono: IconoDiario },
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
    const h = herramienta(p.id);
    const href = destinoPorRuta(p.ruta, { logueado, premium });
    const activo = pathname === href || pathname.startsWith(href + "/");
    return { ...p, href, activo, color: h.color };
  });
  const conBurbuja = encima ?? enlaces.find((e) => e.activo)?.id ?? null;

  return (
    <ul className="nav-principal" onPointerLeave={() => setEncima(null)}>
      {enlaces.map((e) => (
        <li key={e.id}>
          <Link
            href={e.href}
            className={`nav-principal-enlace${e.activo ? " is-activo" : ""}`}
            style={{ "--c": e.color } as React.CSSProperties}
            aria-current={e.activo ? "page" : undefined}
            onPointerEnter={() => setEncima(e.id)}
            onFocus={() => setEncima(e.id)}
            onBlur={() => setEncima(null)}
          >
            {conBurbuja === e.id && (
              <motion.span
                layoutId="nav-principal-burbuja"
                className="nav-principal-burbuja"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                aria-hidden="true"
              />
            )}
            <span className="nav-principal-icono" aria-hidden="true">
              <e.Icono size={16} />
            </span>
            <span className="nav-principal-texto">{e.label}</span>
          </Link>
          {/* Nova, la asistente del Diario, al lado de su enlace. La ve todo el
              mundo; quien no tiene el Diario la ve bloqueada (08-11-2026). */}
          {e.id === "diario" && <NovaNav href={e.href} bloqueada={!conNova} />}
        </li>
      ))}
    </ul>
  );
}
