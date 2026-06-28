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
import { NotebookPen, Radar, MessagesSquare, Gem, Check, ArrowRight, Crown } from "lucide-react";

export const metadata: Metadata = {
  title: "Hazte Premium | AdelinBTC Academy",
  description:
    "Desbloquea el diario de trading, señales, herramientas exclusivas y todo el contenido Premium por 19,99€/mes. Sin permanencia.",
};

const PERKS = [
  { Icon: NotebookPen, title: "Diario de Trading", desc: "Registra cada operación y descubre qué te hace ganar." },
  { Icon: Radar, title: "Señales en Spot", desc: "Entradas y salidas con criterio, no con corazonadas." },
  { Icon: MessagesSquare, title: "Sala de Chat", desc: "Comunidad privada en tiempo real, sin ruido ni gurús." },
  { Icon: Gem, title: "Artículos y herramientas exclusivas", desc: "Análisis avanzados, watchlist, estadísticas y todo lo que viene." },
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

      <main className="blog-main premium-gate-page">
        {isPremium ? (
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
        ) : (
          <div className="premium-plan">
            <div className="premium-gate-header">
              <div className="premium-gate-pill">PREMIUM</div>
              <h1 className="premium-gate-title">Hazte Premium</h1>
              <p className="premium-gate-sub">
                Todo lo que necesitas para operar con criterio y aprender de verdad.<br />
                Sin permanencia. Cancela cuando quieras.
              </p>
            </div>

            <div className="premium-plan-card">
              <ul className="premium-pitch-features premium-plan-features">
                {PERKS.map(({ Icon, title, desc }) => (
                  <li key={title} className="premium-pitch-feature">
                    <span className="premium-pitch-feature-icon"><Icon size={16} aria-hidden="true" /></span>
                    <span><strong>{title}</strong>{desc}</span>
                  </li>
                ))}
              </ul>

              <div className="premium-plan-checkout">
                <div className="premium-pitch-price-wrapper">
                  <span className="premium-pitch-limited">Por tiempo limitado</span>
                  <div className="premium-pitch-price">
                    <span className="premium-pitch-old-price">49,99€</span>
                    <span className="premium-pitch-amount">19,99€</span>
                    <span className="premium-pitch-period">/mes</span>
                  </div>
                </div>

                <Link href="/api/checkout" prefetch={false} className="premium-pitch-cta premium-plan-cta">
                  {user ? "Suscribirme ahora" : "Empezar ahora"}
                  <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                </Link>

                <p className="premium-pitch-note">
                  <Check size={13} aria-hidden="true" /> Pago seguro con Stripe · Renovación mensual · Cancela cuando quieras
                </p>
                {!user && (
                  <p className="premium-plan-login-note">
                    ¿Ya tienes cuenta? <Link href="/login?next=/premium">Inicia sesión</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
