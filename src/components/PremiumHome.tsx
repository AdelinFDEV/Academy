import Link from "next/link";
import { ArrowRight, Crown, GraduationCap, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import PremiumPiezas, { type PiezaPremium } from "@/components/PremiumPiezas";
import { detalleDe, herramienta } from "@/lib/herramientas";
import type { ResumenHero } from "@/components/HeroSlider";

/**
 * La sección de Premium del home. Rehecha desde cero el 31-10-2026: una sola,
 * para todos los anchos (antes había una tarjeta para móvil y otra a lo ancho
 * para escritorio), y sin recuento de herramientas — se venden tres piezas,
 * no un número.
 *
 * Todo lo que promete existe y está comprobado en su código: las diez
 * estadísticas y los hitos del diario, la rentabilidad real de la cartera
 * (sale de `resumenPortfolioPublico()`, la misma que el slider) y la
 * estructura de los cursos, que se anuncian como «próximamente» hasta que se
 * publique el primero. No se enseña a quien ya es Premium.
 */

function piezas(portfolio: ResumenHero): PiezaPremium[] {
  const pct = portfolio
    ? `${portfolio.rentabilidadPct >= 0 ? "+" : ""}${portfolio.rentabilidadPct.toFixed(1).replace(".", ",")} %`
    : null;
  return [
    {
      id: "diario",
      href: detalleDe(herramienta("diario")),
      titulo: "Diario de Trading",
      linea: "Cada operación, registrada y medida.",
      dato: { valor: "10", key: "estadísticas de tu operativa" },
      puntos: ["Riesgo, resultado y por qué la tomaste", "Curva de capital y rendimiento por meses", "Hitos con niveles que premian la disciplina"],
    },
    {
      id: "portfolio",
      href: detalleDe(herramienta("portfolio")),
      titulo: "Portfolio Adelin",
      linea: "Mis compras reales de este ciclo, al momento.",
      dato: pct ? { valor: pct, key: "rentabilidad real de la cartera" } : null,
      puntos: ["Cada compra en spot, publicada", "Precio de entrada de cada posición", "Rentabilidad en tiempo real"],
    },
    {
      id: "cursos",
      href: detalleDe(herramienta("cursos")),
      titulo: "Cursos con certificado",
      linea: "Formación completa, a tu ritmo.",
      dato: null,
      puntos: ["Módulos y lecciones con su cronograma", "Un examen al cerrar cada módulo", "Certificado verificable al aprobar"],
    },
  ];
}

export default function PremiumHome({ portfolio }: { portfolio: ResumenHero }) {
  return (
    <section className="ph" aria-labelledby="ph-titulo">
      <div className="ph-marco">
        <header className="ph-cabecera">
          <span className="ph-sello"><Crown size={14} aria-hidden="true" /> Premium</span>
          <h2 id="ph-titulo" className="ph-titulo">
            Una suscripción. <span>Tres piezas para operar con método.</span>
          </h2>
          <p className="ph-sub">
            El diario que te dice cómo operas de verdad, mi cartera real para ver cómo se hace y
            cursos que te lo enseñan paso a paso.
          </p>
        </header>

        <PremiumPiezas piezas={piezas(portfolio)} />

        <div className="ph-cierre">
          <div className="ph-incluye">
            {/* Lo que tiene que quedar claro: lo que se añada a la web no se
                cobra aparte. Y la cuota no sube mientras sigas suscrito, que
                es lo que dice la FAQ de /premium — no prometer más que eso. */}
            <p className="ph-incluye-titulo">Todo lo que llegue, incluido</p>
            <p className="ph-incluye-texto">
              Cada herramienta nueva y cada curso que publique entran en tu suscripción. Nunca
              pagarás más por lo que añada, y tu cuota no sube mientras sigas suscrito.
            </p>
            <ul className="ph-incluye-lista">
              <li><Sparkles size={15} aria-hidden="true" /> Herramientas nuevas, incluidas</li>
              <li><GraduationCap size={15} aria-hidden="true" /> Cursos futuros, incluidos</li>
              <li><MessageCircle size={15} aria-hidden="true" /> Me escribes y te contesto yo</li>
            </ul>
          </div>

          <div className="ph-precio">
            <p className="ph-precio-cifra">
              49,99 €<small>/mes</small>
            </p>
            <p className="ph-precio-nota">Menos de 1,70 € al día, sin extras ni compras sueltas</p>
            <Link href="/premium" className="ph-cta">
              Hazte Premium <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <p className="ph-garantia">
              <ShieldCheck size={13} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
