"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, BookA, MonitorPlay, Layers, Route } from "lucide-react";

const ITEMS = [
  {
    href: "/glosario",
    label: "Diccionario Cripto",
    desc: "Términos clave de crypto y trading explicados",
    premium: false,
    icon: <BookA size={16} aria-hidden="true" />,
  },
  {
    href: "/cursos",
    label: "Cursos",
    desc: "Aprende desde cero con nuestros cursos",
    soon: true,
    icon: <MonitorPlay size={16} aria-hidden="true" />,
  },
  {
    href: "/recursos",
    label: "Recursos",
    desc: "Herramientas y materiales de referencia",
    soon: true,
    icon: <Layers size={16} aria-hidden="true" />,
  },
  {
    href: "/guias",
    label: "Guías Interactivas",
    desc: "Aprende paso a paso con ejercicios y quizzes",
    icon: <Route size={16} aria-hidden="true" />,
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

          {ITEMS.map((item) =>
            item.soon ? (
              <div key={item.href} className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
                <span className="nav-tools-item-icon">{item.icon}</span>
                <span>
                  <span className="nav-tools-item-name">{item.label}</span>
                  <span className="nav-tools-item-desc">{item.desc}</span>
                </span>
                <span className="nav-tools-soon-badge">Pronto</span>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="nav-tools-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className="nav-tools-item-icon">{item.icon}</span>
                <span>
                  <span className="nav-tools-item-name">{item.label}</span>
                  <span className="nav-tools-item-desc">{item.desc}</span>
                </span>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
