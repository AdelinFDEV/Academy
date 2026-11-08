import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Star } from "lucide-react";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PremiumHome from "@/components/PremiumHome";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import HeroVideo from "@/components/HeroVideo";
import HeroSlider, { type ResumenHero } from "@/components/HeroSlider";
import YouTubeLatestSection from "@/components/YouTubeLatestSection";
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
  //
  // La cartera pública no depende de quién mire: se pide A LA VEZ que la
  // sesión, no después (antes eran tres esperas en fila: sesión, perfil y
  // cartera). La cartera tiene su propia caché; aquí solo se deja de esperar.
  const [{ data: { user } }, resumenCompleto] = await Promise.all([
    supabase.auth.getUser(),
    resumenPortfolioPublico(),
  ]);

  const profileRes = user
    ? await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
    : null;
  const profileData = profileRes?.data ?? null;
  const isPremium = profileData?.role === "premium" || profileData?.role === "admin";
  const isAdmin = profileData?.role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "";

  // Cifras reales de la cartera para la tarjeta del hero. Si falla, la
  // tarjeta cae a su microvisual de siempre y nadie se entera.
  //
  // Recortadas a lo que se enseña: HeroSlider es de cliente, y lo que recibe
  // viaja en el HTML. Pasarle el resumen entero publicaba los importes
  // invertidos aunque `MOSTRAR_IMPORTES` diga que no (arreglado el 04-11-2026).
  const resumenPortfolio: ResumenHero = resumenCompleto && {
    posiciones: resumenCompleto.posiciones,
    rentabilidadPct: resumenCompleto.rentabilidadPct,
    desdeAnio: resumenCompleto.desdeAnio,
    dca: resumenCompleto.dca && {
      rentabilidadPct: resumenCompleto.dca.rentabilidadPct,
      compras: resumenCompleto.dca.compras,
    },
  };

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
          <HeroSlider isPremium={isPremium} portfolio={resumenPortfolio} />

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
          sube aquí, tras el hero. */}
      <GuidesHomeSection />


      {/* ── Cuerpo ──
          Hasta el 07-09-2026 esto eran dos columnas, con un lateral de 300 px
          que llevaba Herramientas, Educación y Categorías. Retirado a mano por
          el admin: el feed se queda con todo el ancho. Las herramientas siguen
          accesibles desde el menú y el dashboard. */}
      <div className="home-layout" id="feed">

        {/* El último vídeo de YouTube. Iba dentro del feed de entradas, que se
            retiró el 10-10-2026 con todo el sistema de entradas. */}
        <div className="home-feed">
          <Suspense key="yt-latest" fallback={null}>
            <YouTubeLatestSection />
          </Suspense>
        </div>

      </div>

      {/* ── Premium: una sola sección para todos los anchos, y solo para quien
          aún no lo es ── */}
      {!isPremium && <PremiumHome portfolio={resumenPortfolio} />}

      <Footer />
    </div>
  );
}
