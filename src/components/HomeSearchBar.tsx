"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Post {
  slug: string;
  title: string;
  is_premium: boolean;
  categories: { name: string } | null;
}

export default function HomeSearchBar({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = query.trim().length > 0
    ? posts.filter((p) => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="home-search-wrap" ref={ref}>
      <div className="home-search-box">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="home-search-icon">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          className="home-search-input"
          placeholder="Buscar artículos…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button className="home-search-clear" onClick={() => { setQuery(""); setOpen(false); }} aria-label="Limpiar búsqueda">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="home-search-results">
          {results.map((p) => (
            <Link
              key={p.slug}
              href={`/post/${p.slug}`}
              className="home-search-result-item"
              onClick={() => { setQuery(""); setOpen(false); }}
            >
              <span className="home-search-result-title">{p.title}</span>
              <div className="home-search-result-meta">
                {p.categories?.name && <span className="home-search-result-cat">{p.categories.name}</span>}
                {p.is_premium && <span className="home-search-result-premium">PREMIUM</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && query.trim().length > 0 && results.length === 0 && (
        <div className="home-search-results">
          <div className="home-search-empty">No se encontraron artículos para "{query}".</div>
        </div>
      )}
    </div>
  );
}
