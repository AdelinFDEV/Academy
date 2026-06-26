"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { createClient } from "@/lib/supabase/client";

interface Category {
  name: string;
  slug: string;
}

interface Props {
  user: boolean;
  isPremium?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

export default function BlogMobileMenu({ user, isPremium = false, userName, isAdmin = false }: Props) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const pathname = usePathname();
  const a = (href: string) => pathname === href || pathname.startsWith(href + "/") ? " active" : "";

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("name, slug")
      .order("name")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  const tradingLocked = !user || !isPremium;

  return (
    <>
      {!user && (
        <Link href="/login" className="btn-nav-mobile-login" onClick={close}>
          Iniciar sesión
        </Link>
      )}
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
          <nav className="blog-mobile-menu-nav">
            <div className="blog-mobile-section">
              <span className="blog-mobile-section-label">Artículos</span>
              <Link href="/articulos" className={`blog-mobile-tool-link${a("/articulos")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Todos los artículos
              </Link>
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/categoria/${cat.slug}`} className={`blog-mobile-tool-link${a("/categoria/" + cat.slug)}`} onClick={close}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2 4h5l1.5 2H14v7H2V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className="blog-mobile-section">
              <span className="blog-mobile-section-label">Educación</span>
              <Link href="/glosario" className={`blog-mobile-tool-link${a("/glosario")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 2h6l1 1h5v11H2V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M5 7h6M5 9.5h6M5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Glosario
              </Link>
              <Link href="/cursos" className={`blog-mobile-tool-link${a("/cursos")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1L1 5l7 4 7-4-7-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M1 5v6M4 6.5v4.5a6 6 0 0 0 8 0V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cursos
                <span className="mobile-premium-badge">PREMIUM</span>
              </Link>
              <Link href="/recursos" className={`blog-mobile-tool-link${a("/recursos")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 2h7l3 3v9H3V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M10 2v3h3M5.5 7h5M5.5 9.5h5M5.5 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Recursos
                <span className="mobile-premium-badge">PREMIUM</span>
              </Link>
              <Link href="/guias" className={`blog-mobile-tool-link${a("/guias")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 3h5v10H2zM9 3h5v10H9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                Guías
              </Link>
            </div>

            <div className="blog-mobile-section">
              <span className="blog-mobile-section-label">Herramientas</span>

              <Link href={tradingLocked ? (!user ? "/register" : "/dashboard") : "/dashboard/trading"} className={`blog-mobile-tool-link${a("/dashboard/trading")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <polyline points="1,11 5,7 9,9 15,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="11,3 15,3 15,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Diario de Trading
                {tradingLocked && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href={!user ? "/register" : "/dashboard/watchlist"} className={`blog-mobile-tool-link${a("/dashboard/watchlist")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8Z" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Watchlist
                {!user && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href={(!user || !isPremium) ? "/dashboard" : "/dashboard/estadisticas"} className={`blog-mobile-tool-link${a("/dashboard/estadisticas")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="9" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="6.5" y="5" width="3" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="11" y="2" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                Mis Estadísticas
                {(!user || !isPremium) && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href="/logros" className={`blog-mobile-tool-link${a("/logros")}`} onClick={close}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2l1.9 3.8L14 6.6l-3 2.9.7 4.1L8 11.5l-3.7 2.1.7-4.1-3-2.9 4.1-.8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                Logros
                {!user && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Portfolio Spot
                <span className="mobile-premium-badge" style={{ opacity: 0.7 }}>PREMIUM</span>
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>

              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M14 5H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1v2.5L6 12h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                Chat y Foro Privado
                <span className="mobile-premium-badge" style={{ opacity: 0.7 }}>PREMIUM</span>
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>

              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Calculadora de precio
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>
            </div>
          </nav>

          <div className="blog-mobile-menu-footer">
            {user ? (
              <>
                {userName && (
                  <div className="blog-mobile-user-info">
                    <span className="blog-mobile-user-name">{userName}</span>
                    <span className={`blog-mobile-user-role${isPremium ? " premium" : ""}`}>
                      {isAdmin ? "Admin" : isPremium ? "Premium" : "Free"}
                    </span>
                  </div>
                )}
                {!userName && (
                  <Link href="/dashboard" className="blog-mobile-btn-cta" onClick={close}>
                    Ir a la academia →
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="blog-mobile-admin-link" onClick={close}>
                    Panel Admin ↗
                  </Link>
                )}
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
