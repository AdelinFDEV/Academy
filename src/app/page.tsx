import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import LogoutButton from "@/components/LogoutButton";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import PostInteractions from "@/components/PostInteractions";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, is_premium, is_featured, created_at, categories(name, slug)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .order("name", { ascending: true });

  const featured = posts?.find((p) => p.is_featured);
  const rest = posts?.filter((p) => !p.is_featured) ?? [];

  const postIds = posts?.map((p) => p.id) ?? [];
  const commentCountMap: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: cc } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("approved", true);
    cc?.forEach((c) => {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
    });
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          adelin<span>btc</span>
        </Link>
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

      {/* Hero — ancho completo fuera del contenedor */}
      <div className="home-hero">
        <video className="hero-video" autoPlay loop muted playsInline>
          <source src="/hero.webm" type="video/webm" />
          <source src="/hero-opt.mp4" type="video/mp4" />
        </video>
        <div className="home-hero-badge">Formación crypto profesional</div>
        <h1 className="home-hero-title">
          El conocimiento que el mercado<br />no te va a regalar
        </h1>
        <p className="home-hero-sub">
          Análisis de mercado, educación blockchain y herramientas para operar con criterio.
          Pensado para quien empieza y quiere ir en serio.
        </p>
        <div className="home-hero-actions">
          {user ? (
            <Link href="/dashboard" className="hero-btn-primary">Ir a mi academia →</Link>
          ) : (
            <>
              <Link href="/register" className="hero-btn-primary">Empieza gratis →</Link>
              <a href="#contenido" className="hero-btn-secondary">Ver artículos</a>
            </>
          )}
        </div>
        <div className="home-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">100%</span>
            <span className="hero-stat-label">Contenido original</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">Semanal</span>
            <span className="hero-stat-label">Nuevas publicaciones</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">BTC · DeFi · Trading</span>
            <span className="hero-stat-label">Áreas de cobertura</span>
          </div>
        </div>
      </div>

      <main className="blog-main" id="contenido">

        {/* Navegación por temas */}
        {categories && categories.length > 0 && (
          <div className="topics-nav">
            <span className="topics-nav-label">Temas</span>
            <div className="topics-nav-list">
              {categories.map((c) => (
                <Link key={c.slug} href={`/categoria/${c.slug}`} className="topic-pill">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {featured && (
          <div className="featured-post-wrap">
            <Link href={`/post/${featured.slug}`} className={`featured-post${featured.is_premium ? " is-premium" : ""}`}>
              <div className="featured-bg" style={featured.cover_image ? { backgroundImage: `url(${featured.cover_image})` } : undefined} />
              <div className="featured-overlay" />
              <div className="featured-content">
                <div className="featured-meta">
                  {(featured.categories as any)?.name && (
                    <span className="post-category">{(featured.categories as any).name}</span>
                  )}
                  <span className="featured-label">Destacado</span>
                  {featured.is_premium ? (
                    <span className="featured-access is-premium"><Icon name="lock" size={11} /> Premium</span>
                  ) : (
                    <span className="featured-access is-free">Gratis</span>
                  )}
                </div>
                <h1 className="featured-title">{featured.title}</h1>
                {featured.excerpt && <p className="featured-excerpt">{featured.excerpt}</p>}
                <div className="featured-footer">
                  <div className="post-author-row">
                    <span className="post-author">AdelinBTC</span>
                    <span className="post-author-sep">·</span>
                    <span className="post-date">{formatDate(featured.created_at)}</span>
                  </div>
                  <span className={`read-more${featured.is_premium ? " is-premium" : ""}`}>
                    {featured.is_premium ? (
                      <><Icon name="lock" size={15} /> Desbloquear</>
                    ) : (
                      <>Leer artículo <Icon name="arrow-right" size={16} /></>
                    )}
                  </span>
                </div>
              </div>
            </Link>
            <div className="featured-post-bar">
              <PostInteractions
                postId={featured.id}
                postSlug={featured.slug}
                commentsCount={commentCountMap[featured.id] ?? 0}
                isLoggedIn={!!user}
                variant="card"
              />
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="posts-section">
            <h2 className="posts-section-title">Últimas entradas</h2>
            <div className="posts-grid">
              {rest.map((post) => (
                <div key={post.id} className={`post-card${post.is_premium ? " is-premium" : ""}`}>
                  <Link href={`/post/${post.slug}`} className="post-card-link">
                    <div className="post-card-image" style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}>
                      {!post.cover_image && <span className="post-card-image-placeholder"><Icon name="chart" size={40} /></span>}
                      {post.is_premium ? (
                        <div className="post-premium-badge"><Icon name="lock" size={11} /> Premium</div>
                      ) : (
                        <div className="post-free-badge">Gratis</div>
                      )}
                    </div>
                    <div className="post-card-body">
                      <div className="post-card-meta">
                        {(post.categories as any)?.name && (
                          <span className="post-category">{(post.categories as any).name}</span>
                        )}
                        <span className="post-date">{formatDate(post.created_at)}</span>
                      </div>
                      <div className="post-author-row">
                        <span className="post-author">AdelinBTC</span>
                      </div>
                      <h3 className="post-card-title">{post.title}</h3>
                      {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
                      {post.is_premium ? (
                        <span className="post-read-more is-premium"><Icon name="lock" size={14} /> Desbloquear</span>
                      ) : (
                        <span className="post-read-more">Leer más <Icon name="arrow-right" size={15} /></span>
                      )}
                    </div>
                  </Link>
                  <PostInteractions
                    postId={post.id}
                    postSlug={post.slug}
                    commentsCount={commentCountMap[post.id] ?? 0}
                    isLoggedIn={!!user}
                    variant="card"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!posts?.length && (
          <div className="blog-empty">
            <p>Próximamente el primer artículo.</p>
          </div>
        )}

        {/* Empieza aquí — ruta para principiantes */}
        <section className="starter-section" id="como-empezar">
          <div className="section-heading">
            <span className="section-heading-eyebrow">Empieza aquí</span>
            <h2 className="section-heading-title">Tu punto de partida si empiezas desde cero</h2>
            <p className="section-heading-sub">
              Tres pilares para construir una base sólida antes de arriesgar un solo euro.
            </p>
          </div>
          <div className="starter-grid">
            <div className="starter-card">
              <span className="starter-step">01</span>
              <div className="starter-icon"><Icon name="book" size={22} /></div>
              <h3>Fundamentos</h3>
              <p>Qué es Bitcoin, cómo funciona la blockchain y por qué importa. Sin tecnicismos vacíos.</p>
            </div>
            <div className="starter-card">
              <span className="starter-step">02</span>
              <div className="starter-icon"><Icon name="shield" size={22} /></div>
              <h3>Seguridad</h3>
              <p>Cómo custodiar tus criptomonedas, elegir wallet y evitar los errores que arruinan a los novatos.</p>
            </div>
            <div className="starter-card">
              <span className="starter-step">03</span>
              <div className="starter-icon"><Icon name="trending" size={22} /></div>
              <h3>Estrategia</h3>
              <p>Cómo leer el mercado con criterio, gestionar el riesgo y construir una tesis propia.</p>
            </div>
          </div>
        </section>

        {/* Herramientas */}
        <section className="tools-section" id="herramientas">
          <div className="section-heading">
            <span className="section-heading-eyebrow">Herramientas</span>
            <h2 className="section-heading-title">Instrumentos para decidir con datos</h2>
            <p className="section-heading-sub">
              Herramientas exclusivas para miembros, diseñadas para que dejes de operar a ciegas.
            </p>
          </div>
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-card-head">
                <div className="tool-icon"><Icon name="trending" size={20} /></div>
                <span className="tool-tag tool-tag-free">Gratis</span>
              </div>
              <h3>Calculadora Predicción de Precio</h3>
              <p>Introduce un activo y obtén proyecciones de precio basadas en análisis técnico.</p>
              <span className="tool-access-note"><Icon name="lock" size={11} /> Requiere registro gratuito</span>
            </div>
            <div className="tool-card tool-card-locked">
              <div className="tool-card-head">
                <div className="tool-icon"><Icon name="chart" size={20} /></div>
                <span className="tool-tag tool-tag-premium"><Icon name="lock" size={10} /> Premium</span>
              </div>
              <h3>Diario de Trading</h3>
              <p>Registra, analiza y mejora tus operaciones. Estadísticas detalladas de win rate, P&L y patrones de error.</p>
            </div>
            <div className="tool-card">
              <div className="tool-card-head">
                <div className="tool-icon"><Icon name="compass" size={20} /></div>
                <span className="tool-tag tool-tag-free">Gratis</span>
              </div>
              <h3>Guía de Iniciación</h3>
              <p>Una hoja de ruta paso a paso para tus primeras semanas en el mundo crypto. Desde cero hasta operar con criterio.</p>
              <span className="tool-access-note"><Icon name="lock" size={11} /> Requiere registro gratuito</span>
            </div>
          </div>
          <p className="tools-note">Las herramientas se desbloquean dentro de la academia.</p>
        </section>

        {!user && (
          <div className="home-cta">
            <div className="home-cta-inner">
              <div className="home-cta-badge">Acceso gratuito</div>
              <h2 className="home-cta-title">
                Más que un blog.<br />Es tu ventaja en el mercado.
              </h2>
              <p className="home-cta-sub">
                Regístrate gratis y desbloquea las herramientas, deja comentarios,
                guarda artículos y accede a contenido exclusivo que no encontrarás
                en ningún otro sitio.
              </p>
              <div className="home-cta-features">
                <div className="cta-feature">
                  <span className="cta-feature-icon"><Icon name="trending" size={20} /></span>
                  <div>
                    <strong>Predicción de precios</strong>
                    <span>Modelos de análisis técnico en tiempo real</span>
                  </div>
                </div>
                <div className="cta-feature">
                  <span className="cta-feature-icon"><Icon name="chat" size={20} /></span>
                  <div>
                    <strong>Comentarios y comunidad</strong>
                    <span>Debate cada análisis con otros inversores</span>
                  </div>
                </div>
                <div className="cta-feature">
                  <span className="cta-feature-icon"><Icon name="lock" size={20} /></span>
                  <div>
                    <strong>Contenido exclusivo</strong>
                    <span>Análisis semanales, estrategias y mucho más</span>
                  </div>
                </div>
              </div>
              <div className="home-cta-actions">
                <Link href="/register" className="cta-btn-primary">Crear cuenta gratis →</Link>
                <Link href="/login" className="cta-btn-secondary">Ya tengo cuenta</Link>
              </div>
              <p className="home-cta-disclaimer">Sin tarjeta de crédito · Gratis para siempre en el plan básico</p>
            </div>
          </div>
        )}


      </main>

      <Footer />
    </div>
  );
}
