import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, NotebookPen, BookA, MonitorPlay, Route, ShieldCheck, Star, Crown, Gem, Check, Tag, Map, Unlock, MessageCircle, Wallet, GraduationCap } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import GuideSearch from "@/components/GuideSearch";
import HomeFeed from "@/components/HomeFeed";
import SidebarTools from "@/components/SidebarTools";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import HeroVideo from "@/components/HeroVideo";
import HeroSpotlight from "@/components/HeroSpotlight";
import YouTubeLatestSection from "@/components/YouTubeLatestSection";
import { GUIDES } from "@/lib/guides";
import "./home.css";

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

  // The feed only ever renders the hero post + up to 3 posts per tab.
  // Only those posts get sent to the client and have their metrics queried —
  // keeps payload and DB work flat as the post count grows.
  const FEED_TAB_MAX = 3;
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
    const slug = (p.categories as any)?.slug;
    if (slug) catPostMap[slug] = (catPostMap[slug] ?? 0) + 1;
  });

  const premiumPitchCard = (
    <div className="premium-pitch">
      <span className="premium-pitch-glow" aria-hidden="true" />

      <div className="premium-pitch-top">
        <span className="premium-pitch-badge">
          <Crown size={13} aria-hidden="true" /> Premium
        </span>
        <span className="premium-pitch-discount">-60%</span>
      </div>

      <h3 className="premium-pitch-title">
        Deja de mirar el mercado.<br />
        <span className="text-gradient">Empieza a operarlo.</span>
      </h3>
      <p className="premium-pitch-sub">
        Las herramientas que separan a los que improvisan de los que operan con ventaja.
      </p>

      <ul className="premium-pitch-features">
        <li className="premium-pitch-feature">
          <span className="premium-pitch-feature-icon" style={{ color: "#ff9a4d", background: "rgba(255,154,77,0.14)", borderColor: "rgba(255,154,77,0.3)" }}>
            <NotebookPen size={16} aria-hidden="true" />
          </span>
          <span>
            <strong>Diario de Trading</strong>
            No solo registras: completas retos que te convierten en un trader disciplinado.
          </span>
        </li>
        <li className="premium-pitch-feature">
          <span className="premium-pitch-feature-icon" style={{ color: "#34d399", background: "rgba(52,211,153,0.14)", borderColor: "rgba(52,211,153,0.3)" }}>
            <Unlock size={16} aria-hidden="true" />
          </span>
          <span>
            <strong>Liberaciones de Tokens</strong>
            Anticipa la presión vendedora con el calendario de vesting en tiempo real.
          </span>
        </li>
        <li className="premium-pitch-feature">
          <span className="premium-pitch-feature-icon" style={{ color: "#fb923c", background: "rgba(251,146,60,0.14)", borderColor: "rgba(251,146,60,0.3)" }}>
            <Wallet size={16} aria-hidden="true" />
          </span>
          <span>
            <strong>Portfolio Spot</strong>
            Sigue en directo las compras reales de AdelinBTC, con precios de entrada y contexto.
          </span>
        </li>
        <li className="premium-pitch-feature">
          <span className="premium-pitch-feature-icon" style={{ color: "#ffd166", background: "rgba(255,209,102,0.14)", borderColor: "rgba(255,209,102,0.3)" }}>
            <Gem size={16} aria-hidden="true" />
          </span>
          <span>
            <strong>Guías Premium</strong>
            Desbloquea todas las guías interactivas, no solo las básicas.
          </span>
        </li>
      </ul>

      <div className="premium-pitch-included">
        <GraduationCap size={13} aria-hidden="true" />
        Lancemos los cursos que lancemos, siempre estarán incluidos — sin coste extra.
      </div>

      <div className="premium-pitch-price-wrapper">
        <span className="premium-pitch-limited">Por tiempo limitado</span>
        <div className="premium-pitch-price">
          <span className="premium-pitch-old-price">49,99€</span>
          <span className="premium-pitch-amount">19,99€</span>
          <span className="premium-pitch-period">/mes</span>
        </div>
      </div>

      <Link href="/premium" className="premium-pitch-cta">
        Más información <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
      </Link>

      <p className="premium-pitch-note">
        <Check size={13} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras
      </p>
    </div>
  );

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

  return (
    <div className="blog-page">
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

          <HeroSpotlight isLoggedIn={!!user} isPremium={isPremium} latestGuide={latestGuide} />

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

      {/* ── Empieza aquí / Última guía — bandas gemelas ── */}
      <div className="starthere-row">
        <Link href="/guia-iniciacion" className="starthere-band">
          <span className="starthere-band-glow" aria-hidden="true" />
          <span className="starthere-band-left">
            <span className="starthere-band-icon">
              <Map size={22} aria-hidden="true" />
            </span>
            <span className="starthere-band-text">
              <span className="starthere-band-eyebrow">¿Nuevo en cripto?</span>
              <span className="starthere-band-title">Empieza aquí — tu hoja de ruta paso a paso</span>
              <span className="starthere-band-steps" aria-hidden="true">
                <i /><em /><i /><em /><i />
              </span>
            </span>
          </span>
          <span className="starthere-band-cta">
            <span className="starthere-band-cta-label">
              Empieza <ArrowRight size={15} strokeWidth={2.5} className="starthere-cta-arrow" aria-hidden="true" />
            </span>
            <span className="starthere-band-cta-sub">Gratis · 5 min</span>
          </span>
        </Link>
      </div>

      {/* ── Main layout ── */}
      <div className="home-layout" id="feed">

        <div className="tools-mobile-only">
          <SidebarTools isLoggedIn={!!user} isPremium={isPremium} />
        </div>

        {/* Premium pitch — en móvil sube aquí, justo tras Herramientas */}
        <div className="premium-pitch-mobile-only">
          {premiumPitchCard}
        </div>

        {/* Feed */}
        <HomeFeed
          posts={enrichedPosts}
          isLoggedIn={!!user}
          youtubeSection={
            <Suspense fallback={null}>
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
              <Link href="/glosario" className="sidebar-tool-link" style={{ "--tool-color": "#2f8fff" } as React.CSSProperties}>
                <BookA size={16} className="sidebar-tool-icon" style={{ color: "#2f8fff" }} />
                <span className="sidebar-tool-label" style={{ color: "#2f8fff" }}>Diccionario Cripto</span>
              </Link>
              <div className="sidebar-tool-link sidebar-tool-link--soon" style={{ "--tool-color": "#b98bff" } as React.CSSProperties}>
                <MonitorPlay size={16} className="sidebar-tool-icon" style={{ color: "#b98bff" }} />
                <span className="sidebar-tool-label" style={{ color: "#b98bff" }}>Cursos</span>
                <span className="sidebar-tool-badge--soon">Pronto</span>
              </div>
              <Link href="/guias" className="sidebar-tool-link sidebar-tool-link--gold">
                <Route size={16} className="sidebar-tool-icon" />
                <span className="sidebar-tool-label">Guías Interactivas</span>
              </Link>
            </div>
          </div>

          {/* Categorías — Noticias siempre primero, separada del resto:
              agrupa toda la actualidad cripto, mientras que el resto de
              categorías son temáticas específicas (Bitcoin, Ondo, etc.). */}
          {(categories ?? []).length > 0 && (() => {
            const allCats = categories ?? [];
            const newsCat = allCats.find((c) => c.slug === "noticias");
            const restCats = allCats.filter((c) => c.slug !== "noticias");

            const renderCat = (c: { name: string; slug: string }) => (
              <Link key={c.slug} href={`/categoria/${c.slug}`} className="sidebar-tool-link">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Tag size={16} className="sidebar-tool-icon" />
                  <span>{c.name}</span>
                </div>
                {catPostMap[c.slug] && (
                  <span className="sidebar-cat-count">{catPostMap[c.slug]}</span>
                )}
              </Link>
            );

            return (
              <div className="sidebar-card">
                <p className="sidebar-card-title">Categorías</p>
                <div className="sidebar-tools-list">
                  {newsCat && renderCat(newsCat)}
                  {newsCat && restCats.length > 0 && <div className="sidebar-cat-separator" aria-hidden="true" />}
                  {restCats.map(renderCat)}
                </div>
              </div>
            );
          })()}

          {/* Premium pitch — en desktop se queda al final del sidebar */}
          <div className="premium-pitch-desktop-only">
            {premiumPitchCard}
          </div>

        </aside>
      </div>

      <GuidesHomeSection />

      {/* ── Contacto cercano — Instagram ── */}
      <section className="contact-cta-section">
        <div className="contact-cta-card">
          <div className="contact-cta-glow" aria-hidden="true" />

          <div className="contact-cta-left">
            <div className="contact-cta-avatar">
              <InstagramIcon />
            </div>
            <div className="contact-cta-text">
              <span className="contact-cta-eyebrow">
                <MessageCircle size={12} aria-hidden="true" />
                Hablemos
              </span>
              <h2 className="contact-cta-title">¿Dudas, ideas o algo que le falta a la academia?</h2>
              <p className="contact-cta-sub">
                Cuéntamelo por Instagram — leo cada mensaje personalmente, y varias mejoras
                de la web han salido de ahí.
              </p>
              <div className="contact-cta-footer">
                <span className="contact-cta-handle">@adelinbtc</span>
                <span className="contact-cta-footer-sep" aria-hidden="true" />
                <span className="contact-cta-response">
                  <span className="contact-cta-response-dot" aria-hidden="true" />
                  Responde en menos de 24h
                </span>
              </div>
            </div>
          </div>

          <a
            href="https://www.instagram.com/adelinbtc/"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-cta-btn"
          >
            <InstagramIcon />
            Escríbeme
            <ArrowRight size={15} className="contact-cta-btn-arrow" aria-hidden="true" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
