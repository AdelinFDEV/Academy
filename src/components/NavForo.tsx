"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AvatarUsuario from "@/components/AvatarUsuario";

/**
 * El foro en la barra de escritorio, al lado de la cápsula de las tres piezas
 * de pago (`NavPrincipal`).
 *
 * Tercera versión, rehecha desde cero el 13-11-2026 (el admin descartó la
 * pastilla naranja con icono de bocadillos): en vez de un icono, TRES CARAS de
 * la comunidad (las fotos de perfil que puede elegir cualquiera), apiladas como
 * una conversación en marcha. Dice «aquí está la gente» sin parecer una cuarta
 * herramienta. Se mecen despacio, se abren en abanico con el ratón encima y,
 * junto al nombre, un punto que late.
 *
 * Es de cliente solo para saber si estás dentro del foro y marcarlo. Si se
 * enseña o no lo decide `SiteNav`, en el servidor.
 */
const CARAS = ["toro", "ballena", "oso"] as const;

function useEnElForo() {
  const pathname = usePathname();
  return pathname === "/foro" || pathname.startsWith("/foro/");
}

export default function NavForo() {
  const activo = useEnElForo();

  return (
    <Link href="/foro" className={`nav-foro${activo ? " is-activo" : ""}`} aria-current={activo ? "page" : undefined}>
      <span className="nav-foro-caras" aria-hidden="true">
        {CARAS.map((c) => (
          <AvatarUsuario key={c} avatar={c} inicial="" className="nav-foro-cara" />
        ))}
      </span>
      <span className="nav-foro-texto">Foro</span>
      <span className="nav-foro-latido" aria-hidden="true" />
    </Link>
  );
}

/**
 * El foro en la barra del móvil (y de cualquier pantalla de menos de 1200 px,
 * donde el de escritorio se esconde): entre la marca y la foto de perfil.
 *
 * Más simple a propósito (pedido por el admin el 13-11-2026): ahí no caben las
 * caras. Una pastilla de la altura de la hamburguesa con el punto que late y
 * la palabra. El menú sigue llevando el foro también.
 */
export function NavForoMovil() {
  const activo = useEnElForo();
  return (
    <Link href="/foro" className={`nav-foro-movil${activo ? " is-activo" : ""}`} aria-current={activo ? "page" : undefined}>
      <span className="nav-foro-latido" aria-hidden="true" />
      Foro
    </Link>
  );
}
