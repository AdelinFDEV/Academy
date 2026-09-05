import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import GlosarioClient from "./GlosarioClient";
import { GLOSARIO, GLOSARIO_CON_PAGINA, GLOSARIO_CATEGORIAS } from "@/lib/glosario";
import "../herramientas/detalle.css";
import "./glosario.css";

/**
 * Diccionario Cripto — listado de los términos.
 *
 * Rediseñado el 05-09-2026 con el sistema visual de las fichas de herramienta
 * (`detalle.css`): fondo técnico, hero con marca de agua y cabeceras
 * numeradas. Antes era una lista plana sobre fondo plano.
 *
 * Es el nodo que enlaza a las fichas de cada término, el bloque de URLs más
 * grande del sitio. La paginación de la lista es SOLO visual —ver el comentario
 * en `GlosarioClient`— para no perder ese enlazado.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/glosario" },
  title: "Diccionario cripto: 49 términos explicados",
  description:
    "Qué significan market cap, apalancamiento, vesting o stop-loss, explicados en cristiano y con ejemplos. Gratis y sin registro.",
};

export default async function GlosarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const initialSaved: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("saved_terms")
      .select("term")
      .eq("user_id", user.id);
    initialSaved.push(...(data ?? []).map((r) => r.term));
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <JsonLd
        data={{
          "@type": "DefinedTermSet",
          name: "Diccionario Cripto de AdelinBTC Academy",
          description:
            "Términos de criptomonedas y trading explicados para quien empieza.",
          hasDefinedTerm: GLOSARIO_CON_PAGINA.slice(0, 20).map((t) => ({
            "@type": "DefinedTerm",
            name: t.term,
            description: t.definition,
          })),
        }}
      />

      <SiteNav user={!!user} />

      <main
        className="blog-main det-main gl-main"
        style={{ "--det-accent": "#22d3ee", "--det-accent-2": "#a5f3fc" } as React.CSSProperties}
      >
        <div className="det-backdrop" aria-hidden="true">
          <span className="det-backdrop-grid" />
          <span className="det-orb det-orb--1" />
          <span className="det-orb det-orb--2" />
          <span className="det-orb det-orb--3" />
        </div>

        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">Aa</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            Gratis y sin registro
          </span>

          <h1 className="det-title">
            Diccionario cripto
            <span className="det-title-grad">En cristiano, no en jerga.</span>
          </h1>

          <p className="det-lead">
            Cada palabra que te encuentras y nadie te explica: qué significa,
            por qué importa y cuál es el error típico. Escrito para quien
            empieza, no para quien ya lo sabe.
          </p>

          <div className="det-stats">
            <div className="det-stat">
              <span className="det-stat-value">{GLOSARIO.length}</span>
              <span className="det-stat-label">Términos</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">{GLOSARIO_CATEGORIAS.length}</span>
              <span className="det-stat-label">Categorías</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">{GLOSARIO_CON_PAGINA.length}</span>
              <span className="det-stat-label">Con explicación larga</span>
            </div>
          </div>

          {!user && (
            <p className="det-stats-nota">
              <span className="det-stats-dot" aria-hidden="true" />
              <Link href="/login">Inicia sesión</Link>&nbsp;si quieres guardar
              términos en tu dashboard. Leerlos no requiere cuenta.
            </p>
          )}
        </header>

        <GlosarioClient isLoggedIn={!!user} initialSaved={initialSaved} />
      </main>

      <Footer />
    </div>
  );
}
