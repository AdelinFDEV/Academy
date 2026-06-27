import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mis Estadísticas | AdelinBTC Academy",
  description: "Analiza tu rendimiento como trader con datos reales de tu diario.",
};

type TradeResult = "win" | "loss" | "breakeven";

interface Trade {
  id: string;
  pair: string;
  direction: "long" | "short";
  pnl: number;
  result: TradeResult;
  date: string;
}

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  if (role !== "admin") redirect("/dashboard");

  const { data: trades } = await supabase
    .from("trades")
    .select("id, pair, direction, pnl, result, date")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const all: Trade[] = trades ?? [];
  const total = all.length;
  const wins = all.filter((t) => t.result === "win").length;
  const losses = all.filter((t) => t.result === "loss").length;
  const breakevens = all.filter((t) => t.result === "breakeven").length;
  const winRate = pct(wins, total);
  const totalPnl = all.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const bestTrade = total > 0 ? all.reduce((best, t) => t.pnl > best.pnl ? t : best, all[0]) : null;
  const worstTrade = total > 0 ? all.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, all[0]) : null;
  const avgPnl = total > 0 ? totalPnl / total : 0;

  // Best current win streak
  let maxStreak = 0, curStreak = 0;
  for (const t of all) {
    if (t.result === "win") { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else curStreak = 0;
  }

  // Pair breakdown
  const pairMap: Record<string, { count: number; pnl: number }> = {};
  for (const t of all) {
    if (!pairMap[t.pair]) pairMap[t.pair] = { count: 0, pnl: 0 };
    pairMap[t.pair].count++;
    pairMap[t.pair].pnl += t.pnl ?? 0;
  }
  const pairStats = Object.entries(pairMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  // Long vs Short
  const longs = all.filter((t) => t.direction === "long").length;
  const shorts = all.filter((t) => t.direction === "short").length;

  const fmtPnl = (n: number) =>
    `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main className="dashboard-main">
      <div className="dashboard-header">
        <h1>Mis Estadísticas</h1>
        <p>Basado en {total} operación{total !== 1 ? "es" : ""} registradas en tu diario de trading.</p>
      </div>

      {total === 0 ? (
        <div className="stats-empty">
          <svg width="40" height="40" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="9" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="6.5" y="5" width="3" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="11" y="2" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <p>Aún no tienes operaciones registradas.</p>
          <a href="/dashboard/trading" className="btn-primary btn-small">Ir al Diario de Trading →</a>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{total}</span>
              <span className="stat-label">Operaciones</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: winRate >= 50 ? "var(--accent-orange)" : "#ef4444" }}>
                {winRate}%
              </span>
              <span className="stat-label">Win rate</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: totalPnl >= 0 ? "var(--accent-orange)" : "#ef4444" }}>
                {fmtPnl(totalPnl)}
              </span>
              <span className="stat-label">PnL total</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{maxStreak}</span>
              <span className="stat-label">Racha de wins</span>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="estads-secondary">
            <div className="estads-row">
              <div className="estads-item">
                <span className="estads-label">Wins / Losses / BE</span>
                <div className="estads-bar-wrap">
                  <div className="estads-bar">
                    <div className="estads-bar-win" style={{ width: `${pct(wins, total)}%` }} title={`${wins} wins`} />
                    <div className="estads-bar-loss" style={{ width: `${pct(losses, total)}%` }} title={`${losses} losses`} />
                    <div className="estads-bar-be" style={{ width: `${pct(breakevens, total)}%` }} title={`${breakevens} BE`} />
                  </div>
                  <div className="estads-bar-legend">
                    <span className="win">{wins} W</span>
                    <span className="loss">{losses} L</span>
                    {breakevens > 0 && <span className="be">{breakevens} BE</span>}
                  </div>
                </div>
              </div>

              <div className="estads-item">
                <span className="estads-label">Long vs Short</span>
                <div className="estads-bar-wrap">
                  <div className="estads-bar">
                    <div className="estads-bar-win" style={{ width: `${pct(longs, total)}%` }} />
                    <div className="estads-bar-loss" style={{ width: `${pct(shorts, total)}%` }} />
                  </div>
                  <div className="estads-bar-legend">
                    <span className="win">{longs} Long</span>
                    <span className="loss">{shorts} Short</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="estads-row">
              <div className="estads-item">
                <span className="estads-label">Mejor operación</span>
                {bestTrade && (
                  <div className="estads-highlight positive">
                    <span className="estads-pair">{bestTrade.pair}</span>
                    <span className="estads-pnl">{fmtPnl(bestTrade.pnl)}</span>
                  </div>
                )}
              </div>
              <div className="estads-item">
                <span className="estads-label">Peor operación</span>
                {worstTrade && (
                  <div className="estads-highlight negative">
                    <span className="estads-pair">{worstTrade.pair}</span>
                    <span className="estads-pnl">{fmtPnl(worstTrade.pnl)}</span>
                  </div>
                )}
              </div>
              <div className="estads-item">
                <span className="estads-label">PnL promedio</span>
                <div className={`estads-highlight ${avgPnl >= 0 ? "positive" : "negative"}`}>
                  <span className="estads-pnl">{fmtPnl(avgPnl)} por op.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pair breakdown */}
          {pairStats.length > 0 && (
            <div className="section">
              <h2 className="section-title">Desglose por par</h2>
              <div className="estads-pairs">
                {pairStats.map(([pair, s]) => (
                  <div key={pair} className="estads-pair-row">
                    <span className="estads-pair-name">{pair}</span>
                    <span className="estads-pair-count">{s.count} op.</span>
                    <span className={`estads-pair-pnl ${s.pnl >= 0 ? "positive" : "negative"}`}>
                      {fmtPnl(s.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
