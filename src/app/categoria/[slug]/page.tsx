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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "Categoría no encontrada" };
  return { title: category.name };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const profileData = user ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, is_premium, created_at, categories(name, slug)")
    .eq("published", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  const list = posts ?? [];

  const commentCountMap: Record<string, number> = {};
  if (list.length > 0) {
    const { data: cc } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", list.map((p) => p.id))
      .eq("approved", true);
    cc?.forEach((c) => {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
    });
  }

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
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

      <main className="blog-main">
        <div className="category-header">
          <span className="section-heading-eyebrow">Tema</span>
          <h1 className="category-title">{category.name}</h1>
          <p className="category-count">
            {list.length} {list.length === 1 ? "artículo" : "artículos"}
          </p>
        </div>

        {list.length === 0 ? (
          <div className="blog-empty">
            <p>Aún no hay artículos en este tema.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {list.map((post) => (
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
        )}
      </main>

      <Footer />
    </div>
  );
}
