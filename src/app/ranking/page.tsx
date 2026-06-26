import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import { Lock, Trophy, Flame, BookOpen, MessageSquare, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Ranking de Comunidad | AdelinBTC Academy",
  description: "Los miembros más activos y comprometidos de la academia.",
};

// ── Score weights ──────────────────────────────────────
// Shares excluded: no UNIQUE(user_id, post_id) constraint → spammable
// Future: forum_posts ×8, helpful_replies ×20, chat_messages ×1
const W = {
  comments: 15, // gated by moderation — highest quality signal
  reads:     3,  // genuine content consumption, capped by post count
  streak:    5,  // requires daily authentic use
  likes:     2,  // one per post max, bounded by post count
};

function score(c: number, r: number, s: number, l: number) {
  return c * W.comments + r * W.reads + s * W.streak + l * W.likes;
}

function initial(name: string | null) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function countBy(arr: { user_id: string | null }[]) {
  return arr.reduce((acc, r) => {
    if (r.user_id) acc[r.user_id] = (acc[r.user_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

const MEDAL_COLORS = ["#F5B800", "#9BA8BB", "#B87041"];
const MEDAL_LABELS = ["1º", "2º", "3º"];

// ── Coming soon screen (non-admin) ────────────────────
function LockedScreen() {
  const ghost = [
    { w: "58%", sw: "18%", score: "—" },
    { w: "42%", sw: "14%", score: "—" },
    { w: "67%", sw: "22%", score: "—" },
    { w: "35%", sw: "11%", score: "—" },
    { w: "51%", sw: "16%", score: "—" },
  ];

  return (
    <div className="ranking-locked-wrap">
      <div className="ranking-locked-blur" aria-hidden="true">
        {ghost.map((g, i) => (
          <div key={i} className="ranking-ghost-row">
            <span className="ranking-ghost-rank">{i + 1}</span>
            <span className="ranking-ghost-avatar" />
            <span className="ranking-ghost-name" style={{ width: g.w }} />
            <span className="ranking-ghost-score" style={{ width: g.sw }} />
          </div>
        ))}
      </div>
      <div className="ranking-locked-card">
        <div className="ranking-locked-icon">
          <Lock size={28} strokeWidth={1.5} />
        </div>
        <span className="ranking-locked-badge">Próximamente</span>
        <h2 className="ranking-locked-title">Ranking de Comunidad</h2>
        <p className="ranking-locked-desc">
          Estamos preparando el sistema de clasificación. Cuando esté activo, todos los miembros aparecerán aquí ordenados por su nivel de participación.
        </p>
        <div className="ranking-locked-metrics">
          <div className="ranking-locked-metric">
            <MessageSquare size={14} />
            Comentarios aprobados
          </div>
          <div className="ranking-locked-metric">
            <BookOpen size={14} />
            Artículos leídos
          </div>
          <div className="ranking-locked-metric">
            <Flame size={14} />
            Racha de lectura
          </div>
          <div className="ranking-locked-metric">
            <Heart size={14} />
            Me gustas
          </div>
        </div>
        <Link href="/dashboard" className="ranking-locked-cta">
          Ir a mi dashboard →
        </Link>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────
export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileRes = user
    ? await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
    : null;
  const userRole   = profileRes?.data?.role ?? "free";
  const isAdmin    = userRole === "admin";
  const isPremium  = isAdmin || userRole === "premium";
  const userName   = profileRes?.data?.full_name ?? user?.email?.split("@")[0] ?? "Usuario";

  const nav = (
    <nav className="blog-nav">
      <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
      <div className="blog-nav-links">
        <NavArticulosDropdown />
        <NavEducacionDropdown />
        <NavHerramientasDropdown user={!!user} isPremium={isPremium} />
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
      <BlogMobileMenu user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />
    </nav>
  );

  // ── Non-admin: coming soon ──
  if (!isAdmin) {
    return (
      <div className="blog-page">
        <div className="bg-ambient" />
        {nav}
        <main className="blog-main">
          <LockedScreen />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Admin: fetch ranking data ──
  const [
    { data: profiles },
    { data: commentRows },
    { data: likeRows },
    { data: readRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, current_streak, created_at")
      .order("created_at"),
    supabase
      .from("comments")
      .select("user_id")
      .eq("approved", true),
    supabase
      .from("post_likes")
      .select("user_id"),
    supabase
      .from("user_posts")
      .select("user_id")
      .not("read_at", "is", null),
  ]);

  const commentMap = countBy((commentRows ?? []) as { user_id: string | null }[]);
  const likeMap    = countBy((likeRows    ?? []) as { user_id: string | null }[]);
  const readMap    = countBy((readRows    ?? []) as { user_id: string | null }[]);

  type RankedUser = {
    id: string;
    name: string;
    role: string;
    streak: number;
    comments: number;
    reads: number;
    likes: number;
    score: number;
  };

  const ranked: RankedUser[] = (profiles ?? [])
    .map((p) => {
      const comments = commentMap[p.id] ?? 0;
      const reads    = readMap[p.id]    ?? 0;
      const likes    = likeMap[p.id]    ?? 0;
      const streak   = p.current_streak ?? 0;
      return {
        id:       p.id,
        name:     p.full_name ?? "Usuario",
        role:     p.role ?? "free",
        streak,
        comments,
        reads,
        likes,
        score:    score(comments, reads, streak, likes),
      };
    })
    .sort((a, b) => b.score - a.score);

  const top3   = ranked.slice(0, 3);
  const rest   = ranked.slice(3);
  const podium = top3.length >= 2 ? [top3[1], top3[0], top3[2]] : top3;

  const memberSince = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { month: "short", year: "numeric" });

  const totalUsers    = ranked.length;
  const activeUsers   = ranked.filter((u) => u.score > 0).length;
  const premiumUsers  = ranked.filter((u) => u.role === "premium").length;

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      {nav}

      <main className="blog-main ranking-page">

        {/* Header */}
        <div className="ranking-header">
          <div className="ranking-header-left">
            <div className="ranking-header-icon">
              <Trophy size={22} strokeWidth={1.5} />
            </div>
            <div>
              <div className="ranking-header-supra">
                <span className="ranking-admin-tag">Solo visible para admin</span>
              </div>
              <h1 className="ranking-title">Ranking de Comunidad</h1>
              <p className="ranking-subtitle">
                Clasificación de miembros por nivel de participación activa.
              </p>
            </div>
          </div>
          <div className="ranking-header-kpis">
            <div className="ranking-kpi">
              <span className="ranking-kpi-v">{totalUsers}</span>
              <span className="ranking-kpi-l">Miembros</span>
            </div>
            <div className="ranking-kpi">
              <span className="ranking-kpi-v">{activeUsers}</span>
              <span className="ranking-kpi-l">Activos</span>
            </div>
            <div className="ranking-kpi">
              <span className="ranking-kpi-v" style={{ color: "var(--accent-orange)" }}>{premiumUsers}</span>
              <span className="ranking-kpi-l">Premium</span>
            </div>
          </div>
        </div>

        {/* Score legend */}
        <div className="ranking-legend">
          <span className="ranking-legend-label">Puntuación</span>
          <div className="ranking-legend-items">
            <span className="ranking-legend-item">
              <MessageSquare size={12} />
              Comentarios ×{W.comments}
            </span>
            <span className="ranking-legend-sep" />
            <span className="ranking-legend-item">
              <BookOpen size={12} />
              Lecturas ×{W.reads}
            </span>
            <span className="ranking-legend-sep" />
            <span className="ranking-legend-item">
              <Flame size={12} />
              Racha ×{W.streak}
            </span>
            <span className="ranking-legend-sep" />
            <span className="ranking-legend-item">
              <Heart size={12} />
              Me gustas ×{W.likes}
            </span>
          </div>
        </div>

        {ranked.length === 0 ? (
          <div className="ranking-empty">
            <p>Aún no hay datos de actividad suficientes para generar el ranking.</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div className="ranking-podium">
                {podium.map((u, displayIdx) => {
                  if (!u) return null;
                  const trueRank = top3.indexOf(u); // 0=gold,1=silver,2=bronze
                  const color    = MEDAL_COLORS[trueRank] ?? "#9BA8BB";
                  const label    = MEDAL_LABELS[trueRank] ?? `${trueRank + 1}º`;
                  const isFirst  = trueRank === 0;
                  return (
                    <div
                      key={u.id}
                      className={`ranking-podium-slot${isFirst ? " ranking-podium-slot--first" : ""}`}
                    >
                      <div className="ranking-podium-inner">
                        <div className="ranking-podium-medal" style={{ borderColor: color, color }}>
                          {label}
                        </div>
                        <div className="ranking-podium-avatar" style={{ background: `${color}18`, color }}>
                          {initial(u.name)}
                        </div>
                        <span className="ranking-podium-name">{u.name}</span>
                        {u.role !== "free" && (
                          <span className={`ranking-role-badge ranking-role-badge--${u.role}`}>{u.role}</span>
                        )}
                        <span className="ranking-podium-score" style={{ color }}>
                          {u.score.toLocaleString("es-ES")} pts
                        </span>
                        <div className="ranking-podium-stats">
                          <span title="Comentarios"><MessageSquare size={11} />{u.comments}</span>
                          <span title="Lecturas"><BookOpen size={11} />{u.reads}</span>
                          <span title="Racha"><Flame size={11} />{u.streak}</span>
                          <span title="Me gustas"><Heart size={11} />{u.likes}</span>
                        </div>
                      </div>
                      <div className="ranking-podium-pedestal" style={{ background: `${color}22`, borderColor: `${color}44` }}>
                        <span style={{ color }}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th className="ranking-th ranking-th--rank">#</th>
                    <th className="ranking-th">Miembro</th>
                    <th className="ranking-th ranking-th--num">
                      <MessageSquare size={12} aria-hidden="true" />
                      Comentarios
                    </th>
                    <th className="ranking-th ranking-th--num">
                      <BookOpen size={12} aria-hidden="true" />
                      Lecturas
                    </th>
                    <th className="ranking-th ranking-th--num">
                      <Flame size={12} aria-hidden="true" />
                      Racha
                    </th>
                    <th className="ranking-th ranking-th--num">
                      <Heart size={12} aria-hidden="true" />
                      Me gustas
                    </th>
                    <th className="ranking-th ranking-th--score">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((u, i) => {
                    const rank  = i + 1;
                    const color = rank <= 3 ? MEDAL_COLORS[rank - 1] : undefined;
                    return (
                      <tr key={u.id} className={`ranking-row${rank <= 3 ? " ranking-row--top" : ""}${u.score === 0 ? " ranking-row--zero" : ""}`}>
                        <td className="ranking-td ranking-td--rank">
                          <span className="ranking-rank-num" style={color ? { color } : undefined}>
                            {rank}
                          </span>
                        </td>
                        <td className="ranking-td">
                          <div className="ranking-user-cell">
                            <div className="ranking-avatar" style={color ? { borderColor: color, color, background: `${color}14` } : undefined}>
                              {initial(u.name)}
                            </div>
                            <div className="ranking-user-info">
                              <span className="ranking-user-name">{u.name}</span>
                              {u.role !== "free" && (
                                <span className={`ranking-role-badge ranking-role-badge--${u.role}`}>{u.role}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="ranking-td ranking-td--num">
                          <span className={u.comments > 0 ? "ranking-stat--active" : "ranking-stat--zero"}>{u.comments}</span>
                        </td>
                        <td className="ranking-td ranking-td--num">
                          <span className={u.reads > 0 ? "ranking-stat--active" : "ranking-stat--zero"}>{u.reads}</span>
                        </td>
                        <td className="ranking-td ranking-td--num">
                          <span className={u.streak > 0 ? "ranking-stat--active" : "ranking-stat--zero"}>{u.streak > 0 ? `${u.streak}d` : "—"}</span>
                        </td>
                        <td className="ranking-td ranking-td--num">
                          <span className={u.likes > 0 ? "ranking-stat--active" : "ranking-stat--zero"}>{u.likes}</span>
                        </td>
                        <td className="ranking-td ranking-td--score">
                          <span className="ranking-score" style={color ? { color } : undefined}>
                            {u.score > 0 ? u.score.toLocaleString("es-ES") : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Future metrics note */}
            <div className="ranking-future-note">
              <span className="ranking-future-note-label">Métricas planificadas</span>
              <span>Cuando el foro esté activo se añadirán: Posts del foro (×8 pts), Respuestas marcadas útiles (×20 pts), Mensajes en chat (×1 pt).</span>
              <span className="ranking-future-note-warn">Compartidos excluidos del score — la tabla <code>post_shares</code> no tiene restricción UNIQUE(user_id, post_id), por lo que es gameable.</span>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
