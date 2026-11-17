import Link from "next/link";
import type { GuideMeta } from "@/lib/guides";
import { guiasVisiblesRecientes } from "@/lib/guiasVisibles";
import GuiaPortada from "@/components/GuiaPortada";
import GuideSearch from "@/components/GuideSearch";
import Tecla from "@/components/cuaderno/Tecla";

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

/** Nivel y tiempo, como chips (disenos/sistema.html, «Etiquetas»): cada nivel, su color. */
function Chips({ g, secciones = false }: { g: GuideMeta; secciones?: boolean }) {
  return (
    <span className="gh-chips">
      <span className={`gh-chip gh-chip--${g.difficulty === "básico" ? "basico" : g.difficulty}`}>
        {NIVEL_TEXTO[g.difficulty]}
      </span>
      <span className="gh-chip">{g.readTime}</span>
      {secciones && <span className="gh-chip">{g.sections} secciones</span>}
    </span>
  );
}

/**
 * Las guías en la portada, con el estilo «Cuaderno de estudio» (17-11-2026).
 * Referencia: disenos/version-o-equilibrio.html («Guías como mazos») y
 * disenos/sistema.html («Tarjetas que giran y mazos»). Su color es el cielo.
 *
 * · Cada guía es un MAZO: tres tarjetas apiladas que se levantan al pasar el
 *   ratón. La de arriba lleva su portada, el título y los chips de nivel y
 *   tiempo.
 * · La más reciente, en grande y con su pósit «¡Nueva!»: descripción, logro
 *   que da y una tecla para empezarla. Toda la tarjeta lleva a la guía.
 * · Arriba, el titular, el buscador de criptomonedas y la tecla al catálogo.
 *
 * Todo sale de guiasVisiblesRecientes(): al publicar una guía, la nueva pasa a
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
          <div className="gh-cabecera-texto">
            <p className="gh-nota">Guías interactivas · 100 % gratis</p>
            <h2 id="gh-titulo" className="gh-titulo">
              Criptomonedas, <span className="fluor">explicadas a fondo</span>
            </h2>
            <p className="gh-sub">
              Qué es cada proyecto, cómo funciona por dentro y qué riesgos tiene. Con gráficas,
              ejercicios y un quiz final.
            </p>
          </div>
          <div className="gh-cabecera-acciones">
            <div className="gh-buscar">
              <GuideSearch />
            </div>
            <Tecla href="/guias" color="blanca" className="gh-todas">
              Ver todas las guías
            </Tecla>
          </div>
        </header>

        <div className="gh-mesa">
          {/* ── La más reciente: el mazo grande ── */}
          <article className="gh-mazo gh-mazo--nueva">
            <span className="gh-mazo-hoja gh-mazo-hoja--1" aria-hidden="true" />
            <span className="gh-mazo-hoja gh-mazo-hoja--2" aria-hidden="true" />
            <span className="gh-postit" aria-hidden="true">¡Nueva!</span>

            <div className="gh-mazo-top">
              <GuiaPortada guia={nueva} className="gh-portada" sizes="(max-width: 960px) 100vw, 560px" />
              <div className="gh-nueva-cuerpo">
                <span className="gh-cat">{categoria(nueva)}</span>
                <h3 className="gh-nueva-titulo">
                  <Link href={`/guias/${nueva.slug}`} className="gh-estirado">
                    {nueva.title}
                  </Link>
                </h3>
                <p className="gh-nueva-desc">{nueva.description}</p>
                <Chips g={nueva} secciones />
                <p className="gh-logro">
                  Al acabarla ganas el logro <b>{nueva.badge}</b>
                </p>
                <Tecla href={`/guias/${nueva.slug}`} color="cielo" className="gh-empezar">
                  Empezar la guía
                </Tecla>
              </div>
            </div>
          </article>

          {/* ── Las cuatro anteriores: un mazo cada una ── */}
          <ol className="gh-mazos">
            {siguientes.map((g, i) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="gh-mazo gh-mazo--peq">
                  <span className="gh-mazo-hoja gh-mazo-hoja--1" aria-hidden="true" />
                  <span className="gh-mazo-hoja gh-mazo-hoja--2" aria-hidden="true" />
                  <span className="gh-mazo-top">
                    <GuiaPortada guia={g} className="gh-portada" sizes="(max-width: 640px) 260px, (max-width: 960px) 45vw, 280px" />
                    <span className="gh-num" aria-hidden="true">0{i + 2}</span>
                    <span className="gh-peq-titulo">{g.shortTitle}</span>
                    <Chips g={g} />
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
