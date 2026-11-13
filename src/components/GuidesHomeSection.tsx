import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Clock, Trophy } from "lucide-react";
import type { GuideMeta } from "@/lib/guides";
import { guiasVisiblesRecientes } from "@/lib/guiasVisibles";
import GuiaPortada from "@/components/GuiaPortada";
import GuideSearch from "@/components/GuideSearch";

/** Nivel de 1 a 3, para las tres rayitas de dificultad. */
const NIVEL: Record<GuideMeta["difficulty"], number> = { "básico": 1, "intermedio": 2, "avanzado": 3 };
const NIVEL_TEXTO: Record<GuideMeta["difficulty"], string> = {
  "básico": "Básico",
  "intermedio": "Intermedio",
  "avanzado": "Avanzado",
};

/** La categoría que se pinta, de la primera etiqueta: «EXPLICACIONES» → «Explicaciones». */
function categoria(g: GuideMeta): string {
  const t = g.tags[0] ?? "Guía";
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function Dificultad({ g }: { g: GuideMeta }) {
  const n = NIVEL[g.difficulty];
  return (
    <span className="gh-nivel" aria-label={`Nivel ${NIVEL_TEXTO[g.difficulty].toLowerCase()}`}>
      <span className="gh-nivel-rayas" aria-hidden="true">
        {[1, 2, 3].map((i) => <i key={i} className={i <= n ? "is-on" : undefined} />)}
      </span>
      {NIVEL_TEXTO[g.difficulty]}
    </span>
  );
}

/**
 * Las guías en la portada. Rehecha desde cero el 31-10-2026: la web vive de
 * Portfolio, Diario y Cursos, y las guías son la puerta gratuita, así que van
 * contenidas —una composición de revista— y no ocupan media portada.
 *
 * · A la izquierda, la más reciente, en grande: portada arriba y texto debajo.
 * · A la derecha, las cuatro anteriores, en filas con miniatura. Son cuatro
 *   (no tres) para que la columna llene la misma altura que la grande sin
 *   que las filas se estiren y queden huecas (08-11-2026).
 * · Arriba, el titular y el paso al catálogo entero.
 *
 * Todo sale de src/lib/guides.ts: al añadir una guía allí, la nueva pasa a
 * ser la grande y empuja a las demás.
 */
export default async function GuidesHomeSection() {
  const [nueva, ...resto] = await guiasVisiblesRecientes();
  const siguientes = resto.slice(0, 4);
  if (!nueva) return null;

  return (
    <section id="guias" className="gh" aria-labelledby="gh-titulo">
      <div className="gh-inner">
        <header className="gh-cabecera">
          <div>
            <span className="gh-eyebrow">
              <span className="gh-eyebrow-punto" aria-hidden="true" />
              Guías interactivas · 100 % gratis
            </span>
            <h2 id="gh-titulo" className="gh-titulo">
              Criptomonedas, <span>explicadas a fondo</span>
            </h2>
            <p className="gh-sub">
              Qué es cada proyecto, cómo funciona por dentro y qué riesgos tiene. Con gráficas,
              ejercicios y un quiz final.
            </p>
            <div className="gh-buscar">
              <GuideSearch />
            </div>
          </div>
          <Link href="/guias" className="gh-todas">
            Ver todas las explicaciones
            <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </header>

        <div className="gh-rejilla">
          {/* ── La más reciente ── */}
          <Link href={`/guias/${nueva.slug}`} className="gh-grande">
            <GuiaPortada guia={nueva} className="gh-grande-portada" sizes="(max-width: 900px) 100vw, 640px" />
            <span className="gh-grande-velo" aria-hidden="true" />

            <span className="gh-grande-cuerpo">
              <span className="gh-chips">
                <span className="gh-chip gh-chip--nueva">Nueva</span>
                <span className="gh-chip">{categoria(nueva)}</span>
              </span>
              <h3 className="gh-grande-titulo">{nueva.title}</h3>
              <p className="gh-grande-desc">{nueva.description}</p>

              <span className="gh-grande-pie">
                <span className="gh-datos">
                  <Dificultad g={nueva} />
                  <span><Clock size={13} aria-hidden="true" /> {nueva.readTime}</span>
                  <span><BookOpen size={13} aria-hidden="true" /> {nueva.sections} secciones</span>
                  <span className="gh-logro"><Trophy size={13} aria-hidden="true" /> {nueva.badge}</span>
                </span>
                <span className="gh-empezar">
                  Empezar
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </span>
              </span>
            </span>
          </Link>

          {/* ── Las tres anteriores ── */}
          <ol className="gh-lista">
            {siguientes.map((g, i) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="gh-fila">
                  <GuiaPortada guia={g} className="gh-fila-portada" sizes="160px" />
                  <span className="gh-fila-cuerpo">
                    <span className="gh-fila-cat">
                      <span className="gh-fila-num">0{i + 2}</span>
                      {categoria(g)}
                    </span>
                    <span className="gh-fila-titulo">{g.shortTitle}</span>
                    <span className="gh-datos gh-datos--fila">
                      <Dificultad g={g} />
                      <span><Clock size={12} aria-hidden="true" /> {g.readTime}</span>
                    </span>
                  </span>
                  <span className="gh-fila-flecha" aria-hidden="true">
                    <ArrowUpRight size={17} strokeWidth={2.2} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
