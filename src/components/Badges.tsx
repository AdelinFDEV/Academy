"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Flame, Star, Trophy, Check } from "lucide-react";
import { BADGE_DEFS, GUIDE_BADGE_DEFS, type BadgeDef } from "@/lib/logros";


/* ─── Progress ring ──────────────────────────────────────── */

function ProgressRing({ pct }: { pct: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(pct, 100)) / 100);
  return (
    <svg className="logros-ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <defs>
        <linearGradient id="logros-ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8552" />
          <stop offset="100%" stopColor="#ff6b2b" />
        </linearGradient>
      </defs>
      <circle className="logros-ring-track" cx="42" cy="42" r={r} />
      <circle
        className="logros-ring-fill"
        cx="42"
        cy="42"
        r={r}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 42 42)"
      />
    </svg>
  );
}

/* ─── Celebration popup ──────────────────────────────────── */

function BadgePopup({ badge, onClose }: { badge: BadgeDef; onClose: () => void }) {
  return (
    <div className="badge-popup-overlay" onClick={onClose}>
      <div className="badge-popup" onClick={(e) => e.stopPropagation()}>
        <div className="badge-popup-confetti">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="confetti-dot" style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className={`badge-popup-icon${badge.special ? " special" : ""}`}>
          {badge.bigIcon}
          {badge.special && <span className="badge-popup-star">★</span>}
        </div>
        <p className="badge-popup-eyebrow">¡Logro desbloqueado!</p>
        <h3 className="badge-popup-title">{badge.label}</h3>
        <p className="badge-popup-desc">{badge.condition}</p>
        {badge.reward && (
          <p className="badge-popup-reward">
            <span>★</span> {badge.reward}
          </p>
        )}
        <button className="badge-popup-close" onClick={onClose}>
          <Check size={15} strokeWidth={3} aria-hidden="true" /> Genial
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

interface Props {
  initialStreak: number;
  initialMax: number;
  initialFeatured: boolean;
  initialEarned: string[];
}

export function FeaturedStar() {
  return (
    <span className="featured-star" title="Usuario destacado — 30 días de racha">
      <Star size={14} fill="currentColor" aria-hidden="true" />
    </span>
  );
}

export default function Badges({ initialStreak, initialMax, initialFeatured, initialEarned }: Props) {
  const [streak, setStreak]       = useState(initialStreak);
  const [maxStreak, setMaxStreak] = useState(initialMax);
  const [featured, setFeatured]   = useState(initialFeatured);
  const [earned, setEarned]       = useState<Set<string>>(new Set(initialEarned));
  const [, setQueue]              = useState<BadgeDef[]>([]);
  const [current, setCurrent]     = useState<BadgeDef | null>(null);

  const nextTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissCurrent = useCallback(() => {
    setCurrent(null);
    setQueue((q) => {
      const next = q.slice(1);
      if (next.length > 0) {
        if (nextTimer.current) clearTimeout(nextTimer.current);
        nextTimer.current = setTimeout(() => {
          setCurrent(next[0]);
          nextTimer.current = null;
        }, 300);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // Update streak first, then check badges
    fetch("/api/streak", { method: "POST" })
      .then((r) => r.json())
      .then((streakData) => {
        if (streakData.current_streak !== undefined) {
          setStreak(streakData.current_streak);
          setMaxStreak(streakData.max_streak);
          setFeatured(streakData.is_featured);
        }
        return fetch("/api/badges", { method: "POST" });
      })
      .then((r) => r.json())
      .then((data) => {
        if (!data.earned) return;
        setEarned(new Set(data.earned));
        if (data.newlyUnlocked?.length > 0) {
          const newBadges = data.newlyUnlocked
            .map((id: string) => BADGE_DEFS.find((b) => b.id === id))
            .filter(Boolean) as BadgeDef[];
          setQueue(newBadges);
          setCurrent(newBadges[0]);
        }
      });

    return () => {
      if (nextTimer.current) clearTimeout(nextTimer.current);
    };
  }, []);

  const unlockedCount = BADGE_DEFS.filter((b) => earned.has(b.id)).length;
  const guideUnlockedCount = GUIDE_BADGE_DEFS.filter((b) => earned.has(b.id)).length;

  const totalBadges   = BADGE_DEFS.length + GUIDE_BADGE_DEFS.length;
  const totalUnlocked = unlockedCount + guideUnlockedCount;
  const totalPct      = totalBadges > 0 ? (totalUnlocked / totalBadges) * 100 : 0;
  const activityPct   = BADGE_DEFS.length > 0 ? (unlockedCount / BADGE_DEFS.length) * 100 : 0;
  const guidePct      = GUIDE_BADGE_DEFS.length > 0 ? (guideUnlockedCount / GUIDE_BADGE_DEFS.length) * 100 : 0;

  return (
    <>
      {current && <BadgePopup badge={current} onClose={dismissCurrent} />}

      <div className="badges-section">
        {/* Overview: progreso global */}
        <div className="logros-overview">
          <div className="logros-ring-wrap">
            <ProgressRing pct={totalPct} />
            <div className="logros-ring-center">
              <span className="logros-ring-num">{totalUnlocked}</span>
              <span className="logros-ring-den">de {totalBadges}</span>
            </div>
          </div>
          <div className="logros-overview-text">
            <span className="logros-overview-eyebrow">Progreso total</span>
            <h2 className="logros-overview-title">
              {totalUnlocked === totalBadges
                ? "¡Has desbloqueado todos los logros!"
                : `${totalUnlocked} de ${totalBadges} logros desbloqueados`}
            </h2>
            <div className="logros-ov-bars">
              <div className="logros-ov-row">
                <span className="logros-ov-name">Actividad</span>
                <span className="logros-ov-track">
                  <span className="logros-ov-fill" style={{ width: `${activityPct}%` }} />
                </span>
                <span className="logros-ov-count">{unlockedCount}/{BADGE_DEFS.length}</span>
              </div>
              <div className="logros-ov-row">
                <span className="logros-ov-name">Guías</span>
                <span className="logros-ov-track">
                  <span className="logros-ov-fill" style={{ width: `${guidePct}%` }} />
                </span>
                <span className="logros-ov-count">{guideUnlockedCount}/{GUIDE_BADGE_DEFS.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak bar */}
        <div className="streak-bar">
          <div className="streak-info">
            <span className="streak-flame"><Flame size={20} aria-hidden="true" /></span>
            <div>
              <span className="streak-value">{streak}</span>
              <span className="streak-label">día{streak !== 1 ? "s" : ""} de racha actual</span>
            </div>
            {featured && (
              <span className="streak-featured-badge">
                <Star size={12} fill="currentColor" aria-hidden="true" /> Destacado
              </span>
            )}
          </div>
          <span className="streak-max">
            <Trophy size={13} aria-hidden="true" />
            Tu récord: <strong>{maxStreak}</strong> día{maxStreak !== 1 ? "s" : ""} seguidos
          </span>
        </div>

        {/* Activity badges */}
        <div className="badges-header">
          <span className="badges-title">Logros de Actividad</span>
          <span className="badges-progress">{unlockedCount} / {BADGE_DEFS.length} desbloqueados</span>
        </div>
        <div className="badges-grid">
          {BADGE_DEFS.map((badge) => {
            const unlocked = earned.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`badge-item${unlocked ? " unlocked" : " locked"}${badge.special ? " special" : ""}`}
              >
                {unlocked && (
                  <span className={`badge-unlocked-check${badge.special ? " badge-unlocked-check--gold" : ""}`} title="Logro obtenido">
                    <Check size={11} strokeWidth={3.2} aria-hidden="true" />
                  </span>
                )}
                <div className="badge-icon">
                  {badge.icon}
                  {badge.special && !unlocked && <span className="badge-special-star">★</span>}
                </div>
                <span className="badge-label">{badge.label}</span>
                {badge.special && <span className="badge-special-tag">Especial</span>}
                <div className="badge-tooltip">
                  {badge.special && <p className="badge-tooltip-special">★ Logro especial</p>}
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

        {/* Guide badges */}
        <div className="badges-header" style={{ marginTop: 36 }}>
          <span className="badges-title">Logros de Guías</span>
          <span className="badges-progress">{guideUnlockedCount} / {GUIDE_BADGE_DEFS.length} desbloqueados</span>
        </div>
        <p className="badges-guide-sub" style={{marginBottom: "20px"}}>
          Completa el quiz de cada guía con puntuación perfecta para desbloquear el logro exclusivo.
        </p>
        <div className="badges-grid">
          {GUIDE_BADGE_DEFS.map((badge) => {
            const unlocked = earned.has(badge.id);
            const content = (
              <div className={`badge-item${unlocked ? " unlocked" : " locked"}${badge.special ? " special" : ""}`}>
                {unlocked && (
                  <span className={`badge-unlocked-check${badge.special ? " badge-unlocked-check--gold" : ""}`} title="Logro obtenido">
                    <Check size={11} strokeWidth={3.2} aria-hidden="true" />
                  </span>
                )}
                <div className="badge-icon">
                  {badge.icon}
                  {badge.special && !unlocked && <span className="badge-special-star">★</span>}
                </div>
                <span className="badge-label">{badge.label}</span>
                {badge.special && <span className="badge-special-tag">Especial</span>}
                <div className="badge-tooltip">
                  {badge.special && <p className="badge-tooltip-special">★ Logro especial</p>}
                  <p className="badge-tooltip-condition">{badge.condition}</p>
                  {badge.reward && (
                    <p className="badge-tooltip-reward">
                      <span className="badge-tooltip-reward-star">★</span> {badge.reward}
                    </p>
                  )}
                </div>
              </div>
            );
            return badge.guideSlug ? (
              <Link key={badge.id} href={`/guias/${badge.guideSlug}`} style={{textDecoration: 'none', color: 'inherit', display: 'block'}}>
                {content}
              </Link>
            ) : (
              <div key={badge.id}>{content}</div>
            );
          })}
        </div>
      </div>
    </>
  );
}
