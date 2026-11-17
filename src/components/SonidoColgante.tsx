"use client";

import { usePathname } from "next/navigation";
import InterruptorSonido from "@/components/cuaderno/InterruptorSonido";

/**
 * La etiqueta del altavoz que cuelga de la barra (site-nav.css, `.nav-sonido`).
 *
 * En el móvil solo cuelga en la portada (pedido por el admin el 17-11-2026):
 * en cualquier otra página, y con el menú abierto, no se ve, y el altavoz
 * pasa a estar dentro del menú, junto al buscador (BlogMobileMenu). Para eso
 * marca con `es-portada` la etiqueta de la página de inicio; lo demás lo
 * decide el CSS. En el ordenador cuelga siempre.
 */
export default function SonidoColgante() {
  const portada = usePathname() === "/";
  return (
    <span className={`nav-sonido${portada ? " es-portada" : ""}`}>
      <InterruptorSonido />
    </span>
  );
}
