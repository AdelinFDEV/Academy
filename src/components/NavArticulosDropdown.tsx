"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Newspaper, Tag, Map } from "lucide-react";

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
        <ChevronDown size={12} className="nav-tools-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="nav-tools-menu" role="menu">
          <Link
            href="/guias"
            className="nav-tools-item nav-tools-item--featured"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="nav-tools-item-icon">
              <Map size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Empieza aquí</span>
              <span className="nav-tools-item-desc">Tu hoja de ruta paso a paso en crypto</span>
            </span>
          </Link>

          <p className="nav-tools-section-label">Categorías</p>

          <Link
            href="/articulos"
            className="nav-tools-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="nav-tools-item-icon">
              <Newspaper size={16} aria-hidden="true" />
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
                <Tag size={16} aria-hidden="true" />
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
