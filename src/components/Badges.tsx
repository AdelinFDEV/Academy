"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sprout, BookOpen, Book, Flame, Zap, Gem, Bookmark, Compass, Star } from "lucide-react";

function BlockchainBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
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
  guideSlug?: string;
  guideTitle?: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-read",
    label: "Primer paso",
    condition: "Lee tu primer artículo de la academia",
    icon: <Sprout size={24} aria-hidden="true" />,
    bigIcon: <Sprout size={48} aria-hidden="true" />,
  },
  {
    id: "reader",
    label: "Lector",
    condition: "Completa 5 artículos leídos",
    icon: <BookOpen size={24} aria-hidden="true" />,
    bigIcon: <BookOpen size={48} aria-hidden="true" />,
  },
  {
    id: "scholar",
    label: "Estudioso",
    condition: "Alcanza 10 artículos leídos",
    icon: <Book size={24} aria-hidden="true" />,
    bigIcon: <Book size={48} aria-hidden="true" />,
  },
  {
    id: "streak3",
    label: "Constante",
    condition: "Entra 3 días seguidos a la academia",
    icon: <Flame size={24} aria-hidden="true" />,
    bigIcon: <Flame size={48} aria-hidden="true" />,
  },
  {
    id: "streak7",
    label: "Dedicado",
    condition: "Mantén una racha de 7 días consecutivos",
    icon: <Zap size={24} aria-hidden="true" />,
    bigIcon: <Zap size={48} aria-hidden="true" />,
  },
  {
    id: "streak30",
    label: "Imparable",
    condition: "Consigue 30 días consecutivos en la academia",
    reward: "Tu perfil lucirá una ★ dorada visible en todos tus comentarios",
    icon: <Gem size={24} aria-hidden="true" />,
    bigIcon: <Gem size={48} aria-hidden="true" />,
    special: true,
  },
  {
    id: "collector",
    label: "Coleccionista",
    condition: "Guarda 5 artículos en tu lista",
    icon: <Bookmark size={24} aria-hidden="true" />,
    bigIcon: <Bookmark size={48} aria-hidden="true" />,
  },
  {
    id: "explorer",
    label: "Explorador",
    condition: "Lee artículos de al menos 3 categorías distintas",
    icon: <Compass size={24} aria-hidden="true" />,
    bigIcon: <Compass size={48} aria-hidden="true" />,
  },
];

export const GUIDE_BADGE_DEFS: BadgeDef[] = [
  {
    id: "guide-blockchain",
    label: "Arquitecto de Cadenas",
    condition: "Completa el quiz de ¿Qué es la Blockchain? con 5/5 respuestas correctas",
    icon: <BlockchainBadgeIcon size={24} />,
    bigIcon: <BlockchainBadgeIcon size={48} />,
    special: true,
    guideSlug: "que-es-la-blockchain",
    guideTitle: "¿Qué es la Blockchain?",
  },
];

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
      <Star size={14} fill="currentColor" aria-hidden="true" />
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
  const guideUnlockedCount = GUIDE_BADGE_DEFS.filter((b) => earned.has(b.id)).length;

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
                <Star size={12} fill="currentColor" aria-hidden="true" /> Destacado
              </span>
            )}
          </div>
          <span className="streak-max">Mejor racha: {maxStreak} días</span>
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
