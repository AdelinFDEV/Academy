import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, current_streak, max_streak, is_featured")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const role = profile?.role || "free";
  const isPremium = role === "premium" || role === "admin";

  const [{ data: posts }, { data: userPostsData }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, is_premium, created_at, categories(name, slug)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_posts")
      .select("post_id, saved, read_at")
      .eq("user_id", user.id),
  ]);

  const allPosts = posts ?? [];
  const userPosts = userPostsData ?? [];

  const totalPosts = allPosts.length;
  const premiumPosts = allPosts.filter((p) => p.is_premium).length;
  const readIds = new Set(userPosts.filter((up) => up.read_at).map((up) => up.post_id));
  const readCount = readIds.size;
  const savedIds = new Set(userPosts.filter((up) => up.saved).map((up) => up.post_id));
  const savedPosts = allPosts.filter((p) => savedIds.has(p.id));
  const latest = allPosts.slice(0, 6);
  const planLabel = role === "admin" ? "Admin" : isPremium ? "Premium" : "Free";

  return (
    <main className="dashboard-main">
      <div className="dashboard-header">
        <div className="dashboard-header-name">
          <h1>Hola, <span>{name}</span></h1>
          {profile?.is_featured && (
            <span className="featured-star-large" title="Usuario destacado — 30 días de racha">
              ★
            </span>
          )}
        </div>
        <p>Bienvenido a tu academia de criptomonedas</p>
      </div>

      {!isPremium && (
        <div className="premium-banner">
          <div className="premium-banner-text">
            <strong>Desbloquea todo el contenido</strong>
            <p>Accede a los {premiumPosts} análisis premium y a todo lo que publiquemos con el plan Premium</p>
          </div>
          <button className="btn-primary btn-small">Hazte Premium →</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{totalPosts}</span>
          <span className="stat-label">Artículos disponibles</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{readCount}</span>
          <span className="stat-label">Artículos leídos</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{savedPosts.length}</span>
          <span className="stat-label">Guardados</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: isPremium ? "var(--accent-orange)" : undefined }}>
            {planLabel}
          </span>
          <span className="stat-label">Tu plan</span>
        </div>
      </div>

      <Link href="/dashboard/logros" className="streak-teaser">
        <span className="streak-teaser-btn">Ver Mis Logros</span>
        <span className="streak-teaser-flame">🔥</span>
        <span className="streak-teaser-value">{profile?.current_streak ?? 0} días de racha</span>
        {profile?.is_featured && (
          <span className="streak-teaser-star" title="Usuario destacado">★</span>
        )}
      </Link>

      {savedPosts.length > 0 && (
        <div className="section">
          <div className="dashboard-section-head">
            <h2 className="section-title">
              <Icon name="bookmark" size={18} /> Guardados
            </h2>
          </div>
          <div className="posts-grid">
            {savedPosts.map((post) => {
              const locked = post.is_premium && !isPremium;
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={`post-card${post.is_premium ? " is-premium" : ""}`}
                >
                  <div
                    className="post-card-image"
                    style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}
                  >
                    {!post.cover_image && (
                      <span className="post-card-image-placeholder">
                        <Icon name="chart" size={40} />
                      </span>
                    )}
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
                    <h3 className="post-card-title">{post.title}</h3>
                    {locked ? (
                      <span className="post-read-more is-premium"><Icon name="lock" size={14} /> Desbloquear</span>
                    ) : (
                      <span className="post-read-more">Leer <Icon name="arrow-right" size={15} /></span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <div className="dashboard-section-head">
          <h2 className="section-title">Últimos artículos</h2>
          <Link href="/articulos" className="dashboard-see-all">Ver todos →</Link>
        </div>
        {latest.length === 0 ? (
          <p className="admin-empty">Aún no hay artículos publicados.</p>
        ) : (
          <div className="posts-grid">
            {latest.map((post) => {
              const locked = post.is_premium && !isPremium;
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={`post-card${post.is_premium ? " is-premium" : ""}`}
                >
                  <div
                    className="post-card-image"
                    style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}
                  >
                    {!post.cover_image && (
                      <span className="post-card-image-placeholder">
                        <Icon name="chart" size={40} />
                      </span>
                    )}
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
                    <h3 className="post-card-title">{post.title}</h3>
                    {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
                    {locked ? (
                      <span className="post-read-more is-premium"><Icon name="lock" size={14} /> Desbloquear</span>
                    ) : (
                      <span className="post-read-more">Leer <Icon name="arrow-right" size={15} /></span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
