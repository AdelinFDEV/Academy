import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PremiumFeatureGrid from "@/components/PremiumFeatureGrid";
import PremiumStickyBar from "@/components/PremiumStickyBar";
import { Check, X, ArrowRight, Crown, ShieldCheck, Users, Star, Lock, Sparkles } from "lucide-react";
import { DefiLlamaGlyph, CoinGeckoGlyph } from "@/components/BrandMarks";
import "./premium.css";

export const metadata: Metadata = {
  alternates: { canonical: "/premium" },
  title: "Hazte Premium",
  description:
    "Desbloquea el diario de trading, guías premium, trading en directo y el calendario de liberaciones de tokens por 49,99€/mes. Sin permanencia.",
};

const COMPARE: { label: string; free: boolean | string; premium: boolean | string }[] = [
  { label: "Artículos y análisis semanales", free: true, premium: true },
  { label: "Guías interactivas con quiz y logros", free: "Básicas", premium: "Todas" },
  { label: "Watchlist y predicción de precio", free: true, premium: true },
  { label: "Logros y rachas", free: true, premium: true },
  { label: "Calculadora de Riesgo", free: true, premium: true },
  { label: "Diario de Trading con 10 estadísticas", free: false, premium: true },
  { label: "Liberaciones de tokens en tiempo real", free: false, premium: true },
  { label: "Portfolio Adelin en tiempo real", free: false, premium: true },
  { label: "Trading en directo, 3 sesiones por semana", free: false, premium: true },
  { label: "Canal privado de Telegram", free: false, premium: true },
  { label: "Hablar conmigo por Telegram", free: false, premium: true },
  { label: "Soporte prioritario", free: false, premium: true },
];

const TESTIMONIALS = [
  { name: "Marcos R.", role: "Miembro Premium", quote: "El diario de trading me hizo ver que mi problema no eran las entradas, eran las salidas. Solo eso ya vale la suscripción." },
  { name: "Laura G.", role: "Miembro Premium", quote: "Vengo de perder dinero siguiendo a gurús de Twitter. Aquí por fin entiendo el porqué de cada movimiento." },
  { name: "Adrián M.", role: "Miembro Premium", quote: "El calendario de liberaciones me salvó de comprar justo antes de un unlock masivo. Herramienta brutal." },
];

