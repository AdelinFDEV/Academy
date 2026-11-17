import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { ArrowRight, BookOpen, Trophy, BarChart2, Star } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { guiasVisiblesRecientes } from "@/lib/guiasVisibles";
import JsonLd from "@/components/JsonLd";
import GuiaPortada from "@/components/GuiaPortada";
import GuideSearch from "@/components/GuideSearch";
import { itemListSchema } from "@/lib/schema";
import Tecla from "@/components/cuaderno/Tecla";
import "./listado.css";

export const metadata: Metadata = {
  alternates: { canonical: "/guias" },
  title: "Aprende Criptomonedas Gratis: 6 Guías",
  description:
    "Aprende criptomonedas gratis desde cero: 6 guías interactivas sobre blockchain, proyectos cripto reales y fiscalidad en España. Con quiz y badges.",
};

// El chip de cada nivel, con su color (disenos/sistema.html, «Etiquetas»).
const DIFF_CLASS: Record<string, string> = {
  "básico": "basico",
  "intermedio": "intermedio",
  "avanzado": "avanzado",
};

const GUIA_POR_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));

/**
 * Una guía dentro del itinerario. El nombre y el tiempo salen de `GUIDES`, no
 * escritos a mano, para que no se desincronicen si cambia una guía.
 *
 * Si el slug no está en el array no pinta nada: esa guía ya es invisible para
 * Google de todos modos, y un enlace a una guía inexistente daría 404.
 */
function enlaceGuia(slug: string) {
  const g = GUIA_POR_SLUG.get(slug);
  if (!g) return null;
  return (
    <li key={g.slug}>
      <Link href={`/guias/${g.slug}`}>{g.shortTitle}</Link>
      <span className="gl-ruta-meta">{g.readTime}</span>
    </li>
  );
}

