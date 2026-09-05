import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";
import DashboardSavedPosts from "@/components/DashboardSavedPosts";
import DashboardSavedTerms from "@/components/DashboardSavedTerms";
import { NotebookPen, Unlock, Radar, Gem, Crown, ArrowRight, Check, User, Lock, Sprout, BookOpen, Book, Flame, Zap } from "lucide-react";
import DashboardSavedGuides from "@/components/DashboardSavedGuides";
import TwoFactorNudge from "@/components/TwoFactorNudge";
import DashboardSpotlight from "@/components/DashboardSpotlight";
import DashboardToolsSidebar from "@/components/DashboardToolsSidebar";
import type { ToolSection } from "@/components/DashboardToolsSidebar";
import { GUIDES, GUIDES_NEWEST_FIRST } from "@/lib/guides";
import { getEffectiveStreak } from "@/lib/streak";
import type { PostCategoryRef } from "@/lib/types";
import SiguientePasoTelegram from "@/components/SiguientePasoTelegram";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, current_streak, last_seen, is_featured, telegram_linked_at")
    .eq("id", user.id)
    .single();

  const effectiveStreak = getEffectiveStreak(profile?.current_streak, profile?.last_seen);

  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const role = profile?.role || "free";
  const isPremium = role === "premium" || role === "admin";
  const planLabel = role === "admin" ? "Admin" : isPremium ? "Premium" : "Free";

  const [{ data: posts }, { data: userPostsData }, { data: savedTermsData }, { data: savedGuidesData }, { data: userBadgesData }] = await Promise.all([
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
    supabase
      .from("guide_saves")
      .select("guide_slug, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id),
  ]);

  const allPosts = posts ?? [];
  const userPosts = userPostsData ?? [];
  const savedTermsList = savedTermsData ?? [];
  const savedGuidesList = (savedGuidesData ?? [])
    .map((sg) => ({ slug: sg.guide_slug, savedAt: sg.saved_at, meta: GUIDES.find((g) => g.slug === sg.guide_slug) }))
    .filter((sg): sg is { slug: string; savedAt: string; meta: NonNullable<typeof sg.meta> } => !!sg.meta);
  const earnedBadgeIds = new Set((userBadgesData ?? []).map((b) => b.badge_id));

  const DASH_BADGES = [
    { id: "first-read", label: "Primer paso", icon: <Sprout size={18} aria-hidden="true" />, condition: "Lee tu primer artículo de la academia" },
    { id: "reader",     label: "Lector",       icon: <BookOpen size={18} aria-hidden="true" />, condition: "Completa 5 artículos leídos" },
    { id: "scholar",    label: "Estudioso",    icon: <Book size={18} aria-hidden="true" />, condition: "Alcanza 10 artículos leídos" },
    { id: "streak3",    label: "Constante",    icon: <Flame size={18} aria-hidden="true" />, condition: "Entra 3 días seguidos a la academia" },
    { id: "streak7",    label: "Dedicado",     icon: <Zap size={18} aria-hidden="true" />, condition: "Mantén una racha de 7 días consecutivos" },
    {
      id: "streak30", label: "Imparable", icon: <Gem size={18} aria-hidden="true" />,
      condition: "Consigue 30 días consecutivos en la academia",
      reward: "Tu perfil lucirá una ★ dorada visible en todos tus comentarios",
    },
  ];
  const badgesUnlockedCount = DASH_BADGES.filter((b) => earnedBadgeIds.has(b.id)).length;

  const readIds = new Set(userPosts.filter((up) => up.read_at).map((up) => up.post_id));
  const savedIds = new Set(userPosts.filter((up) => up.saved).map((up) => up.post_id));
  const savedPosts = allPosts.filter((p) => savedIds.has(p.id));

  const savedUnread = allPosts.filter((p) => {
    const up = userPosts.find((u) => u.post_id === p.id);
    return up?.saved && !up.read_at;
  });
  const continueReading = savedUnread.length > 0
    ? savedUnread.slice(0, 3)
    : allPosts.filter((p) => !readIds.has(p.id)).slice(0, 3);

  const TOOL_SECTIONS: ToolSection[] = [
    {
      label: "Educación",
      tools: [
        { href: "/glosario", icon: "booka",         name: "Diccionario Cripto",   desc: "Términos clave explicados",      locked: false, soon: false },
        { href: "#",         icon: "radio",         name: "Trading en Directo",   desc: "Futuros de Solana en 5 minutos", locked: false, soon: true  },
        { href: "/guias",    icon: "map",           name: "Guías Interactivas",   desc: "Tu hoja de ruta de aprendizaje", locked: false, soon: false },
      ],
    },
    {
      label: "Herramientas",
      tools: [
        { href: isPremium ? "/dashboard/trading"         : "#", icon: "notebookpen",  name: "Diario de Trading",      desc: "Registra y analiza tus operaciones",                        locked: !isPremium, soon: false },
        { href: "/dashboard/watchlist",                         icon: "scaneye",      name: "Watchlist",              desc: "Sigue el precio de tus coins",                              locked: false,      soon: false },
        { href: "/logros",                                      icon: "trophy",       name: "Logros",                 desc: "Tu progreso y rachas",                                      locked: false,      soon: false },
        { href: "/calculadora",                                 icon: "target",       name: "Predicción de Precio",   desc: "¿Qué Market Cap necesita tu token?",                        locked: false,      soon: false },
        { href: isPremium ? "/portfolio"                 : "#", icon: "piechart",     name: "Portfolio Adelin",       desc: "Sigue las compras de AdelinBTC en SPOT",                    locked: !isPremium, soon: false },
        { href: isPremium ? "/herramientas/liberaciones" : "#", icon: "unlock",       name: "Liberaciones de Tokens", desc: "Anticipa la presión vendedora con el calendario de vesting", locked: !isPremium, soon: false },
        { href: isPremium ? "/herramientas/radar"        : "#", icon: "radar",        name: "Radar Diario",           desc: "Resumen del mercado y macro de EE. UU. (inflación y tipos)", locked: !isPremium, soon: false },
        { href: isPremium ? "/dashboard/mi-portfolio"    : "#", icon: "piechart",     name: "Mi Portfolio",           desc: "Registra compras y ventas y sigue tu P&L en tiempo real",    locked: !isPremium, soon: false },
        { href: "/dashboard/calculadora-riesgo",                icon: "shield",    name: "Calculadora de Riesgo",  desc: "Tamaño de posición según tu capital y riesgo",              locked: false,      soon: false },
      ],
    },
  ];

  return (
    <div className="dash-page-wrap">
    <main className="dashboard-main">

      {/* Solo aparece si es Premium y aún no ha vinculado Telegram: es el
          único paso que le queda y no es evidente por sí solo. */}
      <SiguientePasoTelegram
        isPremium={isPremium}
        telegramVinculado={!!profile?.telegram_linked_at}
      />

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
            {effectiveStreak > 0 && (
              <Link href="/dashboard/logros" className="dash-streak-badge">
                🔥 {effectiveStreak} días
              </Link>
            )}
          </div>
        </div>
        <div className="dash-header-actions">
          <Link href="/cuenta" className="dash-account-btn">
            <User size={15} /> Mi cuenta
          </Link>
          {!isPremium && (
            <Link href="/premium" className="dash-upgrade-btn">Hazte Premium →</Link>
          )}
        </div>
      </div>

      <TwoFactorNudge />

      {/* ── Spotlight: herramientas top ── */}
      <DashboardSpotlight isPremium={isPremium} />

      {/* ── Logros ── */}
      <div className="dash-badges-card">
        <div className="dash-progress-head">
          <span className="dash-card-label">Tus logros</span>
          <span className="dash-progress-count">
            {badgesUnlockedCount}<span>/{DASH_BADGES.length}</span>
          </span>
        </div>
        <div className="dash-badges-row">
          {DASH_BADGES.map((badge) => {
            const unlocked = earnedBadgeIds.has(badge.id);
            return (
              <div key={badge.id} className={`dash-badge-tile${unlocked ? " dash-badge-tile--unlocked" : ""}`}>
                {unlocked && (
                  <span className="dash-badge-tile-check" title="Logro obtenido">
                    <Check size={10} strokeWidth={3.2} aria-hidden="true" />
                  </span>
                )}
                <div className="dash-badge-tile-icon">
                  {unlocked ? badge.icon : <Lock size={16} aria-hidden="true" />}
                </div>
                <span className="dash-badge-tile-label">{badge.label}</span>
                <div className="badge-tooltip">
                  <p className="badge-tooltip-condition">{badge.condition}</p>
                  {badge.reward && (
                    <p className="badge-tooltip-reward">
                      <span className="badge-tooltip-reward-star">★</span> {badge.reward}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="dash-progress-foot">
          <span>{badgesUnlockedCount === 0 ? "Empieza a leer para desbloquear tu primer logro" : `${badgesUnlockedCount} de ${DASH_BADGES.length} logros desbloqueados`}</span>
          <Link href="/dashboard/logros" className="dash-link-orange"><span>Ver todos</span><ArrowRight size={14} className="dash-link-arrow" /></Link>
        </div>
      </div>

      {/* ── Asesoría 1:1 ── */}

      {/* ── Upgrade card (free users only) ── */}
      {!isPremium && (
        <div className="dash-upsell">
          <div className="dash-upsell-accent" />

          <div className="dash-upsell-left">
            <div className="dash-upsell-header">
              <span className="dash-upsell-eyebrow">
                <Crown size={11} aria-hidden="true" /> Premium
              </span>
              <h3 className="dash-upsell-title">Lleva tu trading al siguiente nivel</h3>
            </div>

            <div className="dash-upsell-features">
              <div className="dash-upsell-feat">
                <div className="dash-upsell-feat-icon"><NotebookPen size={15} /></div>
                <div>
                  <span className="dash-upsell-feat-name">Diario de Trading</span>
                  <span className="dash-upsell-feat-desc">Registra cada operación y descubre qué te hace ganar.</span>
                </div>
              </div>
              <div className="dash-upsell-feat">
                <div className="dash-upsell-feat-icon"><Radar size={15} /></div>
                <div>
                  <span className="dash-upsell-feat-name">Señales en Spot</span>
                  <span className="dash-upsell-feat-desc">Entradas y salidas con criterio, no con corazonadas.</span>
                </div>
              </div>
              <div className="dash-upsell-feat">
                <div className="dash-upsell-feat-icon"><Unlock size={15} /></div>
                <div>
                  <span className="dash-upsell-feat-name">Liberaciones de Tokens</span>
                  <span className="dash-upsell-feat-desc">Anticipa la presión vendedora con el calendario de vesting.</span>
                </div>
              </div>
              <div className="dash-upsell-feat">
                <div className="dash-upsell-feat-icon"><Gem size={15} /></div>
                <div>
                  <span className="dash-upsell-feat-name">Herramientas exclusivas</span>
                  <span className="dash-upsell-feat-desc">Watchlist, estadísticas y todo lo que viene después.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-upsell-right">
            <div className="dash-upsell-price">
              <span className="dash-upsell-price-main">49,99€</span>
              <span className="dash-upsell-price-per">/mes</span>
            </div>
            <Link href="/premium" className="dash-upsell-cta">
              Hazte Premium <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <p className="dash-upsell-note">
              <Check size={11} /> Sin permanencia · Cancela cuando quieras
            </p>
          </div>
        </div>
      )}

      {/* ── Últimas guías publicadas ── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Últimas guías publicadas</h2>
          <Link href="/guias" className="dash-link-orange"><span>Ver todas</span><ArrowRight size={14} className="dash-link-arrow" /></Link>
        </div>
        <div className="dash-continue-list">
          {GUIDES_NEWEST_FIRST.slice(0, 3).map((guide) => (
            <Link key={guide.slug} href={`/guias/${guide.slug}`} className="dash-continue-card" style={{borderColor: `color-mix(in srgb, ${guide.color} 30%, transparent)`}}>
              <div
                className="dash-continue-thumb"
                style={{ background: `linear-gradient(145deg, var(--card-bg), color-mix(in srgb, ${guide.color} 15%, transparent))` }}
              >
                <Icon name="map" size={26} style={{ color: guide.color }} />
                {guide.type === "premium" && <span className="dash-mini-badge">PREMIUM</span>}
              </div>
              <div className="dash-continue-body">
                <span className="dash-continue-cat" style={{ color: guide.color }}>Guía Interactiva • {guide.difficulty}</span>
                <h3 className="dash-continue-title">{guide.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Últimos artículos publicados ── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Últimos artículos publicados</h2>
          <Link href="/articulos" className="dash-link-orange"><span>Ver todos</span><ArrowRight size={14} className="dash-link-arrow" /></Link>
        </div>
        <div className="dash-continue-list">
          {allPosts.slice(0, 3).map((post) => (
            <Link key={post.id} href={`/post/${post.slug}`} className="dash-continue-card">
              <div
                className="dash-continue-thumb"
                style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}
              >
                {!post.cover_image && <Icon name="chart" size={26} />}
                {post.is_premium && <span className="dash-mini-badge">PREMIUM</span>}
              </div>
              <div className="dash-continue-body">
                {(post.categories as PostCategoryRef | null)?.name && (
                  <span className="dash-continue-cat">{(post.categories as PostCategoryRef).name}</span>
                )}
                <h3 className="dash-continue-title">{post.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Continúa leyendo ── */}
      {continueReading.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">Continúa leyendo</h2>
            <Link href="/articulos" className="dash-link-orange"><span>Ver todos</span><ArrowRight size={14} className="dash-link-arrow" /></Link>
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
                  {(post.categories as PostCategoryRef | null)?.name && (
                    <span className="dash-continue-cat">{(post.categories as PostCategoryRef).name}</span>
                  )}
                  <h3 className="dash-continue-title">{post.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Artículos guardados ── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">
            Artículos guardados
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
            categoryName: (p.categories as PostCategoryRef | null)?.name ?? null,
          }))}
        />
      </div>

      {/* ── Guías guardadas ── */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">
            Guías guardadas
            {savedGuidesList.length > 0 && (
              <span className="dash-count-pill">{savedGuidesList.length}</span>
            )}
          </h2>
          <Link href="/guias" className="dash-link-orange"><span>Ver guías</span><ArrowRight size={14} className="dash-link-arrow" /></Link>
        </div>
        <DashboardSavedGuides initialGuides={savedGuidesList} />
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
          <Link href="/glosario" className="dash-link-orange"><span>Ver diccionario</span><ArrowRight size={14} className="dash-link-arrow" /></Link>
        </div>
        <DashboardSavedTerms initialTerms={savedTermsList} />
      </div>

    </main>
    <DashboardToolsSidebar sections={TOOL_SECTIONS} />
    </div>
  );
}
