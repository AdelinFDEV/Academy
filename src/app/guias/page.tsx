import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { ArrowRight, Zap, BookOpen, Trophy, BarChart2, Lock, Star } from "lucide-react";
import { GUIDES, GUIDES_NEWEST_FIRST } from "@/lib/guides";
import JsonLd from "@/components/JsonLd";
import { itemListSchema } from "@/lib/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/guias" },
  title: "Aprende Criptomonedas Gratis: 7 Guías",
  description:
    "Aprende criptomonedas gratis desde cero: 7 guías interactivas sobre blockchain, ciclos de Bitcoin, proyectos reales y fiscalidad en España. Con quiz y badges.",
};

// Clase CSS por dificultad (las clases guides-diff--* ya existen en globals.css).
const DIFF_CLASS: Record<string, string> = {
  "básico": "basic",
  "intermedio": "intermediate",
  "avanzado": "advanced",
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
      <span className="guias-ruta-meta">
        {g.readTime}
        {g.type === "premium" ? " · Premium" : ""}
      </span>
    </li>
  );
}

export default async function GuiasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileData = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="blog-page">
      <JsonLd
        data={itemListSchema(
          "Guías interactivas de AdelinBTC Academy",
          GUIDES_NEWEST_FIRST.map((g) => ({ name: g.title, path: `/guias/${g.slug}` }))
        )}
      />
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      <main className="guias-page">

        {/* Hero */}
        <div className="guias-hero">
          <div className="guias-hero-glow" aria-hidden="true" />
          <div className="guias-hero-inner">
            <div className="guias-hero-eyebrow">
              <Zap size={14} aria-hidden="true" />
              Guías Interactivas · AdelinBTC Academy
            </div>
            <h1 className="guias-hero-title">
              Aprende crypto<br />
              <span className="guias-hero-title-gold">como nunca antes.</span>
            </h1>
            <p className="guias-hero-subtitle">
              No listas de bullets ni teoría aburrida. Cada guía combina contenido experto,
              gráficas animadas, flashcards, quizzes con puntuación y badges de logro que
              demuestran lo que sabes.
            </p>
            <div className="guias-hero-pills">
              <span className="guias-hero-pill"><BarChart2 size={13} aria-hidden="true" /> Gráficas animadas</span>
              <span className="guias-hero-pill"><BookOpen size={13} aria-hidden="true" /> Flashcards</span>
              <span className="guias-hero-pill"><Star size={13} aria-hidden="true" /> Quiz 0–10</span>
              <span className="guias-hero-pill"><Trophy size={13} aria-hidden="true" /> Badges de logro</span>
            </div>
          </div>
        </div>

        {/* ── Contenido pilar (punto 9 del plan SEO) ──────────────────────
            El hero de arriba es la voz de marca y se queda como está; la
            palabra que la gente busca —«aprender criptomonedas gratis»— entra
            aquí, en el título de Google y en los h2. Antes esta página tenía
            unas 80 palabras indexables: era un escaparate de tarjetas. */}
        <section className="guias-pilar">
          <h2 className="guias-pilar-title">Aprende criptomonedas gratis, empezando desde cero</h2>
          <p>
            Estas guías son el itinerario de formación gratuita de la academia. No hacen falta
            conocimientos previos, ni tener dinero invertido, ni comprar nada: solo una cuenta
            gratuita para que se guarde tu progreso.
          </p>
          <p>
            Están pensadas para leerse <strong>en orden</strong>, aunque cada una funciona por su
            cuenta. La primera explica qué es una blockchain y por qué resulta tan difícil de
            falsificar. A partir de ahí cada guía añade una capa: cómo se mueve el mercado, qué
            hace por dentro un proyecto concreto y cómo tributa todo esto en España.
          </p>
          <p>
            <strong>Seis de las siete son gratuitas</strong> y entre todas suman unas dos horas de
            lectura. Cada una termina con un quiz y un badge, que están ahí para que compruebes
            que lo has entendido de verdad y no solo leído por encima.
          </p>
        </section>

        {/* Guías publicadas */}
        <div className="guias-section">
          <h2 className="guias-section-title">Disponibles ahora</h2>
          <div className="guias-grid">
            {GUIDES_NEWEST_FIRST.map((g) => (
              <Link key={g.slug} href={`/guias/${g.slug}`} className="guias-card">
                <div className="guias-card-glow" aria-hidden="true" />
                <div className="guias-card-top">
                  <span className={`guides-diff-badge guides-diff--${DIFF_CLASS[g.difficulty]}`}>
                    {g.difficulty.charAt(0).toUpperCase() + g.difficulty.slice(1)}
                  </span>
                  {g.type === "free"
                    ? <span className="guides-access-badge">Gratis con registro</span>
                    : <span className="guides-access-badge guides-access-badge--premium"><Lock size={11} aria-hidden="true" /> Premium</span>}
                </div>
                <h3 className="guias-card-title">{g.title}</h3>
                <p className="guias-card-desc">{g.description}</p>
                <div className="guias-card-meta">
                  <span><BookOpen size={13} aria-hidden="true" /> {g.sections} secciones</span>
                  <span><Trophy size={13} aria-hidden="true" /> {g.badge}</span>
                </div>
                <div className="guias-card-cta">
                  Empezar <ArrowRight size={14} aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Itinerario: los nombres y los tiempos salen de GUIDES, no escritos a
            mano, para que no se desincronicen si cambia una guía. */}
        <section className="guias-pilar">
          <h2 className="guias-pilar-title">Por dónde empezar</h2>

          <div className="guias-ruta">
            <article className="guias-ruta-paso">
              <span className="guias-ruta-nivel">Si empiezas de cero</span>
              <p>
                Solo hay una imprescindible, y es esta. Cuenta de dónde sale todo esto, cómo
                funciona una cadena de bloques y por qué nadie puede reescribirla a su antojo.
                Saltársela hace que el resto se lea cuesta arriba.
              </p>
              <ul className="guias-ruta-lista">
                {enlaceGuia("que-es-la-blockchain")}
              </ul>
            </article>

            <article className="guias-ruta-paso">
              <span className="guias-ruta-nivel">Cuando ya entiendes la base</span>
              <p>
                Aquí se pasa de la teoría a lo que ocurre de verdad. La de ciclos explica por qué
                el mercado sube y baja siguiendo cierto patrón; las otras tres diseccionan un
                proyecto real cada una, que es la mejor forma de aprender a mirar cualquier otro.
              </p>
              <ul className="guias-ruta-lista">
                {enlaceGuia("ciclos-de-bitcoin")}
                {enlaceGuia("worldcoin")}
                {enlaceGuia("render")}
                {enlaceGuia("hyperliquid")}
              </ul>
            </article>

            <article className="guias-ruta-paso">
              <span className="guias-ruta-nivel">Cuando ya te mueves solo</span>
              <p>
                XRP entra en cómo funciona una red que no usa minería y en el juicio que marcó al
                sector entero. La de fiscalidad es la única premium, y es la que evita disgustos
                con Hacienda: modelo 721, método FIFO y cómo se declaran el staking y los airdrops.
              </p>
              <ul className="guias-ruta-lista">
                {enlaceGuia("xrp")}
                {enlaceGuia("fiscalidad-cripto-espana")}
              </ul>
            </article>
          </div>
        </section>

        <section className="guias-pilar">
          <h2 className="guias-pilar-title">Lo que suele preguntar la gente</h2>

          <dl className="guias-faq">
            <dt>¿Es gratis de verdad?</dt>
            <dd>
              Sí. Seis de las siete guías son gratuitas y solo piden una cuenta —también gratuita—
              para guardar tu progreso y tus badges. La de fiscalidad es la única premium.
            </dd>

            <dt>¿Necesito saber algo antes de empezar?</dt>
            <dd>
              No. La primera guía da por hecho que no has tocado una criptomoneda en tu vida y
              empieza por explicar qué es la tecnología que hay debajo.
            </dd>

            <dt>¿Tengo que comprar criptomonedas para seguirlas?</dt>
            <dd>
              No hace falta invertir un euro. Ninguna guía te dice qué comprar ni cuándo: explican
              cómo funcionan las cosas para que decidas tú con criterio.
            </dd>

            <dt>¿Cuánto tiempo me van a llevar?</dt>
            <dd>
              Las seis gratuitas suman unas dos horas en total, entre 15 y 25 minutos cada una. No
              hay que hacerlas del tirón: el progreso se guarda y puedes retomarlas cuando quieras.
            </dd>

            <dt>¿Y si me pierdo con alguna palabra?</dt>
            <dd>
              Para eso está el <Link href="/glosario">diccionario cripto</Link>, con los términos
              del sector explicados uno a uno y en lenguaje llano.
            </dd>
          </dl>
        </section>

        {/* CTA registro */}
        {!user && (
          <div className="guias-cta-band">
            <div className="guias-cta-band-glow" aria-hidden="true" />
            <div className="guias-cta-band-inner">
              <h3 className="guias-cta-band-title">Crea tu cuenta gratis y empieza a aprender</h3>
              <p className="guias-cta-band-sub">Accede a las guías gratuitas, acumula puntos y desbloquea badges.</p>
              <div className="guias-cta-band-actions">
                <Link href="/register" className="guias-cta-primary">
                  Registrarme gratis <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/login" className="guias-cta-secondary">Ya tengo cuenta</Link>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
