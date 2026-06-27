import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import LiveCounter from "@/components/LiveCounter";

export const metadata: Metadata = {
  title: "Recursos | AdelinBTC Academy",
  description: "Herramientas, plantillas y materiales de referencia para traders.",
};

export default async function RecursosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  if (role !== "admin") redirect("/");

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
          <NavHerramientasDropdown user={!!user} isPremium={isPremium} />
          {user ? (
            <>
              <Link href="/dashboard" className="btn-nav-cta">Ir a la academia →</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-nav-login">Iniciar sesión</Link>
              <Link href="/register" className="btn-nav-register">Registrarte</Link>
            </>
          )}
        </div>
        <BlogMobileMenu user={!!user} isPremium={isPremium} />
      </nav>

      <main className="blog-main premium-gate-page">

        {isPremium ? (
          <div className="premium-gate-unlocked">
            <div className="premium-gate-unlocked-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 2h7l3 3v9H3V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M10 2v3h3M5.5 7h5M5.5 9.5h5M5.5 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="premium-gate-unlocked-title">Recursos</h1>
            <p className="premium-gate-unlocked-sub">
              La biblioteca de recursos está en preparación. Serás el primero en acceder cuando esté lista.
            </p>
            <span className="premium-gate-coming-soon">Próximamente</span>
          </div>
        ) : (
          <>
            <div className="premium-gate-header">
              <div className="premium-gate-pill">PREMIUM</div>
              <div className="premium-gate-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 2h7l3 3v9H3V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M10 2v3h3M5.5 7h5M5.5 9.5h5M5.5 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="premium-gate-title">Recursos exclusivos</h1>
              <p className="premium-gate-sub">
                Plantillas, checklists, herramientas y materiales de referencia<br />
                para elevar tu operativa. Solo para miembros Premium.
              </p>
              <div className="premium-gate-actions">
                <Link href="/register" className="btn-primary">Hazte Premium →</Link>
                {!user && <Link href="/login" className="premium-gate-login">Ya tengo cuenta</Link>}
              </div>
            </div>

            <div className="premium-gate-preview">
              <div className="premium-gate-blur-wrap">
                <div className="premium-gate-fake-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="premium-gate-fake-card">
                      <div className="premium-gate-fake-thumb" />
                      <div className="premium-gate-fake-body">
                        <div className="premium-gate-fake-line wide" />
                        <div className="premium-gate-fake-line medium" />
                        <div className="premium-gate-fake-line short" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="premium-gate-overlay">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <p>Contenido exclusivo Premium</p>
                  <Link href="/register" className="btn-primary btn-small">Hazte Premium →</Link>
                </div>
              </div>
            </div>
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
