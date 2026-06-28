"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { GuideMeta } from "@/lib/guides";

type SavedGuide = {
  slug: string;
  savedAt: string;
  meta: GuideMeta;
};

export default function DashboardSavedGuides({ initialGuides }: { initialGuides: SavedGuide[] }) {
  const [guides, setGuides] = useState(initialGuides);
  const [removing, setRemoving] = useState<string | null>(null);

  async function unsave(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;
    setRemoving(slug);
    setGuides((prev) => prev.filter((g) => g.slug !== slug));
    await fetch("/api/guide-saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide_slug: slug }),
    });
    setRemoving(null);
  }

  if (guides.length === 0) {
    return (
      <div className="dash-empty">
        <div className="dash-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
          </svg>
        </div>
        <p>No tienes guías guardadas aún.</p>
        <Link href="/guias" className="dash-link-orange">Explorar guías →</Link>
      </div>
    );
  }

  return (
    <div className="dash-saved-list">
      {guides.map((g) => (
        <Link key={g.slug} href={`/guias/${g.slug}`} className="dash-saved-item dash-saved-item--guide">
          <div className="dash-saved-thumb dash-saved-thumb--guide">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
            </svg>
          </div>
          <div className="dash-saved-body">
            <span className="dash-saved-cat">Guía · {g.meta.difficulty}</span>
            <h3 className="dash-saved-title">{g.meta.title}</h3>
            <div className="dash-saved-tags">
              <span className="dash-tag-read">{g.meta.sections} secciones</span>
              <span className="dash-tag-read">{g.meta.readTime}</span>
            </div>
          </div>
          <button
            className="dash-unsave-btn"
            onClick={(e) => unsave(e, g.slug)}
            disabled={removing === g.slug}
            aria-label="Quitar de guardados"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </Link>
      ))}
    </div>
  );
}
