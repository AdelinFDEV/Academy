import Link from "next/link";
import { GUIDES_NEWEST_FIRST, type GuideMeta } from "@/lib/guides";

const CUANTAS = 3;

/**
 * Las guías que se le proponen al terminar otra: primero las que comparten
 * etiqueta, de la más nueva a la más antigua, y si no llegan a tres se
 * completan con las más recientes del resto.
 *
 * Existe por el SEO tanto como por el lector: antes de este bloque ninguna
 * guía enlazaba a otra, y cuatro solo recibían el enlace de `/guias`. Google
 * trata una página sin enlaces entrantes como periférica por buena que sea.
 *
 * Va FUERA del muro de registro a propósito: Googlebot entra sin sesión, y un
 * enlace que solo ve el registrado para Google no existe.
 *
 * Sin `<h2>` a propósito: no es una sección de la guía, y contarlo como una
 * sería inflar la estructura que mide la auditoría SEO.
 */
export default function GuiasRelacionadas({ slug }: { slug: string }) {
  const actual = GUIDES_NEWEST_FIRST.find((g) => g.slug === slug);
  if (!actual) return null;

  const resto = GUIDES_NEWEST_FIRST.filter((g) => g.slug !== slug);
  const comparte = (g: GuideMeta) => g.tags.some((t) => actual.tags.includes(t));
  const elegidas = [...resto.filter(comparte), ...resto.filter((g) => !comparte(g))].slice(0, CUANTAS);
  if (elegidas.length === 0) return null;

  return (
    <nav className="gbc-section gbc-rel" aria-label="Guías relacionadas">
      <div className="gbc-gc">
        <p className="gbc-ey">Sigue aprendiendo</p>
        <p className="gbc-rel-title">Otras guías que te pueden interesar</p>
        <ul className="gbc-rel-grid">
          {elegidas.map((g) => (
            <li key={g.slug}>
              <Link href={`/guias/${g.slug}`} className="gbc-rel-card">
                <span className="gbc-rel-meta">
                  {g.difficulty.charAt(0).toUpperCase() + g.difficulty.slice(1)} · {g.readTime}
                </span>
                <span className="gbc-rel-name">{g.title}</span>
                <span className="gbc-rel-desc">{g.description}</span>
                <span className="gbc-rel-cta">Leer la guía →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
