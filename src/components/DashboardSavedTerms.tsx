"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Icon from "@/components/Icon";

type SavedTerm = {
  term: string;
  definition: string;
  category: string;
};

export default function DashboardSavedTerms({
  initialTerms,
}: {
  initialTerms: SavedTerm[];
}) {
  const [terms, setTerms] = useState(initialTerms);
  const [removing, setRemoving] = useState<string | null>(null);

  async function unsave(t: SavedTerm) {
    if (removing) return;
    setRemoving(t.term);
    setTerms((prev) => prev.filter((x) => x.term !== t.term));
    await fetch("/api/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: t.term, definition: t.definition, category: t.category }),
    });
    setRemoving(null);
  }

  if (terms.length === 0) {
    return (
      <div className="dash-empty">
        <div className="dash-empty-icon"><Icon name="book" size={22} /></div>
        <p>No tienes términos guardados aún.</p>
        <Link href="/glosario" className="dash-link-orange">Explorar el diccionario →</Link>
      </div>
    );
  }

  return (
    <div className="dash-terms-grid">
      {terms.map((t) => (
        <div key={t.term} className="dash-term-card">
          <div className="dash-term-head">
            <span className="dash-term-name">{t.term}</span>
            <div className="dash-term-head-right">
              <span className={`glosario-term-cat glosario-term-cat--${t.category}`}>{t.category}</span>
              <button
                className="dash-unsave-btn"
                onClick={() => unsave(t)}
                disabled={removing === t.term}
                aria-label="Quitar término de guardados"
                title="Quitar de guardados"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="dash-term-def">{t.definition}</p>
        </div>
      ))}
    </div>
  );
}