export default async function GuiasPage() {
  // Las publicadas en el código y las que el admin ha publicado desde el panel.
  const recientes = await guiasVisiblesRecientes();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileData = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  // Estilo «Cuaderno de estudio» (17-11-2026): el color de las guías es el
  // cielo. Las guías son mazos de tarjetas, como en la portada; el itinerario,
  // un camino de tres paradas. Los textos son los de siempre (SEO auditado).
  const mesa = recientes.slice(0, 3);

  return (
    <div className="gl">
      <JsonLd
        data={itemListSchema(
          "Guías interactivas de AdelinBTC Academy",
          recientes.map((g) => ({ name: g.title, path: `/guias/${g.slug}` }))
        )}
      />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      <main className="guias-page">

        {/* Hero: el titular a la izquierda y, a la derecha, las portadas de las
            tres guías más recientes como un mazo sobre la mesa (decorativo). */}
        <div className="gl-hero">
          <div className="gl-hero-texto">
            <p className="gl-hero-nota">Guías Interactivas · AdelinBTC Academy</p>
            <h1 className="gl-hero-titulo">
              Aprende crypto<br />
              <span className="fluor">como nunca antes.</span>
            </h1>
            <p className="gl-hero-sub">
              No listas de bullets ni teoría aburrida. Cada guía combina contenido experto,
              gráficas animadas, flashcards, quizzes con puntuación y badges de logro que
              demuestran lo que sabes.
            </p>
            <div className="gl-buscar">
              <GuideSearch />
            </div>
            <div className="gl-chips">
              <span className="gl-chip gl-chip--cielo"><BarChart2 size={14} strokeWidth={2.6} aria-hidden="true" /> Gráficas animadas</span>
              <span className="gl-chip gl-chip--naranja"><BookOpen size={14} strokeWidth={2.6} aria-hidden="true" /> Flashcards</span>
              <span className="gl-chip gl-chip--lila"><Star size={14} strokeWidth={2.6} aria-hidden="true" /> Quiz 0–10</span>
              <span className="gl-chip gl-chip--amarillo"><Trophy size={14} strokeWidth={2.6} aria-hidden="true" /> Badges de logro</span>
            </div>
          </div>

          {mesa.length > 0 && (
            <div className="gl-mesa" aria-hidden="true">
              {mesa.map((g, i) => (
                <span key={g.slug} className={`gl-mesa-carta gl-mesa-carta--${i + 1}`}>
                  <GuiaPortada guia={g} className="gl-mesa-portada" sizes="(max-width: 900px) 60vw, 320px" />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Contenido pilar (punto 9 del plan SEO) ──────────────────────
            El hero de arriba es la voz de marca y se queda como está; la
            palabra que la gente busca —«aprender criptomonedas gratis»— entra
            aquí, en el título de Google y en los h2. Antes esta página tenía
            unas 80 palabras indexables: era un escaparate de tarjetas. */}
        <section className="gl-bloque gl-intro">
          <div className="gl-intro-cabeza">
            <span className="gl-kicker">Formación gratuita</span>
            <h2 className="gl-titulo">Aprende criptomonedas gratis, empezando desde cero</h2>
          </div>
          <div className="gl-hoja">
            <p>
              Estas guías son el itinerario de formación gratuita de la academia. No hacen falta
              conocimientos previos, ni tener dinero invertido, ni comprar nada: se leen enteras sin
              registrarte. La cuenta gratuita solo la pide el quiz final, que guarda tu resultado.
            </p>
            <p>
              Están pensadas para leerse <strong>en orden</strong>, aunque cada una funciona por su
              cuenta. La primera explica qué es una blockchain y por qué resulta tan difícil de
              falsificar. A partir de ahí cada guía añade una capa: qué hace por dentro un proyecto
              concreto, cómo funciona una red sin minería y cómo tributa todo esto en España.
            </p>
            <p>
              <strong>Todas son gratuitas</strong> y entre todas suman unas dos horas de
              lectura. Cada una termina con un quiz y un badge, que están ahí para que compruebes
              que lo has entendido de verdad y no solo leído por encima.
            </p>
          </div>
        </section>

        {/* Itinerario: los nombres y los tiempos salen de GUIDES, no escritos a
            mano, para que no se desincronicen si cambia una guía. Se pinta como
            el camino de los cursos: tres paradas unidas por un trazo. Va antes
            del listado completo (repaso del 17-11-2026): quien llega sin saber
            nada ve primero por dónde empezar, y no un muro de tarjetas. */}
        <section className="gl-bloque">
          <span className="gl-kicker">El itinerario</span>
          <h2 className="gl-titulo">Por dónde empezar</h2>

          <div className="gl-ruta">
            <article className="gl-ruta-paso gl-ruta-paso--1">
              <span className="gl-ruta-num" aria-hidden="true">1</span>
              <span className="gl-ruta-nivel">Si empiezas de cero</span>
              <p>
                Solo hay una imprescindible, y es esta. Cuenta de dónde sale todo esto, cómo
                funciona una cadena de bloques y por qué nadie puede reescribirla a su antojo.
                Saltársela hace que el resto se lea cuesta arriba.
              </p>
              <ul className="gl-ruta-lista">
                {enlaceGuia("que-es-la-blockchain")}
              </ul>
            </article>

            <article className="gl-ruta-paso gl-ruta-paso--2">
              <span className="gl-ruta-num" aria-hidden="true">2</span>
              <span className="gl-ruta-nivel">Cuando ya entiendes la base</span>
              <p>
                Aquí se pasa de la teoría a lo que ocurre de verdad. Cada una de estas tres
                disecciona un proyecto real, que es la mejor forma de aprender a mirar cualquier
                otro: qué problema resuelve, cómo funciona por dentro y qué riesgos tiene.
              </p>
              <ul className="gl-ruta-lista">
                {enlaceGuia("worldcoin")}
                {enlaceGuia("render")}
                {enlaceGuia("hyperliquid")}
              </ul>
            </article>

            <article className="gl-ruta-paso gl-ruta-paso--3">
              <span className="gl-ruta-num" aria-hidden="true">3</span>
              <span className="gl-ruta-nivel">Cuando ya te mueves solo</span>
              <p>
                XRP entra en cómo funciona una red que no usa minería y en el juicio que marcó al
                sector entero. La de fiscalidad es la que evita disgustos con Hacienda: modelo 721,
                método FIFO y cómo se declaran el staking y los airdrops.
              </p>
              <ul className="gl-ruta-lista">
                {enlaceGuia("xrp")}
                {enlaceGuia("fiscalidad-cripto-espana")}
              </ul>
            </article>
          </div>
        </section>

        {/* Guías publicadas: cada una, un mazo de tarjetas cielo */}
        <section className="gl-bloque">
          <h2 className="gl-titulo">Disponibles ahora</h2>
          <ul className="gl-mazos">
            {recientes.map((g) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`} className="gl-mazo">
                  <span className="gl-mazo-hoja gl-mazo-hoja--1" aria-hidden="true" />
                  <span className="gl-mazo-hoja gl-mazo-hoja--2" aria-hidden="true" />
                  <span className="gl-mazo-top">
                    <GuiaPortada guia={g} className="gl-portada" sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 360px" />
                    <span className="gl-mazo-chips">
                      <span className={`gl-chip gl-chip--${DIFF_CLASS[g.difficulty]}`}>
                        {g.difficulty.charAt(0).toUpperCase() + g.difficulty.slice(1)}
                      </span>
                      <span className="gl-chip gl-chip--gratis">Gratis</span>
                    </span>
                    <h3 className="gl-mazo-titulo">{g.title}</h3>
                    <span className="gl-mazo-desc">{g.description}</span>
                    <span className="gl-mazo-meta">
                      <span><BookOpen size={14} strokeWidth={2.6} aria-hidden="true" /> {g.sections} secciones</span>
                      <span className="gl-mazo-logro"><Trophy size={14} strokeWidth={2.6} aria-hidden="true" /> {g.badge}</span>
                    </span>
                    <span className="gl-mazo-cta">
                      Empezar <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="gl-bloque">
          <span className="gl-kicker">Preguntas frecuentes</span>
          <h2 className="gl-titulo">Lo que suele preguntar la gente</h2>

          <dl className="gl-faq">
            <div className="gl-faq-item">
              <dt>¿Es gratis de verdad?</dt>
              <dd>
                Sí. Todas las guías se leen enteras gratis y sin registrarte. Solo el quiz final de
                cada una pide una cuenta —también gratuita—, porque guarda tu resultado y te da su
                badge.
              </dd>
            </div>

            <div className="gl-faq-item">
              <dt>¿Necesito saber algo antes de empezar?</dt>
              <dd>
                No. La primera guía da por hecho que no has tocado una criptomoneda en tu vida y
                empieza por explicar qué es la tecnología que hay debajo.
              </dd>
            </div>

            <div className="gl-faq-item">
              <dt>¿Tengo que comprar criptomonedas para seguirlas?</dt>
              <dd>
                No hace falta invertir un euro. Ninguna guía te dice qué comprar ni cuándo: explican
                cómo funcionan las cosas para que decidas tú con criterio.
              </dd>
            </div>

            <div className="gl-faq-item">
              <dt>¿Cuánto tiempo me van a llevar?</dt>
              <dd>
                Las seis suman unas dos horas en total, entre 18 y 28 minutos cada una. No
                hay que hacerlas del tirón: el progreso se guarda y puedes retomarlas cuando quieras.
              </dd>
            </div>

            <div className="gl-faq-item">
              <dt>¿Y si me pierdo con alguna palabra?</dt>
              <dd>
                Para eso está el <Link href="/glosario">diccionario cripto</Link>, con los términos
                del sector explicados uno a uno y en lenguaje llano.
              </dd>
            </div>
          </dl>
        </section>

        {/* CTA registro */}
        {!user && (
          <div className="gl-cta">
            <div className="gl-cta-inner">
              <h3 className="gl-cta-titulo">Crea tu cuenta gratis y empieza a aprender</h3>
              <p className="gl-cta-sub">Accede a las guías gratuitas, acumula puntos y desbloquea badges.</p>
              <div className="gl-cta-acciones">
                <Tecla href="/register" color="naranja" tamano="grande">
                  Registrarme gratis <ArrowRight size={18} strokeWidth={2.8} aria-hidden="true" />
                </Tecla>
                <Tecla href="/login" color="blanca" tamano="grande">Ya tengo cuenta</Tecla>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
