import type { Metadata } from "next";
import Link from "next/link";
import {
  Check, X, ArrowRight, Crown, ShieldCheck, Lock, Zap, CreditCard, LineChart,
  CalendarRange, Trophy, EyeOff, Radio, Coins, Layers, GraduationCap, MessagesSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PremiumStickyBar from "@/components/PremiumStickyBar";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import { CoinGeckoGlyph } from "@/components/BrandMarks";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import "./premium.css";

export const metadata: Metadata = {
  alternates: { canonical: "/premium" },
  title: "Hazte Premium",
  description:
    "Desbloquea el diario de trading y el Portfolio Adelin en tiempo real por 49,99€/mes. Sin permanencia.",
};

/**
 * /premium — la página que vende la suscripción.
 *
 * Rehecha de cero el 06-11-2026. Fuera, por no ser verdad:
 *  - las **reseñas** con estrellas («Marcos R.», «Laura G.»): no eran de
 *    clientes. Presentar reseñas que no vienen de compradores reales es una
 *    práctica prohibida por la normativa europea de consumo (Directiva
 *    Ómnibus). Si algún día hay opiniones reales, se piden con permiso;
 *  - «+100 traders activos»: no había ese número de cuentas;
 *  - «Soporte prioritario»: no existe. El soporte es el mismo para todos, por
 *    Instagram;
 *  - «Cancela en 1 clic»: se cancela desde «Mi perfil», en el portal de
 *    Stripe. Es fácil, pero no es un clic.
 *
 * Lo que se promete sale de lo que hacen las herramientas, revisado para sus
 * fichas (`/herramientas/diario` y `/herramientas/portfolio`). Los Cursos y
 * el foro aún no existen: salen como «en camino», nunca como incluidos ya.
 */

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/** Free frente a Premium. `"pronto"` = llega a Premium cuando exista. */
const COMPARA: { label: string; free: boolean; premium: boolean | "pronto" }[] = [
  { label: "Guías interactivas con quiz y logros", free: true, premium: true },
  { label: "Diccionario cripto", free: true, premium: true },
  { label: "Predicción de Precio", free: true, premium: true },
  { label: "Logros y rachas", free: true, premium: true },
  { label: "Diario de Trading", free: false, premium: true },
  { label: "Portfolio Adelin: spot y DCA de bitcoin", free: false, premium: true },
  { label: "Cursos con examen y certificado", free: false, premium: "pronto" },
  { label: "Preguntar y responder en el foro", free: false, premium: "pronto" },
];

const FAQS = [
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia ni preguntas. Cancelas desde «Mi perfil», en el portal seguro de Stripe, y mantienes el acceso hasta el final del periodo que ya has pagado.",
  },
  {
    q: "¿El precio me subirá más adelante?",
    a: "A ti no. El precio al que te suscribes queda fijado mientras mantengas la suscripción activa, aunque suba para quien entre después. Si cancelas y vuelves más adelante, entrarías con la tarifa que haya entonces.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Con tarjeta, a través de Stripe. El pago va cifrado y nosotros nunca vemos los datos de tu tarjeta.",
  },
  {
    q: "¿Mi diario lo ve alguien más?",
    a: "No. Tu diario es privado: solo lo ves tú. Ni otros usuarios ni la academia lo enseñan en ninguna parte.",
  },
  {
    q: "¿Esto es asesoramiento financiero?",
    a: "No. Es formación y herramientas para que tomes tus propias decisiones con criterio. Nadie puede garantizarte rentabilidad: quien lo haga, te está mintiendo.",
  },
];

