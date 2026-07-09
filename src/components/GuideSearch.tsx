"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { GUIDES } from "@/lib/guides";

const CRYPTO_GUIDES = GUIDES.filter((g) => g.tags.includes("CRIPTOMONEDAS"));

export default function GuideSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const hasQuery = q.length >= 3;
  // Solo filtra por título de la guía — a propósito, no busca en
  // descripción/temas para que los resultados sean siempre predecibles.
  const results = hasQuery
    ? CRYPTO_GUIDES.filter((g) => g.title.toLowerCase().includes(q))
    : [];

  return (
    <div className="guide-search" ref={wrapRef}>
      <div className="guide-search-box">
        <Search size={14} aria-hidden="true" className="guide-search-icon" />
        <input
          type="text"
          className="guide-search-input"
          placeholder="Busca Criptomonedas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            type="button"
            className="guide-search-clear"
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery("")}
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && hasQuery && (
        <div className="guide-search-dropdown">
          {results.length === 0 ? (
            <p className="guide-search-empty">Sin resultados para &quot;{query}&quot;</p>
          ) : (
            results.map((g) => (
              <Link
                key={g.slug}
                href={`/guias/${g.slug}`}
                className="guide-search-result"
                onClick={() => setOpen(false)}
              >
                <span className="guide-search-result-dot" style={{ background: g.color }} />
                <span className="guide-search-result-body">
                  <span className="guide-search-result-title">{g.shortTitle}</span>
                  <span className="guide-search-result-desc">{g.description}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
