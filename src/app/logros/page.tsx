import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import Badges from "@/components/Badges";
import { BADGE_DEFS } from "@/components/Badges";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import LiveCounter from "@/components/LiveCounter";

export const metadata: Metadata = {
  title: "Logros | AdelinBTC Academy",
  description: "Desbloquea logros y rachas completando artículos en la academia.",
};

export default async function LogrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users go straight to the dashboard logros
  if (user) redirect("/dashboard/logros");

  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={false} />
          <Link href="/login" className="btn-nav-login">Iniciar sesión</Link>
          <Link href="/register" className="btn-nav-register">Registrarte</Link>
        </div>
        <BlogMobileMenu user={false} />
      </nav>

      <main className="blog-main logros-gate-page">

        <div className="logros-gate-header">
          <div className="logros-gate-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 21h8M12 17v4M7 4H4v4a5 5 0 0 0 3 4.58M17 4h3v4a5 5 0 0 1-3 4.58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 className="logros-gate-title">Sistema de Logros</h1>
          <p className="logros-gate-sub">
            Completa artículos, mantén rachas y desbloquea recompensas únicas.<br/>
            Regístrate gratis para empezar a acumular tu progreso.
          </p>
          <div className="logros-gate-actions">
            <Link href="/register" className="btn-primary">Registrarte gratis →</Link>
            <Link href="/login" className="logros-gate-login">Ya tengo cuenta</Link>
          </div>
        </div>

        {/* Badge preview locked */}
        <div className="logros-gate-preview">
          <div className="logros-gate-blur-wrap">
            <div className="badges-grid logros-gate-grid">
              {BADGE_DEFS.map((badge) => (
                <div key={badge.id} className="badge-item locked logros-gate-badge">
                  <div className="badge-icon">{badge.icon}</div>
                  <span className="badge-label">{badge.label}</span>
                </div>
              ))}
            </div>
            <div className="logros-gate-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <p>Regístrate para desbloquear tus logros</p>
              <Link href="/register" className="btn-primary btn-small">Crear cuenta gratis →</Link>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
