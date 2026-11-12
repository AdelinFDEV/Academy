"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesSquare } from "lucide-react";

/**
 * El foro en la barra de escritorio, al lado de la cápsula de las tres piezas
 * de pago (`NavPrincipal`).
 *
 * Es una cápsula hermana, no una cuarta pieza: dentro de la otra van las que
 * salen del catálogo de herramientas, y el foro no es una. Pero tiene que
 * leerse como de la misma familia, así que comparte su cristal, su icono en
 * pastilla de color y su gesto al pasar el ratón (rehecho el 12-11-2026: la
 * primera versión era un contorno plano y se quedaba pobre a su lado).
 *
 * Es de cliente solo para saber si estás dentro del foro y dejarlo encendido.
 * Si se enseña o no lo decide `SiteNav`, en el servidor.
 */
export default function NavForo() {
  const pathname = usePathname();
  const activo = pathname === "/foro" || pathname.startsWith("/foro/");

  return (
    <Link href="/foro" className={`nav-foro${activo ? " is-activo" : ""}`} aria-current={activo ? "page" : undefined}>
      <span className="nav-foro-dentro">
        <span className="nav-foro-icono" aria-hidden="true">
          <MessagesSquare size={16} strokeWidth={2.2} />
        </span>
        Foro
      </span>
    </Link>
  );
}
