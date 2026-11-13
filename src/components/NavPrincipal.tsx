"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { destinoPorRuta } from "@/lib/herramientas";
import NovaNav from "@/components/trading/NovaNav";

/**
 * Las tres piezas de pago, en el centro de la barra de escritorio.
 *
 * Rehecha el 13-11-2026, pedido por el admin: la barra anterior (una cápsula
 * de cristal, un icono de color por pieza y una burbuja de luz) se veía
 * infantil. Ahora son enlaces de texto, sobrios, con una línea naranja bajo el
 * que está activo. Un solo color de acento en toda la barra.
 *
 * A dónde lleva cada una lo decide el catálogo según quién mire: la ficha
 * pública a quien no tiene acceso, la herramienta a quien sí.
 */
const PIEZAS = [
  { id: "cursos", ruta: "/cursos", label: "Cursos" },
  { id: "portfolio", ruta: "/portfolio", label: "Portfolio Adelin" },
  { id: "diario", ruta: "/dashboard/trading", label: "Diario de Trading" },
] as const;

export default function NavPrincipal({ logueado, premium, conNova = false }: {
  logueado: boolean;
  premium: boolean;
  /** Tiene el Diario de Trading. Sin él, Nova sale igual en la barra, pero bloqueada. */
  conNova?: boolean;
}) {
  const pathname = usePathname();

  return (
    <ul className="nav-principal">
      {PIEZAS.map((p) => {
        const href = destinoPorRuta(p.ruta, { logueado, premium });
        const activo = pathname === href || pathname.startsWith(href + "/");
        return (
          <li key={p.id}>
            <Link
              href={href}
              className={`nav-principal-enlace${activo ? " is-activo" : ""}`}
              aria-current={activo ? "page" : undefined}
            >
              {p.label}
            </Link>
            {/* Nova, la asistente del Diario, al lado de su enlace. La ve todo el
                mundo; quien no tiene el Diario la ve bloqueada (08-11-2026). */}
            {p.id === "diario" && <NovaNav href={href} bloqueada={!conNova} />}
          </li>
        );
      })}
    </ul>
  );
}
