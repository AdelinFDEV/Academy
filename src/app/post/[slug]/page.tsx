import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import PostInteractions from "@/components/PostInteractions";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "Artículo no encontrado" };

  const description = post.excerpt ?? undefined;

  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getYoutubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  // Si es premium verificar acceso
  let hasAccess = !post.is_premium;
  if (post.is_premium && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    hasAccess = profile?.role === "premium" || profile?.role === "admin";
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, created_at, profiles(full_name, is_featured)")
    .eq("post_id", post.id)
    .eq("approved", true)
    .order("created_at", { ascending: true });

  let userPost: { saved: boolean; read_at: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("user_posts")
      .select("saved, read_at")
      .eq("user_id", user.id)
      .eq("post_id", post.id)
      .single();
    userPost = data;
  }

  const youtubeId = post.youtube_url ? getYoutubeId(post.youtube_url) : null;
  const wordCount = post.content ? post.content.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  // Artículos relacionados: misma categoría, con fallback a los más recientes
  let relatedQuery = supabase
    .from("posts")
    .select("id, title, slug, cover_image, is_premium, created_at, categories(name)")
    .eq("published", true)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (post.category_id) relatedQuery = relatedQuery.eq("category_id", post.category_id);

  let { data: related } = await relatedQuery;

  if ((!related || related.length === 0) && post.category_id) {
    const fb = await supabase
      .from("posts")
      .select("id, title, slug, cover_image, is_premium, created_at, categories(name)")
      .eq("published", true)
      .neq("id", post.id)
      .order("created_at", { ascending: false })
      .limit(3);
    related = fb.data;
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <div className="blog-nav-links">
          <Link href="/" className="btn-nav-back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver al inicio
          </Link>
          <Link href="/dashboard" className="btn-nav-register">Mi academia</Link>
        </div>
      </nav>

      <main className="post-page">

        {/* Header del post */}
        <div className="post-header">
          <div className="post-header-meta">
            {(post.categories as any)?.name && (
              <span className="post-category">{(post.categories as any).name}</span>
            )}
            {post.is_premium && <span className="post-category premium-cat">Premium</span>}
          </div>
          <h1 className="post-title">{post.title}</h1>
          {post.excerpt && <p className="post-lead">{post.excerpt}</p>}
          <div className="post-header-bottom">
            <div className="post-author-row">
              <span className="post-author">AdelinBTC</span>
              <span className="post-author-sep">·</span>
              <span className="post-date-full">{formatDate(post.created_at)}</span>
              <span className="post-author-sep">·</span>
              <span className="post-date-full">{readingMinutes} min de lectura</span>
            </div>
          </div>
          <PostInteractions
            postId={post.id}
            postSlug={slug}
            commentsCount={comments?.length ?? 0}
            initialSaved={userPost?.saved ?? false}
            initialRead={!!userPost?.read_at}
            isLoggedIn={!!user}
            variant="post"
          />
        </div>

        {/* Imagen de portada */}
        {post.cover_image && (
          <div className="post-cover">
            <img src={post.cover_image} alt={post.title} />
          </div>
        )}

        {/* Contenido o paywall */}
        {hasAccess ? (
          <>
            {/* Vídeo de YouTube */}
            {youtubeId && (
              <div className="post-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={post.title}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}

            <div className="post-content">
              {post.content.split("\n").map((p: string, i: number) =>
                p ? <p key={i}>{p}</p> : <br key={i} />
              )}
            </div>

            {/* Prompt suave de registro tras leer un artículo gratis */}
            {!user && (
              <div className="article-cta">
                <strong>¿Te ha resultado útil?</strong>
                <p>Regístrate gratis y no te pierdas los próximos análisis. Sin tarjeta, en 30 segundos.</p>
                <div className="article-cta-actions">
                  <Link href="/register" className="cta-btn-primary">Crear cuenta gratis →</Link>
                  <Link href="/login" className="cta-btn-secondary">Ya tengo cuenta</Link>
                </div>
              </div>
            )}
          </>
        ) : !user ? (
          <div className="post-paywall">
            <div className="paywall-icon"><Icon name="lock" size={26} /></div>
            <h3>Crea tu cuenta para seguir leyendo</h3>
            <p>Este artículo es exclusivo. Regístrate gratis para acceder al contenido premium y al resto de la academia.</p>
            <div className="article-cta-actions">
              <Link href="/register" className="btn-primary" style={{ textDecoration: "none" }}>
                Regístrate gratis →
              </Link>
              <Link href="/login" className="cta-btn-secondary">Ya tengo cuenta</Link>
            </div>
          </div>
        ) : (
          <div className="post-paywall">
            <div className="paywall-icon"><Icon name="lock" size={26} /></div>
            <h3>Contenido exclusivo Premium</h3>
            <p>Este artículo es solo para miembros Premium. Desbloquea acceso ilimitado a todo el contenido.</p>
            <Link href="/dashboard" className="btn-primary" style={{ textDecoration: "none" }}>
              Hazte Premium →
            </Link>
          </div>
        )}

        {/* Artículos relacionados */}
        {related && related.length > 0 && (
          <div className="related-posts">
            <h2 className="related-title">Sigue leyendo</h2>
            <div className="related-grid">
              {related.map((rp) => (
                <Link key={rp.id} href={`/post/${rp.slug}`} className="related-card">
                  <div
                    className="related-card-image"
                    style={rp.cover_image ? { backgroundImage: `url(${rp.cover_image})` } : undefined}
                  >
                    {!rp.cover_image && <span className="related-card-placeholder"><Icon name="chart" size={28} /></span>}
                    {rp.is_premium && <span className="post-premium-badge">Premium</span>}
                  </div>
                  <div className="related-card-body">
                    {(rp.categories as any)?.name && (
                      <span className="related-card-cat">{(rp.categories as any).name}</span>
                    )}
                    <h3 className="related-card-title">{rp.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comentarios */}
        <div id="comentarios" className="post-comments">
          <h2 className="comments-title">Comentarios ({comments?.length ?? 0})</h2>

          {user && hasAccess && (
            <form className="comment-form" action={`/api/comments`} method="POST">
              <input type="hidden" name="post_id" value={post.id} />
              <textarea
                name="content"
                placeholder="Escribe tu comentario..."
                rows={4}
                required
              />
              <button type="submit" className="btn-primary btn-small">
                Enviar comentario
              </button>
            </form>
          )}

          {!user && (
            <p className="comments-login">
              <Link href="/login">Inicia sesión</Link> para dejar un comentario.
            </p>
          )}

          <div className="comments-list">
            {comments?.length === 0 && (
              <p className="comments-empty">Sé el primero en comentar.</p>
            )}
            {comments?.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-item-meta">
                  <span className="comment-author">
                    {(c.profiles as any)?.full_name ?? "Usuario"}
                    {(c.profiles as any)?.is_featured && (
                      <span className="featured-star" title="Usuario destacado — 30 días de racha">★</span>
                    )}
                  </span>
                  <span className="comment-item-date">{formatDate(c.created_at)}</span>
                </div>
                <p className="comment-item-content">{c.content}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
