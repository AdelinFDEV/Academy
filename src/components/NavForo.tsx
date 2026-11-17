"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleMore } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import { sonar } from "@/lib/sonidos";

/**
 * El foro en la barra de escritorio, al lado de la cápsula de las tres piezas
 * de pago (`NavPrincipal`).
 *
 * Tercera versión, rehecha desde cero el 13-11-2026 (el admin descartó la
 * pastilla naranja con icono de bocadillos): en vez de un icono, TRES CARAS de
 * la comunidad (las fotos de perfil que puede elegir cualquiera), apiladas como
 * una conversación en marcha. Dice «aquí está la gente» sin parecer una cuarta
 * herramienta. Se mecen despacio, se abren en abanico con el ratón encima y,
 * junto al nombre, un bocadillo de diálogo (antes un punto que latía; cambiado
 * a petición del admin el 17-11-2026) que de vez en cuando se mece, como si
 * alguien estuviera escribiendo.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): en coral, el color del foro
 * (ESTILO.md). Dentro del foro es una tecla coral, con su canto.
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
    <Link
      href="/foro"
      className={`nav-foro${activo ? " is-activo" : ""}`}
      aria-current={activo ? "page" : undefined}
      onPointerDown={() => sonar("tecla")}
    >
      <span className="nav-foro-caras" aria-hidden="true">
        {CARAS.map((c) => (
          <AvatarUsuario key={c} avatar={c} inicial="" className="nav-foro-cara" />
        ))}
      </span>
      <span className="nav-foro-texto">Foro</span>
      <MessageCircleMore className="nav-foro-bocadillo" size={19} strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}

/**
 * El foro en la barra del móvil (y de cualquier pantalla de menos de 1280 px,
 * donde el de escritorio se esconde): entre la marca y la foto de perfil. Solo
 * sale con sesión: sin ella, la barra del móvil lleva únicamente «Entrar» y
 * «Registrarse» (`SiteNav`).
 *
 * Desde el 17-11-2026 (pedido por el admin) es el MISMO botón que el de
 * escritorio, con las tres caras de la comunidad, solo más compacto
 * (site-nav.css, `.nav-foro--movil`). Antes era una tecla coral con un icono.
 */
export function NavForoMovil() {
  const activo = useEnElForo();

  return (
    <Link
      href="/foro"
      className={`nav-foro nav-foro--movil${activo ? " is-activo" : ""}`}
      aria-current={activo ? "page" : undefined}
      aria-label="Foro"
      onPointerDown={() => sonar("tecla")}
    >
      <span className="nav-foro-caras" aria-hidden="true">
        {CARAS.map((c) => (
          <AvatarUsuario key={c} avatar={c} inicial="" className="nav-foro-cara" />
        ))}
      </span>
      <span className="nav-foro-texto">Foro</span>
      <MessageCircleMore className="nav-foro-bocadillo" size={17} strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}
