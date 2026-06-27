import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Target, Eye, BarChart2, Trophy, Folder, Star, BookOpen, GraduationCap, Library, Compass, Users } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import LogoutButton from "@/components/LogoutButton";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import HomeFeed from "@/components/HomeFeed";
import LiveCounter from "@/components/LiveCounter";
import SocialLinks from "@/components/SocialLinks";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: posts }, { data: categories }, { count: postsTotal }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, slug, excerpt, cover_image, is_premium, is_featured, created_at, base_likes, categories(name, slug)")
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("name, slug")
        .order("name"),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("published", true),
    ]);

  const postIds = posts?.map((p) => p.id) ?? [];

  // Bulk fetch likes and comments
  const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
    postIds.length > 0
      ? supabase.from("post_likes").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("comments").select("post_id").in("post_id", postIds).eq("approved", true)
      : Promise.resolve({ data: [] }),
  ]);

  const likeMap: Record<string, number> = {};
  likeRows?.forEach((r) => { likeMap[r.post_id] = (likeMap[r.post_id] ?? 0) + 1; });

  const commentMap: Record<string, number> = {};
  commentRows?.forEach((r) => { commentMap[r.post_id] = (commentMap[r.post_id] ?? 0) + 1; });

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
    is_premium: p.is_premium,
    is_featured: p.is_featured,
    created_at: p.created_at,
    categories: p.categories as unknown as { name: string; slug: string } | null,
    likes: (p.base_likes ?? 0) + (likeMap[p.id] ?? 0),
    comments: commentMap[p.id] ?? 0,
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

      {/* ── Compact hero banner ── */}
      <div className="home-banner">
        <video className="home-banner-video" autoPlay loop muted playsInline>
          <source src="/hero.webm" type="video/webm" />
          <source src="/hero-opt.mp4" type="video/mp4" />
        </video>
        <div className="home-banner-overlay" />
        <div className="home-banner-content">
          <h1 className="home-banner-title">
            El ecosistema cripto<br className="home-banner-br" />
            <span className="text-gradient">en un solo lugar.</span>
          </h1>
          <div className="home-banner-slogan">
            <span>Aprende en la academia</span>
            <span className="slogan-line" aria-hidden="true"></span>
            <span>Crece con la comunidad</span>
          </div>
          
          <div className="home-banner-features">
            <span className="home-feature"><GraduationCap size={15} aria-hidden="true" /> Guías y Cursos</span>
            <span className="home-feature"><Target size={15} aria-hidden="true" /> Herramientas Exclusivas</span>
            <span className="home-feature"><Users size={15} aria-hidden="true" /> Comunidad Privada</span>
          </div>

          <div className="home-banner-actions">
            {user ? (
              <Link href="/dashboard" className="hero-btn-primary hero-btn-glowing">
                Ir a mi Academia <ArrowRight className="btn-arrow" size={20} strokeWidth={2.5} />
              </Link>
            ) : (
              <>
                <Link href="/register" className="hero-btn-primary hero-btn-glowing">
                  Únete Gratis Ahora <ArrowRight className="btn-arrow" size={20} strokeWidth={2.5} />
                </Link>
                <a href="#feed" className="hero-btn-secondary">Explorar contenido</a>
              </>
            )}
          </div>
          {!user && (
            <p className="home-banner-guarantee">
              <Star size={14} aria-hidden="true" />
              Crea tu cuenta en menos de 1 minuto. Sin tarjeta de crédito.
            </p>
          )}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="home-layout" id="feed">

        {/* Feed */}
        <HomeFeed posts={enrichedPosts} isLoggedIn={!!user} />

        {/* Sidebar */}
        <aside className="home-sidebar">

          {/* Herramientas */}
          <div className="sidebar-card">
            <p className="sidebar-card-title">Herramientas</p>
            <div className="sidebar-tools-list">
              <Link href={!user ? "/register" : "/dashboard/diario"} className="sidebar-tool-link sidebar-tool-highlight">
                <Star size={16} className="sidebar-tool-icon" fill="currentColor" />
                <span>Diario de Trading</span>
              </Link>
              <Link href={!user ? "/register" : "/calculadora"} className="sidebar-tool-link">
                <Target size={16} className="sidebar-tool-icon" />
                <span>Predicción de Precio</span>
              </Link>
              <Link href={!user ? "/register" : "/dashboard/watchlist"} className="sidebar-tool-link">
                <Eye size={16} className="sidebar-tool-icon" />
                <span>Mi Watchlist</span>
              </Link>
              <Link href={!user ? "/register" : "/dashboard/estadisticas"} className="sidebar-tool-link">
                <BarChart2 size={16} className="sidebar-tool-icon" />
                <span>Estadísticas</span>
              </Link>
              <Link href={!user ? "/register" : "/logros"} className="sidebar-tool-link">
                <Trophy size={16} className="sidebar-tool-icon" />
                <span>Logros y XP</span>
              </Link>
            </div>
          </div>

          {/* Educación */}
          <div className="sidebar-card">
            <p className="sidebar-card-title">Educación</p>
            <div className="sidebar-tools-list">
              <Link href="/glosario" className="sidebar-tool-link">
                <BookOpen size={16} className="sidebar-tool-icon" />
                <span>Diccionario Cripto</span>
              </Link>
              <Link href="/cursos" className="sidebar-tool-link sidebar-tool-highlight">
                <Star size={16} className="sidebar-tool-icon" fill="currentColor" />
                <span>Cursos</span>
              </Link>
              <Link href="/recursos" className="sidebar-tool-link">
                <Library size={16} className="sidebar-tool-icon" />
                <span>Recursos</span>
              </Link>
              <Link href="/guias" className="sidebar-tool-link">
                <Compass size={16} className="sidebar-tool-icon" />
                <span>Guías</span>
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
                      <Folder size={16} className="sidebar-tool-icon" />
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

          {/* Redes sociales */}
          <div className="sidebar-card">
            <p className="sidebar-card-title">Sígueme</p>
            <SocialLinks variant="sidebar" />
          </div>

          {/* Start here */}
          <div className="sidebar-card">
            <p className="sidebar-card-title">Empieza aquí</p>
            <div className="sidebar-steps">
              <div className="sidebar-step">
                <span className="sidebar-step-num">01</span>
                <div>
                  <strong>Fundamentos</strong>
                  <p>Qué es Bitcoin y por qué importa. Sin tecnicismos vacíos.</p>
                </div>
              </div>
              <div className="sidebar-step">
                <span className="sidebar-step-num">02</span>
                <div>
                  <strong>Seguridad</strong>
                  <p>Custodiar cripto y evitar los errores que arruinan a los novatos.</p>
                </div>
              </div>
              <div className="sidebar-step">
                <span className="sidebar-step-num">03</span>
                <div>
                  <strong>Estrategia</strong>
                  <p>Leer el mercado, gestionar riesgo y construir una tesis propia.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium CTA */}
          {!user && (
            <div className="sidebar-card sidebar-premium-card">
              <div className="sidebar-premium-icon">
                <Icon name="lock" size={18} />
              </div>
              <p className="sidebar-premium-title">Acceso Premium</p>
              <p className="sidebar-premium-desc">
                Desbloquea análisis semanales, herramientas exclusivas y contenido avanzado.
              </p>
              <Link href="/register" className="sidebar-premium-btn">
                Empieza gratis →
              </Link>
            </div>
          )}

        </aside>
      </div>

      <Footer />
    </div>
  );
}
