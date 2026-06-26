import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";

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

function buildMonthBuckets(n: number) {
  const months: { key: string; label: string; count: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-ES", { month: "short" }),
      count: 0,
    });
  }
  return months;
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

// ── SVG donut ─────────────────────────────────────────────
function Donut({ pct, color }: { pct: number; color: string }) {
  const r = 18, cx = 22, cy = 22;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(240,244,255,0.06)" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash.toFixed(1)} ${(circ - dash).toFixed(1)}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "22px 22px" }}
      />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────
export default async function AdminPage() {
  const supabase = await createClient();

  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d14 = new Date(now); d14.setDate(d14.getDate() - 14);
  const m6  = new Date(now); m6.setMonth(m6.getMonth() - 6); m6.setDate(1);

  const [
    { count: postsCount },
    { count: commentsCount },
    { count: usersCount },
    { count: premiumCount },
    { count: publishedCount },
    { count: newUsersThisWeek },
    { count: newUsersLastWeek },
    { count: newUsersThisMonth },
    { count: newUsersLastMonth },
    { data: userSignups },
    { data: postsMonthly },
    { data: publishedPosts },
    { data: recentComments },
    { data: recentSignups },
    { data: allReads },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("approved", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "premium"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", d7.toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", d14.toISOString()).lt("created_at", d7.toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", d30.toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", d60.toISOString()).lt("created_at", d30.toISOString()),
    supabase.from("profiles").select("created_at").gte("created_at", d30.toISOString()).order("created_at"),
    supabase.from("posts").select("created_at, published").gte("created_at", m6.toISOString()),
    supabase.from("posts").select("is_premium").eq("published", true),
    supabase.from("comments")
      .select("id, content, approved, created_at, profiles(full_name), posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("user_posts").select("post_id, posts(title, slug)").not("read_at", "is", null),
  ]);

  // ── User growth chart (30 days) ──
  const dayBuckets = buildDayBuckets(30);
  (userSignups ?? []).forEach((u) => {
    const key = u.created_at.slice(0, 10);
    const b = dayBuckets.find((d) => d.key === key);
    if (b) b.count++;
  });

  // ── Posts per month chart (6 months) ──
  const monthBuckets = buildMonthBuckets(6);
  (postsMonthly ?? []).filter((p) => p.published).forEach((p) => {
    const key = p.created_at.slice(0, 7);
    const b = monthBuckets.find((m) => m.key === key);
    if (b) b.count++;
  });
  const maxPosts = Math.max(...monthBuckets.map((m) => m.count), 1);

  // ── Free vs premium donut ──
  const totalPublished = publishedPosts?.length ?? 0;
  const premiumPosts = (publishedPosts ?? []).filter((p) => p.is_premium).length;
  const freePosts = totalPublished - premiumPosts;
  const premiumPct = totalPublished > 0 ? premiumPosts / totalPublished : 0;

  // ── Top posts by reads ──
  const readMap: Record<string, { title: string; slug: string; count: number }> = {};
  (allReads ?? []).forEach((r) => {
    const post = r.posts as unknown as { title: string; slug: string } | null;
    if (!post || !r.post_id) return;
    if (!readMap[r.post_id]) readMap[r.post_id] = { title: post.title, slug: post.slug, count: 0 };
    readMap[r.post_id].count++;
  });
  const topPosts = Object.values(readMap).sort((a, b) => b.count - a.count).slice(0, 5);

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
        <Link href="/admin/posts/new" className="btn-primary btn-small">
          + Nueva entrada
        </Link>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-v2">
        <div className="admin-stat-v2">
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "var(--accent-orange)" } as React.CSSProperties}>
            <Icon name="list" size={18} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value">{postsCount ?? 0}</span>
            <span className="admin-stat-v2-label">Entradas totales</span>
            <span className="admin-stat-v2-sub">{publishedCount ?? 0} publicadas · {(postsCount ?? 0) - (publishedCount ?? 0)} borradores</span>
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
          <div className="admin-stat-v2-icon" style={{ "--stat-color": "#f87171" } as React.CSSProperties}>
            <Icon name="chat" size={18} />
          </div>
          <div className="admin-stat-v2-body">
            <span className="admin-stat-v2-value" style={commentsCount ? { color: "#f87171" } : undefined}>{commentsCount ?? 0}</span>
            <span className="admin-stat-v2-label">Comentarios pendientes</span>
            {(commentsCount ?? 0) > 0 && (
              <Link href="/admin/comments" className="admin-stat-v2-action">Revisar →</Link>
            )}
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

        {/* Posts per month bar chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <h2 className="admin-chart-title">Publicaciones</h2>
              <p className="admin-chart-sub">Últimos 6 meses</p>
            </div>
          </div>
          <div className="admin-bar-chart">
            {monthBuckets.map((m) => (
              <div key={m.key} className="admin-bar-col">
                <span className="admin-bar-val">{m.count > 0 ? m.count : ""}</span>
                <div className="admin-bar-track">
                  <div
                    className="admin-bar-fill"
                    style={{ height: `${maxPosts > 0 ? Math.max((m.count / maxPosts) * 100, m.count > 0 ? 8 : 0) : 0}%` }}
                  />
                </div>
                <span className="admin-bar-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content split donut */}
        <div className="admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <h2 className="admin-chart-title">Contenido</h2>
              <p className="admin-chart-sub">Free vs Premium</p>
            </div>
          </div>
          <div className="admin-donut-wrap">
            <div className="admin-donut-ring">
              <Donut pct={premiumPct} color="var(--accent-orange)" />
              <span className="admin-donut-pct">{Math.round(premiumPct * 100)}%</span>
            </div>
            <div className="admin-donut-legend">
              <div className="admin-donut-row">
                <span className="admin-donut-dot" style={{ background: "var(--accent-orange)" }} />
                <span>Premium</span>
                <strong>{premiumPosts}</strong>
              </div>
              <div className="admin-donut-row">
                <span className="admin-donut-dot" style={{ background: "#60a5fa" }} />
                <span>Free</span>
                <strong>{freePosts}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: top posts + recent activity */}
      <div className="admin-bottom-row">
        {/* Top posts by reads */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">
              <Icon name="eye" size={16} />
              Artículos más leídos
            </h2>
          </div>
          {topPosts.length === 0 ? (
            <p className="admin-empty">Sin datos de lectura todavía</p>
          ) : (
            <div className="admin-top-posts">
              {topPosts.map((p, i) => (
                <div key={p.slug} className="admin-top-post-row">
                  <span className="admin-top-post-rank">{i + 1}</span>
                  <span className="admin-top-post-title">{p.title}</span>
                  <span className="admin-top-post-reads">{p.count} lecturas</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="admin-card">
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
            {(recentComments ?? []).slice(0, 3).map((c: any) => (
              <div key={c.id} className="admin-activity-item">
                <div className={`admin-activity-dot ${c.approved ? "comment" : "comment-pending"}`} />
                <div className="admin-activity-body">
                  <span className="admin-activity-text">
                    <strong>{c.profiles?.full_name ?? "Usuario"}</strong> comentó en <em>{c.posts?.title ?? "—"}</em>
                  </span>
                  <span className="admin-activity-meta">
                    {!c.approved && <span className="admin-activity-badge">Pendiente</span>}
                    · {new Date(c.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">
              <Icon name="spark" size={16} />
              Acciones rápidas
            </h2>
          </div>
          <div className="admin-quick-actions">
            <Link href="/admin/posts/new" className="admin-quick-action">
              <span className="admin-quick-action-icon"><Icon name="pen" size={16} /></span>
              <span>Nueva entrada</span>
            </Link>
            <Link href="/admin/categories" className="admin-quick-action">
              <span className="admin-quick-action-icon"><Icon name="folder" size={16} /></span>
              <span>Categorías</span>
            </Link>
            <Link href="/admin/comments" className="admin-quick-action">
              <span className="admin-quick-action-icon"><Icon name="chat" size={16} /></span>
              <span>Comentarios</span>
              {(commentsCount ?? 0) > 0 && (
                <span className="admin-quick-action-badge">{commentsCount}</span>
              )}
            </Link>
            <Link href="/admin/users" className="admin-quick-action">
              <span className="admin-quick-action-icon"><Icon name="users" size={16} /></span>
              <span>Usuarios</span>
            </Link>
            <Link href="/admin/posts" className="admin-quick-action">
              <span className="admin-quick-action-icon"><Icon name="list" size={16} /></span>
              <span>Todas las entradas</span>
            </Link>
            <Link href="/" target="_blank" className="admin-quick-action">
              <span className="admin-quick-action-icon"><Icon name="globe" size={16} /></span>
              <span>Ver web</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
