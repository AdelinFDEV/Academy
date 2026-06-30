import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Crosshair, ScanEye, NotebookPen, Medal, Wallet, ListOrdered, MessagesSquare, Network, BookA, MonitorPlay, Layers, Route, FlaskConical, Globe, Wrench, ShieldCheck, Star, GraduationCap, Crown, Gem, Radar, Users, Check, Tag, Map, Sparkles, Unlock } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import LogoutButton from "@/components/LogoutButton";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import HomeFeed from "@/components/HomeFeed";
import SidebarTools from "@/components/SidebarTools";
import GuidesHomeSection from "@/components/GuidesHomeSection";
import LiveCounter from "@/components/LiveCounter";
import SocialLinks from "@/components/SocialLinks";
import HeroVideo from "@/components/HeroVideo";
import HeroPremiumSlider from "@/components/HeroPremiumSlider";
import { getLatestVideos } from "@/lib/youtube";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get user role for premium check
  const profileData = user
    ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data
    : null;
  const isPremium = profileData?.role === "premium" || profileData?.role === "admin";

  const [{ data: posts }, { data: categories }, { count: postsTotal }, youtubeVideos] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, slug, excerpt, cover_image, youtube_url, is_premium, is_featured, created_at, base_likes, base_saves, categories(name, slug)")
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("name, slug")
        .order("name"),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("published", true),
      getLatestVideos(2),
    ]);

  const postIds = posts?.map((p) => p.id) ?? [];

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

  // Count posts per category
  const catPostMap: Record<string, number> = {};
  posts?.forEach((p) => {
    const slug = (p.categories as any)?.slug;
    if (slug) catPostMap[slug] = (catPostMap[slug] ?? 0) + 1;
  });

  const enrichedPosts = (posts ?? []).map((p) => ({
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

  const premiumCount = enrichedPosts.filter((p) => p.is_premium).length;

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      {/* ── Nav ── */}
      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          adelin<span>btc</span>
        </Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-cta">Ir a la academia →</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-login">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-register">Registrarte</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} />
      </nav>

      {/* ── Hero ── */}
      <div className="home-banner">
        <HeroVideo />
        <div className="home-banner-overlay" />
        <div className="home-banner-content">

          <h1 className="home-banner-title hero-anim hero-anim-1">
            Domina el mundo Cripto<br className="home-banner-br" />
            <span className="text-gradient">Todo en un solo lugar.</span>
          </h1>

          <HeroPremiumSlider />

          <div className="home-banner-actions hero-anim hero-anim-5">
            {user ? (
              <>
                <Link href="/dashboard" className="hero-btn-primary hero-btn-glowing">
                  Ir a mi Academia <ArrowRight className="btn-arrow" size={20} strokeWidth={2.5} />
                </Link>
                <Link href="#guias-premium" className="hero-btn-gold">
                  Guías Premium <Gem size={16} strokeWidth={1.75} />
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="hero-btn-primary hero-btn-glowing">
                  Empieza Gratis Ahora <ArrowRight className="btn-arrow" size={20} strokeWidth={2.5} />
                </Link>
                <Link href="#guias-premium" className="hero-btn-gold">
                  Guías Premium <Gem size={16} strokeWidth={1.75} />
                </Link>
              </>
            )}
          </div>

          {!user && (
            <div className="hero-trust hero-anim hero-anim-6">
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

              <p className="home-banner-guarantee">
                <ShieldCheck size={14} aria-hidden="true" />
                Crea tu cuenta en 1 minuto - Sin Tarjeta - Gratis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Empieza aquí band ── */}
      <Link href="/guia-iniciacion" className="starthere-band">
        <span className="starthere-band-glow" aria-hidden="true" />
        <span className="starthere-band-left">
          <span className="starthere-band-icon">
            <Map size={20} aria-hidden="true" />
          </span>
          <span className="starthere-band-text">
            <span className="starthere-band-eyebrow">¿Nuevo en cripto?</span>
            <span className="starthere-band-title">Empieza aquí — tu hoja de ruta paso a paso</span>
          </span>
        </span>
        <span className="starthere-band-cta">
          <span className="starthere-band-cta-label">
            Ver la guía <ArrowRight size={15} strokeWidth={2.5} className="starthere-cta-arrow" aria-hidden="true" />
          </span>
          <span className="starthere-band-cta-sub">Gratis · 5 min</span>
        </span>
      </Link>

      {/* ── Main layout ── */}
      <div className="home-layout" id="feed">

        <div className="tools-mobile-only">
          <SidebarTools isLoggedIn={!!user} isPremium={isPremium} />
        </div>

        {/* Feed */}
        <HomeFeed posts={enrichedPosts} isLoggedIn={!!user} youtubeVideos={youtubeVideos} />

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
                <span>Diccionario Cripto</span>
              </Link>
              <div className="sidebar-tool-link sidebar-tool-link--soon">
                <MonitorPlay size={16} className="sidebar-tool-icon" />
                <span>Cursos</span>
                <span className="sidebar-tool-badge--soon">Pronto</span>
              </div>
              <div className="sidebar-tool-link sidebar-tool-link--soon">
                <Layers size={16} className="sidebar-tool-icon" />
                <span>Recursos</span>
                <span className="sidebar-tool-badge--soon">Pronto</span>
              </div>
              <Link href="/guias" className="sidebar-tool-link">
                <Route size={16} className="sidebar-tool-icon" />
                <span>Guías Interactivas</span>
              </Link>
            </div>
          </div>

          {/* Categorías */}
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

          {/* Premium pitch */}
          <div className="premium-pitch">
            <span className="premium-pitch-glow" aria-hidden="true" />

            <span className="premium-pitch-badge">
              <Crown size={13} aria-hidden="true" /> Premium
            </span>

            <h3 className="premium-pitch-title">
              Deja de mirar el mercado.<br />
              <span className="text-gradient">Empieza a operarlo.</span>
            </h3>
            <p className="premium-pitch-sub">
              Las herramientas que separan a los que improvisan de los que operan con ventaja.
            </p>

            <ul className="premium-pitch-features">
              <li className="premium-pitch-feature">
                <span className="premium-pitch-feature-icon"><NotebookPen size={16} aria-hidden="true" /></span>
                <span>
                  <strong>Diario de Trading</strong>
                  Registra cada operación y descubre qué te hace ganar.
                </span>
              </li>
              <li className="premium-pitch-feature">
                <span className="premium-pitch-feature-icon"><Radar size={16} aria-hidden="true" /></span>
                <span>
                  <strong>Señales en Spot</strong>
                  Entradas y salidas con criterio, no con corazonadas.
                </span>
              </li>
              <li className="premium-pitch-feature">
                <span className="premium-pitch-feature-icon"><Unlock size={16} aria-hidden="true" /></span>
                <span>
                  <strong>Liberaciones de Tokens</strong>
                  Anticipa la presión vendedora con el calendario de vesting en tiempo real.
                </span>
              </li>
              <li className="premium-pitch-feature">
                <span className="premium-pitch-feature-icon"><Gem size={16} aria-hidden="true" /></span>
                <span>
                  <strong>Herramientas exclusivas</strong>
                  Watchlist, estadísticas y todo lo que viene después.
                </span>
              </li>
            </ul>

            <div className="premium-pitch-price-wrapper">
              <span className="premium-pitch-limited">Por tiempo limitado</span>
              <div className="premium-pitch-price">
                <span className="premium-pitch-old-price">49,99€</span>
                <span className="premium-pitch-amount">19,99€</span>
                <span className="premium-pitch-period">/mes</span>
              </div>
            </div>

            <Link href="/premium" className="premium-pitch-cta">
              Hazte Premium <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
            </Link>

            <p className="premium-pitch-note">
              <Check size={13} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras
            </p>
          </div>

        </aside>
      </div>

      <GuidesHomeSection />

      <Footer />
    </div>
  );
}
