import Link from "next/link";
import { ArrowRight, Zap, BookOpen, Trophy, BarChart2 } from "lucide-react";

const PLACEHOLDER_GUIDE = {
  slug: "bitcoin-de-cero-a-entender-la-revolucion-financiera",
  title: "Bitcoin: De cero a entender la revolución financiera",
  description:
    "Desde qué es Bitcoin y cómo funciona la blockchain hasta por qué está cambiando el sistema financiero global. Con gráficas animadas, flashcards y quiz final.",
  difficulty: "Básico",
  type: "free" as const,
  sections: 8,
  badge: "Pionero Bitcoin",
  topics: ["Qué es Bitcoin", "Cómo funciona la blockchain", "Wallets y claves", "Por qué importa"],
};

export default function GuidesHomeSection() {
  const g = PLACEHOLDER_GUIDE;

  return (
    <section className="guides-home-section">
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
              <div className="guides-featured-badges">
                <span className="guides-diff-badge guides-diff--basic">{g.difficulty}</span>
                <span className="guides-access-badge">Gratis con registro</span>
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
                Badge: {g.badge}
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
              <span className="guides-stat-num">8</span>
              <span className="guides-stat-label">Secciones</span>
            </div>
            <div className="guides-stat-card">
              <span className="guides-stat-num">10</span>
              <span className="guides-stat-label">Puntos máx.</span>
            </div>
            <div className="guides-stat-card">
              <span className="guides-stat-num">1</span>
              <span className="guides-stat-label">Badge exclusivo</span>
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
