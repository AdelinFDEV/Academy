"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, BookOpen, GraduationCap, Files, LayoutGrid } from "lucide-react";

const ITEMS = [
  {
    href: "/glosario",
    label: "Glosario",
    desc: "Términos clave de crypto y trading explicados",
    premium: false,
    icon: <BookOpen size={16} aria-hidden="true" />,
  },
  {
    href: "/cursos",
    label: "Cursos",
    desc: "Aprende desde cero con nuestros cursos",
    premium: true,
    icon: <GraduationCap size={16} aria-hidden="true" />,
  },
  {
    href: "/recursos",
    label: "Recursos",
    desc: "Herramientas y materiales de referencia",
    premium: true,
    icon: <Files size={16} aria-hidden="true" />,
  },
  {
    href: "/guias",
    label: "Guías",
    desc: "Paso a paso para dominar el mercado",
    premium: false,
    icon: <LayoutGrid size={16} aria-hidden="true" />,
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
        <ChevronDown size={12} className="nav-tools-caret" aria-hidden="true" />
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
