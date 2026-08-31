"use client";

import { useState, useMemo } from "react";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { GLOSARIO, GLOSARIO_CATEGORIAS, type GlosarioTerm } from "@/lib/glosario";

// Los terminos viven en src/lib/glosario.ts desde el punto 7 del plan SEO:
// aqui dentro eran invisibles para el sitemap y para cualquier pagina de
// servidor, porque este es un componente de cliente.
type Term = GlosarioTerm;
const TERMS = GLOSARIO;

const CATEGORIES = [{ id: "all", label: "Todos" }, ...GLOSARIO_CATEGORIAS] as const;

interface Props {
  isLoggedIn: boolean;
  initialSaved: string[];
}

export default function GlosarioClient({ isLoggedIn, initialSaved }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TERMS.filter((t) => {
      const matchesCat = category === "all" || t.category === category;
      const matchesSearch = !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, category]);

  async function toggleSave(t: Term) {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    if (toggling === t.term) return;
    setToggling(t.term);

    const wasSaved = saved.has(t.term);
    setSaved((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(t.term);
      else next.add(t.term);
      return next;
    });

    try {
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: t.term, definition: t.definition, category: t.category }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved((prev) => {
          const next = new Set(prev);
          if (data.saved) next.add(t.term);
          else next.delete(t.term);
          return next;
        });
      } else {
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(t.term);
          else next.delete(t.term);
          return next;
        });
      }
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(t.term);
        else next.delete(t.term);
        return next;
      });
    }
    setToggling(null);
  }

  return (
    <>
      <div className="glosario-controls">
        <input
          type="search"
          className="glosario-search"
          placeholder="Buscar término…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
        <div className="glosario-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`glosario-cat-btn${category === cat.id ? " active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="glosario-count">{filtered.length} término{filtered.length !== 1 ? "s" : ""}</p>

      <div className="glosario-list">
        {filtered.map((t) => {
          const isSaved = saved.has(t.term);
          return (
            <div key={t.term} className="glosario-term">
              <div className="glosario-term-head">
                {/* Solo enlazan los términos que ya tienen desarrollo largo. El
                    resto se queda como estaba: sin página, sin enlace roto. */}
                {t.extended ? (
                  <Link href={`/glosario/${t.slug}`} className="glosario-term-name glosario-term-link">
                    {t.term}
                  </Link>
                ) : (
                  <span className="glosario-term-name">{t.term}</span>
                )}
                <div className="glosario-term-actions">
                  <span className={`glosario-term-cat glosario-term-cat--${t.category}`}>{t.category}</span>
                  <button
                    className={`glosario-save-btn${isSaved ? " saved" : ""}`}
                    onClick={() => toggleSave(t)}
                    disabled={toggling === t.term}
                    aria-label={isSaved ? "Quitar de guardados" : "Guardar término"}
                    title={isLoggedIn ? (isSaved ? "Quitar de guardados" : "Guardar en tu diccionario") : "Inicia sesión para guardar términos"}
                  >
                    <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="glosario-term-def">{t.definition}</p>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="glosario-empty">No se encontró ningún término para "{search}".</p>
        )}
      </div>
    </>
  );
}
