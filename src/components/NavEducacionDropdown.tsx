"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const ITEMS = [
  {
    href: "/glosario",
    label: "Glosario",
    desc: "Términos clave de crypto y trading explicados",
    premium: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2h6l1 1h5v11H2V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M5 7h6M5 9.5h6M5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/cursos",
    label: "Cursos",
    desc: "Aprende desde cero con nuestros cursos",
    premium: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1L1 5l7 4 7-4-7-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M1 5v6M4 6.5v4.5a6 6 0 0 0 8 0V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/recursos",
    label: "Recursos",
    desc: "Herramientas y materiales de referencia",
    premium: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 2h7l3 3v9H3V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M10 2v3h3M5.5 7h5M5.5 9.5h5M5.5 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/guias",
    label: "Guías",
    desc: "Paso a paso para dominar el mercado",
    premium: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 3h5v10H2zM9 3h5v10H9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function NavEducacionDropdown() {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        Educación
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="nav-tools-caret">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="nav-tools-menu" role="menu">
          <p className="nav-tools-section-label">Educación</p>

          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-tools-item${item.premium ? " nav-tools-item--dimmed" : ""}`}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="nav-tools-item-icon">{item.icon}</span>
              <span>
                <span className="nav-tools-item-name">{item.label}</span>
                <span className="nav-tools-item-desc">{item.desc}</span>
              </span>
              {item.premium && <span className="nav-tools-badge--premium">PREMIUM</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
