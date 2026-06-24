"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const BADGE_LABELS: Record<string, { label: string; condition: string; special?: boolean; reward?: string }> = {
  "first-read":  { label: "Primer paso",    condition: "Leíste tu primer artículo de la academia" },
  "reader":      { label: "Lector",         condition: "Completaste 5 artículos leídos" },
  "scholar":     { label: "Estudioso",      condition: "Alcanzaste 10 artículos leídos" },
  "streak3":     { label: "Constante",      condition: "Entraste 3 días seguidos a la academia" },
  "streak7":     { label: "Dedicado",       condition: "Mantuviste una racha de 7 días consecutivos" },
  "streak30":    { label: "Imparable",      condition: "Conseguiste 30 días consecutivos en la academia", special: true, reward: "Tu perfil lucirá una ★ dorada visible en todos tus comentarios" },
  "collector":   { label: "Coleccionista",  condition: "Guardaste 5 artículos en tu lista" },
  "explorer":    { label: "Explorador",     condition: "Leíste artículos de al menos 3 categorías distintas" },
};

interface Notification {
  id: string;
  label: string;
  condition: string;
  special?: boolean;
  reward?: string;
}

function Popup({ n, onClose }: { n: Notification; onClose: () => void }) {
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
        <div className={`badge-popup-icon${n.special ? " special" : ""}`}>
          {n.special && <span className="badge-popup-star">★</span>}
        </div>
        <p className="badge-popup-eyebrow">¡Logro desbloqueado!</p>
        <h3 className="badge-popup-title">{n.label}</h3>
        <p className="badge-popup-desc">{n.condition}</p>
        {n.reward && (
          <p className="badge-popup-reward">
            <span>★</span> {n.reward}
          </p>
        )}
        <button className="badge-popup-close" onClick={onClose}>Genial ✓</button>
      </div>
    </div>
  );
}

export default function BadgeNotifier() {
  const [queue, setQueue] = useState<Notification[]>([]);
  const [current, setCurrent] = useState<Notification | null>(null);
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
      const notifications = ids
        .map((id) => {
          const def = BADGE_LABELS[id];
          return def ? { id, ...def } : null;
        })
        .filter(Boolean) as Notification[];

      if (notifications.length === 0) return;
      setQueue((q) => {
        const combined = [...q, ...notifications];
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
  return <Popup n={current} onClose={dismiss} />;
}
