"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BADGE_DEFS } from "@/components/Badges";

type BadgeDef = (typeof BADGE_DEFS)[number];

function Popup({ badge, onClose }: { badge: BadgeDef; onClose: () => void }) {
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

export default function BadgeNotifier() {
  const [queue, setQueue] = useState<BadgeDef[]>([]);
  const [current, setCurrent] = useState<BadgeDef | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setCurrent(null);
    setQueue((q) => {
      const next = q.slice(1);
      if (next.length > 0) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { setCurrent(next[0]); timer.current = null; }, 300);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    function onBadge(e: Event) {
      const ids: string[] = (e as CustomEvent).detail.ids;
      const badges = ids
        .map((id) => BADGE_DEFS.find((b) => b.id === id))
        .filter(Boolean) as BadgeDef[];

      if (badges.length === 0) return;
      setQueue((q) => {
        const combined = [...q, ...badges];
        if (!current && q.length === 0) {
          setCurrent(combined[0]);
          return combined.slice(1);
        }
        return combined;
      });
    }

    window.addEventListener("badge-unlocked", onBadge);
    return () => {
      window.removeEventListener("badge-unlocked", onBadge);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [current]);

  if (!current) return null;
  return <Popup badge={current} onClose={dismiss} />;
}
