"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Medal, NotebookPen, ScanEye, Wallet, ListOrdered, MessagesSquare, Crosshair, Network } from "lucide-react";

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
              <Medal size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Logros</span>
              <span className="nav-tools-item-desc">Tu progreso y rachas en la academia</span>
            </span>
            {!user && <span className="nav-tools-badge--free">GRATIS</span>}
          </Link>

          <Link
            href={!user ? "/register" : "/calculadora"}
            className="nav-tools-item"
            role="menuitem"
            onClick={close}
          >
            <span className="nav-tools-item-icon">
              <Crosshair size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Predicción de Precio</span>
              <span className="nav-tools-item-desc">¿Qué Market Cap necesita tu token?</span>
            </span>
            {!user && <span className="nav-tools-badge--free">GRATIS</span>}
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
              <NotebookPen size={16} aria-hidden="true" />
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
              <ScanEye size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Watchlist</span>
              <span className="nav-tools-item-desc">Sigue el precio de tus coins favoritas</span>
            </span>
            {!user && <span className="nav-tools-badge--free">GRATIS</span>}
          </Link>

          <Link
            href={tradingLocked ? (!user ? "/register" : "/portfolio") : "/portfolio"}
            className={`nav-tools-item${tradingLocked ? " nav-tools-item--dimmed" : ""}`}
            role="menuitem"
            onClick={close}
          >
            <span className="nav-tools-item-icon">
              <Wallet size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Portfolio Spot</span>
              <span className="nav-tools-item-desc">Sigue las compras de AdelinBTC en SPOT</span>
            </span>
            {tradingLocked && <span className="nav-tools-badge--premium">PREMIUM</span>}
          </Link>

          {/* ── Comunidad ── */}
          <p className="nav-tools-section-label" style={{ marginTop: "10px" }}>Comunidad</p>

          <Link href="/ranking" className="nav-tools-item" role="menuitem" onClick={close}>
            <span className="nav-tools-item-icon">
              <ListOrdered size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Ranking</span>
              <span className="nav-tools-item-desc">Los miembros más activos de la academia</span>
            </span>
            <span className="nav-tools-soon-badge">Pronto</span>
          </Link>

          <div className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
            <span className="nav-tools-item-icon">
              <MessagesSquare size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Chat</span>
              <span className="nav-tools-item-desc">Chat en tiempo real con la comunidad</span>
            </span>
            <span className="nav-tools-soon-badge">Pronto</span>
          </div>

          <div className="nav-tools-item nav-tools-item--soon" aria-disabled="true">
            <span className="nav-tools-item-icon">
              <Network size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="nav-tools-item-name">Foro</span>
              <span className="nav-tools-item-desc">Debates y análisis con otros miembros</span>
            </span>
            <span className="nav-tools-soon-badge">Pronto</span>
          </div>

        </div>
      )}
    </div>
  );
}
