"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { createClient } from "@/lib/supabase/client";
import { destinoPorRuta } from "@/lib/herramientas";
import {
  FileText, Folder, BookOpen, GraduationCap, LayoutGrid, Radio,
  TrendingUp, Eye, Trophy, PieChart, Target, Unlock, Shield, Radar, BookOpenCheck,
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

  /**
   * Destino de cada herramienta según quién mire. La regla NO se escribe aquí:
   * la decide el catálogo (`@/lib/herramientas`), que es la fuente única.
   *
   * Antes cada enlace llevaba su propio ternario, y así fue como la calculadora
   * siguió mandando a `/register` después de abrirse al público. De paso, quien
   * tiene cuenta pero no Premium ahora va directo a `/premium` en vez de a una
   * herramienta que iba a rebotarle.
   */
  const destino = (ruta: string) => destinoPorRuta(ruta, { logueado: user, premium: isPremium });

  const tradingLocked = !user || !isPremium;

  return (
    <>
      <button
        className={`btn-hamburger${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        <span className="hamburger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
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
              <Link
                href={user ? "/dashboard" : "/register"}
                className={`blog-mobile-tool-link blog-mobile-tool-link--cta${a("/dashboard")}`}
                onClick={close}
              >
                <GraduationCap size={15} aria-hidden="true" />
                Mi Dashboard
              </Link>
              <Link href="/glosario" className={`blog-mobile-tool-link${a("/glosario")}`} onClick={close}>
                <BookOpen size={15} aria-hidden="true" />
                Diccionario Cripto
              </Link>
              {/* Estuvo como «Pronto» y en un <div> sin enlace hasta el
                  06-09-2026, cuando ya llevaba semanas emitiendo tres sesiones
                  por semana. `destino` manda a la sala a los premium y a la
                  ficha pública al resto, que explica qué es y cuándo se emite. */}
              <Link
                href={destino("/trading-en-directo")}
                className={`blog-mobile-tool-link${a("/trading-en-directo")}`}
                onClick={close}
              >
                <Radio size={15} aria-hidden="true" />
                Trading en Directo
                {tradingLocked && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>
              <Link href="/guias" className={`blog-mobile-tool-link blog-mobile-tool-link--featured${a("/guias")}`} onClick={close}>
                <LayoutGrid size={15} aria-hidden="true" />
                Guías Interactivas
                <span className="mobile-featured-badge">★ Destacado</span>
              </Link>
              <Link href="/cursos" className={`blog-mobile-tool-link blog-mobile-tool-link--featured${a("/cursos")}`} onClick={close}>
                <BookOpenCheck size={15} aria-hidden="true" />
                Cursos
                <span className="mobile-featured-badge">★ Destacado</span>
              </Link>
            </div>

            <div className="blog-mobile-section">
              <span className="blog-mobile-section-label">Herramientas</span>

              {/* La landing va la primera de la sección: es la que explica las
                  ocho, y en la barra superior solo se ve en pantallas anchas. */}
              <Link
                href="/herramientas"
                className={`blog-mobile-tool-link blog-mobile-tool-link--featured${a("/herramientas")}`}
                onClick={close}
              >
                <LayoutGrid size={15} aria-hidden="true" />
                Ver todas las herramientas
              </Link>

              <Link href={destino("/dashboard/trading")} className={`blog-mobile-tool-link blog-mobile-tool-link--featured${a("/dashboard/trading")}`} onClick={close}>
                <TrendingUp size={15} aria-hidden="true" />
                Diario de Trading
                <span className="mobile-featured-badge">★ Destacado</span>
              </Link>

              <Link href={destino("/dashboard/watchlist")} className={`blog-mobile-tool-link${a("/dashboard/watchlist")}`} onClick={close}>
                <Eye size={15} aria-hidden="true" />
                Watchlist
                {!user && <span className="mobile-free-badge">FREE · Registro</span>}
              </Link>

              <Link href="/logros" className={`blog-mobile-tool-link${a("/logros")}`} onClick={close}>
                <Trophy size={15} aria-hidden="true" />
                Logros
                {!user && <span className="mobile-free-badge">FREE · Registro</span>}
              </Link>

              {/* La calculadora se usa SIN cuenta (tres cálculos y luego se
                  pide el registro). Antes este enlace mandaba a /register
                  directamente, así que nadie llegaba a probarla. */}
              <Link
                href="/calculadora"
                className={`blog-mobile-tool-link${a("/calculadora")}`}
                onClick={close}
              >
                <Target size={15} aria-hidden="true" />
                Predicción de Precio
                {!user && <span className="mobile-free-badge">FREE · Sin registro</span>}
              </Link>

              <Link href={destino("/portfolio")} className={`blog-mobile-tool-link blog-mobile-tool-link--featured${a("/portfolio")}`} onClick={close}>
                <PieChart size={15} aria-hidden="true" />
                Portfolio Adelin
                <span className="mobile-featured-badge">★ Destacado</span>
              </Link>

              <Link href={destino("/herramientas/liberaciones")} className={`blog-mobile-tool-link${a("/herramientas/liberaciones")}`} onClick={close}>
                <Unlock size={15} aria-hidden="true" />
                Liberaciones de Tokens
                {!isPremium && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href={destino("/herramientas/radar")} className={`blog-mobile-tool-link${a("/herramientas/radar")}`} onClick={close}>
                <Radar size={15} aria-hidden="true" />
                Radar Diario
                {!isPremium && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href={user ? "/dashboard/mi-portfolio" : "/register"} className={`blog-mobile-tool-link${a("/dashboard/mi-portfolio")}`} onClick={close}>
                <PieChart size={15} aria-hidden="true" />
                Mi Portfolio
                {!isPremium && <span className="mobile-premium-badge">PREMIUM</span>}
              </Link>

              <Link href={destino("/dashboard/calculadora-riesgo")} className={`blog-mobile-tool-link${a("/dashboard/calculadora-riesgo")}`} onClick={close}>
                <Shield size={15} aria-hidden="true" />
                Calculadora de Riesgo
                {!user && <span className="mobile-free-badge">FREE · Registro</span>}
              </Link>

            </div>
          </nav>

          <div className="blog-mobile-menu-footer">
            {user ? (
              <>
                {userName && (
                  <Link href="/cuenta" className="blog-mobile-user-info" onClick={close} style={{ textDecoration: "none" }}>
                    <span className="blog-mobile-user-name">{userName}</span>
                    <span className={`blog-mobile-user-role${isPremium ? " premium" : ""}`}>
                      {isAdmin ? "Admin" : isPremium ? "Premium" : "Free"} · Mi cuenta →
                    </span>
                  </Link>
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
