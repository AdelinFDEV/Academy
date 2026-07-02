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
import { NotebookPen, Radar, Lightbulb, Gem, Check, X, ArrowRight, Crown, ShieldCheck, Users, Timer, Unlock, Wallet, Star, Lock, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Hazte Premium | AdelinBTC Academy",
  description:
    "Desbloquea el diario de trading, señales, herramientas exclusivas y todo el contenido Premium por 19,99€/mes. Sin permanencia.",
};

const PERKS = [
  { Icon: NotebookPen, color: "#4f9dff", title: "Diario de Trading Profesional", desc: "Registra cada operación, calcula tu win rate y descubre con datos qué te hace rentable." },
  { Icon: Radar, color: "#f87171", title: "Señales en Spot", desc: "Entradas y salidas con criterio, no con corazonadas. Contexto y niveles claros." },
  { Icon: Unlock, color: "#34d399", title: "Liberaciones de Tokens", desc: "Anticipa la presión vendedora con el calendario de vesting del mercado en tiempo real." },
  { Icon: Wallet, color: "#fb923c", title: "Portfolio Spot de AdelinBTC", desc: "Sigue en directo las compras reales del portfolio, con precios de entrada y contexto." },
  { Icon: Lightbulb, color: "#a78bfa", title: "Guías Estratégicas Premium", desc: "Guías interactivas avanzadas con gráficas, quizzes y pasos accionables." },
  { Icon: Gem, color: "#fbbf24", title: "Todo lo que viene", desc: "Cada herramienta y contenido nuevo entra directo en tu suscripción. Sin pagar más." },
];

const COMPARE: { label: string; free: boolean | string; premium: boolean | string }[] = [
  { label: "Artículos y análisis semanales", free: true, premium: true },
  { label: "Guías interactivas con quiz y logros", free: "Básicas", premium: "Todas" },
  { label: "Watchlist y predicción de precio", free: true, premium: true },
  { label: "Logros, rachas y ranking", free: true, premium: true },
  { label: "Diario de Trading con win rate", free: false, premium: true },
  { label: "Señales en Spot", free: false, premium: true },
  { label: "Portfolio Spot en tiempo real", free: false, premium: true },
  { label: "Calendario de liberaciones de tokens", free: false, premium: true },
  { label: "Artículos y análisis Premium", free: false, premium: true },
  { label: "Soporte prioritario", free: false, premium: true },
];

const TESTIMONIALS = [
  { name: "Marcos R.", role: "Miembro Premium", quote: "El diario de trading me hizo ver que mi problema no eran las entradas, eran las salidas. Solo eso ya vale la suscripción." },
  { name: "Laura G.", role: "Miembro Premium", quote: "Vengo de perder dinero siguiendo a gurús de Twitter. Aquí por fin entiendo el porqué de cada movimiento." },
  { name: "Adrián M.", role: "Miembro Premium", quote: "El calendario de liberaciones me salvó de comprar justo antes de un unlock masivo. Herramienta brutal." },
];

