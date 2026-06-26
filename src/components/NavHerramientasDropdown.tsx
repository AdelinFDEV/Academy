"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Props {
  user: boolean;
  isPremium?: boolean;
}

export default function NavHerramientasDropdown({ user, isPremium = false }: Props) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }

  const close = () => setOpen(false);

  const tradingLocked = !user || !isPremium;
  const estadisticasLocked = !user || !isPremium;

  return (
    <div className="nav-tools-wrap" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={`btn-nav-link nav-tools-trigger${open ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Herramientas
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="nav-tools-caret">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="nav-tools-menu nav-tools-menu--wide" role="menu">

          {/* ── Academia ── */}
          <p className="nav-tools-section-label">Academia</p>

          <Link href="/logros" className="nav-tools-item" role="menuitem" onClick={close}>
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2l1.9 3.8L14 6.6l-3 2.9.7 4.1L8 11.5l-3.7 2.1.7-4.1-3-2.9 4.1-.8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Logros</span>
              <span className="nav-tools-item-desc">Tu progreso y rachas en la academia</span>
            </span>
            {!user && <span className="nav-tools-badge--premium">PREMIUM</span>}
          </Link>

          {/* ── Trading ── */}
          <p className="nav-tools-section-label" style={{ marginTop: "10px" }}>Trading</p>

          <Link
            href={tradingLocked ? (!user ? "/register" : "/dashboard") : "/dashboard/trading"}
            className={`nav-tools-item${tradingLocked ? " nav-tools-item--dimmed" : ""}`}
            role="menuitem"
            onClick={close}
          >
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polyline points="1,11 5,7 9,9 15,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="11,3 15,3 15,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Diario de Trading</span>
              <span className="nav-tools-item-desc">Registra y analiza tus operaciones</span>
            </span>
            {tradingLocked && <span className="nav-tools-badge--premium">PREMIUM</span>}
          </Link>

          <Link
            href={!user ? "/register" : "/dashboard/watchlist"}
            className="nav-tools-item"
            role="menuitem"
            onClick={close}
          >
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8Z" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Watchlist</span>
              <span className="nav-tools-item-desc">Sigue el precio de tus coins favoritas</span>
            </span>
            {!user && <span className="nav-tools-badge--premium">PREMIUM</span>}
          </Link>

          <Link
            href={estadisticasLocked ? (!user ? "/register" : "/dashboard") : "/dashboard/estadisticas"}
            className={`nav-tools-item${estadisticasLocked ? " nav-tools-item--dimmed" : ""}`}
            role="menuitem"
            onClick={close}
          >
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="9" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="6.5" y="5" width="3" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="11" y="2" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Mis Estadísticas</span>
              <span className="nav-tools-item-desc">Rendimiento de tu diario de trading</span>
            </span>
            {estadisticasLocked && <span className="nav-tools-badge--premium">PREMIUM</span>}
          </Link>

          <div className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l-1.41 1.41M4.95 11.54l-1.41 1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Portfolio Spot</span>
              <span className="nav-tools-item-desc">Gestiona tus holdings de crypto</span>
            </span>
            <span className="nav-tools-badge--premium" style={{ marginRight: "4px" }}>PREMIUM</span>
            <span className="nav-tools-soon-badge">Pronto</span>
          </div>

          {/* ── Comunidad ── */}
          <p className="nav-tools-section-label" style={{ marginTop: "10px" }}>Comunidad</p>

          <div className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M14 5H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1v2.5L6 12h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Chat y Foro Privado</span>
              <span className="nav-tools-item-desc">Comunidad exclusiva de miembros</span>
            </span>
            <span className="nav-tools-badge--premium" style={{ marginRight: "4px" }}>PREMIUM</span>
            <span className="nav-tools-soon-badge">Pronto</span>
          </div>

          {/* ── Utilidades ── */}
          <p className="nav-tools-section-label" style={{ marginTop: "10px" }}>Utilidades</p>

          <div className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
            <span className="nav-tools-item-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>
              <span className="nav-tools-item-name">Predicción de precio</span>
              <span className="nav-tools-item-desc">Predicción de precio de tokens</span>
            </span>
            <span className="nav-tools-soon-badge">Pronto</span>
          </div>

        </div>
      )}
    </div>
  );
}
