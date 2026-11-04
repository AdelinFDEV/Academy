import Link from "next/link";
import { ArrowRight, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { detalleDe, herramienta } from "@/lib/herramientas";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import type { ResumenHero } from "@/components/HeroSlider";

/**
 * La sección de Premium del home.
 *
 * Rehecha el 04-11-2026: la anterior (31-10) tenía un párrafo de entrada, tres
 * puntos por tarjeta y otro párrafo junto al precio, y se leía como un folleto.
 * Esta se queda con lo que se ve de un golpe: un titular, tres tarjetas con su
 * icono animado, UNA cifra y una frase, y una barra con el precio y el botón.
 * Compactas, caben apiladas en el móvil, así que ya no hace falta carrusel.
 *
 * Todo lo que dice existe y está comprobado en su código: las diez
 * estadísticas del diario, la rentabilidad real de la cartera (de
 * `resumenPortfolioPublico()`, la misma que el slider) y el certificado de los
 * cursos, que se anuncian como «próximamente» hasta que se publique el primero.
 * No se enseña a quien ya es Premium.
 */

type Pieza = {
  id: "diario" | "portfolio" | "cursos";
  Icono: (p: { size?: number }) => React.ReactNode;
  titulo: string;
  frase: string;
  cifra: string;
  cifraTexto: string;
};

function piezas(portfolio: ResumenHero): Pieza[] {
  const pct = portfolio
    ? `${portfolio.rentabilidadPct >= 0 ? "+" : ""}${portfolio.rentabilidadPct.toFixed(1).replace(".", ",")} %`
    : null;
  return [
    {
      id: "diario",
      Icono: IconoDiario,
      titulo: "Diario de Trading",
      frase: "Cada operación, registrada y medida.",
      cifra: "10",
      cifraTexto: "estadísticas automáticas",
    },
    {
      id: "portfolio",
      Icono: IconoPortfolio,
      titulo: "Portfolio Adelin",
      frase: "Mis compras reales, al momento.",
      cifra: pct ?? "En vivo",
      cifraTexto: pct ? "rentabilidad real de la cartera" : "precio de entrada y rentabilidad",
    },
    {
      id: "cursos",
      Icono: IconoCursos,
      titulo: "Cursos",
      frase: "Por módulos, a tu ritmo.",
      cifra: "Certificado",
      cifraTexto: "al aprobar el examen final",
    },
  ];
}

export default function PremiumHome({ portfolio }: { portfolio: ResumenHero }) {
  return (
    <section className="ph" aria-labelledby="ph-titulo">
      <div className="ph-inner">
        <header className="ph-cabecera">
          <span className="ph-sello"><Crown size={14} aria-hidden="true" /> Premium</span>
          <h2 id="ph-titulo" className="ph-titulo">
            Una suscripción. <span>Tres piezas.</span>
          </h2>
        </header>

        <ul className="ph-piezas">
          {piezas(portfolio).map((p) => {
            const h = herramienta(p.id);
            const pronto = h.acceso === "proximamente";
            return (
              <li key={p.id} style={{ "--c": h.color } as React.CSSProperties}>
                {/* Toda la tarjeta lleva a la ficha pública de la pieza. */}
                <Link href={detalleDe(h)} className="ph-pieza">
                  <span className="ph-pieza-cab">
                    <span className="ph-pieza-icono" aria-hidden="true"><p.Icono size={26} /></span>
                    {pronto && <span className="ph-pronto">Próximamente</span>}
                  </span>

                  <span className="ph-cifra">{p.cifra}</span>
                  <span className="ph-cifra-texto">{p.cifraTexto}</span>

                  <span className="ph-pieza-pie">
                    <span>
                      <strong className="ph-pieza-titulo">{p.titulo}</strong>
                      <span className="ph-pieza-frase">{p.frase}</span>
                    </span>
                    <span className="ph-pieza-flecha" aria-hidden="true">
                      <ArrowRight size={16} strokeWidth={2.4} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ph-barra">
          <p className="ph-incluye">
            <Sparkles size={16} aria-hidden="true" />
            <span><strong>Todo lo que añada, incluido.</strong> Herramientas y cursos nuevos, sin pagar más.</span>
          </p>

          <div className="ph-compra">
            <p className="ph-precio">49,99 €<small>/mes</small></p>
            <div className="ph-compra-accion">
              <Link href="/premium" className="ph-cta">
                Hazte Premium <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
              </Link>
              <p className="ph-garantia">
                <ShieldCheck size={13} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
