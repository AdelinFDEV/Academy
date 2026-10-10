import Link from "next/link";
import { ArrowRight, Zap, Clock, BookOpen, Lock } from "lucide-react";
import { GUIDES, GUIDES_NEWEST_FIRST, type GuideMeta } from "@/lib/guides";
import FeaturedGuideCard from "@/components/FeaturedGuideCard";

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

/** Cuántas guías se enseñan bajo la destacada. */
const RECIENTES = 3;

/**
 * Las guías en la portada. Desde el 10-10-2026 son la única vía de
 * información de la web (no hay noticias), así que van justo tras el hero:
 *
 * 1. La guía más reciente, grande.
 * 2. Las tres anteriores, en tarjetas.
 * 3. El paso al catálogo entero.
 *
 * Todo sale de src/lib/guides.ts: al añadir una guía allí, la portada se
 * actualiza sola (la nueva pasa a destacada y empuja a las demás).
 */
export default function GuidesHomeSection() {
  const [destacada, ...resto] = GUIDES_NEWEST_FIRST;
  const recientes = resto.slice(0, RECIENTES);

  return (
    <section id="guias" className="guides-home-section">
      <div className="guides-home-glow" aria-hidden="true" />

      <div className="guides-home-inner">

        <div className="guides-home-header">
          <span className="guides-home-eyebrow">
            <Zap size={13} aria-hidden="true" />
            Guías interactivas
          </span>
          <h2 className="guides-home-title">
            Aprende crypto de verdad.<br />
            <span className="guides-home-title-gold">Paso a paso. Con criterio.</span>
          </h2>
          <p className="guides-home-subtitle">
            Cada guía explica un tema a fondo, con gráficas, ejercicios y un quiz al final que
            comprueba que lo has entendido — no solo leído.
          </p>
        </div>

        {destacada && <FeaturedGuideCard guide={destacada} />}

        {recientes.length > 0 && (
          <div className="guides-recientes">
            <h3 className="guides-recientes-titulo">Últimas guías</h3>
            <ul className="guides-recientes-lista">
              {recientes.map((g) => <TarjetaGuia key={g.slug} guia={g} />)}
            </ul>
          </div>
        )}

        <Link href="/guias" className="guides-home-todas">
          Ver todas las guías
          <span className="guides-home-todas-cifra">{GUIDES.length}</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </Link>

      </div>
    </section>
  );
}

function TarjetaGuia({ guia: g }: { guia: GuideMeta }) {
  return (
    <li>
      <Link href={`/guias/${g.slug}`} className="guides-mini">
        <div className="guides-mini-top">
          <span className={`guides-diff-badge ${DIFF_CLASS[g.difficulty]}`}>{DIFF_LABEL[g.difficulty]}</span>
          {g.type === "premium" && (
            <span className="guides-access-badge guides-access-badge--premium">
              <Lock size={11} aria-hidden="true" /> Premium
            </span>
          )}
        </div>
        <h4 className="guides-mini-titulo">{g.title}</h4>
        <p className="guides-mini-desc">{g.description}</p>
        <div className="guides-mini-pie">
          <span className="guides-mini-meta">
            <Clock size={13} aria-hidden="true" /> {g.readTime}
            <span aria-hidden="true">·</span>
            <BookOpen size={13} aria-hidden="true" /> {g.sections} secciones
          </span>
          <span className="guides-mini-leer">
            Leer <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}
