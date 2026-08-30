import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, BookA, Radio, Route, ShieldCheck, Star, Tag, MessageCircle } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import TelegramBanner from "@/components/TelegramBanner";
import { TelegramIcon } from "@/components/SocialLinks";
import { INSTAGRAM_URL, TELEGRAM_ADELIN_URL } from "@/lib/contacto";
import SiteNav from "@/components/SiteNav";
import GuideSearch from "@/components/GuideSearch";
import HomeFeed, { HeroPost } from "@/components/HomeFeed";
import FeaturedGuideCard from "@/components/FeaturedGuideCard";
import PremiumPitch from "@/components/PremiumPitch";
import SidebarTools from "@/components/SidebarTools";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import HeroVideo from "@/components/HeroVideo";
import HeroSpotlight from "@/components/HeroSpotlight";
import YouTubeLatestSection from "@/components/YouTubeLatestSection";
import { GUIDES } from "@/lib/guides";
import "./home.css";
import type { PostCategoryRef } from "@/lib/types";

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
  const publicDataPromise = Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, youtube_url, is_premium, is_featured, created_at, base_likes, base_saves, categories(name, slug)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("name, slug")
      .order("name"),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile for nav and premium check
  const [[{ data: posts }, { data: categories }], profileRes] = await Promise.all([
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

  const likeMap: Record<string, number> = {};
  likeRows?.forEach((r) => { likeMap[r.post_id] = (likeMap[r.post_id] ?? 0) + 1; });

  const commentMap: Record<string, number> = {};
  commentRows?.forEach((r) => { commentMap[r.post_id] = (commentMap[r.post_id] ?? 0) + 1; });

  const saveMap: Record<string, number> = {};
  saveRows?.forEach((r) => { saveMap[r.post_id] = (saveMap[r.post_id] ?? 0) + 1; });

  const userSavedSet = new Set(userSaveRows?.filter((r) => r.saved).map((r) => r.post_id) ?? []);
  const userLikedSet = new Set(userLikeRows?.map((r) => r.post_id) ?? []);

  const latestGuide = GUIDES[GUIDES.length - 1];

  // Count posts per category
  const catPostMap: Record<string, number> = {};
  allPosts.forEach((p) => {
    const slug = (p.categories as PostCategoryRef | null)?.slug;
    if (slug) catPostMap[slug] = (catPostMap[slug] ?? 0) + 1;
  });

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

          <HeroSpotlight isLoggedIn={!!user} isPremium={isPremium} guidesCount={GUIDES.length} />

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

      {/* ── Fila destacada: entrada principal + última guía (50/50, full width) ── */}
      {(enrichedHero || latestGuide) && (
        <div className="home-featured-row">
          {enrichedHero && <HeroPost post={enrichedHero} isLoggedIn={!!user} />}
          {latestGuide && <FeaturedGuideCard guide={latestGuide} />}
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="home-layout" id="feed">

        <div className="tools-mobile-only">
          <SidebarTools isLoggedIn={!!user} isPremium={isPremium} />
        </div>

        {/* Premium pitch — en móvil sube aquí, justo tras Herramientas.
            En desktop no se muestra aquí: va como sección tras el layout. */}
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

        {/* Sidebar */}
        <aside className="home-sidebar">

          {/* Herramientas */}
          <div className="tools-desktop-only">
            <SidebarTools isLoggedIn={!!user} isPremium={isPremium} />
          </div>

          {/* Educación */}
          <div className="sidebar-card">
            <p className="sidebar-card-title">Educación</p>
            <div className="sidebar-tools-list">
              <Link href="/glosario" className="sidebar-tool-link">
                <BookA size={16} className="sidebar-tool-icon" />
                <span className="sidebar-tool-label">Diccionario Cripto</span>
              </Link>
              <div className="sidebar-tool-link sidebar-tool-link--soon">
                <Radio size={16} className="sidebar-tool-icon" />
                <span className="sidebar-tool-label">Trading en Directo</span>
                <span className="sidebar-tool-badge--soon">Pronto</span>
              </div>
              <Link href="/guias" className="sidebar-tool-link sidebar-tool-link--gold">
                <Route size={16} className="sidebar-tool-icon" />
                <span className="sidebar-tool-label">Guías Interactivas</span>
              </Link>
            </div>
          </div>

          {/* Categorías — temáticas educativas (Bitcoin, blockchain, etc.).
              Se leen dinámicamente de la tabla `categories` de Supabase. */}
          {(categories ?? []).length > 0 && (
            <div className="sidebar-card">
              <p className="sidebar-card-title">Categorías</p>
              <div className="sidebar-tools-list">
                {(categories ?? []).map((c) => (
                  <Link key={c.slug} href={`/categoria/${c.slug}`} className="sidebar-tool-link">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Tag size={16} className="sidebar-tool-icon" />
                      <span>{c.name}</span>
                    </div>
                    {catPostMap[c.slug] && (
                      <span className="sidebar-cat-count">{catPostMap[c.slug]}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </aside>
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

          {/* Telegram primero y en primario: es donde está la comunidad y donde
              responde antes. Instagram queda como alternativa. */}
          <div className="contact-cta-botones">
            <a
              href={TELEGRAM_ADELIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-cta-btn"
            >
              <TelegramIcon />
              Telegram
              <ArrowRight size={15} className="contact-cta-btn-arrow" aria-hidden="true" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-cta-btn contact-cta-btn--alt"
            >
              <InstagramIcon />
              Instagram
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* El username sale del entorno en el servidor: TELEGRAM_BOT_USERNAME no
          lleva el prefijo NEXT_PUBLIC_, así que no es accesible desde el
          cliente y hay que pasárselo como prop. */}
      <TelegramBanner botUsername={process.env.TELEGRAM_BOT_USERNAME || "AdelinBTC_Bot"} />
    </div>
  );
}
