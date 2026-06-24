"use client";

import React, { useEffect, useState, useCallback } from "react";

/* ─── Icons ──────────────────────────────────────────────── */

function SeedlingIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 12C12 12 7 10 5 6c4 0 7 2 7 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 12C12 12 17 10 19 6c-4 0-7 2-7 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function BookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function BooksIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.5 2H14v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 6h4l2 14h-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function TrophyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4H4v4a5 5 0 0 0 3 4.58M17 4h3v4a5 5 0 0 1-3 4.58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function FireIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C9 6 7 8.5 7 11.5a5 5 0 0 0 10 0C17 8.5 15 6 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 22c-1.5 0-3-1-3-3 0-1.5 1-2.5 3-4 2 1.5 3 2.5 3 4 0 2-1.5 3-3 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function LightningIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function DiamondIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h12l4 6-10 12L2 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 9h20M12 3l4 6-4 12-4-12 4-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function BookmarkIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function CompassIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function StarIcon({ size = 24, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── Badge definitions ──────────────────────────────────── */

interface BadgeDef {
  id: string;
  label: string;
  condition: string;
  reward?: string;
  icon: React.ReactNode;
  bigIcon: React.ReactNode;
  special?: boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-read",
    label: "Primer paso",
    condition: "Lee tu primer artículo de la academia",
    icon: <SeedlingIcon />,
    bigIcon: <SeedlingIcon size={48} />,
  },
  {
    id: "reader",
    label: "Lector",
    condition: "Completa 5 artículos leídos",
    icon: <BookIcon />,
    bigIcon: <BookIcon size={48} />,
  },
  {
    id: "scholar",
    label: "Estudioso",
    condition: "Alcanza 10 artículos leídos",
    icon: <BooksIcon />,
    bigIcon: <BooksIcon size={48} />,
  },
  {
    id: "streak3",
    label: "Constante",
    condition: "Entra 3 días seguidos a la academia",
    icon: <FireIcon />,
    bigIcon: <FireIcon size={48} />,
  },
  {
    id: "streak7",
    label: "Dedicado",
    condition: "Mantén una racha de 7 días consecutivos",
    icon: <LightningIcon />,
    bigIcon: <LightningIcon size={48} />,
  },
  {
    id: "streak30",
    label: "Imparable",
    condition: "Consigue 30 días consecutivos en la academia",
    reward: "Tu perfil lucirá una ★ dorada visible en todos tus comentarios",
    icon: <DiamondIcon />,
    bigIcon: <DiamondIcon size={48} />,
    special: true,
  },
  {
    id: "collector",
    label: "Coleccionista",
    condition: "Guarda 5 artículos en tu lista",
    icon: <BookmarkIcon />,
    bigIcon: <BookmarkIcon size={48} />,
  },
  {
    id: "explorer",
    label: "Explorador",
    condition: "Lee artículos de al menos 3 categorías distintas",
    icon: <CompassIcon />,
    bigIcon: <CompassIcon size={48} />,
  },
];

/* ─── Celebration popup ──────────────────────────────────── */

function BadgePopup({ badge, onClose }: { badge: BadgeDef; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

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
        <button className="badge-popup-close" onClick={onClose}>Genial ✓</button>
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
      <StarIcon size={14} filled />
    </span>
  );
}

export default function Badges({ initialStreak, initialMax, initialFeatured, initialEarned }: Props) {
  const [streak, setStreak]       = useState(initialStreak);
  const [maxStreak, setMaxStreak] = useState(initialMax);
  const [featured, setFeatured]   = useState(initialFeatured);
  const [earned, setEarned]       = useState<Set<string>>(new Set(initialEarned));
  const [queue, setQueue]         = useState<BadgeDef[]>([]);
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

  return (
    <>
      {current && <BadgePopup badge={current} onClose={dismissCurrent} />}

      <div className="badges-section">
        {/* Streak bar */}
        <div className="streak-bar">
          <div className="streak-info">
            <span className="streak-flame">🔥</span>
            <div>
              <span className="streak-value">{streak}</span>
              <span className="streak-label">día{streak !== 1 ? "s" : ""} de racha actual</span>
            </div>
            {featured && (
              <span className="streak-featured-badge">
                <StarIcon size={12} filled /> Destacado
              </span>
            )}
          </div>
          <span className="streak-max">Mejor racha: {maxStreak} días</span>
        </div>

        {/* Badges */}
        <div className="badges-header">
          <span className="badges-title">Logros</span>
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
                <div className="badge-icon">
                  {badge.icon}
                  {badge.special && !unlocked && <span className="badge-special-star">★</span>}
                </div>
                <span className="badge-label">{badge.label}</span>
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
      </div>
    </>
  );
}
