import Link from "next/link";
import { ArrowRight, Zap, BookOpen, Trophy, BarChart2 } from "lucide-react";
import { GUIDES } from "@/lib/guides";

const DIFF_CLASS: Record<string, string> = {
  "básico": "guides-diff--basic",
  "intermedio": "guides-diff--intermediate",
  "avanzado": "guides-diff--advanced",
};
const DIFF_LABEL: Record<string, string> = {
  "básico": "Básico",
  "intermedio": "Intermedio",
  "avanzado": "Avanzado",
};

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

          <div className="guides-featured-card">
            <div className="guides-featured-card-glow" aria-hidden="true" />

            <div className="guides-featured-top">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span className={`guides-diff-badge ${DIFF_CLASS[g.difficulty]}`}>{DIFF_LABEL[g.difficulty]}</span>
                <span className="guides-access-badge">{g.type === "premium" ? "Premium" : "Gratis con registro"}</span>
              </div>
              <span className="guides-featured-label">Guía destacada</span>
            </div>

            <h3 className="guides-featured-title">{g.title}</h3>
            <p className="guides-featured-desc">{g.description}</p>

            <div className="guides-featured-topics">
              {g.topics.map((t) => (
                <span key={t} className="guides-topic-pill">{t}</span>
              ))}
            </div>

            <div className="guides-featured-meta">
              <span className="guides-meta-item">
                <BookOpen size={14} aria-hidden="true" />
                {g.sections} secciones
              </span>
              <span className="guides-meta-item">
                <BarChart2 size={14} aria-hidden="true" />
                Quiz · 0–10 pts
              </span>
              <span className="guides-meta-item">
                <Trophy size={14} aria-hidden="true" />
                Logro: {g.badge}
              </span>
            </div>

            <Link href={`/guias/${g.slug}`} className="guides-featured-cta">
              Empezar guía
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>

          {/* Stats column */}
          <div className="guides-home-stats">
            <div className="guides-stat-card">
              <span className="guides-stat-num">{g.sections}</span>
              <span className="guides-stat-label">Secciones</span>
            </div>
            <div className="guides-stat-card">
              <span className="guides-stat-num">10</span>
              <span className="guides-stat-label">Puntos máx.</span>
            </div>
            <div className="guides-stat-card">
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