const FAQS = [
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Cancelas en 1 clic desde tu cuenta, sin permanencia ni preguntas. Mantienes el acceso hasta el final del periodo que ya has pagado." },
  { q: "¿El precio me subirá más adelante?", a: "A ti no. El precio al que te suscribes queda fijado: mientras mantengas la suscripción activa lo conservas, aunque suba para quien entre después. Si cancelas y vuelves más adelante, entrarías con la tarifa que haya entonces." },
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

      <SiteNav user={!!user} isPremium={isPremium} />

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
          <div className="prem-page">

            {/* ── Hero ── */}
            <section className="prem-hero">
              <span className="prem-hero-glow" aria-hidden="true" />

              <span className="prem-hero-badge">
                <span className="prem-pulse-dot" aria-hidden="true" /> Acceso completo · Sin permanencia
              </span>

              <h1 className="prem-hero-title">
                Deja de operar a ciegas.<br />
                Empieza a operar con <span className="prem-hero-title-accent">ventaja</span>.
              </h1>

              <p className="prem-hero-sub">
                El diario de trading más completo e interactivo, guías premium, trading en directo
                sobre futuros de NASDAQ y cripto, y el calendario de liberaciones en tiempo real — todo en una sola suscripción.
              </p>

              <div className="prem-hero-cta-row">
                <Link href="/api/checkout" prefetch={false} className="prem-hero-cta pv2-shine">
                  {user ? "Desbloquear todo ahora" : "Empezar ahora"} <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                </Link>
                <span className="prem-hero-cta-price">
                  49,99€<span>/mes</span>
                </span>
              </div>

              <div className="prem-hero-trust">
                <div className="prem-trust-item"><Users size={16} aria-hidden="true" /> +100 traders activos</div>
                <div className="prem-trust-item"><ShieldCheck size={16} aria-hidden="true" /> Cancela en 1 clic</div>
                <div className="prem-trust-item"><Lock size={16} aria-hidden="true" /> Pago seguro con Stripe</div>
              </div>
            </section>

            {/* ── Anclas de valor ── */}
            <section className="prem-anchor">
              <div className="prem-anchor-item">
                <span className="prem-anchor-figure">1,67€</span>
                <span className="prem-anchor-label">al día — lo que un café</span>
              </div>
              <span className="prem-anchor-divider" aria-hidden="true" />
              <div className="prem-anchor-item">
                <span className="prem-anchor-figure">100%</span>
                <span className="prem-anchor-label">incluido, sin letra pequeña ni upsells</span>
              </div>
              <span className="prem-anchor-divider" aria-hidden="true" />
              <div className="prem-anchor-item">
                <span className="prem-anchor-figure">1 clic</span>
                <span className="prem-anchor-label">para cancelar cuando quieras</span>
              </div>
            </section>

            {/* ── Datos oficiales / colaboradores ── */}
            <section className="prem-partners">
              <div className="prem-partners-head">
                <span className="prem-partners-eyebrow">
                  <ShieldCheck size={14} aria-hidden="true" /> Datos oficiales, no estimaciones
                </span>
                <h2 className="prem-partners-title">
                  Herramientas que funcionan con <span className="pv2-gold">datos reales en directo</span>
                </h2>
                <p className="prem-partners-sub">
                  No inventamos cifras. Cada precio, mercado y calendario de liberaciones viene
                  directamente de las mayores fuentes del sector, en colaboración con ellas.
                </p>
              </div>
              <div className="prem-partners-grid">
                <div className="prem-partner prem-partner--dl">
                  <span className="prem-partner-mark"><DefiLlamaGlyph size={20} /></span>
                  <div className="prem-partner-text">
                    <strong>DefiLlama</strong>
                    <span>Calendario oficial de liberaciones de tokens</span>
                  </div>
                </div>
                <div className="prem-partner prem-partner--cg">
                  <span className="prem-partner-mark"><CoinGeckoGlyph size={20} /></span>
                  <div className="prem-partner-text">
                    <strong>CoinGecko</strong>
                    <span>Precios y datos de mercado en tiempo real</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Sentinela para la barra flotante — justo después del CTA principal */}
            <PremiumStickyBar isLoggedIn={!!user} />

            {/* ── Features + Pricing ── */}
            <div className="prem-split-view">
              <div className="prem-features-side">
                <h2 className="prem-section-title">Todo lo que desbloqueas</h2>
                <PremiumFeatureGrid />
              </div>

              <div className="prem-pricing-side">
                <div className="prem-pricing-card">
                  <span className="prem-pricing-glow" aria-hidden="true" />
                  <span className="prem-pricing-shine" aria-hidden="true" />
                  <span className="prem-pricing-ribbon"><Sparkles size={12} aria-hidden="true" /> Cancela en 1 clic</span>

                  <div className="prem-pricing-header">
                    <h3>Acceso Total</h3>
                  </div>

                  <div className="prem-pricing-amount-wrapper">
                    <div className="prem-pricing-amount">
                      49<span>,99€</span><small>/mes</small>
                    </div>
                    <span className="prem-pricing-perday">1,67€ al día — lo que un café</span>
                  </div>

                  <ul className="prem-pricing-list">
                    <li><Check size={16} aria-hidden="true" /> Diario de Trading con 10 estadísticas</li>
                    <li><Check size={16} aria-hidden="true" /> Guías premium desbloqueadas</li>
                    <li><Check size={16} aria-hidden="true" /> Trading en directo, incluido</li>
                    <li><Check size={16} aria-hidden="true" /> Liberaciones de tokens en tiempo real</li>
                    <li><Check size={16} aria-hidden="true" /> Portfolio Adelin</li>
                    <li><Check size={16} aria-hidden="true" /> Comunidad privada en Telegram</li>
                    <li><Check size={16} aria-hidden="true" /> Soporte prioritario</li>
                  </ul>

                  <Link href="/api/checkout" prefetch={false} className="prem-pricing-cta pv2-shine">
                    <span>{user ? "Desbloquear todo ahora" : "Empezar ahora"}</span>
                    <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                  </Link>

                  <div className="prem-pricing-footer">
                    <span><ShieldCheck size={14} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras</span>
                    <span>Pagos encriptados por Stripe.</span>
                  </div>

                  {!user && (
                    <p className="prem-pricing-login-note">
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
                <strong>49,99€/mes</strong> · Sin permanencia · Acceso inmediato
              </p>
              <Link href="/api/checkout" prefetch={false} className="prem-pricing-cta pv2-shine pv2-final-btn">
                <span>{user ? "Desbloquear todo ahora" : "Hazte Premium ahora"}</span>
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </Link>
              <p className="pv2-final-note">
                <ShieldCheck size={13} aria-hidden="true" /> Si no es para ti, cancelas en 1 clic. Sin preguntas.
              </p>
            </section>

            {/* ── Asesoría 1:1 — el escalón por encima de la suscripción ── */}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
