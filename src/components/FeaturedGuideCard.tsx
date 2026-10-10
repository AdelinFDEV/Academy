import Link from "next/link";
import { ArrowRight, BookOpen, Trophy, BarChart2, Clock, Lock, Unlock, Sparkles } from "lucide-react";
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

/**
 * La guía destacada de la portada: la más reciente. Desde el 10-10-2026 las
 * guías son la única vía de información de la web, así que es la pieza
 * principal de la portada.
 *
 * Dos columnas: a la izquierda lo que cuenta la guía y el botón; a la
 * derecha, lo que incluye (lectura, secciones, quiz, logro y acceso). Antes
 * esas cifras iban en una columna aparte, fuera de la tarjeta, y repetían las
 * pastillas de dentro.
 */
export default function FeaturedGuideCard({ guide: g }: { guide: GuideMeta }) {
  const premium = g.type === "premium";
  return (
    <article className="guides-featured-card">
      <div className="guides-featured-card-glow" aria-hidden="true" />
      <div className="guides-featured-card-shine" aria-hidden="true" />

      <div className="guides-featured-main">
        <div className="guides-featured-badges">
          <span className="guides-featured-label">
            <Sparkles size={11} aria-hidden="true" /> Guía más reciente
          </span>
          <span className={`guides-diff-badge ${DIFF_CLASS[g.difficulty]}`}>{DIFF_LABEL[g.difficulty]}</span>
        </div>

        <h3 className="guides-featured-title">
          <Link href={`/guias/${g.slug}`}>{g.title}</Link>
        </h3>
        <p className="guides-featured-desc">{g.description}</p>

        <div className="guides-featured-topics">
          {g.topics.map((t) => (
            <span key={t} className="guides-topic-pill">
              <span className="guides-topic-dot" aria-hidden="true" />
              {t}
            </span>
          ))}
        </div>

        <Link href={`/guias/${g.slug}`} className="guides-featured-cta" aria-label={`Empezar la guía: ${g.shortTitle}`}>
          <span className="guides-featured-cta-shine" aria-hidden="true" />
          Empezar guía
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>

      <aside className="guides-featured-panel" aria-label="Qué incluye la guía">
        <span className="guides-featured-panel-title">Qué incluye</span>
        <ul className="guides-featured-incluye">
          <li>
            <span className="guides-featured-incluye-icono"><Clock size={16} aria-hidden="true" /></span>
            <span><strong>{g.readTime}</strong> de lectura</span>
          </li>
          <li>
            <span className="guides-featured-incluye-icono"><BookOpen size={16} aria-hidden="true" /></span>
            <span><strong>{g.sections} secciones</strong> paso a paso</span>
          </li>
          <li>
            <span className="guides-featured-incluye-icono"><BarChart2 size={16} aria-hidden="true" /></span>
            <span><strong>Quiz final</strong> con nota de 0 a 10</span>
          </li>
          <li>
            <span className="guides-featured-incluye-icono"><Trophy size={16} aria-hidden="true" /></span>
            <span>Logro <strong>{g.badge}</strong></span>
          </li>
        </ul>
        <span className={`guides-featured-acceso${premium ? " guides-featured-acceso--premium" : ""}`}>
          {premium ? <Lock size={13} aria-hidden="true" /> : <Unlock size={13} aria-hidden="true" />}
          {premium ? "Incluida en Premium" : "Gratis con registro"}
        </span>
      </aside>
    </article>
  );
}
