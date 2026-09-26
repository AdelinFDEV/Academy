"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { BADGE_DEFS, GUIDE_BADGE_DEFS } from "@/lib/logros";

/**
 * Lo que el aviso necesita para pintarse. Un logro de `logros.tsx` ya lo cumple;
 * otras partes de la web (los hitos del diario) mandan el suyo completo en
 * `detail.notices`, con su propio encabezado y su enlace.
 */
export interface UnlockNotice {
  id: string;
  label: string;
  condition: string;
  reward?: string;
  bigIcon: React.ReactNode;
  special?: boolean;
  eyebrow?: string;
  link?: { href: string; label: string };
}

export interface UnlockEventDetail {
  ids?: string[];
  notices?: UnlockNotice[];
}

const ALL_BADGE_DEFS: UnlockNotice[] = [...BADGE_DEFS, ...GUIDE_BADGE_DEFS];

function Popup({ badge, onClose }: { badge: UnlockNotice; onClose: () => void }) {
  const link = badge.link ?? { href: "/logros", label: "Ver Logros" };
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
        <p className="badge-popup-eyebrow">{badge.eyebrow ?? "¡Logro desbloqueado!"}</p>
        <h3 className="badge-popup-title">{badge.label}</h3>
        <p className="badge-popup-desc">{badge.condition}</p>
        {badge.reward && (
          <p className="badge-popup-reward">
            <span>★</span> {badge.reward}
          </p>
        )}
        <button className="badge-popup-close" onClick={onClose}>Genial ✓</button>
        {/* Un enlace de solo hash tiene que ser <a>: Link no dispara "hashchange". */}
        {link.href.startsWith("#") ? (
          <a href={link.href} className="badge-popup-viewall" onClick={onClose}>{link.label}</a>
        ) : (
          <Link href={link.href} className="badge-popup-viewall" onClick={onClose}>{link.label}</Link>
        )}
      </div>
    </div>
  );
}

export default function BadgeNotifier() {
  const [, setQueue] = useState<UnlockNotice[]>([]);
  const [current, setCurrent] = useState<UnlockNotice | null>(null);
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
      const { ids = [], notices = [] } = (e as CustomEvent<UnlockEventDetail>).detail;
      const badges = [
        ...ids.map((id) => ALL_BADGE_DEFS.find((b) => b.id === id)).filter((b): b is UnlockNotice => !!b),
        ...notices,
      ];

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
