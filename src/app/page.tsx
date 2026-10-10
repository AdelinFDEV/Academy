import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClientOpcional } from "@/lib/supabase/admin";
import { ArrowRight, ShieldCheck, Star, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";
import TelegramBanner from "@/components/TelegramBanner";
import { TelegramIcon } from "@/components/SocialLinks";
import { INSTAGRAM_URL, TELEGRAM_CANAL_FREE_URL } from "@/lib/contacto";
import SiteNav from "@/components/SiteNav";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
import HomeFeed, { HeroPost } from "@/components/HomeFeed";
import FeaturedGuideCard from "@/components/FeaturedGuideCard";
import PremiumPitch from "@/components/PremiumPitch";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import HeroVideo from "@/components/HeroVideo";
import HeroSpotlight from "@/components/HeroSpotlight";
import RadarWidgetsHome from "@/components/RadarWidgets";
import YouTubeLatestSection from "@/components/YouTubeLatestSection";
import { GUIDES } from "@/lib/guides";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import "./herramientas/radar/radar.css";
import "./home.css";

/**
 * Minutos de lectura a ojo: se quitan las etiquetas, se cuentan las palabras y
 * se dividen entre 200, que es el ritmo de lectura en pantalla que usa todo el
 * mundo. Nunca devuelve 0: una entrada de tres frases sigue siendo "1 min".
 */
function minutosDeLectura(html: string | null): number | null {
  if (!html) return null;
  const texto = html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  if (palabras === 0) return null;
  return Math.max(1, Math.round(palabras / 200));
}

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

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default async function HomePage() {
  const supabase = await createClient();

  // Public data doesn't depend on auth — kick it off immediately so it
  // resolves in parallel with the auth/profile round-trips. YouTube is
  // deliberately NOT here: it hits youtube.com directly (slow/unreliable),
  // so it's fetched separately inside a <Suspense> boundary below to avoid
  // blocking the rest of the page on it.
  // Las entradas premium las esconde la policy de `posts`. Sin este lector
  // desaparecerian del listado en vez de salir con su candado, y nadie sabria
  // que existen. Aqui no se pide `content`: solo lo que ya se enseña.
  const lector = createAdminClientOpcional() ?? supabase;

  const publicDataPromise = Promise.all([
    lector
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, youtube_url, is_premium, is_featured, created_at, base_likes, base_saves, categories(name, slug)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile for nav and premium check
  const [[{ data: posts }], profileRes] = await Promise.all([
    publicDataPromise,
    user
      ? supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
      : Promise.resolve(null),
  ]);
  const profileData = profileRes?.data ?? null;
  const isPremium = profileData?.role === "premium" || profileData?.role === "admin";
  const isAdmin = profileData?.role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "";

  const allPosts = posts ?? [];

  // The feed only ever renders the hero post + up to 5 posts per tab
  // (desktop shows 5; mobile hides from the 3rd onward via CSS).
  // Only those posts get sent to the client and have their metrics queried —
  // keeps payload and DB work flat as the post count grows.
  const FEED_TAB_MAX = 5;
  const heroPost = allPosts.find((p) => p.is_featured);
  const restPosts = heroPost ? allPosts.filter((p) => p.id !== heroPost.id) : allPosts;
  const feedIds = new Set<string>();
  if (heroPost) feedIds.add(heroPost.id);
  restPosts.slice(0, FEED_TAB_MAX).forEach((p) => feedIds.add(p.id));
  restPosts.filter((p) => p.is_featured).slice(0, FEED_TAB_MAX).forEach((p) => feedIds.add(p.id));
  restPosts.filter((p) => p.is_premium).slice(0, FEED_TAB_MAX).forEach((p) => feedIds.add(p.id));
  const feedPosts = allPosts.filter((p) => feedIds.has(p.id));

  const postIds = feedPosts.map((p) => p.id);

  // Bulk fetch likes, comments, saves and user state
  const [{ data: likeRows }, { data: commentRows }, { data: saveRows }, { data: userSaveRows }, { data: userLikeRows }] = await Promise.all([
    postIds.length > 0
      ? supabase.from("post_likes").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("comments").select("post_id").in("post_id", postIds).eq("approved", true)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("user_posts").select("post_id").in("post_id", postIds).eq("saved", true)
      : Promise.resolve({ data: [] }),
    user && postIds.length > 0
      ? supabase.from("user_posts").select("post_id, saved").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    user && postIds.length > 0
      ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  // El cuerpo de las entradas que se pintan, solo para medir cuanto se tarda en
  // leerlas. No se pide en la consulta grande de arriba a proposito: esa trae
  // TODAS las publicadas, y arrastrar el contenido entero de cada una en cada
  // carga de la portada se encarece con cada entrada nueva.
  const { data: contenidos } = postIds.length > 0
    ? await lector.from("posts").select("id, content").in("id", postIds)
    : { data: [] };

  const minutosMap: Record<string, number> = {};
  (contenidos as { id: string; content: string | null }[] | null)?.forEach((p) => {
    const min = minutosDeLectura(p.content);
    if (min) minutosMap[p.id] = min;
  });

  const likeMap: Record<string, number> = {};
  likeRows?.forEach((r) => { likeMap[r.post_id] = (likeMap[r.post_id] ?? 0) + 1; });

  const commentMap: Record<string, number> = {};
  commentRows?.forEach((r) => { commentMap[r.post_id] = (commentMap[r.post_id] ?? 0) + 1; });

  const saveMap: Record<string, number> = {};
  saveRows?.forEach((r) => { saveMap[r.post_id] = (saveMap[r.post_id] ?? 0) + 1; });

  const userSavedSet = new Set(userSaveRows?.filter((r) => r.saved).map((r) => r.post_id) ?? []);
  const userLikedSet = new Set(userLikeRows?.map((r) => r.post_id) ?? []);

  // Cifras reales de la cartera para la tarjeta del hero. Si falla, la
  // tarjeta cae a su microvisual de siempre y nadie se entera.
  const resumenPortfolio = await resumenPortfolioPublico();

  const latestGuide = GUIDES[GUIDES.length - 1];

  const enrichedPosts = feedPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    cover_image: p.cover_image,
    youtube_url: p.youtube_url,
    is_premium: p.is_premium,
    is_featured: p.is_featured,
    created_at: p.created_at,
    categories: p.categories as unknown as { name: string; slug: string } | null,
    likes: (p.base_likes ?? 0) + (likeMap[p.id] ?? 0),
    saves: (p.base_saves ?? 0) + (saveMap[p.id] ?? 0),
    comments: commentMap[p.id] ?? 0,
    initialLiked: userLikedSet.has(p.id),
    initialSaved: userSavedSet.has(p.id),
    minutos: minutosMap[p.id] ?? null,
  }));

  const enrichedHero = enrichedPosts.find((p) => p.is_featured) ?? null;

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

      {/* ── El mercado ahora mismo ──────────────────────────────────────────
          Los dos widgets del Radar Diario, en vivo y con el mismo componente
          que usa la propia herramienta (`@/components/RadarWidgets`): si un
          día se mejoran allí, aquí cambian solos.

          Va justo aquí, entre el hero y el contenido editorial, porque es
          información que caduca: primero lo que pasa hoy, después lo que se
          lee con calma. */}
      <RadarWidgetsHome />

      {/* ── Fila destacada: entrada principal + última guía (50/50, full width) ── */}
      {(enrichedHero || latestGuide) && (
        <div className="home-featured-row">
          {enrichedHero && <HeroPost post={enrichedHero} isLoggedIn={!!user} />}
          {latestGuide && <FeaturedGuideCard guide={latestGuide} />}
        </div>
      )}

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

        {/* Feed — el hero ya se muestra en la fila destacada de arriba */}
        <HomeFeed
          posts={enrichedPosts}
          isLoggedIn={!!user}
          showHero={false}
          youtubeSection={
            <Suspense key="yt-latest" fallback={null}>
              <YouTubeLatestSection />
            </Suspense>
          }
        />

      </div>

      {/* ── Premium — sección full-width en desktop (en móvil va arriba, tras Herramientas) ── */}
      <section className="premium-section">
        <PremiumPitch variant="section" />
      </section>

      <GuidesHomeSection />

      {/* ── Contacto cercano — Instagram ── */}
      <section className="contact-cta-section">
        <div className="contact-cta-card">
          <div className="contact-cta-glow" aria-hidden="true" />

          <div className="contact-cta-left">
            <div className="contact-cta-avatar">
              <TelegramIcon size={18} />
            </div>
            <div className="contact-cta-text">
              <span className="contact-cta-eyebrow">
                <MessageCircle size={12} aria-hidden="true" />
                Hablemos
              </span>
              <h2 className="contact-cta-title">¿Dudas, ideas o algo que le falta a la academia?</h2>
              <p className="contact-cta-sub">
                Escríbeme por donde te resulte más cómodo — leo cada mensaje personalmente,
                y varias mejoras de la web han salido de ahí.
              </p>
              <div className="contact-cta-footer">
                <span className="contact-cta-handle">@AdelinBTC</span>
                <span className="contact-cta-footer-sep" aria-hidden="true" />
                <span className="contact-cta-response">
                  <span className="contact-cta-response-dot" aria-hidden="true" />
                  Responde en menos de 24h
                </span>
              </div>
            </div>
          </div>

          {/* Telegram primero y en primario: es donde está la comunidad.
              Instagram queda como alternativa.

              Y ahora apunta de verdad a la comunidad: hasta el 06-09-2026 este
              botón abría el privado de Adelin, justo lo que el comentario de
              arriba decía que NO era. */}
          <div className="contact-cta-botones">
            <a
              href={TELEGRAM_CANAL_FREE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-cta-btn contact-cta-btn--telegram"
            >
              <TelegramIcon />
              Telegram
              <ArrowRight size={15} className="contact-cta-btn-arrow" aria-hidden="true" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-cta-btn contact-cta-btn--instagram"
            >
              <InstagramIcon />
              Instagram
              <ArrowRight size={15} className="contact-cta-btn-arrow" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>


      <Footer />

      {/* Ya no lleva prop: apuntaba al bot y necesitaba que el servidor le
          pasara el username. Ahora lee el canal de `lib/contacto`, que es una
          constante y sí llega al cliente. */}
      <TelegramBanner />
    </div>
  );
}
