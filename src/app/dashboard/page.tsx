import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";
import DashboardSavedPosts from "@/components/DashboardSavedPosts";
import DashboardSavedTerms from "@/components/DashboardSavedTerms";
import { Medal, Crosshair, BookA, NotebookPen, ScanEye, Wallet, ListOrdered, MessagesSquare, Network, Lock, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, current_streak, is_featured")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const role = profile?.role || "free";
  const isPremium = role === "premium" || role === "admin";
  const planLabel = role === "admin" ? "Admin" : isPremium ? "Premium" : "Free";

  const [{ data: posts }, { data: userPostsData }, { data: savedTermsData }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, cover_image, is_premium, created_at, categories(name, slug)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_posts")
      .select("post_id, saved, read_at")
      .eq("user_id", user.id),
    supabase
      .from("saved_terms")
      .select("term, definition, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const allPosts = posts ?? [];
  const userPosts = userPostsData ?? [];
  const savedTermsList = savedTermsData ?? [];
  const premiumArticlesCount = allPosts.filter((p) => p.is_premium).length;

  const totalPosts = allPosts.length;
  const readIds = new Set(userPosts.filter((up) => up.read_at).map((up) => up.post_id));
  const readCount = readIds.size;
  const savedIds = new Set(userPosts.filter((up) => up.saved).map((up) => up.post_id));
  const savedPosts = allPosts.filter((p) => savedIds.has(p.id));
  const readPercent = totalPosts > 0 ? Math.round((readCount / totalPosts) * 100) : 0;

  const savedUnread = allPosts.filter((p) => {
    const up = userPosts.find((u) => u.post_id === p.id);
    return up?.saved && !up.read_at;
  });
  const continueReading = savedUnread.length > 0
    ? savedUnread.slice(0, 3)
    : allPosts.filter((p) => !readIds.has(p.id)).slice(0, 3);

  const TOOL_SECTIONS = [
    {
      label: "Academia",
      tools: [
        { href: "/logros", Icon: Medal,     name: "Logros y XP",          desc: "Tu progreso y rachas",            locked: false, soon: false },
        { href: "/calculadora", Icon: Crosshair, name: "Predicción de Precio", desc: "¿Qué Market Cap necesita tu token?", locked: false, soon: false },
        { href: "/glosario",    Icon: BookA,     name: "Diccionario Cripto",   desc: "Términos clave explicados",        locked: false, soon: false },
      ],
    },
    {
      label: "Trading",
      tools: [
        { href: isPremium ? "/dashboard/trading" : "#", Icon: NotebookPen, name: "Diario de Trading", desc: "Registra y analiza tus operaciones", locked: !isPremium, soon: false },
        { href: "/dashboard/watchlist",                  Icon: ScanEye,    name: "Watchlist",         desc: "Sigue el precio de tus coins",      locked: false,      soon: false },
        { href: "#",                                     Icon: Wallet,     name: "Portfolio Spot",    desc: "Gestiona tus holdings de crypto",   locked: true,       soon: true  },
      ],
    },
    {
      label: "Comunidad",
      tools: [
        { href: "/ranking", Icon: ListOrdered,  name: "Ranking", desc: "Los miembros más activos",      locked: false, soon: true },
        { href: "#",        Icon: MessagesSquare, name: "Chat",    desc: "Chat en tiempo real",           locked: false, soon: true },
        { href: "#",        Icon: Network,       name: "Foro",    desc: "Debates y análisis con otros",  locked: false, soon: true },
      ],
    },
  ];

  return (
    <main className="dashboard-main">

      {/* ── Cabecera ── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">
            Hola, <span>{name}</span>
            {profile?.is_featured && (
              <span className="featured-star-large" title="Usuario destacado — 30 días de racha">★</span>
            )}
          </h1>
          <div className="dash-header-meta">
            <span className={`dash-plan-badge${isPremium ? " premium" : ""}`}>{planLabel}</span>
            {(profile?.current_streak ?? 0) > 0 && (
              <Link href="/dashboard/logros" className="dash-streak-badge">
                🔥 {profile?.current_streak} días
              </Link>
            )}
          </div>
        </div>
        {!isPremium && (
          <Link href="/premium" className="dash-upgrade-btn">Hazte Premium →</Link>
        )}
      </div>

      {/* ── Progreso ── */}
      <div className="dash-progress-card">
        <div className="dash-progress-head">
          <span className="dash-card-label">Tu progreso</span>
          <span className="dash-progress-count">
            {readCount}<span>/{totalPosts}</span>
          </span>
        </div>
        <div className="dash-progress-bar">
          <div className="dash-progress-fill" style={{ width: `${readPercent}%` }} />
        </div>
        <div className="dash-progress-foot">
          <span>{readPercent}% de artículos leídos</span>
          <Link href="/articulos" className="dash-link-orange">Ver todos →</Link>
        </div>
      </div>

      {/* ── Herramientas ── */}
      <div className="dash-tools-card">
        <span className="dash-card-label">Herramientas</span>
        <div className="dash-tools-sections">
          {TOOL_SECTIONS.map((section) => (
            <div key={section.label} className="dash-tools-section">
              <p className="dash-tools-section-label">{section.label}</p>
              <div className="dash-tools-grid">
                {section.tools.map((t) => {
                  const isClickable = !t.locked && !t.soon;
                  const cls = `dash-tool-item${t.locked || t.soon ? " locked" : ""}`;
                  return isClickable ? (
                    <Link key={t.name} href={t.href} className={cls}>
                      {t.locked && <span className="dash-tool-premium-tag">PREMIUM</span>}
                      <div className="dash-tool-icon"><t.Icon size={17} aria-hidden="true" /></div>
                      <span className="dash-tool-name">{t.name}</span>
                      <span className="dash-tool-desc">{t.desc}</span>
                    </Link>
                  ) : (
                    <div key={t.name} className={cls}>
                      {t.soon
                        ? <span className="dash-tool-soon-tag">Pronto</span>
                        : <span className="dash-tool-premium-tag">PREMIUM</span>
                      }
                      <div className="dash-tool-icon"><t.Icon size={17} aria-hidden="true" /></div>
                      <span className="dash-tool-name">{t.name}</span>
                      <span className="dash-tool-desc">{t.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upgrade card (free users only) ── */}
      {!isPremium && (
        <div className="dash-upgrade-card">
          <div className="dash-upgrade-card-body">
            <span className="dash-upgrade-card-badge">PREMIUM</span>
            <h3 className="dash-upgrade-card-title">Desbloquea el acceso completo</h3>
            <ul className="dash-upgrade-card-perks">
              <li>Acceso a <strong>{premiumArticlesCount} artículos</strong> premium bloqueados</li>
              <li>Diario de trading y estadísticas avanzadas</li>
              <li>Todo el contenido futuro sin límites</li>
            </ul>
          </div>
          <div className="dash-upgrade-card-right">
            <div className="dash-upgrade-card-price">
              <span className="dash-upgrade-price-main">19,99€</span>
              <span className="dash-upgrade-price-per">/mes</span>
            </div>
            <Link href="/premium" className="dash-upgrade-card-cta">Hazte Premium →</Link>
          </div>
        </div>
      )}

      {/* ── Continúa leyendo ── */}
      {continueReading.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">Continúa leyendo</h2>
            <Link href="/articulos" className="dash-link-orange">Ver todos →</Link>
          </div>
          <div className="dash-continue-list">
            {continueReading.map((post) => (
              <Link key={post.id} href={`/post/${post.slug}`} className="dash-continue-card">
                <div
                  className="dash-continue-thumb"
                  style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}
                >
                  {!post.cover_image && <Icon name="chart" size={26} />}
                  {post.is_premium && <span className="dash-mini-badge">PREMIUM</span>}
                </div>
                <div className="dash-continue-body">
                  {(post.categories as any)?.name && (
                    <span className="dash-continue-cat">{(post.categories as any).name}</span>
                  )}
                  <h3 className="dash-continue-title">{post.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Guardados ── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">
            Guardados
            {savedPosts.length > 0 && (
              <span className="dash-count-pill">{savedPosts.length}</span>
            )}
          </h2>
        </div>
        <DashboardSavedPosts
          isPremium={isPremium}
          initialPosts={savedPosts.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            cover_image: p.cover_image,
            is_premium: p.is_premium,
            isRead: readIds.has(p.id),
            categoryName: (p.categories as any)?.name ?? null,
          }))}
        />
      </div>

      {/* ── Diccionario guardado ── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">
            Diccionario guardado
            {savedTermsList.length > 0 && (
              <span className="dash-count-pill">{savedTermsList.length}</span>
            )}
          </h2>
          <Link href="/glosario" className="dash-link-orange">Ver diccionario →</Link>
        </div>
        <DashboardSavedTerms initialTerms={savedTermsList} />
      </div>

    </main>
  );
}
