"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

/**
 * El foro en la barra de escritorio, tras las tres piezas de pago
 * (`NavPrincipal`) y separado de ellas por una raya fina: no es una
 * herramienta, es el sitio donde está la gente.
 *
 * Cuarta versión (13-11-2026): un enlace de texto como los demás, con un punto
 * naranja. Las tres caras de dibujos de la versión anterior se quitaron con el
 * resto de adornos de la barra, que el admin veía infantil.
 *
 * Es de cliente solo para saber si estás dentro del foro y marcarlo. Si se
 * enseña o no lo decide `SiteNav`, en el servidor.
 */

function useEnElForo() {
  const pathname = usePathname();
  return pathname === "/foro" || pathname.startsWith("/foro/");
}

export default function NavForo() {
  const activo = useEnElForo();

  return (
    <Link href="/foro" className={`nav-foro${activo ? " is-activo" : ""}`} aria-current={activo ? "page" : undefined}>
      Foro
      <span className="nav-foro-punto" aria-hidden="true" />
    </Link>
  );
}

/**
 * El foro en la barra del móvil (y de cualquier pantalla de menos de 1200 px,
 * donde el de escritorio se esconde): entre la marca y la foto de perfil.
 *
 * Más simple a propósito (pedido por el admin el 13-11-2026): ahí no caben las
 * caras. Un botón sólido, de la familia de «Registrarse» (degradado naranja,
 * brillo arriba, sombra), con un bocadillo y la palabra: la primera versión,
 * con borde y un punto, no se leía como botón. Solo sale con sesión: sin ella,
 * la barra del móvil lleva únicamente «Entrar» y «Registrarse» (`SiteNav`).
 */
export function NavForoMovil() {
  const activo = useEnElForo();
  return (
    <Link href="/foro" className={`nav-foro-movil${activo ? " is-activo" : ""}`} aria-current={activo ? "page" : undefined}>
      <MessageCircle size={16} strokeWidth={2.4} aria-hidden="true" />
      Foro
    </Link>
  );
}
