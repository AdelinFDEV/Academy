import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import ComoFunciona from "@/components/aula/ComoFunciona";
import { createClient } from "@/lib/supabase/server";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { cursosPublicados, duracion } from "@/lib/cursos";
import "../herramientas/detalle.css";
import "./cursos.css";

/**
 * Catálogo de cursos — la puerta de todos los cursos de la academia.
 *
 * El contenido no vive aquí: cada curso es una fila de `cursos` en Supabase
 * (esquema en `scripts/create-cursos.sql`) y esta página solo lo pinta.
 *
 * ── Mientras no haya ningún curso publicado ───────────────────────────────
 *
 * La página existe y se enlaza desde el catálogo de herramientas, pero sale
 * con `noindex` y fuera del sitemap: una página vacía indexada es contenido
 * pobre para Google, y en un sitio YMYL eso pesa. En cuanto se publica el
 * primer curso pasa a indexable y entra sola en el sitemap — la misma regla
 * que las categorías sin entradas.
 *
 * ⚠️ «Cómo funciona un curso» describe lo acordado con el admin: módulos,
 * ritmo propio, examen por módulo y final con nota de 0 a 10 y certificado.
 * **Antes de publicar el primer curso, todo eso tiene que existir de verdad.**
 * Si alguna pieza se queda fuera, se quita de aquí: no se promete lo que el
 * producto no hace.
 */
export async function generateMetadata(): Promise<Metadata> {
  const cursos = await cursosPublicados();
  return {
    title: "Cursos de criptomonedas",
    description:
      "Cursos por módulos para alumnos Premium: a tu ritmo, con examen al final de cada módulo, examen final con nota de 0 a 10 y certificado.",
    // Vacía: `noindex` y SIN canónica, como un borrador. Una canónica le diría
    // a Google que esta es la buena versión de una página que pide no indexarse.
    ...(cursos.length > 0
      ? { alternates: { canonical: "/cursos" } }
      : { robots: { index: false, follow: true } }),
  };
}


export default async function CursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const userName = profile?.full_name ?? user?.email?.split("@")[0];

  const cursos = await cursosPublicados();
  const hayCursos = cursos.length > 0;
  const totalModulos = cursos.reduce((t, c) => t + c.modulos, 0);
  const totalMinutos = cursos.reduce((t, c) => t + c.minutos, 0);

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Cursos", path: "/cursos" },
          ]),
        ]}
      />

      <SiteNav user={!!user} isPremium={isPremium} userName={userName} isAdmin={role === "admin"} />

      <main
        className="blog-main det-main"
        style={{ "--det-accent": "#e6b455", "--det-accent-2": "#f5dca6" } as React.CSSProperties}
      >
        <div className="det-backdrop" aria-hidden="true">
          <span className="det-backdrop-grid" />
          <span className="det-orb det-orb--1" />
          <span className="det-orb det-orb--2" />
          <span className="det-orb det-orb--3" />
        </div>

        <nav className="det-breadcrumb" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Cursos</span>
        </nav>

        {/* ── Hero ── */}
        <header className="det-hero">
          {hayCursos && <span className="det-hero-watermark" aria-hidden="true">{cursos.length}</span>}

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            {hayCursos ? "Incluido en Premium" : "En preparación"}
          </span>

          <h1 className="det-title">
            Cursos
            <span className="det-title-grad">Aprender en orden, y demostrarlo.</span>
          </h1>

          <p className="det-lead">
            Las <Link href="/articulos">entradas</Link> explican una noticia y las{" "}
            <Link href="/guias">guías</Link> un tema. Un curso te lleva de principio a fin
            por una materia entera, módulo a módulo, con un examen que comprueba que lo
            has entendido antes de seguir.
          </p>

          {hayCursos && (
            <div className="det-stats">
              <div className="det-stat">
                <span className="det-stat-value">{cursos.length}</span>
                <span className="det-stat-label">{cursos.length === 1 ? "Curso" : "Cursos"}</span>
              </div>
              <div className="det-stat">
                <span className="det-stat-value">{totalModulos}</span>
                <span className="det-stat-label">Módulos con examen</span>
              </div>
              <div className="det-stat">
                <span className="det-stat-value">{duracion(totalMinutos)}</span>
                <span className="det-stat-label">De contenido</span>
              </div>
            </div>
          )}
        </header>

        {/* ── 01 · Los cursos ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">01</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">{hayCursos ? "Todos los cursos" : "El primer curso está en camino"}</h2>
              <p className="det-sechead-sub">
                {hayCursos
                  ? "Ordenados de menos a más: si empiezas de cero, empieza por arriba."
                  : "Todavía no hay ningún curso publicado. Cuando salga el primero aparecerá aquí."}
              </p>
            </div>
          </header>

          {hayCursos ? (
            <ul className="cur-grid">
              {cursos.map((c) => (
                <li key={c.slug} className="cur-card" style={{ "--cur-color": c.color } as React.CSSProperties}>
                  {/* La ficha de cada curso (/cursos/[slug]) es el paso siguiente.
                      No publiques un curso antes de que exista: el enlace daría 404. */}
                  <Link href={`/cursos/${c.slug}`} className="cur-card-link">
                    <span className="cur-card-top">
                      <span className="cur-card-icon" aria-hidden="true">
                        <GraduationCap size={20} strokeWidth={1.9} />
                      </span>
                      <span className="cur-card-nivel">{c.nivel}</span>
                    </span>
                    <span className="cur-card-title">{c.titulo}</span>
                    {c.subtitulo && <span className="cur-card-text">{c.subtitulo}</span>}
                    <span className="cur-card-meta">
                      <span>{c.modulos} {c.modulos === 1 ? "módulo" : "módulos"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{c.lecciones} {c.lecciones === 1 ? "lección" : "lecciones"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{duracion(c.minutos)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cur-vacio">
              <span className="cur-vacio-icon" aria-hidden="true">
                <GraduationCap size={26} strokeWidth={1.7} />
              </span>
              <p className="cur-vacio-text">
                Mientras tanto, las <Link href="/guias">guías interactivas</Link> cubren los
                fundamentos, y el <Link href="/glosario">diccionario</Link> explica cada término
                que vas a encontrarte.
              </p>
            </div>
          )}
        </section>

        {/* ── 02 · Cómo funciona ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">02</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">{hayCursos ? "Cómo funciona un curso" : "Cómo serán los cursos"}</h2>
              <p className="det-sechead-sub">
                Cuatro piezas, y todas pensadas para que termines lo que empiezas.
              </p>
            </div>
          </header>

          <ComoFunciona />
        </section>

        {/* ── Cierre ── */}
        <section className="det-final">
          <span className="det-final-watermark" aria-hidden="true">10</span>
          <h2 className="det-final-title">
            {isPremium ? "Los cursos entran en tu suscripción" : "Los cursos van incluidos en Premium"}
          </h2>
          <p className="det-final-sub">
            {isPremium
              ? "No hay que comprar nada aparte: cada curso que se publique aparecerá aquí, listo para empezar."
              : "Sin compras sueltas: todos los cursos entran en la misma suscripción que las herramientas."}
          </p>
          <div className="det-actions">
            {isPremium ? (
              <Link href="/guias" className="det-btn">
                Ver las guías
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ) : (
              <Link href="/premium" className="det-btn">
                Ver qué incluye Premium
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            )}
            <Link href="/herramientas" className="det-btn det-btn--ghost">
              Ver las herramientas
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
