"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { ArrowLeft, Calendar, TrendingDown, Info, ExternalLink, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { Token, getUpcomingUnlocks, UnlockEvent } from "../tokenData";

const TODAY = new Date();

function fmtTokens(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("es-ES");
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - TODAY.getTime()) / 86_400_000);
}

function pct(tokens: number, total: number) {
  return ((tokens / total) * 100).toFixed(3) + "%";
}

interface Props {
  token: Token;
  isPremium: boolean;
}

export default function TokenDetailClient({ token, isPremium }: Props) {
  const [showAll, setShowAll] = useState(false);

  const upcomingEvents = useMemo(() =>
    getUpcomingUnlocks(token, TODAY, 18).filter(e => new Date(e.date) >= TODAY),
    [token]
  );

  const pastEvents = useMemo(() =>
    getUpcomingUnlocks(token, new Date("2020-01-01"), 120)
      .filter(e => new Date(e.date) < TODAY)
      .slice(-6)
      .reverse(),
    [token]
  );

  // Monthly chart data — next 12 months
  const chartData = useMemo(() => {
    const months: Record<string, Record<string, string | number>> = {};
    const allFuture = getUpcomingUnlocks(token, TODAY, 13).filter(e => new Date(e.date) >= TODAY);

    for (const e of allFuture) {
      const key = fmtMonth(e.date);
      if (!months[key]) months[key] = { month: key };
      months[key][e.category] = ((months[key][e.category] as number) ?? 0) + e.tokens / 1_000_000;
    }
    return Object.values(months).slice(0, 12);
  }, [token]);

  const categories = [...new Set(token.schedules.map(s => s.category))];
  const categoryColors: Record<string, string> = {};
  token.schedules.forEach(s => { categoryColors[s.category] = s.color; });

  // Next unlock
  const nextEvent = upcomingEvents[0];
  const daysNext = nextEvent ? daysUntil(nextEvent.date) : null;

  // Vesting progress
  const tgeDate = new Date(token.tge);
  const vestEnd = new Date(token.vestingEnd);
  const totalDays = (vestEnd.getTime() - tgeDate.getTime()) / 86_400_000;
  const elapsed = (TODAY.getTime() - tgeDate.getTime()) / 86_400_000;
  const progress = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);

  const visibleEvents = isPremium ? upcomingEvents : upcomingEvents.slice(0, 3);
  const lockedCount = upcomingEvents.length - visibleEvents.length;

  return (
    <div className="lib-detail-wrap">

      {/* ── Back ── */}
      <Link href="/herramientas/liberaciones" className="lib-back">
        <ArrowLeft size={14} />
        Volver a Liberaciones
      </Link>

      {/* ── Token Hero ── */}
      <div className="lib-detail-hero" style={{ background: token.bgGradient }}>
        <div className="lib-detail-hero-inner">
          <div className="lib-detail-token-head">
            <div className="lib-detail-dot" style={{ background: token.color, boxShadow: `0 0 24px ${token.color}60` }} />
            <div>
              <div className="lib-detail-symbol" style={{ color: token.color }}>{token.symbol}</div>
              <div className="lib-detail-name">{token.name}</div>
              <div className="lib-detail-cat-badge">{token.category}</div>
            </div>
          </div>
          <p className="lib-detail-desc">{token.description}</p>

          {/* Key stats */}
          <div className="lib-detail-stats">
            <div className="lib-detail-stat">
              <span className="lib-detail-stat-label">Supply total</span>
              <span className="lib-detail-stat-val">{fmtTokens(token.totalSupply)}</span>
            </div>
            <div className="lib-detail-stat">
              <span className="lib-detail-stat-label">TGE</span>
              <span className="lib-detail-stat-val">{fmtDate(token.tge)}</span>
            </div>
            <div className="lib-detail-stat">
              <span className="lib-detail-stat-label">Fin del vesting</span>
              <span className="lib-detail-stat-val">{fmtDate(token.vestingEnd)}</span>
            </div>
            <div className="lib-detail-stat">
              <span className="lib-detail-stat-label">Próximo unlock</span>
              <span className="lib-detail-stat-val" style={{ color: token.color }}>
                {nextEvent ? (daysNext === 0 ? "Hoy" : daysNext === 1 ? "Mañana" : `en ${daysNext} días`) : "Completado"}
              </span>
            </div>
          </div>

          {/* Vesting progress */}
          <div className="lib-vesting-progress">
            <div className="lib-vesting-progress-head">
              <span>Progreso del vesting</span>
              <span style={{ color: token.color }}>{progress.toFixed(1)}%</span>
            </div>
            <div className="lib-vesting-track">
              <div className="lib-vesting-fill" style={{ width: `${progress}%`, background: token.color }} />
            </div>
            <div className="lib-vesting-labels">
              <span>TGE {fmtDate(token.tge)}</span>
              <span>Fin {fmtDate(token.vestingEnd)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Risk Alert ── */}
      <div className="lib-risk-alert">
        <TrendingDown size={16} />
        <p><strong>Punto clave:</strong> {token.keyRisk}</p>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="lib-detail-grid">

        {/* Allocation Chart */}
        <div className="lib-detail-card">
          <h2 className="lib-detail-card-title">
            <Calendar size={16} />
            Distribución del Supply
          </h2>
          <div className="lib-alloc-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={token.allocations}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="pct"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {token.allocations.map((a, i) => (
                    <Cell key={i} fill={a.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, "Porcentaje"]}
                  contentStyle={{ background: "#0f2040", border: "1px solid rgba(240,244,255,0.1)", borderRadius: 8, color: "#dce8f8", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="lib-alloc-legend">
              {token.allocations.map((a, i) => (
                <div key={i} className="lib-alloc-item">
                  <div className="lib-alloc-dot" style={{ background: a.color }} />
                  <div className="lib-alloc-info">
                    <span className="lib-alloc-name">{a.name}</span>
                    <span className="lib-alloc-tokens">{a.pct}% · {fmtTokens(a.tokens)}</span>
                    <span className="lib-alloc-schedule">{a.schedule}</span>
                  </div>
                  {a.isActive && <span className="lib-alloc-active">activo</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Unlock Chart */}
        <div className="lib-detail-card">
          <h2 className="lib-detail-card-title">
            <TrendingDown size={16} />
            Unlocks mensuales (próximos 12 meses)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,244,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#b0c4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#b0c4d8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}B` : `${v}M`} />
                <Tooltip
                  formatter={(value, name) => [`${Number(value).toFixed(1)}M ${token.symbol}`, String(name)]}
                  contentStyle={{ background: "#0f2040", border: "1px solid rgba(240,244,255,0.1)", borderRadius: 8, color: "#dce8f8", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#b0c4d8" }} />
                {categories.map(cat => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColors[cat] ?? token.color} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="lib-empty-chart">El vesting de este token ha finalizado</div>
          )}
        </div>

      </div>

      {/* ── Upcoming Unlock Events ── */}
      <div className="lib-detail-card lib-detail-card--full">
        <h2 className="lib-detail-card-title">
          <Calendar size={16} />
          Próximas liberaciones
        </h2>

        {visibleEvents.length === 0 ? (
          <div className="lib-empty-chart">No hay unlocks futuros registrados</div>
        ) : (
          <div className="lib-events-list">
            {visibleEvents.map((event, i) => {
              const days = daysUntil(event.date);
              const isNext = i === 0;
              return (
                <div key={`${event.date}-${event.category}`} className={`lib-event-row${isNext ? " lib-event-row--next" : ""}`}>
                  <div className="lib-event-date">
                    <span className="lib-event-date-main">{fmtDate(event.date)}</span>
                    <span className={`lib-event-countdown${days <= 7 ? " urgent" : days <= 14 ? " soon" : ""}`}>
                      {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `en ${days}d`}
                    </span>
                  </div>
                  <div className="lib-event-cat">
                    <div className="lib-event-dot" style={{ background: event.color }} />
                    {event.category}
                  </div>
                  <div className="lib-event-type">
                    <span className={`lib-type-badge lib-type-${event.type}`}>
                      {event.type === "cliff" ? "Cliff" : "Lineal mensual"}
                    </span>
                  </div>
                  <div className="lib-event-amount">
                    <span className="lib-event-tokens">{fmtTokens(event.tokens)} {token.symbol}</span>
                    <span className="lib-event-pct">{pct(event.tokens, token.totalSupply)} del supply</span>
                  </div>
                </div>
              );
            })}

            {/* Premium lock overlay */}
            {!isPremium && lockedCount > 0 && (
              <div className="lib-events-lock">
                <div className="lib-events-lock-inner">
                  <Lock size={20} />
                  <div className="lib-events-lock-title">+{lockedCount} liberaciones bloqueadas</div>
                  <div className="lib-events-lock-sub">Hazte Premium para ver el calendario completo de unlocks hasta {fmtDate(token.vestingEnd)}</div>
                  <Link href="/premium" className="lib-upgrade-btn">Ver planes Premium</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Historical (últimos 6 meses) ── */}
      {isPremium && pastEvents.length > 0 && (
        <div className="lib-detail-card lib-detail-card--full">
          <button className="lib-detail-card-title lib-card-toggle" onClick={() => setShowAll(v => !v)}>
            <Info size={16} />
            Últimas liberaciones ejecutadas
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAll && (
            <div className="lib-events-list lib-events-list--past">
              {pastEvents.map((event, i) => (
                <div key={i} className="lib-event-row lib-event-row--past">
                  <div className="lib-event-date">
                    <span className="lib-event-date-main">{fmtDate(event.date)}</span>
                    <span className="lib-event-countdown past">Ejecutado</span>
                  </div>
                  <div className="lib-event-cat">
                    <div className="lib-event-dot" style={{ background: event.color, opacity: 0.5 }} />
                    {event.category}
                  </div>
                  <div className="lib-event-type">
                    <span className={`lib-type-badge lib-type-${event.type}`}>{event.type === "cliff" ? "Cliff" : "Lineal mensual"}</span>
                  </div>
                  <div className="lib-event-amount">
                    <span className="lib-event-tokens">{fmtTokens(event.tokens)} {token.symbol}</span>
                    <span className="lib-event-pct">{pct(event.tokens, token.totalSupply)} del supply</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
