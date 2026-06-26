"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Trophy, TrendingUp, Eye, BarChart2, PieChart, MessageSquare, Target } from "lucide-react";

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
        <ChevronDown size={12} className="nav-tools-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="nav-tools-menu nav-tools-menu--wide" role="menu">

          {/* ── Academia ── */}
          <p className="nav-tools-section-label">Academia</p>

          <Link href="/logros" className="nav-tools-item" role="menuitem" onClick={close}>
            <span className="nav-tools-item-icon">
              <Trophy size={16} aria-hidden="true" />
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
              <TrendingUp size={16} aria-hidden="true" />
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
              <Eye size={16} aria-hidden="true" />
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
              <BarChart2 size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Mis Estadísticas</span>
              <span className="nav-tools-item-desc">Rendimiento de tu diario de trading</span>
            </span>
            {estadisticasLocked && <span className="nav-tools-badge--premium">PREMIUM</span>}
          </Link>

          <div className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
            <span className="nav-tools-item-icon">
              <PieChart size={16} aria-hidden="true" />
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
              <MessageSquare size={16} aria-hidden="true" />
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
              <Target size={16} aria-hidden="true" />
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
