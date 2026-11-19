import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { ArrowRight, BookOpen, Trophy, BarChart2, Star } from "lucide-react";
import { guiasVisiblesRecientes } from "@/lib/guiasVisibles";
import JsonLd from "@/components/JsonLd";
import GuiaPortada from "@/components/GuiaPortada";
import GuideSearch from "@/components/GuideSearch";
import { itemListSchema } from "@/lib/schema";
import Tecla from "@/components/cuaderno/Tecla";
import PaginasGuias from "./PaginasGuias";
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

  // Estilo «Cuaderno de estudio» (17-11-2026): el color de las guías es el cielo.
  // Las guías son mazos de tarjetas, como en la portada. El itinerario («Por
  // dónde empezar») se quitó el 19-11-2026: no se leen en orden.
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
            {/* El mismo texto de siempre (SEO auditado), con estilo (19-11-2026):
                lo que no hay, tachado a mano; lo que trae cada guía, marcado con
                el color de su chip de abajo. */}
            <p className="gl-hero-sub">
              <span className="gl-sub-no">
                No listas de <s className="gl-tachon">bullets</s> ni <s className="gl-tachon">teoría aburrida</s>.
              </span>{" "}
              Cada guía combina <strong className="gl-sub-fuerte">contenido experto</strong>,{" "}
              <span className="gl-marca gl-marca--cielo">gráficas animadas</span>,{" "}
              <span className="gl-marca gl-marca--naranja">flashcards</span>,{" "}
              <span className="gl-marca gl-marca--lila">quizzes con puntuación</span> y{" "}
              <span className="gl-marca gl-marca--amarillo">badges de logro</span> que
              demuestran <span className="gl-sub-sabes">lo que sabes.</span>
            </p>
            <div className="gl-buscar">
              <GuideSearch ventanaEnMovil />
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
              {/* Garabatos a mano detrás de las portadas (19-11-2026, pedido
                  por el admin): estudio, seguimiento y quiz, con trazo
                  irregular. Asoman alrededor del mazo. */}
              <span className="gl-garabatos">
                {/* Lista con casillas marcadas: el quiz */}
                <svg className="gl-g gl-g--lista" viewBox="0 0 60 60"><path d="M7 9.5c2.8-.4 5.6.3 8.2.1.6 2.7-.1 5.6.3 8.1-2.9.5-5.4-.2-8.3.2-.3-2.7.2-5.6-.2-8.4zM9.5 13.4l2.3 2.6 5.6-7.9M23 12.8c7.6-.6 17.4.5 29.8-.3M7.3 26.1c2.6-.2 5.5.4 8.4 0 .2 2.8-.3 5.6.1 8.2-2.8.3-5.6-.1-8.3.3-.4-2.9.1-5.5-.2-8.5zM9.4 29.8l2.5 2.7 5.4-8.2M23.2 29.6c9.1.4 15.9-.6 24.1.2M7.1 42.7c2.9-.3 5.6.2 8.3-.1.3 2.7-.2 5.5.2 8.3-2.7.4-5.6-.2-8.4.1-.2-2.8.3-5.6-.1-8.3zM23 46.3c6.4-.3 11.7.4 18.6-.2" /></svg>
                {/* Gráfica de progreso que sube: el seguimiento */}
                <svg className="gl-g gl-g--grafica" viewBox="0 0 60 60"><path d="M6.5 5.8c.6 15.6-.4 32.1.4 47.5 15.4.6 31.9-.4 47.6.3M11.8 44.2c4.6-5.3 7.4-9.8 11.9-8.1 4.2 1.7 5.6 5.2 9.8.6 4.9-5.6 8.3-15.4 14.9-22.6M42.6 13.6c2.4-.6 5.6-.9 7.1-.5.6 2.3.2 5 .3 7.4" /></svg>
                {/* Interrogación: las preguntas del quiz */}
                <svg className="gl-g gl-g--pregunta" viewBox="0 0 40 60"><path d="M9.2 17.6C8.4 9.1 15.3 4.2 21.8 5c7.4.8 11.6 7.9 8.4 14.2-2.8 5.4-9.4 7.4-10 14.6-.2 2.1.3 4.4.1 6.2M19.6 50.4c.9-.6 2.1-.4 2.4.6.3 1.2-.8 2.1-1.9 1.7-1-.4-1.2-1.6-.5-2.3z" /></svg>
                {/* Lápiz */}
                <svg className="gl-g gl-g--lapiz" viewBox="0 0 60 60"><path d="M9.6 50.8l3.1-11.9L41.3 9.7c2.6-2.3 6.2-1.8 8.6.9 2.4 2.7 2.2 6.1-.4 8.6L21.1 47.9zM12.9 38.6c3.4.2 6.7 2.9 8.1 9.1M36.6 14.2c3.7.6 7.2 3.7 8.4 8.4" /></svg>
                {/* Diana con dardo: el objetivo */}
                <svg className="gl-g gl-g--diana" viewBox="0 0 60 60"><path d="M30.4 8.1c11.9-.5 21.6 9.4 21.2 21.4-.3 11.4-10 21.1-21.6 20.7C18.2 49.8 8.7 40.6 9.1 28.9 9.6 17.4 18.8 8.6 30.4 8.1zM30.1 19.4c5.7-.3 10.6 4.6 10.3 10.4-.3 5.4-4.9 9.9-10.4 9.6-5.5-.2-9.9-4.9-9.6-10.4.3-5.2 4.6-9.4 9.7-9.6zM30.2 29.6L50.8 9.4M45.3 8.9l5.8.3-.2 5.6" /></svg>
                {/* Estrella de logro */}
                <svg className="gl-g gl-g--estrella" viewBox="0 0 40 40"><path d="M20.3 4.6l4.2 9.8 10.7.6-8.4 7.3 2.9 10.6-9.6-5.7-9.3 5.9 2.3-10.9-8.1-7 10.8-1.2z" /></svg>
              </span>
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
          {/* El cero que empieza el cole (19-11-2026): en el hueco entre el
              hero y esta sección, arriba a la derecha. Decoración. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- pegatina decorativa, ya optimizada */}
          <img src="/cuaderno/cero-pegatina.webp" alt="" width={420} height={415} className="gl-cero" loading="lazy" draggable={false} />
          <div className="gl-intro-cabeza">
            <span className="gl-kicker">Formación gratuita</span>
            {/* Mismo texto (es la palabra clave de la página), con estilo
                (19-11-2026): «gratis» en fluorescente y el «cero» grande,
                rodeado a rotulador. */}
            <h2 className="gl-titulo gl-titulo--cero">
              Aprende criptomonedas <span className="gl-tc-gratis">gratis</span>,{" "}
              <span className="gl-tc-desde">empezando desde</span>{" "}
              <span className="gl-tc-cero">cero</span>
            </h2>
          </div>
          <div className="gl-hoja">
            {/* Sin el párrafo de «leerse en orden» (19-11-2026, pedido por el
                admin: no están pensadas para leerse en orden). Lo que queda,
                marcado con los colores del cuaderno. */}
            <p>
              Estas guías son la <span className="gl-marca gl-marca--cielo">formación gratuita</span> de
              la academia. No hacen falta <s className="gl-tachon">conocimientos previos</s>, ni{" "}
              <s className="gl-tachon">tener dinero invertido</s>, ni <s className="gl-tachon">comprar nada</s>:{" "}
              <strong className="gl-sub-fuerte">se leen enteras sin registrarte</strong>. La cuenta
              gratuita solo la pide el <span className="gl-marca gl-marca--lila">quiz final</span>, que
              guarda tu resultado.
            </p>
            <p>
              <span className="gl-marca gl-marca--amarillo">Todas son gratuitas</span> y entre todas
              suman unas dos horas de lectura. Cada una termina con un{" "}
              <span className="gl-marca gl-marca--lila">quiz</span> y un{" "}
              <span className="gl-marca gl-marca--naranja">badge</span>, que están ahí para que
              compruebes que lo has entendido <span className="gl-sub-sabes">de verdad</span> y no solo
              leído por encima.
            </p>
          </div>
        </section>

        {/* Guías publicadas: cada una, un mazo de tarjetas cielo */}
        <section className="gl-bloque">
          {/* Antes «Disponibles ahora» (cambiado el 19-11-2026, pedido por el admin). */}
          <span className="gl-kicker">Todas gratis</span>
          <h2 className="gl-titulo">
            Elige la que te pique la <span className="gl-tc-gratis">curiosidad</span>
          </h2>
          <PaginasGuias>
            {recientes.map((g) => (
                <Link key={g.slug} href={`/guias/${g.slug}`} className="gl-mazo">
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
            ))}
          </PaginasGuias>
        </section>

        {/* CTA registro, rediseñada el 19-11-2026 (pedido por el admin): una
            ficha del cuaderno con celo, lo que ganas con la cuenta en tres
            líneas y la pegatina del certificado. Sin cuenta, nunca con sesión. */}
        {!user && (
          <div className="gl-cta">
            {/* eslint-disable-next-line @next/next/no-img-element -- pegatina decorativa, ya optimizada */}
            <img src="/cuaderno/certificado-pegatina.webp" alt="" width={300} height={299} className="gl-cta-pegatina" loading="lazy" draggable={false} />
            <div className="gl-cta-inner">
              <span className="gl-cta-nota">Sin pagar nada</span>
              <h3 className="gl-cta-titulo">
                Crea tu cuenta <span className="gl-tc-gratis">gratis</span> y guarda{" "}
                <span className="gl-cta-mano">todo lo que aprendes</span>
              </h3>
              <ul className="gl-cta-lista">
                <li><span className="gl-cta-check gl-cta-check--lila" aria-hidden="true"><Star size={15} strokeWidth={2.8} /></span> <span>Tu nota en el <strong>quiz</strong> de cada guía, guardada</span></li>
                <li><span className="gl-cta-check gl-cta-check--amarillo" aria-hidden="true"><Trophy size={15} strokeWidth={2.8} /></span> <span>El <strong>badge</strong> de cada guía que superas</span></li>
                <li><span className="gl-cta-check gl-cta-check--cielo" aria-hidden="true"><BookOpen size={15} strokeWidth={2.8} /></span> <span>Tus <strong>logros</strong>, todos en un sitio</span></li>
              </ul>
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
