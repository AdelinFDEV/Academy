import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Star } from "lucide-react";
import Footer from "@/components/Footer";
import TelegramBanner from "@/components/TelegramBanner";
import SiteNav from "@/components/SiteNav";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
import PremiumPitch from "@/components/PremiumPitch";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import HeroVideo from "@/components/HeroVideo";
import HeroSpotlight from "@/components/HeroSpotlight";
import YouTubeLatestSection from "@/components/YouTubeLatestSection";
import { GUIDES } from "@/lib/guides";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import "./home.css";

/**
 * La portada hereda del layout raíz el título, la descripción y el OpenGraph;
 * aquí solo se declara la canónica.
 *
 * Va en la página y no en el layout raíz a propósito: en Next.js los metadatos
 * del layout los heredan todas las rutas hijas, así que una canónica ahí le
 * pondría "/" a media web.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const supabase = await createClient();

  // YouTube no se pide aquí: va a youtube.com (lento y poco fiable) y se
  // resuelve en su propio <Suspense> más abajo, sin frenar la página.
  const { data: { user } } = await supabase.auth.getUser();

  const profileRes = user
    ? await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
    : null;
  const profileData = profileRes?.data ?? null;
  const isPremium = profileData?.role === "premium" || profileData?.role === "admin";
  const isAdmin = profileData?.role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "";

  // Cifras reales de la cartera para la tarjeta del hero. Si falla, la
  // tarjeta cae a su microvisual de siempre y nadie se entera.
  const resumenPortfolio = await resumenPortfolioPublico();

  return (
    <div className="blog-page home-page">
      <link rel="preload" as="image" href="/hero-poster.webp" fetchPriority="high" />
      <div className="bg-ambient" />

      {/* ── Nav ── */}
      <SiteNav user={!!user} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />

      {/* ── Hero ── */}
      <div className="hero">
        <HeroVideo />
        <div className="hero-scrim" />
        <div className="hero-aurora" aria-hidden="true" />

        <div className="hero-content">
          {/* En movil el contador baja aqui, justo sobre el buscador: en la
              barra le quitaba el sitio a «Entrar» y «Registrarse», que es lo
              que de verdad tiene que poder pulsarse desde el telefono. En
              escritorio sigue en la barra y esto no se pinta. */}
          <div className="hero-contador hero-anim hero-anim-1">
            <LiveCounter />
          </div>

          <div className="hero-search-bar hero-anim hero-anim-1">
            <GuideSearch />
          </div>

          <div className="hero-headline hero-anim hero-anim-2">
            <h1 className="hero-title">
              Todo lo que necesitas para <span className="text-gradient">dejar de improvisar</span> en cripto
            </h1>
            <p className="hero-subtitle">
              Una única academia para tu camino cripto — sin dispersión, sin letra pequeña.
            </p>
          </div>

          <HeroSpotlight
            isLoggedIn={!!user}
            isPremium={isPremium}
            guidesCount={GUIDES.length}
            portfolio={resumenPortfolio}
          />

          {!user && (
            <div className="hero-trust hero-anim hero-anim-4">
              <div className="hero-social-proof">
                <div className="hero-avatars" aria-hidden="true">
                  <span className="hero-avatar" style={{ background: "linear-gradient(135deg,#ff9a00,#ff6b2b)" }}>A</span>
                  <span className="hero-avatar" style={{ background: "linear-gradient(135deg,#4f9dff,#2b6bff)" }}>M</span>
                  <span className="hero-avatar" style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}>J</span>
                  <span className="hero-avatar" style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)" }}>L</span>
                  <span className="hero-avatar hero-avatar-count">+98</span>
                </div>
                <div className="hero-proof-text">
                  <div className="hero-stars" aria-label="Valoración 4.9 sobre 5">
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                  </div>
                  <span><strong>+100 traders</strong> aprendiendo cada día</span>
                </div>
              </div>

              <p className="hero-guarantee">
                <ShieldCheck size={14} aria-hidden="true" />
                Cancela cuando quieras · Sin permanencia
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Las guías, justo tras el hero ─────────────────────────────────
          Desde el 10-10-2026 la academia son las guías: el bloque entero
          (destacada + cifras + catálogo) sube aquí. El bloque del mercado en
          vivo que iba antes se retiró el mismo día: está en el Radar Diario. Antes había una fila con la
          entrada destacada y la última guía, y este bloque iba tras Premium. */}
      <GuidesHomeSection />


      {/* ── Cuerpo ──
          Hasta el 07-09-2026 esto eran dos columnas, con un lateral de 300 px
          que llevaba Herramientas, Educación y Categorías. Retirado a mano por
          el admin: el feed se queda con todo el ancho. Las herramientas siguen
          accesibles desde la barra de navegación y desde /herramientas. */}
      <div className="home-layout" id="feed">

        {/* Premium pitch — solo en móvil, bajo el feed. En escritorio no se
            muestra aquí: va como sección a lo ancho, tras el cuerpo. */}
        <div className="premium-pitch-mobile-only">
          <PremiumPitch variant="card" />
        </div>

        {/* El último vídeo de YouTube. Iba dentro del feed de entradas, que se
            retiró el 10-10-2026 con todo el sistema de entradas. */}
        <div className="home-feed">
          <Suspense key="yt-latest" fallback={null}>
            <YouTubeLatestSection />
          </Suspense>
        </div>

      </div>

      {/* ── Premium — sección full-width en desktop (en móvil va arriba, tras Herramientas) ── */}
      <section className="premium-section">
        <PremiumPitch variant="section" />
      </section>


      <Footer />

      {/* Ya no lleva prop: apuntaba al bot y necesitaba que el servidor le
          pasara el username. Ahora lee el canal de `lib/contacto`, que es una
          constante y sí llega al cliente. */}
      <TelegramBanner />
    </div>
  );
}
