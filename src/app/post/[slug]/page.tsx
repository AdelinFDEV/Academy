import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import PostInteractions from "@/components/PostInteractions";
import SiteNav from "@/components/SiteNav";
import SocialLinks from "@/components/SocialLinks";
import PostCtaFinal from "@/components/PostCtaFinal";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import CommentForm from "@/components/CommentForm";
import JsonLd from "@/components/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import type { PostCategoryRef, CommentProfileRef } from "@/lib/types";

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

  // Sin entrada no hay canónica que declarar: la ruta acabará en notFound().
  if (!post) return { title: "Artículo no encontrado" };

  const seoTitle = post.seo_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;

  return {
    title: seoTitle,
    description,
    keywords: post.focus_keyword ?? undefined,
    alternates: { canonical: `/post/${slug}` },
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


function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// El contenido ya es HTML (lo escribe Claude directamente, sin Markdown de por
// medio) — el índice se saca leyendo los <h2>/<h3> reales del artículo.
function extractHeadings(html: string) {
  const matches = [...html.matchAll(/<h([23])(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h\1>/gi)];
  return matches.map((m) => {
    const level = Number(m[1]);
    const text = m[3].replace(/<[^>]+>/g, "").trim();
    const id = m[2] || slugify(text);
    return { id, text, level };
  });
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

  // ── Dos rondas de consultas, no seis ──────────────────────────────────────
  //
  // Antes esto era una cadena: sesión → entrada → perfil → comentarios →
  // comentario pendiente → relacionadas, cada una esperando a la anterior. Seis
  // viajes al servidor puestos en fila, y esta es la página que más tráfico de
  // búsqueda va a recibir (medido el 31-08-2026: 1.156 ms de TTFB en
  // producción, cuatro veces más que cualquier otra ruta).
  //
  // La clave es que casi nada depende de casi nada: la entrada se busca por su
  // slug y no necesita saber quién mira, y todo lo demás solo necesita el
  // usuario y el id de la entrada. Así que van en dos tandas paralelas.
  const [{ data: { user } }, { data: post }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .eq("published", true)
      .single(),
  ]);

  if (!post) notFound();

  // Anti-spam: ¿el usuario ya tiene un comentario pendiente (en cualquier
  // entrada)? Se lee con el cliente admin porque la policy pública de
  // `comments` solo expone los aprobados. Si faltara la service key no se rompe
  // la página, que es pública; el trigger de la BD sigue bloqueando el doble
  // comentario de todas formas.
  const admin =
    user && process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;

  // Artículos relacionados: misma categoría, con reserva a los más recientes.
  let relatedQuery = supabase
    .from("posts")
    .select("id, title, slug, cover_image, is_premium, created_at, categories(name)")
    .eq("published", true)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (post.category_id) relatedQuery = relatedQuery.eq("category_id", post.category_id);

  const [
    profileRes,
    commentsRes,
    userPostRes,
    likeCountRes,
    userLikedRes,
    pendingRes,
    relatedRes,
  ] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
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
    admin && user
      ? admin
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("approved", false)
      : Promise.resolve({ count: 0 }),
    relatedQuery,
  ]);

  const profileData = profileRes.data;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  const hasAccess = !post.is_premium || isPremium;

  const comments = commentsRes.data;
  const userPost = userPostRes.data as { saved: boolean; read_at: string | null } | null;
  const hasPendingComment = (pendingRes.count ?? 0) > 0;

  const initialLikes = (post.base_likes ?? 0) + (likeCountRes.count ?? 0);
  const initialLiked = !!userLikedRes.data;
  const initialShares = post.shares_count ?? 0;

  const youtubeId = post.youtube_url ? getYoutubeId(post.youtube_url) : null;
  const wordCount = post.content ? post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length : 0;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  const headings = post.content ? extractHeadings(post.content) : [];

  // La reserva sigue siendo secuencial a propósito: solo salta cuando la
  // categoría no tiene ninguna otra entrada publicada, que es raro. Lanzarla
  // siempre en paralelo costaría una consulta de más en todas las visitas para
  // ahorrar un viaje en unas pocas.
  let related = relatedRes.data;

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

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      <ReadingProgress />

      {/* Los mismos escalones que las migas de pan de abajo, y en el mismo
          orden: Google exige que el dato estructurado se corresponda con lo que
          ve el visitante. Si algún día cambia una, cambia la otra. */}
      <JsonLd
        data={[
          articleSchema({
            slug,
            title: post.title,
            description: post.meta_description || post.excerpt,
            coverImage: post.cover_image,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            isPremium: post.is_premium,
          }),
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Artículos", path: "/articulos" },
            ...((post.categories as PostCategoryRef | null)?.name
              ? [{
                  name: (post.categories as PostCategoryRef).name,
                  path: `/categoria/${(post.categories as PostCategoryRef).slug}`,
                }]
              : []),
            { name: post.title, path: `/post/${slug}` },
          ]),
        ]}
      />

      <main className="post-page">

        {/* Breadcrumb */}
        <nav className="post-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span className="post-breadcrumb-sep">›</span>
          <Link href="/articulos">Artículos</Link>
          {(post.categories as PostCategoryRef | null)?.name && (
            <>
              <span className="post-breadcrumb-sep">›</span>
              <Link href={`/categoria/${(post.categories as PostCategoryRef).slug}`}>
                {(post.categories as PostCategoryRef).name}
              </Link>
            </>
          )}
          <span className="post-breadcrumb-sep">›</span>
          <span className="post-breadcrumb-current">{post.title}</span>
        </nav>

        {/* Header del post */}
        <div className="post-header">
          <div className="post-header-meta">
            {(post.categories as PostCategoryRef | null)?.name && (
              <span className="post-category">{(post.categories as PostCategoryRef).name}</span>
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

        {/* Portada: vídeo de YouTube si existe, sino imagen estática */}
        {youtubeId ? (
          <div className="post-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title={post.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : post.cover_image ? (
          <div className="post-cover">
            <img src={post.cover_image} alt={post.title} />
          </div>
        ) : null}

        {/* Contenido o paywall */}
        {hasAccess ? (
          <>

            <TableOfContents headings={headings} />

            <div
              className="post-content prose-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Cierre fijo: siempre hay un siguiente paso, sea quien sea el
                que lee. Antes los Premium terminaban el artículo sin nada. */}
            <PostCtaFinal logueado={!!user} esPremium={isPremium} />
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
                    {(rp.categories as PostCategoryRef | null)?.name && (
                      <span className="related-card-cat">{(rp.categories as PostCategoryRef).name}</span>
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

          {user && hasAccess && <CommentForm postId={post.id} hasPending={hasPendingComment} />}

          {!user && (
            <div className="comments-register-cta">
              <p className="comments-register-cta-text">
                Únete a la comunidad y participa en la conversación.
              </p>
              <div className="comments-register-cta-actions">
                <Link href="/register" className="cta-btn-primary">Crear cuenta gratis →</Link>
                <Link href="/login" className="cta-btn-secondary">Ya tengo cuenta</Link>
              </div>
            </div>
          )}

          <div className="comments-list">
            {comments?.length === 0 && (
              <p className="comments-empty">Sé el primero en comentar.</p>
            )}
            {comments?.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-item-meta">
                  <span className="comment-author">
                    {(c.profiles as CommentProfileRef | null)?.full_name ?? "Usuario"}
                    {(c.profiles as CommentProfileRef | null)?.is_featured && (
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

        {/* Botones volver */}
        <div className="post-back-row">
          <Link href="/articulos" className="post-back-btn">
            ← Ver todos los artículos
          </Link>
          {user && (
            <Link href="/dashboard" className="post-back-btn">
              Ir a Academia →
            </Link>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
