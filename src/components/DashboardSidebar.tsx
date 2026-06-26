"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import LogoutButton from "@/components/LogoutButton";
import { X } from "lucide-react";

interface Props {
  role: string;
  userName: string;
}

interface NavTool {
  href: string;
  label: string;
  icon: "trending" | "chat" | "book" | "wrench" | "shield";
  requiresPremium: boolean;
}

const TOOLS: NavTool[] = [
  {
    href: "/dashboard/trading",
    label: "Diario de Trading",
    icon: "trending",
    requiresPremium: true,
  },
];

export default function DashboardSidebar({ role, userName }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const planLabel = isAdmin ? "Admin" : isPremium ? "Premium" : "Free";

  const close = () => setMenuOpen(false);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => { close(); }, [pathname]);

  return (
    <>
      {/* ── Mobile/Tablet sticky header with hamburger (hidden on desktop) ── */}
      <header className="dash-mobile-header">
        <Link href="/" className="dash-mobile-brand">
          adelin<span>btc</span>
        </Link>
        <div className="dash-mobile-header-right">
          <span className={`role-badge ${isPremium ? "premium" : "free"}`}
            style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem" }}>
            {planLabel}
          </span>
          <button
            className={`btn-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* ── Full-screen dashboard mobile menu ── */}
      {menuOpen && (
        <div className="dash-mobile-menu">
          <div className="dash-mobile-menu-header">
            <Link href="/" className="blog-brand" onClick={close}>
              adelin<span>btc</span>
            </Link>
            <button className="blog-mobile-close" onClick={close} aria-label="Cerrar menú">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav className="dash-mobile-menu-nav">
            <p className="dash-mobile-menu-section">Academia</p>

            <Link
              href="/dashboard"
              className={`dash-mobile-menu-link${pathname === "/dashboard" ? " active" : ""}`}
              onClick={close}
            >
              <Icon name="chart" size={18} />
              Inicio
            </Link>

            <Link
              href="/dashboard/logros"
              className={`dash-mobile-menu-link${pathname === "/dashboard/logros" ? " active" : ""}`}
              onClick={close}
            >
              <Icon name="spark" size={18} />
              Logros
            </Link>

            <p className="dash-mobile-menu-section">Herramientas</p>

            {TOOLS.map(tool => {
              const locked = tool.requiresPremium && !isPremium;
              if (locked) {
                return (
                  <div key={tool.href} className="dash-mobile-menu-link locked">
                    <Icon name={tool.icon} size={18} />
                    <span style={{ flex: 1 }}>{tool.label}</span>
                    <span className="dash-lock-badge">Premium</span>
                  </div>
                );
              }
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`dash-mobile-menu-link${pathname === tool.href ? " active" : ""}`}
                  onClick={close}
                >
                  <Icon name={tool.icon} size={18} />
                  {tool.label}
                </Link>
              );
            })}
          </nav>

          <div className="dash-mobile-menu-footer">
            <div className="dash-mobile-menu-user">
              <span className="dash-mobile-menu-username">{userName}</span>
              <span className={`role-badge ${isPremium ? "premium" : "free"}`}
                style={{ fontSize: "0.65rem", padding: "0.2rem 0.65rem" }}>
                {planLabel}
              </span>
            </div>
            <div className="dash-mobile-menu-actions">
              {isAdmin && (
                <Link href="/admin" className="admin-nav-link-small" onClick={close}>Admin ↗</Link>
              )}
              <Link href="/" className="dash-back-btn" onClick={close}>← Volver al inicio</Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar (hidden on mobile/tablet ≤900px) ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <Link href="/" className="dash-brand">
            adelin<span>btc</span>
            <small>Academia</small>
          </Link>

          <nav className="dash-nav">
            <span className="dash-nav-section">Academia</span>

            <Link
              href="/dashboard"
              className={`dash-nav-link${pathname === "/dashboard" ? " active" : ""}`}
            >
              <Icon name="chart" size={15} />
              <span className="dash-nav-label">Inicio</span>
            </Link>

            <Link
              href="/dashboard/logros"
              className={`dash-nav-link${pathname === "/dashboard/logros" ? " active" : ""}`}
            >
              <Icon name="spark" size={15} />
              <span className="dash-nav-label">Logros</span>
            </Link>

            <span className="dash-nav-section">Herramientas</span>

            {TOOLS.map(tool => {
              const locked = tool.requiresPremium && !isPremium;
              if (locked) {
                return (
                  <div key={tool.href} className="dash-nav-link locked" title="Exclusivo Premium">
                    <Icon name={tool.icon} size={15} />
                    <span className="dash-nav-label" style={{ flex: 1 }}>{tool.label}</span>
                    <span className="dash-lock-badge">Premium</span>
                  </div>
                );
              }
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`dash-nav-link${pathname === tool.href ? " active" : ""}`}
                >
                  <Icon name={tool.icon} size={15} />
                  <span className="dash-nav-label">{tool.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            <span className="dash-user-name">{userName}</span>
            <span className={`role-badge ${isPremium ? "premium" : "free"}`}
              style={{ fontSize: "0.65rem", padding: "0.2rem 0.65rem", alignSelf: "flex-start" }}>
              {planLabel}
            </span>
          </div>
          <div className="dash-sidebar-links">
            {isAdmin && (
              <Link href="/admin" className="admin-nav-link-small">Admin ↗</Link>
            )}
            <Link href="/" className="dash-back-btn">← Volver al inicio</Link>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
