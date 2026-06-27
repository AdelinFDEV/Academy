import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import PostInteractions from "@/components/PostInteractions";
import LogoutButton from "@/components/LogoutButton";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import SocialLinks from "@/components/SocialLinks";
import LiveCounter from "@/components/LiveCounter";
import { renderMarkdown } from "@/components/admin/MarkdownEditor";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image, seo_title, meta_description, focus_keyword")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "Artículo no encontrado" };

  const seoTitle = post.seo_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;

  return {
    title: seoTitle,
    description,
    keywords: post.focus_keyword ?? undefined,
    openGraph: {
      type: "article",
      title: seoTitle,
      description,
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
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

  const profileData = user ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  const hasAccess = !post.is_premium || isPremium;

  // Fetch comments, user post state, and like data in parallel
  const [commentsRes, userPostRes, likeCountRes, userLikedRes] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, profiles(full_name, is_featured)")
      .eq("post_id", post.id)
      .eq("approved", true)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("user_posts")
          .select("saved, read_at")
          .eq("user_id", user.id)
          .eq("post_id", post.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("post_likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post.id),
    user
      ? supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const comments = commentsRes.data;
  const userPost = userPostRes.data as { saved: boolean; read_at: string | null } | null;
  const initialLikes = (post.base_likes ?? 0) + (likeCountRes.count ?? 0);
  const initialLiked = !!userLikedRes.data;
  const initialShares = post.shares_count ?? 0;

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
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={!!user} isPremium={isPremium} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-link btn-nav-link--dashboard">Academia</Link>
              {isAdmin && <Link href="/admin" className="btn-nav-link">Admin</Link>}
              <div className="blog-nav-user">
                <span className="blog-nav-user-name">{userName}</span>
                <span className={`blog-nav-user-role${isPremium ? " premium" : ""}`}>{isAdmin ? "Admin" : isPremium ? "Premium" : "Free"}</span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-link">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-cta">Registrarse</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />
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
            <SocialLinks variant="post" />
          </div>
          <PostInteractions
            postId={post.id}
            postSlug={slug}
            commentsCount={comments?.length ?? 0}
            initialLikes={initialLikes}
            initialLiked={initialLiked}
            initialShares={initialShares}
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

            <div
              className="post-content prose-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />

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

            {/* Upgrade CTA para usuarios free tras leer un artículo gratuito */}
            {user && !isPremium && (
              <div className="post-upgrade-cta">
                <span className="post-upgrade-cta-tag">PREMIUM</span>
                <h3>¿Quieres más contenido como este?</h3>
                <p>Hazte Premium por 19,99€/mes y accede a todos los análisis avanzados, el diario de trading y mucho más.</p>
                <Link href="/premium" className="btn-primary" style={{ textDecoration: "none" }}>
                  Ver planes Premium →
                </Link>
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