export default async function PremiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const textoCta = user ? "Desbloquear todo" : "Empezar ahora";

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} />

      <main className="blog-main pr">
        {isPremium ? (
          /* ── Quien ya es Premium: sus accesos, no la venta ── */
          <section className="pr-socio">
            <span className="pr-socio-luz" aria-hidden="true" />
            <span className="pr-socio-corona" aria-hidden="true"><Crown size={30} /></span>
            <h1 className="pr-socio-titulo">Ya eres Premium</h1>
            <p className="pr-socio-sub">Tienes todo desbloqueado. Gracias por apoyar el proyecto.</p>
            <div className="pr-socio-accesos">
              <Link href="/dashboard/trading" className="pr-socio-acceso" style={{ "--pr-c": "#ff9a4d" } as React.CSSProperties}>
                <span className="pr-socio-icono"><IconoDiario size={20} /></span>
                <span><strong>Diario de Trading</strong><small>Apunta tu próxima operación</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/portfolio" className="pr-socio-acceso" style={{ "--pr-c": "#4f9dff" } as React.CSSProperties}>
                <span className="pr-socio-icono"><IconoPortfolio size={20} /></span>
                <span><strong>Portfolio Adelin</strong><small>Mira las últimas compras</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <Link href="/dashboard/perfil#suscripcion" className="pr-socio-enlace">Gestionar mi suscripción</Link>
          </section>
        ) : (
          <>
            {/* ── Hero ── */}
            <section className="pr-hero">
              <div className="pr-hero-fondo" aria-hidden="true">
                <span className="pr-orbe pr-orbe--1" />
                <span className="pr-orbe pr-orbe--2" />
                <span className="pr-hero-trama" />
              </div>

              <div className="pr-hero-texto">
                <span className="pr-eyebrow"><Crown size={14} aria-hidden="true" /> AdelinBTC Premium</span>
                <h1 className="pr-hero-titulo">
                  Opera con método,<br />
                  <span className="pr-oro">no de memoria.</span>
                </h1>
                <p className="pr-hero-sub">
                  El diario que hace las cuentas de cada operación por ti y la cartera real de
                  AdelinBTC en directo. Una suscripción, todo incluido.
                </p>

                <div className="pr-hero-compra">
                  <Link href="/api/checkout" prefetch={false} className="pr-cta">
                    {textoCta} <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                  </Link>
                  <span className="pr-hero-precio">
                    <span><strong>{PRECIO}</strong> al mes</span>
                    <small>Sin permanencia</small>
                  </span>
                </div>

                <ul className="pr-confianza">
                  <li><Lock size={15} aria-hidden="true" /> Pago seguro con Stripe</li>
                  <li><Zap size={15} aria-hidden="true" /> Acceso inmediato</li>
                  <li><ShieldCheck size={15} aria-hidden="true" /> Cancela cuando quieras</li>
                </ul>
              </div>

              {/* Las dos herramientas, dibujadas. Decorativo: el diario es
                  privado de cada uno y la cartera se ve dentro. */}
              <div className="pr-hero-arte" aria-hidden="true">
                <div className="pr-maqueta pr-maqueta--diario">
                  <div className="pr-maqueta-cab">
                    <span className="pr-maqueta-icono is-naranja"><IconoDiario size={15} /></span>
                    Diario de Trading
                  </div>
                  <div className="pr-maqueta-kpis">
                    <div><small>Win rate</small><strong>58 %</strong></div>
                    <div><small>P&amp;L</small><strong className="is-verde">+12,4 %</strong></div>
                    <div><small>Operaciones</small><strong>47</strong></div>
                  </div>
                  <svg className="pr-maqueta-curva" viewBox="0 0 300 90" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="pr-relleno" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#ff9a4d" stopOpacity=".35" />
                        <stop offset="1" stopColor="#ff9a4d" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 78 L25 72 L50 75 L75 62 L100 66 L125 52 L150 56 L175 42 L200 46 L225 30 L250 34 L275 20 L300 12 L300 90 L0 90 Z" fill="url(#pr-relleno)" />
                    <path className="pr-maqueta-linea" d="M0 78 L25 72 L50 75 L75 62 L100 66 L125 52 L150 56 L175 42 L200 46 L225 30 L250 34 L275 20 L300 12" pathLength={1} fill="none" stroke="#ff9a4d" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="pr-maqueta pr-maqueta--portfolio">
                  <div className="pr-maqueta-cab">
                    <span className="pr-maqueta-icono is-azul"><IconoPortfolio size={15} /></span>
                    Portfolio Adelin
                    <span className="pr-directo"><span className="pr-directo-punto" /> En directo</span>
                  </div>
                  <div className="pr-maqueta-filas">
                    {[78, 54, 36].map((w, i) => (
                      <div key={i} className="pr-maqueta-fila">
                        <span className="pr-maqueta-moneda" />
                        <span className="pr-maqueta-barra"><span style={{ width: `${w}%` }} /></span>
                        <span className="pr-maqueta-velo" />
                      </div>
                    ))}
                  </div>
                  <div className="pr-maqueta-candado"><Lock size={13} /> Desbloquéalo con Premium</div>
                </div>
              </div>
            </section>

            {/* La barra de abajo aparece en cuanto el hero sale de la vista. */}
            <PremiumStickyBar isLoggedIn={!!user} />

            {/* ── Lo que desbloqueas ── */}
            <section className="pr-seccion" aria-labelledby="pr-incluye">
              <header className="pr-cab">
                <span className="pr-eyebrow">Lo que desbloqueas</span>
                <h2 id="pr-incluye" className="pr-h2">Dos herramientas para dejar de improvisar</h2>
              </header>

              <div className="pr-productos">
                <article className="pr-producto" style={{ "--pr-c": "#ff9a4d" } as React.CSSProperties}>
                  <span className="pr-producto-luz" aria-hidden="true" />
                  <span className="pr-producto-icono" aria-hidden="true"><IconoDiario size={26} /></span>
                  <h3>Diario de Trading</h3>
                  <p>Apuntas cada operación en un minuto y el diario te dice cómo operas de verdad, no cómo crees que operas.</p>
                  <ul>
                    <li><LineChart size={16} aria-hidden="true" /> Diez estadísticas y tu curva de capital</li>
                    <li><CalendarRange size={16} aria-hidden="true" /> Calendario y desglose por par, estrategia, día y hora</li>
                    <li><Trophy size={16} aria-hidden="true" /> Hitos con niveles que premian la disciplina</li>
                    <li><EyeOff size={16} aria-hidden="true" /> Privado: solo lo ves tú</li>
                  </ul>
                  <Link href="/herramientas/diario" className="pr-producto-enlace">
                    Ver cómo funciona <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </article>

                <article className="pr-producto" style={{ "--pr-c": "#4f9dff" } as React.CSSProperties}>
                  <span className="pr-producto-luz" aria-hidden="true" />
                  <span className="pr-producto-icono" aria-hidden="true"><IconoPortfolio size={26} /></span>
                  <h3>Portfolio Adelin</h3>
                  <p>La cartera real de AdelinBTC: qué compra, a qué precio y cómo va. Sin capturas de pantalla ni promesas.</p>
                  <ul>
                    <li><Radio size={16} aria-hidden="true" /> Precios y rentabilidad en directo</li>
                    <li><Layers size={16} aria-hidden="true" /> Cartera spot, moneda a moneda</li>
                    <li><Coins size={16} aria-hidden="true" /> DCA de bitcoin, compra a compra</li>
                    <li><span className="pr-cg" aria-hidden="true"><CoinGeckoGlyph size={15} /></span> Datos de mercado de CoinGecko</li>
                  </ul>
                  <Link href="/herramientas/portfolio" className="pr-producto-enlace">
                    Ver cómo funciona <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </article>
              </div>

              {/* Lo que viene: honesto, sin darlo por hecho. */}
              <div className="pr-pronto">
                <span className="pr-pronto-etiqueta">En camino</span>
                <div className="pr-pronto-items">
                  <span><GraduationCap size={17} aria-hidden="true" /> <strong>Cursos</strong> con examen y certificado</span>
                  <span><MessagesSquare size={17} aria-hidden="true" /> <strong>Foro</strong> para preguntar y responder</span>
                </div>
                <p>Cuando se publiquen, entran en tu suscripción sin pagar aparte.</p>
              </div>
            </section>

            {/* ── El precio ── */}
            <section className="pr-seccion pr-precio" aria-labelledby="pr-precio">
              <div className="pr-precio-texto">
                <span className="pr-eyebrow">Un solo plan</span>
                <h2 id="pr-precio" className="pr-h2">Todo incluido, sin letra pequeña</h2>
                <p>Ni niveles, ni extras de pago, ni permanencia. Pagas un mes y tienes todo ese mes.</p>
                <div className="pr-precio-datos">
                  <div><strong>{PRECIO_DIA}</strong><span>al día</span></div>
                  <div><strong>0</strong><span>permanencia</span></div>
                  <div><strong>Al instante</strong><span>acceso tras pagar</span></div>
                </div>
              </div>

              <div className="pr-tarjeta">
                <span className="pr-tarjeta-brillo" aria-hidden="true" />
                <div className="pr-tarjeta-cab">
                  <span className="pr-tarjeta-corona" aria-hidden="true"><Crown size={20} /></span>
                  <span>Premium</span>
                </div>
                <div className="pr-tarjeta-importe">
                  {PRECIO}<small>/mes</small>
                </div>
                <ul className="pr-tarjeta-lista">
                  <li><Check size={16} aria-hidden="true" /> Diario de Trading completo</li>
                  <li><Check size={16} aria-hidden="true" /> Portfolio Adelin: spot y DCA</li>
                  <li><Check size={16} aria-hidden="true" /> Todo lo gratuito, también</li>
                  <li><Check size={16} aria-hidden="true" /> Cursos y foro cuando lleguen</li>
                </ul>
                <Link href="/api/checkout" prefetch={false} className="pr-cta pr-cta--ancho">
                  {textoCta} <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                </Link>
                <p className="pr-tarjeta-pie">
                  <CreditCard size={14} aria-hidden="true" /> Pago cifrado con Stripe · Cancela cuando quieras
                </p>
                {!user && (
                  <p className="pr-tarjeta-login">
                    ¿Ya tienes cuenta? <Link href="/login?next=/api/checkout">Inicia sesión</Link>
                  </p>
                )}
              </div>
            </section>

            {/* ── Gratis frente a Premium ── */}
            <section className="pr-seccion" aria-labelledby="pr-compara">
              <header className="pr-cab">
                <span className="pr-eyebrow">Gratis frente a Premium</span>
                <h2 id="pr-compara" className="pr-h2">Lo gratuito sigue siendo tuyo</h2>
              </header>
              <div className="pr-tabla" role="table" aria-label="Qué incluye cada plan">
                <div className="pr-tabla-fila pr-tabla-cab" role="row">
                  <span role="columnheader">Qué incluye</span>
                  <span role="columnheader">Gratis</span>
                  <span role="columnheader" className="is-premium"><Crown size={13} aria-hidden="true" /> Premium</span>
                </div>
                {COMPARA.map((f) => (
                  <div key={f.label} className="pr-tabla-fila" role="row">
                    <span role="cell">{f.label}</span>
                    <span role="cell">
                      {f.free
                        ? <Check size={17} className="pr-si" aria-label="Incluido" />
                        : <X size={16} className="pr-no" aria-label="No incluido" />}
                    </span>
                    <span role="cell" className="is-premium">
                      {f.premium === true
                        ? <Check size={17} className="pr-si" aria-label="Incluido" />
                        : <span className="pr-pronto-chip">Pronto</span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Preguntas ── */}
            <section className="pr-seccion" aria-labelledby="pr-faq">
              <header className="pr-cab">
                <span className="pr-eyebrow">Antes de suscribirte</span>
                <h2 id="pr-faq" className="pr-h2">Preguntas frecuentes</h2>
              </header>
              <div className="pr-faq">
                {FAQS.map((f) => (
                  <details key={f.q} className="pr-faq-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* ── Cierre ── */}
            <section className="pr-final">
              <span className="pr-final-luz" aria-hidden="true" />
              <span className="pr-final-corona" aria-hidden="true"><Crown size={26} /></span>
              <h2 className="pr-final-titulo">Empieza hoy a operar con método</h2>
              <p>{PRECIO} al mes · Sin permanencia · Acceso inmediato</p>
              <Link href="/api/checkout" prefetch={false} className="pr-cta">
                {user ? "Desbloquear todo" : "Hazte Premium"} <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
              </Link>
            </section>

            <DisclaimerRiesgo variante="portfolio" />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
