import type { ReactNode } from "react";
import { ArrowRight, Crown } from "lucide-react";
import Tecla, { type TamanoTecla } from "./Tecla";
import "./tecla-premium.css";

/**
 * El botón de hacerse Premium: el MISMO en toda la web (19-11-2026, pedido
 * por el admin). Tecla lila de la paleta con contorno de rotulador, la corona
 * dorada que se mece y un brillo que la cruza cada pocos segundos.
 *
 * Por defecto va a /api/checkout, que manda primero al registro si no hay
 * sesión y vuelve solo al pago (ver su ruta). Con `href="/premium"`, a la
 * página que lo explica.
 */
export default function TeclaPremium({
  href = "/api/checkout",
  children = "Hazte Premium",
  tamano = "normal",
  ancho,
  flecha = true,
  className,
  onClick,
}: {
  href?: string;
  children?: ReactNode;
  tamano?: TamanoTecla;
  ancho?: boolean;
  flecha?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const corona = tamano === "peq" ? 15 : tamano === "grande" ? 20 : 18;
  return (
    <Tecla
      href={href}
      prefetch={false}
      color="lila"
      tamano={tamano}
      ancho={ancho}
      onClick={onClick}
      className={`tecla-premium${className ? ` ${className}` : ""}`}
    >
      <Crown size={corona} strokeWidth={2.4} aria-hidden="true" className="tecla-premium-corona" />
      <span className="tecla-premium-texto">{children}</span>
      {flecha && <ArrowRight size={corona - 2} strokeWidth={2.6} aria-hidden="true" />}
    </Tecla>
  );
}
