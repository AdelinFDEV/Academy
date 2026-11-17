"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, MessageCircleMore } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import Tecla from "@/components/cuaderno/Tecla";
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
 * El foro en la barra del móvil (y de cualquier pantalla de menos de 1200 px,
 * donde el de escritorio se esconde): entre la marca y la foto de perfil.
 *
 * Más simple a propósito (pedido por el admin el 13-11-2026): ahí no caben las
 * caras. Una tecla coral, el color del foro, con un bocadillo y la palabra;
 * dentro del foro, blanca (ya estás ahí). Solo sale con sesión: sin ella, la
 * barra del móvil lleva únicamente «Entrar» y «Registrarse» (`SiteNav`).
 */
export function NavForoMovil() {
  const activo = useEnElForo();
  return (
    <Tecla
      href="/foro"
      color={activo ? "blanca" : "coral"}
      tamano="peq"
      className={`nav-foro-movil${activo ? " is-activo" : ""}`}
      aria-current={activo ? "page" : undefined}
    >
      <MessageCircle size={16} strokeWidth={2.6} aria-hidden="true" />
      Foro
    </Tecla>
  );
}
