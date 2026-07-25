import Link from "next/link";
import { ArrowRight, Zap, BookOpen, Trophy, BarChart2 } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import FeaturedGuideCard from "@/components/FeaturedGuideCard";

export default function GuidesHomeSection() {
  // Siempre la última guía creada — se actualiza sola con cada guía nueva añadida a src/lib/guides.ts
  const g = GUIDES[GUIDES.length - 1];

  return (
    <section id="guias-premium" className="guides-home-section">
      {/* Ambient glow */}
      <div className="guides-home-glow" aria-hidden="true" />

      <div className="guides-home-inner">

        {/* Header */}
        <div className="guides-home-header">
          <span className="guides-home-eyebrow">
            <Zap size={13} aria-hidden="true" />
            Guías Interactivas
          </span>
          <h2 className="guides-home-title">
            Aprende crypto de verdad.<br />
            <span className="guides-home-title-gold">Paso a paso. Con criterio.</span>
          </h2>
          <p className="guides-home-subtitle">
            No listas de bullets. Guías reales con gráficas, quizzes, flashcards y ejercicios
            que te hacen entender — no solo leer.
          </p>
        </div>

        {/* Featured guide card */}
        <div className="guides-home-feature">

          <FeaturedGuideCard guide={g} />

          {/* Stats column */}
          <div className="guides-home-stats">
            <div className="guides-stat-card">
              <span className="guides-stat-icon"><BookOpen size={15} aria-hidden="true" /></span>
              <span className="guides-stat-num">{g.sections}</span>
              <span className="guides-stat-label">Secciones</span>
            </div>
            <div className="guides-stat-card">
              <span className="guides-stat-icon"><BarChart2 size={15} aria-hidden="true" /></span>
              <span className="guides-stat-num">10</span>
              <span className="guides-stat-label">Puntos máx.</span>
            </div>
            <div className="guides-stat-card">
              <span className="guides-stat-icon"><Trophy size={15} aria-hidden="true" /></span>
              <span className="guides-stat-num">1</span>
              <span className="guides-stat-label">Logro exclusivo</span>
            </div>
            <div className="guides-stat-card guides-stat-card--cta">
              <span className="guides-stat-cta-text">Todas las guías</span>
              <Link href="/guias" className="guides-stat-link">
                Ver catálogo <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
