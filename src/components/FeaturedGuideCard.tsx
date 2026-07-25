import Link from "next/link";
import { ArrowRight, BookOpen, Trophy, BarChart2, Map, Star } from "lucide-react";
import type { GuideMeta } from "@/lib/guides";

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

export default function FeaturedGuideCard({ guide: g }: { guide: GuideMeta }) {
  return (
    <div className="guides-featured-card">
      <div className="guides-featured-card-glow" aria-hidden="true" />
      <div className="guides-featured-card-shine" aria-hidden="true" />

      <div className="guides-featured-top">
        <div className="guides-featured-icon">
          <Map size={22} aria-hidden="true" />
        </div>
        <span className="guides-featured-label">
          <Star size={11} aria-hidden="true" /> <span className="guides-featured-label-text">Guía destacada</span>
        </span>
      </div>

      <div className="guides-featured-badges">
        <span className={`guides-diff-badge ${DIFF_CLASS[g.difficulty]}`}>{DIFF_LABEL[g.difficulty]}</span>
        <span className="guides-access-badge">{g.type === "premium" ? "Premium" : "Gratis con registro"}</span>
      </div>

      <h3 className="guides-featured-title">{g.title}</h3>
      <p className="guides-featured-desc">{g.description}</p>

      <div className="guides-featured-topics">
        {g.topics.map((t) => (
          <span key={t} className="guides-topic-pill">
            <span className="guides-topic-dot" aria-hidden="true" />
            {t}
          </span>
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
        <span className="guides-featured-cta-shine" aria-hidden="true" />
        Empezar guía
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </div>
  );
}
