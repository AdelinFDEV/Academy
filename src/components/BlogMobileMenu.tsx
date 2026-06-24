"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function BlogMobileMenu({ user }: { user: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className={`btn-hamburger${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="blog-mobile-menu">
          <div className="blog-mobile-menu-header">
            <Link href="/" className="blog-brand" onClick={close}>
              adelin<span>btc</span>
            </Link>
            <button className="blog-mobile-close" onClick={close} aria-label="Cerrar menú">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <nav className="blog-mobile-menu-nav">
            <Link href="#herramientas" className="blog-mobile-link" onClick={close}>Herramientas</Link>
            <Link href="/articulos" className="blog-mobile-link" onClick={close}>Artículos</Link>
            <Link href="#como-empezar" className="blog-mobile-link" onClick={close}>Cómo empezar</Link>
          </nav>

          <div className="blog-mobile-menu-footer">
            {user ? (
              <>
                <Link href="/dashboard" className="blog-mobile-btn-cta" onClick={close}>
                  Ir a la academia →
                </Link>
                <div className="blog-mobile-btn-logout"><LogoutButton /></div>
              </>
            ) : (
              <>
                <Link href="/login" className="blog-mobile-btn-login" onClick={close}>Iniciar sesión</Link>
                <Link href="/register" className="blog-mobile-btn-cta" onClick={close}>Registrarte gratis →</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
