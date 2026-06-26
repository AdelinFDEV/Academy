"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Category {
  name: string;
  slug: string;
}

export default function NavArticulosDropdown() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("name, slug")
      .order("name")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="nav-tools-wrap"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`btn-nav-link nav-tools-trigger${open ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Artículos
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="nav-tools-caret">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="nav-tools-menu" role="menu">
          <p className="nav-tools-section-label">Categorías</p>

          <Link
            href="/articulos"
            className="nav-tools-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Todos los artículos</span>
              <span className="nav-tools-item-desc">Ver todo el contenido publicado</span>
            </span>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="nav-tools-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="nav-tools-item-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4h5l1.5 2H14v7H2V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>
                <span className="nav-tools-item-name">{cat.name}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
