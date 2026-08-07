import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { ASESORIA_PLANS } from "@/lib/asesoria";

type Variant = "dashboard" | "premium" | "guide";

interface Props {
  variant: Variant;
}

// Copy por contexto: el visitante frío del hero, el suscriptor del dashboard y
// quien acaba de terminar una guía no están en el mismo punto, así que el
// gancho cambia aunque la banda sea la misma pieza.
const COPY: Record<Variant, { eyebrow: string; title: string; sub: string }> = {
  dashboard: {
    eyebrow: "Asesoría 1:1",
    title: "Da el salto con acompañamiento directo",
    sub: "Las herramientas ya las tienes. Si quieres que revisemos tu operativa cara a cara, hablamos.",
  },
  premium: {
    eyebrow: "Un escalón más",
    title: "Premium te da las herramientas. La asesoría me da a mí.",
    sub: "Si además de la academia quieres trabajar tu operativa conmigo en directo, esta es la vía.",
  },
  guide: {
    eyebrow: "Asesoría 1:1",
    title: "¿Lo llevamos a tu operativa real?",
    sub: "Una cosa es entender la teoría y otra aplicarla con tu dinero. Eso lo vemos en una sesión individual.",
  },
};

/**
 * Puerta de entrada a /asesoria. El precio sale del plan más barato para que
 * el "desde" nunca se desincronice de la tarifa real.
 */
export default function AsesoriaBand({ variant }: Props) {
  const copy = COPY[variant];
  const cheapest = ASESORIA_PLANS.reduce((min, p) => (p.priceValue < min.priceValue ? p : min));

  return (
    <Link href="/asesoria" className={`aseband aseband--${variant}`}>
      <span className="aseband-glow" aria-hidden="true" />

      <span className="aseband-left">
        <span className="aseband-icon" aria-hidden="true">
          <UserRound size={20} strokeWidth={2} />
        </span>
        <span className="aseband-text">
          <span className="aseband-eyebrow">{copy.eyebrow}</span>
          <span className="aseband-title">{copy.title}</span>
          <span className="aseband-sub">{copy.sub}</span>
        </span>
      </span>

      <span className="aseband-right">
        <span className="aseband-price">
          <span className="aseband-price-from">desde</span>
          <span className="aseband-price-amount">{cheapest.price}</span>
        </span>
        <span className="aseband-cta">
          Ver asesorías <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
