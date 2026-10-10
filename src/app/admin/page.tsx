import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import { GUIDES, GUIDES_NEWEST_FIRST } from "@/lib/guides";

// ── Helpers ──────────────────────────────────────────────
function buildDayBuckets(n: number) {
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      count: 0,
    });
  }
  return days;
}

// ── SVG line chart ────────────────────────────────────────
function LineChart({ data }: { data: { count: number }[] }) {
  const W = 400, H = 72, PAD_X = 2, PAD_Y = 6;
  const max = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => {
    const x = PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2);
    const y = PAD_Y + (1 - d.count / max) * (H - PAD_Y * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline = pts.join(" ");
  const area = `${PAD_X},${H} ${polyline} ${W - PAD_X},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="admin-line-chart-svg" aria-hidden="true">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-orange)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline points={polyline} fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── SVG multi-line chart (community interaction) ──────────
interface Series { label: string; color: string; data: { count: number }[] }
// `labels` se recibe por compatibilidad con las llamadas existentes, pero este
// grafico no rotula el eje X: no se desestructura para no dejar una variable muerta.
function MultiLineChart({ series }: { series: Series[]; labels: string[] }) {
  const W = 400, H = 80, PAD_X = 2, PAD_Y = 8;
  const allCounts = series.flatMap((s) => s.data.map((d) => d.count));
  const max = Math.max(...allCounts, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="admin-line-chart-svg" aria-hidden="true">
      {series.map((s) => {
        const pts = s.data.map((d, i) => {
          const x = PAD_X + (i / (s.data.length - 1 || 1)) * (W - PAD_X * 2);
          const y = PAD_Y + (1 - d.count / max) * (H - PAD_Y * 2);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        return (
          <polyline key={s.label} points={pts} fill="none" stroke={s.color}
            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
        );
      })}
    </svg>
  );
}

// ── SVG donut ─────────────────────────────────────────────
// ── Page ──────────────────────────────────────────────────
export default async function AdminPage() {
  const supabase = await createClient();

  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d14 = new Date(now); d14.setDate(d14.getDate() - 14);

  const [
    { count: usersCount },
    { count: premiumCount },
    { count: newUsersThisWeek },
    { count: newUsersLastWeek },
    { count: newUsersThisMonth },
    { count: newUsersLastMonth },
    { data: userSignups },
    { data: recentSignups },
  ] = await Promise.all([
    // Usuarios sin administradores en todas las cifras, igual que en /admin/premium
    // y /admin/comunidad: el admin no es un usuario que llega ni que paga.
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "premium"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("created_at", d7.toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("created_at", d14.toISOString()).lt("created_at", d7.toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("created_at", d30.toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin").gte("created_at", d60.toISOString()).lt("created_at", d30.toISOString()),
    supabase.from("profiles").select("created_at").neq("role", "admin").gte("created_at", d30.toISOString()).order("created_at"),
    supabase.from("profiles").select("id, full_name, role, created_at").neq("role", "admin").order("created_at", { ascending: false }).limit(5),
  ]);

  const [
    { data: guideVisitsData },
    { data: guideLikesData },
    { data: guideSavesData },
    { data: guideSharesData },
    { data: quizCompletionsData },
    { data: guideBadgesData },
  ] = await Promise.all([
    supabase.from("guide_visits").select("guide_slug, visited_at, user_id"),
    supabase.from("guide_likes").select("guide_slug, created_at"),
    supabase.from("guide_saves").select("guide_slug"),
    supabase.from("guide_shares").select("guide_slug, created_at"),
    supabase.from("guide_quiz_completions").select("guide_slug, score, total, completed_at, user_id"),
    supabase.from("user_badges").select("badge_id").like("badge_id", "guide-%"),
  ]);

  // ── User growth chart (30 days) ──
  const dayBuckets = buildDayBuckets(30);
  (userSignups ?? []).forEach((u) => {
    const key = u.created_at.slice(0, 10);
    const b = dayBuckets.find((d) => d.key === key);
    if (b) b.count++;
  });

  // ── Guide analytics ──
  const allGuideVisits     = guideVisitsData     ?? [];
  const allGuideLikes      = guideLikesData      ?? [];
  const allGuideSaves      = guideSavesData      ?? [];
  const allGuideShares     = guideSharesData     ?? [];
  const allQuizCompletions = quizCompletionsData ?? [];
  const allGuideBadges     = guideBadgesData     ?? [];

  const totalGuideVisits    = allGuideVisits.length;
  const uniqueGuideVisitors = new Set(allGuideVisits.filter((v) => v.user_id).map((v) => v.user_id)).size;
  const totalGuideLikes     = allGuideLikes.length;
  const totalGuideSaves     = allGuideSaves.length;
  const totalGuideShares    = allGuideShares.length;
  const totalQuizAttempts   = allQuizCompletions.length;
  const totalPerfectScores  = allQuizCompletions.filter((c) => c.score === c.total).length;
  const quizPassRate        = totalQuizAttempts > 0 ? Math.round((totalPerfectScores / totalQuizAttempts) * 100) : 0;
  const totalGuideBadges    = allGuideBadges.length;

  // Per-guide breakdown
  const perGuideStats = GUIDES_NEWEST_FIRST.map((g) => {
    const visits    = allGuideVisits.filter((v) => v.guide_slug === g.slug).length;
    const uVisitors = new Set(allGuideVisits.filter((v) => v.guide_slug === g.slug && v.user_id).map((v) => v.user_id)).size;
    const likes     = allGuideLikes.filter((l) => l.guide_slug === g.slug).length;
    const saves     = allGuideSaves.filter((s) => s.guide_slug === g.slug).length;
    const shares    = allGuideShares.filter((s) => s.guide_slug === g.slug).length;
    const attempts  = allQuizCompletions.filter((c) => c.guide_slug === g.slug).length;
    const perfect   = allQuizCompletions.filter((c) => c.guide_slug === g.slug && c.score === c.total).length;
    const badges    = allGuideBadges.filter((b) => b.badge_id === g.badgeId).length;
    const passRate  = attempts > 0 ? Math.round((perfect / attempts) * 100) : 0;
    const engagePct = visits > 0 ? Math.round((attempts / visits) * 100) : 0;
    return { ...g, visits, uVisitors, likes, saves, shares, attempts, perfect, badges, passRate, engagePct };
  });

  // Guide visits 30-day line chart
  const guideVisitBuckets = buildDayBuckets(30);
  allGuideVisits.filter((v) => new Date(v.visited_at) >= d30).forEach((v) => {
    const b = guideVisitBuckets.find((d) => d.key === v.visited_at.slice(0, 10));
    if (b) b.count++;
  });

  // Guide interactions 30-day multi-line
  const gLikeBuckets  = buildDayBuckets(30);
  const gSaveBuckets  = buildDayBuckets(30);
  const gShareBuckets = buildDayBuckets(30);
  allGuideLikes.filter((v) => new Date(v.created_at) >= d30).forEach((v) => {
    const b = gLikeBuckets.find((d) => d.key === v.created_at.slice(0, 10));
    if (b) b.count++;
  });
  allGuideShares.filter((v) => new Date(v.created_at) >= d30).forEach((v) => {
    const b = gShareBuckets.find((d) => d.key === v.created_at.slice(0, 10));
    if (b) b.count++;
  });
  allQuizCompletions.filter((v) => new Date(v.completed_at) >= d30).forEach((v) => {
    const b = gSaveBuckets.find((d) => d.key === v.completed_at.slice(0, 10));
    if (b) b.count++;
  });

  const guideInteractionSeries: Series[] = [
    { label: "Me gustas",        color: "var(--accent-orange)", data: gLikeBuckets },
    { label: "Quiz completados", color: "#4ade80",              data: gSaveBuckets },
    { label: "Compartidos",      color: "#a78bfa",              data: gShareBuckets },
  ];


  // ── Trend helpers ──
  function trend(curr: number | null, prev: number | null) {
    const c = curr ?? 0, p = prev ?? 0;
    if (p === 0) return c > 0 ? { sign: "+", pct: 100, up: true } : null;
    const pct = Math.round(((c - p) / p) * 100);
    return { sign: pct >= 0 ? "+" : "", pct, up: pct >= 0 };
  }

  const userWeekTrend  = trend(newUsersThisWeek, newUsersLastWeek);
  const userMonthTrend = trend(newUsersThisMonth, newUsersLastMonth);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Panel de administración</h1>
          <p className="admin-page-subtitle">Resumen de actividad y crecimiento</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="admin-card admin-activity-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">
            <Icon name="activity" size={16} />
            Actividad reciente
          </h2>
        </div>
        <div className="admin-activity-feed">
          {(recentSignups ?? []).map((u) => (
            <div key={u.id} className="admin-activity-item">
              <div className="admin-activity-dot signup" />
              <div className="admin-activity-body">
                <span className="admin-activity-text">
                  <strong>{u.full_name ?? "Usuario"}</strong> se registró
                </span>
                <span className="admin-activity-meta">
                  <span className={`admin-activity-role ${u.role}`}>{u.role}</span>
                  · {new Date(u.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-v2">
        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "var(--accent-orange)" } as React.CSSProperties}>
            <Icon name="list" size={18} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{GUIDES.length}</span>
            <span className="admin-stat-v2-label">Guías publicadas</span>
            <span className="admin-stat-v2-sub">la única vía de contenido</span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#60a5fa" } as React.CSSProperties}>
            <Icon name="users" size={18} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{usersCount ?? 0}</span>
            <span className="admin-stat-v2-label">Usuarios registrados</span>
            {userWeekTrend && (
              <span className={`admin-stat-v2-trend ${userWeekTrend.up ? "up" : "down"}`}>
                {userWeekTrend.sign}{userWeekTrend.pct}% esta semana
              </span>
            )}
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "var(--premium-gold)" } as React.CSSProperties}>
            <Icon name="crown" size={18} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value" style={{ color: "var(--accent-orange)" }}>{premiumCount ?? 0}</span>
            <span className="admin-stat-v2-label">Usuarios premium</span>
            <span className="admin-stat-v2-sub">
              {usersCount ? Math.round(((premiumCount ?? 0) / usersCount) * 100) : 0}% conversión
            </span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#4ade80" } as React.CSSProperties}>
            <Icon name="eye" size={18} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalGuideVisits}</span>
            <span className="admin-stat-v2-label">Visitas a las guías</span>
            <span className="admin-stat-v2-sub">{totalQuizAttempts} quiz completados</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="admin-charts-row">
        {/* User growth line chart */}
        <div className="admin-chart-card admin-chart-card--wide">
          <div className="admin-chart-head">
            <div>
              <h2 className="admin-chart-title">Nuevos usuarios</h2>
              <p className="admin-chart-sub">Últimos 30 días</p>
            </div>
            <div className="admin-chart-kpi">
              <span className="admin-chart-kpi-value">{newUsersThisMonth ?? 0}</span>
              {userMonthTrend && (
                <span className={`admin-chart-kpi-trend ${userMonthTrend.up ? "up" : "down"}`}>
                  {userMonthTrend.sign}{userMonthTrend.pct}%
                </span>
              )}
            </div>
          </div>
          <div className="admin-line-chart-wrap">
            <LineChart data={dayBuckets} />
            <div className="admin-line-chart-labels">
              {[dayBuckets[0], dayBuckets[9], dayBuckets[19], dayBuckets[29]].map((d) => (
                <span key={d.key}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* Guide analytics section                               */}
      {/* ─────────────────────────────────────────────────────── */}
      <div className="admin-section-header">
        <div className="admin-section-header-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
          </svg>
        </div>
        <div>
          <h2 className="admin-section-header-title">Rendimiento de Guías</h2>
          <p className="admin-section-header-sub">Métricas de interactividad y engagement · todos los datos históricos</p>
        </div>
      </div>

      {/* Guide KPIs — 8 stats */}
      <div className="admin-stats-v2 admin-guide-kpis">
        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#60a5fa" } as React.CSSProperties}>
            <Icon name="eye" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalGuideVisits}</span>
            <span className="admin-stat-v2-label">Visitas totales</span>
            <span className="admin-stat-v2-sub">{uniqueGuideVisitors} visitantes únicos</span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "var(--accent-orange)" } as React.CSSProperties}>
            <Icon name="heart" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalGuideLikes}</span>
            <span className="admin-stat-v2-label">Me gustas</span>
            <span className="admin-stat-v2-sub">
              {totalGuideVisits > 0 ? Math.round((totalGuideLikes / totalGuideVisits) * 100) : 0}% de visitantes
            </span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#f59e0b" } as React.CSSProperties}>
            <Icon name="bookmark" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalGuideSaves}</span>
            <span className="admin-stat-v2-label">Guardados</span>
            <span className="admin-stat-v2-sub">
              {totalGuideVisits > 0 ? Math.round((totalGuideSaves / totalGuideVisits) * 100) : 0}% de visitantes
            </span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#a78bfa" } as React.CSSProperties}>
            <Icon name="share" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalGuideShares}</span>
            <span className="admin-stat-v2-label">Compartidos</span>
            <span className="admin-stat-v2-sub">
              {totalGuideVisits > 0 ? Math.round((totalGuideShares / totalGuideVisits) * 100) : 0}% de visitantes
            </span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#4ade80" } as React.CSSProperties}>
            <Icon name="check" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalQuizAttempts}</span>
            <span className="admin-stat-v2-label">Quiz completados</span>
            <span className="admin-stat-v2-sub">
              {uniqueGuideVisitors > 0 ? Math.round((totalQuizAttempts / uniqueGuideVisitors) * 100) : 0}% de visitantes únicos
            </span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#34d399" } as React.CSSProperties}>
            <Icon name="star" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{totalPerfectScores}</span>
            <span className="admin-stat-v2-label">Puntuación perfecta</span>
            <span className="admin-stat-v2-sub">{quizPassRate}% de intentos</span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "var(--premium-gold)" } as React.CSSProperties}>
            <Icon name="crown" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value" style={{ color: "var(--accent-orange)" }}>{totalGuideBadges}</span>
            <span className="admin-stat-v2-label">Badges ganados</span>
            <span className="admin-stat-v2-sub">
              {uniqueGuideVisitors > 0 ? Math.round((totalGuideBadges / uniqueGuideVisitors) * 100) : 0}% de visitantes únicos
            </span>
          </div>
        </div>

        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#f87171" } as React.CSSProperties}>
            <Icon name="activity" size={17} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">
              {totalGuideVisits > 0
                ? Math.round(((totalGuideLikes + totalGuideSaves + totalGuideShares + totalQuizAttempts) / totalGuideVisits) * 100)
                : 0}%
            </span>
            <span className="admin-stat-v2-label">Tasa de engagement</span>
            <span className="admin-stat-v2-sub">likes + guardados + compartidos + quiz</span>
          </div>
        </div>
      </div>

      {/* Guide charts row */}
      <div className="admin-charts-row">
        {/* Daily visits line chart */}
        <div className="admin-chart-card admin-chart-card--wide">
          <div className="admin-chart-head">
            <div>
              <h2 className="admin-chart-title">Visitas a guías</h2>
              <p className="admin-chart-sub">Últimos 30 días</p>
            </div>
            <div className="admin-chart-kpi">
              <span className="admin-chart-kpi-value">
                {guideVisitBuckets.reduce((s, d) => s + d.count, 0)}
              </span>
            </div>
          </div>
          <div className="admin-line-chart-wrap">
            <LineChart data={guideVisitBuckets} />
            <div className="admin-line-chart-labels">
              {[guideVisitBuckets[0], guideVisitBuckets[9], guideVisitBuckets[19], guideVisitBuckets[29]].map((d) => (
                <span key={d.key}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Guide interaction multi-line */}
        <div className="admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <h2 className="admin-chart-title">Interacción con guías</h2>
              <p className="admin-chart-sub">Últimos 30 días</p>
            </div>
          </div>
          <div className="admin-line-chart-wrap" style={{ marginTop: 8 }}>
            <MultiLineChart series={guideInteractionSeries} labels={[]} />
            <div className="admin-line-chart-labels">
              {[guideVisitBuckets[0], guideVisitBuckets[14], guideVisitBuckets[29]].map((d) => (
                <span key={d.key}>{d.label}</span>
              ))}
            </div>
          </div>
          <div className="admin-interaction-kpis" style={{ marginTop: 10, flexWrap: "wrap" }}>
            <span className="admin-interaction-kpi" style={{ color: "var(--accent-orange)" }}>
              <span className="admin-interaction-kpi-dot" style={{ background: "var(--accent-orange)" }} />
              {totalGuideLikes} likes
            </span>
            <span className="admin-interaction-kpi" style={{ color: "#4ade80" }}>
              <span className="admin-interaction-kpi-dot" style={{ background: "#4ade80" }} />
              {totalQuizAttempts} quiz
            </span>
            <span className="admin-interaction-kpi" style={{ color: "#a78bfa" }}>
              <span className="admin-interaction-kpi-dot" style={{ background: "#a78bfa" }} />
              {totalGuideShares} shares
            </span>
          </div>
        </div>

        {/* Quiz funnel donut */}
        <div className="admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <h2 className="admin-chart-title">Funnel del quiz</h2>
              <p className="admin-chart-sub">Visitantes → Completados → Perfectos</p>
            </div>
          </div>
          <div className="admin-guide-funnel">
            {[
              { label: "Visitantes únicos", value: uniqueGuideVisitors, color: "#60a5fa", pct: 100 },
              { label: "Completaron quiz",  value: totalQuizAttempts,   color: "#4ade80", pct: uniqueGuideVisitors > 0 ? Math.round((totalQuizAttempts / uniqueGuideVisitors) * 100) : 0 },
              { label: "Puntuación 5/5",   value: totalPerfectScores,  color: "var(--accent-orange)", pct: totalQuizAttempts > 0 ? Math.round((totalPerfectScores / totalQuizAttempts) * 100) : 0 },
              { label: "Badge obtenido",   value: totalGuideBadges,    color: "var(--premium-gold)",  pct: totalPerfectScores > 0 ? Math.round((totalGuideBadges / totalPerfectScores) * 100) : 0 },
            ].map((step) => (
              <div key={step.label} className="admin-guide-funnel-step">
                <div className="admin-guide-funnel-bar-wrap">
                  <div
                    className="admin-guide-funnel-bar"
                    style={{ width: `${step.pct}%`, background: step.color }}
                  />
                </div>
                <div className="admin-guide-funnel-meta">
                  <span className="admin-guide-funnel-label">{step.label}</span>
                  <span className="admin-guide-funnel-val" style={{ color: step.color }}>{step.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-guide breakdown table */}
      <div className="admin-card admin-guide-table-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginRight: 6 }}>
              <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
            </svg>
            Desglose por guía
          </h2>
        </div>
        <div className="admin-guide-table-wrap">
          <table className="admin-guide-table">
            <thead>
              <tr>
                <th>Guía</th>
                <th>Visitas</th>
                <th>Únicos</th>
                <th>Likes</th>
                <th>Guardados</th>
                <th>Compartidos</th>
                <th>Quiz</th>
                <th>5/5</th>
                <th>Tasa quiz</th>
                <th>Engagement</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              {perGuideStats.map((g) => (
                <tr key={g.slug}>
                  <td>
                    <div className="admin-guide-table-name">
                      <span className="admin-guide-table-title">{g.shortTitle}</span>
                      <span className={`admin-guide-table-diff admin-guide-table-diff--${g.difficulty}`}>{g.difficulty}</span>
                    </div>
                  </td>
                  <td>{g.visits}</td>
                  <td>{g.uVisitors}</td>
                  <td style={{ color: "var(--accent-orange)" }}>{g.likes}</td>
                  <td style={{ color: "#f59e0b" }}>{g.saves}</td>
                  <td style={{ color: "#a78bfa" }}>{g.shares}</td>
                  <td>{g.attempts}</td>
                  <td style={{ color: "#4ade80" }}>{g.perfect}</td>
                  <td>
                    <span className={`admin-guide-table-rate${g.passRate >= 50 ? " good" : g.passRate > 0 ? " mid" : ""}`}>
                      {g.passRate}%
                    </span>
                  </td>
                  <td>
                    <span className={`admin-guide-table-rate${g.engagePct >= 30 ? " good" : g.engagePct > 0 ? " mid" : ""}`}>
                      {g.engagePct}%
                    </span>
                  </td>
                  <td style={{ color: "var(--premium-gold)" }}>{g.badges}</td>
                </tr>
              ))}
              {perGuideStats.length === 0 && (
                <tr>
                  <td colSpan={11} className="admin-empty">Sin guías publicadas todavía</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
