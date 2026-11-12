"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesSquare } from "lucide-react";

/**
 * El foro en la barra de escritorio, al lado de la cápsula de las tres piezas
 * de pago (`NavPrincipal`).
 *
 * Tiene que verse DISTINTO de ellas: es una sola pastilla teñida de naranja,
 * sin aro de cristal alrededor y sin círculo en el icono, con un punto de
 * actividad. La versión anterior copiaba la cápsula y se leía como una cuarta
 * pieza (descartada por el admin el 12-11-2026).
 *
 * Es de cliente solo para saber si estás dentro del foro y dejarlo relleno.
 * Si se enseña o no lo decide `SiteNav`, en el servidor.
 */
export default function NavForo() {
  const pathname = usePathname();
  const activo = pathname === "/foro" || pathname.startsWith("/foro/");

  return (
    <Link href="/foro" className={`nav-foro${activo ? " is-activo" : ""}`} aria-current={activo ? "page" : undefined}>
      <span className="nav-foro-icono" aria-hidden="true">
        <MessagesSquare size={17} strokeWidth={2.2} />
      </span>
      Foro
    </Link>
  );
}
