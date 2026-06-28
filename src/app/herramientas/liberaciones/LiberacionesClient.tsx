"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Lock, TrendingDown, Clock, Zap, Filter } from "lucide-react";
import { TOKENS, FREE_TOKEN_IDS, getNextUnlock, getMonthlyTotal, getUpcomingUnlocks } from "./tokenData";

const TODAY = new Date();

function fmtTokens(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("es-ES");
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - TODAY.getTime()) / 86_400_000);
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function pctOfSupply(tokens: number, total: number): string {
  return ((tokens / total) * 100).toFixed(2) + "%";
}

type Filter = "all" | "week" | "month" | "quarter";

interface Props {
  isPremium: boolean;
}

export default function LiberacionesClient({ isPremium }: Props) {
  const [filter, setFilter] = useState<Filter>("month");

  const filteredTokens = useMemo(() => {
    return TOKENS.map(token => {
      const next = getNextUnlock(token, TODAY);
      const monthly = getMonthlyTotal(token, TODAY);
      return { token, next, monthly };
    }).filter(({ next }) => {
      if (!next) return false;
      const days = daysUntil(next.date);
      if (filter === "week") return days <= 7;
      if (filter === "month") return days <= 31;
      if (filter === "quarter") return days <= 90;
      return true;
    }).sort((a, b) => {
      if (!a.next) return 1;
      if (!b.next) return -1;
      return a.next.date.localeCompare(b.next.date);
    });
  }, [filter]);

  // Global stats
  const totalMonthlyTokensByUSD = TOKENS.reduce((sum, t) => sum + getMonthlyTotal(t, TODAY), 0);
  const upcomingThisWeek = TOKENS.filter(t => {
    const n = getNextUnlock(t, TODAY);
    return n && daysUntil(n.date) <= 7;
  }).length;

  return (
    <div className="lib-wrap">

      {/* ── Hero ── */}
      <div className="lib-hero">
        <div className="lib-hero-badge">
          <Zap size={12} />
          Herramienta Premium
        </div>
        <h1 className="lib-hero-title">Liberaciones de Tokens</h1>
        <p className="lib-hero-sub">
          Anticipa la presión vendedora. Calendario de vesting en tiempo real para los proyectos más importantes del mercado cripto.
        </p>

        <div className="lib-stats-row">
          <div className="lib-stat">
            <span className="lib-stat-num">{TOKENS.length}</span>
            <span className="lib-stat-label">Tokens rastreados</span>
          </div>
          <div className="lib-stat-div" />
          <div className="lib-stat">
            <span className="lib-stat-num">{fmtTokens(totalMonthlyTokensByUSD)}</span>
            <span className="lib-stat-label">Tokens liberados este mes</span>
          </div>
          <div className="lib-stat-div" />
          <div className="lib-stat">
            <span className="lib-stat-num">{upcomingThisWeek}</span>
            <span className="lib-stat-label">Unlocks esta semana</span>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="lib-filters">
        <div className="lib-filters-label">
          <Filter size={13} />
          Próximos unlocks
        </div>
        <div className="lib-filter-btns">
          {(["week", "month", "quarter", "all"] as Filter[]).map(f => (
            <button
              key={f}
              className={`lib-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "week" ? "7 días" : f === "month" ? "30 días" : f === "quarter" ? "90 días" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Token List ── */}
      <div className="lib-list">
        {filteredTokens.map(({ token, next, monthly }, idx) => {
          const isFree = FREE_TOKEN_IDS.includes(token.id);
          const isLocked = !isPremium && !isFree;
          const days = next ? daysUntil(next.date) : 999;

          return (
            <div key={token.id} className={`lib-row${isLocked ? " lib-row--locked" : ""}`}>
              {/* Token identity */}
              <div className="lib-row-token">
                <div className="lib-token-dot" style={{ background: token.color }} />
                <div>
                  <div className="lib-token-name">
                    <span style={{ color: token.color }}>{token.symbol}</span>
                    <span className="lib-token-fullname">{token.name}</span>
                  </div>
                  <div className="lib-token-cat">{token.category}</div>
                </div>
              </div>

              {/* Next unlock */}
              <div className="lib-row-next">
                {isLocked ? (
                  <div className="lib-locked-field">
                    <Lock size={12} />
                    Premium
                  </div>
                ) : next ? (
                  <>
                    <div className="lib-next-date">{fmtDate(next.date)}</div>
                    <div className={`lib-days-badge${days <= 7 ? " lib-days-badge--urgent" : days <= 14 ? " lib-days-badge--soon" : ""}`}>
                      <Clock size={10} />
                      {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `en ${days}d`}
                    </div>
                  </>
                ) : <span className="lib-text-muted">—</span>}
              </div>

              {/* Category */}
              <div className="lib-row-category">
                {isLocked ? (
                  <div className="lib-locked-field"><Lock size={12} />Premium</div>
                ) : next ? (
                  <span className="lib-category-pill" style={{ borderColor: token.color + "40", color: token.color }}>
                    {next.category}
                  </span>
                ) : null}
              </div>

              {/* Monthly amount */}
              <div className="lib-row-amount">
                {isLocked ? (
                  <div className="lib-locked-field"><Lock size={12} />Premium</div>
                ) : (
                  <>
                    <div className="lib-amount-tokens">{fmtTokens(monthly)}</div>
                    <div className="lib-amount-pct">{pctOfSupply(monthly, token.totalSupply)} del supply</div>
                  </>
                )}
              </div>

              {/* Pressure indicator */}
              <div className="lib-row-pressure">
                {isLocked ? null : (
                  <PressureBar tokens={monthly} total={token.totalSupply} color={token.color} />
                )}
              </div>

              {/* CTA */}
              <div className="lib-row-cta">
                {isLocked ? (
                  <Link href="/premium" className="lib-btn-upgrade">
                    Desbloquear
                  </Link>
                ) : (
                  <Link href={`/herramientas/liberaciones/${token.id}`} className="lib-btn-detail">
                    Ver detalle
                    <ChevronRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {filteredTokens.length === 0 && (
          <div className="lib-empty">
            <Calendar size={32} />
            <p>No hay unlocks en el período seleccionado</p>
          </div>
        )}
      </div>

      {/* ── Premium CTA (si no es premium) ── */}
      {!isPremium && (
        <div className="lib-upgrade-banner">
          <div className="lib-upgrade-inner">
            <TrendingDown size={24} className="lib-upgrade-icon" />
            <div>
              <div className="lib-upgrade-title">Accede a todos los tokens</div>
              <div className="lib-upgrade-sub">
                {FREE_TOKEN_IDS.length} tokens disponibles en el plan gratuito. Hazte Premium para ver los {TOKENS.length - FREE_TOKEN_IDS.length} restantes con calendario completo y análisis de impacto.
              </div>
            </div>
            <Link href="/premium" className="lib-upgrade-btn">
              Hazte Premium
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

function PressureBar({ tokens, total, color }: { tokens: number; total: number; color: string }) {
  const pct = Math.min((tokens / total) * 100 * 20, 100); // scale x20 to make visible
  const level = pct > 60 ? "alta" : pct > 30 ? "media" : "baja";
  const labelColor = pct > 60 ? "#f87171" : pct > 30 ? "#fbbf24" : "#34d399";

  return (
    <div className="lib-pressure">
      <div className="lib-pressure-track">
        <div className="lib-pressure-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="lib-pressure-label" style={{ color: labelColor }}>{level}</span>
    </div>
  );
}
