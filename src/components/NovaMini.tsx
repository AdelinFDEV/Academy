"use client";

import { useMotionValue } from "framer-motion";
import NovaHead from "@/components/trading/NovaHead";
import type { NovaFace } from "@/components/trading/NovaHead";
import "./nova-mini.css";

/**
 * Nova en pequeño: la misma cabeza que vive en el Diario y en la barra de la
 * web, para ponerla en cualquier sitio donde se hable de ella.
 *
 * **Regla del admin (08-11-2026): donde se mencione a Nova, sale Nova**, nunca
 * un icono genérico (destellos, robots de librería…). Este componente existe
 * para que cumplirla cueste una línea.
 *
 * De frente y quieta en su sitio; con `sigue` mira el cursor con los ojos.
 * Es decorativa (`aria-hidden`): el texto de al lado ya dice «Nova».
 *
 * Sustituye a `premium/NovaCara.tsx`, que hacía lo mismo solo para /premium.
 */
export default function NovaMini({
  size = 24,
  face = "happy",
  sigue = false,
  className = "",
}: {
  size?: number;
  face?: NovaFace;
  sigue?: boolean;
  className?: string;
}) {
  const theta = useMotionValue(0);
  return (
    <span
      className={`nova-mini${className ? ` ${className}` : ""}`}
      style={{ "--nm": `${size}px` } as React.CSSProperties}
      aria-hidden="true"
    >
      <NovaHead theta={theta} face={face} activity="none" flying={false} joy={false} talking={false} track={sigue} />
    </span>
  );
}