const FAQS = [
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Cancelas en 1 clic desde tu cuenta, sin permanencia ni preguntas. Mantienes el acceso hasta el final del periodo que ya has pagado." },
  { q: "¿El precio me subirá más adelante?", a: "No. Los 19,99€/mes son una oferta de lanzamiento: mientras mantengas tu suscripción activa, conservas ese precio para siempre, aunque suba para nuevos miembros." },
  { q: "¿Cómo se realiza el pago?", a: "Con tarjeta a través de Stripe, la misma plataforma que usan Amazon o Shopify. El pago está encriptado y nosotros nunca vemos los datos de tu tarjeta." },
  { q: "¿Esto es asesoramiento financiero?", a: "No. Es formación y herramientas para que tomes tus propias decisiones con criterio. Nadie puede garantizarte rentabilidad — quien lo haga, te está mintiendo." },
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
                <span className="pulse-dot"></span> Oferta de lanzamiento · –60%
              </div>
              <h1 className="premium-hero-title">
                Deja de operar a ciegas.<br/>Empieza a operar con <span>ventaja</span>.
              </h1>
              <p className="premium-hero-sub">
                Las herramientas, señales y análisis que separan a los que improvisan
                de los que operan con un plan. Todo en una sola suscripción.
              </p>

              <div className="premium-hero-trust">
                <div className="trust-item"><Users size={16} /> +100 traders activos</div>
                <div className="trust-item"><ShieldCheck size={16} /> Cancela en 1 clic</div>
                <div className="trust-item"><Lock size={16} /> Pago seguro con Stripe</div>
              </div>
            </div>

            <div className="premium-split-view">
              <div className="premium-features-side">
                <h2 className="premium-section-title">Todo lo que desbloqueas</h2>
                <div className="premium-features-grid">
                  {PERKS.map(({ Icon, color, title, desc }) => (
                    <div key={title} className="premium-feature-card pv2-feature-card">
                      <div
                        className="premium-feature-icon-wrapper"
                        style={{ color, background: `${color}14`, borderColor: `${color}33` }}
                      >
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
                  <span className="pv2-ribbon"><Sparkles size={12} aria-hidden="true" /> Ahorras un 60%</span>

                  <div className="premium-pricing-header">
                    <h3>Acceso Total</h3>
                    <div className="premium-pricing-timer">
                      <Timer size={14} /> Por tiempo limitado
                    </div>
                  </div>

                  <div className="premium-pricing-amount-wrapper">
                    <span className="premium-pricing-old">49,99€</span>
                    <div className="premium-pricing-amount">
                      19<span>,99€</span><small>/mes</small>
                    </div>
                    <span className="pv2-perday">Menos de 0,70€ al día — un café a la semana</span>
                  </div>

                  <ul className="premium-pricing-list">
                    <li><Check size={16} /> Diario de Trading con win rate</li>
                    <li><Check size={16} /> Señales en Spot con contexto</li>
                    <li><Check size={16} /> Liberaciones de tokens en tiempo real</li>
                    <li><Check size={16} /> Portfolio Spot de AdelinBTC</li>
                    <li><Check size={16} /> Todo el contenido y guías Premium</li>
                    <li><Check size={16} /> Soporte prioritario</li>
                  </ul>

                  <Link href="/api/checkout" prefetch={false} className="premium-btn-agressive pv2-shine">
                    <span className="premium-btn-text">{user ? "Desbloquear todo ahora" : "Empezar ahora"}</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </Link>

                  <div className="premium-pricing-footer">
                    <span><ShieldCheck size={14} style={{display: 'inline', marginBottom: '-2px'}}/> Sin permanencia · Cancela cuando quieras</span>
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

            {/* ── Free vs Premium ── */}
            <section className="pv2-compare">
              <h2 className="pv2-section-title">
                Gratis está bien. <span className="pv2-gold">Premium es otra liga.</span>
              </h2>
              <div className="pv2-table" role="table" aria-label="Comparativa Free vs Premium">
                <div className="pv2-table-head" role="row">
                  <span role="columnheader" className="pv2-col-feature">Qué incluye</span>
                  <span role="columnheader" className="pv2-col">Free</span>
                  <span role="columnheader" className="pv2-col pv2-col-premium"><Crown size={13} aria-hidden="true" /> Premium</span>
                </div>
                {COMPARE.map((row) => (
                  <div key={row.label} className="pv2-table-row" role="row">
                    <span role="cell" className="pv2-col-feature">{row.label}</span>
                    <span role="cell" className="pv2-col">
                      {row.free === true ? <Check size={17} className="pv2-check" aria-label="Incluido" />
                        : row.free === false ? <X size={16} className="pv2-x" aria-label="No incluido" />
                        : <em className="pv2-partial">{row.free}</em>}
                    </span>
                    <span role="cell" className="pv2-col pv2-col-premium">
                      {row.premium === true ? <Check size={17} className="pv2-check" aria-label="Incluido" />
                        : <em className="pv2-partial pv2-partial-gold">{row.premium}</em>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Testimonios ── */}
            <section className="pv2-testimonials">
              <h2 className="pv2-section-title">Lo que dicen los miembros</h2>
              <div className="pv2-testimonials-grid">
                {TESTIMONIALS.map((t) => (
                  <figure key={t.name} className="pv2-testimonial">
                    <div className="pv2-testimonial-stars" aria-label="5 estrellas">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" aria-hidden="true" />
                      ))}
                    </div>
                    <blockquote>{t.quote}</blockquote>
                    <figcaption>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className="pv2-faq">
              <h2 className="pv2-section-title">Preguntas frecuentes</h2>
              <div className="pv2-faq-list">
                {FAQS.map((f) => (
                  <details key={f.q} className="pv2-faq-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* ── CTA final ── */}
            <section className="pv2-final">
              <div className="pv2-final-glow" aria-hidden="true" />
              <Crown size={30} className="pv2-final-crown" aria-hidden="true" />
              <h2 className="pv2-final-title">
                Tu yo de dentro de un año<br />te agradecerá haber empezado hoy.
              </h2>
              <p className="pv2-final-sub">
                <s className="pv2-final-old">49,99€</s> <strong>19,99€/mes</strong> · Sin permanencia · Acceso inmediato
              </p>
              <Link href="/api/checkout" prefetch={false} className="premium-btn-agressive pv2-shine pv2-final-btn">
                <span className="premium-btn-text">{user ? "Desbloquear todo ahora" : "Hazte Premium ahora"}</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <p className="pv2-final-note">
                <ShieldCheck size={13} aria-hidden="true" /> Si no es para ti, cancelas en 1 clic. Sin preguntas.
              </p>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
