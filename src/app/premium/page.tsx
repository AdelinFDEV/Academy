import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import LiveCounter from "@/components/LiveCounter";
import { NotebookPen, Radar, Lightbulb, Gem, Check, ArrowRight, Crown, ShieldCheck, Users, Zap, Timer } from "lucide-react";

export const metadata: Metadata = {
  title: "Hazte Premium | AdelinBTC Academy",
  description:
    "Desbloquea el diario de trading, señales, herramientas exclusivas y todo el contenido Premium por 19,99€/mes. Sin permanencia.",
};

const PERKS = [
  { Icon: NotebookPen, title: "Diario de Trading Profesional", desc: "Registra todas tus operaciones, calcula tu win rate y descubre qué te hace rentable." },
  { Icon: Radar, title: "Señales en Spot", desc: "Entradas y salidas con criterio, no con corazonadas." },
  { Icon: Lightbulb, title: "Guías Estratégicas", desc: "Tutoriales y pasos prácticos para aprovechar las mejores oportunidades del mercado." },
  { Icon: Gem, title: "Artículos y recursos pro", desc: "Análisis avanzados, watchlist, estadísticas y todo lo que viene." },
];

export default async function PremiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";

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

      <main className="blog-main">
        {isPremium ? (
          <div className="premium-gate-page">
            <div className="premium-gate-unlocked">
              <div className="premium-gate-unlocked-icon"><Crown size={34} aria-hidden="true" /></div>
              <h1 className="premium-gate-unlocked-title">Ya eres Premium</h1>
              <p className="premium-gate-unlocked-sub">
                Tienes acceso completo a todas las herramientas y contenido exclusivo.
                Gracias por apoyar el proyecto.
              </p>
              <div className="premium-gate-actions">
                <Link href="/dashboard" className="btn-primary">Ir a mi academia →</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="premium-new-layout">
            <div className="premium-hero">
              <div className="premium-hero-badge">
                <span className="pulse-dot"></span> Plazas limitadas
              </div>
              <h1 className="premium-hero-title">
                Deja de operar a ciegas.<br/>Empieza a operar con <span>ventaja</span>.
              </h1>
              <p className="premium-hero-sub">
                Únete a la academia Premium y desbloquea las herramientas, análisis y comunidad que necesitas para dominar el mercado cripto.
              </p>
              
              <div className="premium-hero-trust">
                <div className="trust-item"><Users size={16} /> +100 Traders activos</div>
                <div className="trust-item"><ShieldCheck size={16} /> Cancela en 1 clic</div>
              </div>
            </div>

            <div className="premium-split-view">
              <div className="premium-features-side">
                <h2 className="premium-section-title">¿Qué incluye tu acceso?</h2>
                <div className="premium-features-grid">
                  {PERKS.map(({ Icon, title, desc }) => (
                    <div key={title} className="premium-feature-card">
                      <div className="premium-feature-icon-wrapper">
                        <Icon size={24} strokeWidth={2} />
                      </div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-pricing-side">
                <div className="premium-pricing-card">
                  <div className="premium-pricing-glow"></div>
                  <div className="premium-pricing-header">
                    <h3>Acceso Total</h3>
                    <div className="premium-pricing-timer">
                      <Timer size={14} /> Oferta termina pronto
                    </div>
                  </div>
                  
                  <div className="premium-pricing-amount-wrapper">
                    <span className="premium-pricing-old">49,99€</span>
                    <div className="premium-pricing-amount">
                      19<span>,99€</span><small>/mes</small>
                    </div>
                  </div>

                  <ul className="premium-pricing-list">
                    <li><Check size={16} /> Todo el contenido bloqueado</li>
                    <li><Check size={16} /> Diario de Trading Profesional con Win Rate</li>
                    <li><Check size={16} /> Alertas y Señales VIP</li>
                    <li><Check size={16} /> Soporte prioritario</li>
                  </ul>

                  <Link href="/api/checkout" prefetch={false} className="premium-btn-agressive">
                    <span className="premium-btn-text">{user ? "Desbloquear todo ahora" : "Empezar ahora"}</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </Link>

                  <div className="premium-pricing-footer">
                    <span><ShieldCheck size={14} style={{display: 'inline', marginBottom: '-2px'}}/> Garantía de satisfacción.</span>
                    <span>Pagos encriptados por Stripe.</span>
                  </div>
                  
                  {!user && (
                    <p className="premium-plan-login-note" style={{marginTop: "16px", textAlign: "center"}}>
                      ¿Ya tienes cuenta? <Link href="/login?next=/premium">Inicia sesión</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
