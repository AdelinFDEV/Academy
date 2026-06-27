"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { createClient } from "@/lib/supabase/client";
import {
  FileText, Folder, BookOpen, GraduationCap, Files, LayoutGrid,
  TrendingUp, Eye, BarChart2, Trophy, PieChart, MessageSquare, Target, Award, Hash,
} from "lucide-react";

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
                <FileText size={15} aria-hidden="true" />
                Todos los artículos
              </Link>
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/categoria/${cat.slug}`} className={`blog-mobile-tool-link${a("/categoria/" + cat.slug)}`} onClick={close}>
                  <Folder size={15} aria-hidden="true" />
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className="blog-mobile-section">
              <span className="blog-mobile-section-label">Educación</span>
              <Link href="/glosario" className={`blog-mobile-tool-link${a("/glosario")}`} onClick={close}>
                <BookOpen size={15} aria-hidden="true" />
                Diccionario Cripto
              </Link>
              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <GraduationCap size={15} aria-hidden="true" />
                Cursos
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>
              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <Files size={15} aria-hidden="true" />
                Recursos
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>
              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <LayoutGrid size={15} aria-hidden="true" />
                Guías
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>
            </div>

            <div className="blog-mobile-section">
              <span className="blog-mobile-section-label">Herramientas</span>

              <Link href={tradingLocked ? (!user ? "/register" : "/dashboard") : "/dashboard/trading"} className={`blog-mobile-tool-link${a("/dashboard/trading")}`} onClick={close}>
                <TrendingUp size={15} aria-hidden="true" />
                Diario de Trading
                {tradingLocked && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href={!user ? "/register" : "/dashboard/watchlist"} className={`blog-mobile-tool-link${a("/dashboard/watchlist")}`} onClick={close}>
                <Eye size={15} aria-hidden="true" />
                Watchlist
                {!user && <span className="mobile-free-badge">FREE · Registro</span>}
              </Link>

              <Link href="/logros" className={`blog-mobile-tool-link${a("/logros")}`} onClick={close}>
                <Trophy size={15} aria-hidden="true" />
                Logros
                {!user && <span className="mobile-free-badge">FREE · Registro</span>}
              </Link>

              <Link
                href={!user ? "/register" : "/calculadora"}
                className={`blog-mobile-tool-link${a("/calculadora")}`}
                onClick={close}
              >
                <Target size={15} aria-hidden="true" />
                Predicción de Precio
                {!user && <span className="mobile-free-badge">FREE · Registro</span>}
              </Link>

              <Link href="/ranking" className={`blog-mobile-tool-link${a("/ranking")}`} onClick={close}>
                <Award size={15} aria-hidden="true" />
                Ranking
                <span className="mobile-tool-soon-badge">Pronto</span>
              </Link>

              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <PieChart size={15} aria-hidden="true" />
                Portfolio Spot
                <span className="mobile-premium-badge" style={{ opacity: 0.7 }}>PREMIUM</span>
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>

              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <MessageSquare size={15} aria-hidden="true" />
                Chat
                <span className="mobile-tool-soon-badge">Pronto</span>
              </div>

              <div className="blog-mobile-tool-link blog-mobile-tool-soon">
                <Hash size={15} aria-hidden="true" />
                Foro
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
