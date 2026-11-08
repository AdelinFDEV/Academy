import type { Metadata } from "next";
import Link from "next/link";
import {
  Check, X, ArrowRight, Crown, ShieldCheck, Lock, Zap, CreditCard, LineChart, CalendarRange, Trophy,
  EyeOff, Radio, Coins, Layers, GraduationCap, Smile, Sparkles, BookOpenText, ClipboardCheck,
  Award, Clock3, Infinity as Siempre,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import PremiumStickyBar from "@/components/PremiumStickyBar";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Certificado from "@/components/aula/Certificado";
import NovaCara from "./NovaCara";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import { CoinGeckoGlyph } from "@/components/BrandMarks";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { cursoPorSlug, cursosPublicados, duracion } from "@/lib/cursos";
import "./premium.css";

export const metadata: Metadata = {
  alternates: { canonical: "/premium" },
  title: "Hazte Premium",
  description:
    "Diario de Trading con Nova, la cartera real de AdelinBTC en directo y cursos con certificado, por 49,99 €/mes. Sin permanencia.",
};

/**
 * /premium — la página que vende la suscripción.
 *
 * Rehecha el 08-11-2026 con las tres piezas de pago ya en marcha: Diario de
 * Trading (con Nova), Portfolio Adelin y Cursos. Todo lo que se promete
 * existe y se puede comprobar:
 *  · Cursos: los datos salen de Supabase (los publicados), nunca a mano.
 *  · El foro aún NO existe: sale como «en camino», nunca como incluido.
 *  · La insignia «Miembro Fundador» existe (logros.tsx: primer pago Premium).
 *  · El precio queda fijado mientras la suscripción siga activa (FAQ).
 *  · Se cancela desde «Mi perfil», en el portal de Stripe.
 *
 * Lo que se quitó el 06-11-2026 por no ser verdad (reseñas inventadas, «+100
 * traders», «soporte prioritario», «cancela en 1 clic») no vuelve: presentar
 * reseñas que no son de clientes reales lo prohíbe la normativa europea.
 */

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/** Free frente a Premium. `"pronto"` = llega a Premium cuando exista. */
const COMPARA: { label: string; free: boolean; premium: boolean | "pronto" }[] = [
  { label: "Guías interactivas con quiz y logros", free: true, premium: true },
  { label: "Diccionario cripto", free: true, premium: true },
  { label: "Predicción de Precio", free: true, premium: true },
  { label: "Logros y rachas", free: true, premium: true },
  { label: "Diario de Trading con Nova", free: false, premium: true },
  { label: "Portfolio Adelin: spot y DCA de bitcoin", free: false, premium: true },
  { label: "Cursos con examen y certificado", free: false, premium: true },
  { label: "Insignia de Miembro Fundador", free: false, premium: true },
  { label: "Preguntar y responder en el foro", free: false, premium: "pronto" },
];

const FAQS = [
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia ni preguntas. Cancelas desde «Mi perfil», en el portal seguro de Stripe, y mantienes el acceso hasta el final del periodo que ya has pagado.",
  },
  {
    q: "¿Los cursos se pagan aparte?",
    a: "No. Todos los cursos van incluidos en la suscripción, también los que se publiquen más adelante. Sin compras sueltas.",
  },
  {
    q: "Si cancelo, ¿pierdo mis certificados?",
    a: "No. Los certificados que hayas ganado se quedan en la vitrina de tu panel y puedes descargarlos siempre, aunque ya no seas Premium. Cualquiera puede verificarlos con su código.",
  },
  {
    q: "¿El precio me subirá más adelante?",
    a: "A ti no. El precio al que te suscribes queda fijado mientras mantengas la suscripción activa, aunque suba para quien entre después. Si cancelas y vuelves más adelante, entrarías con la tarifa que haya entonces.",
  },
  {
    q: "¿Qué es Nova?",
    a: "La asistente de tu Diario de Trading. Lee lo que apuntas —operaciones, emociones y capital— y te avisa de lo importante: riesgo, rachas, si cierras las ganadoras antes de tiempo o si operas por revancha. Son reglas sobre tus datos: no inventa nada ni te da señales.",
  },
  {
    q: "¿Mi diario lo ve alguien más?",
    a: "No. Tu diario es privado: solo lo ves tú. Ni otros usuarios ni la academia lo enseñan en ninguna parte.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Con tarjeta, a través de Stripe. El pago va cifrado y nosotros nunca vemos los datos de tu tarjeta.",
  },
  {
    q: "¿Esto es asesoramiento financiero?",
    a: "No. Es formación y herramientas para que tomes tus propias decisiones con criterio. Nadie puede garantizarte rentabilidad: quien lo haga, te está mintiendo.",
  },
];

/** El botón de compra: va al checkout de Stripe (que manda al login si hace falta). */
function Cta({ texto, ancho = false }: { texto: string; ancho?: boolean }) {
  return (
    <Link href="/api/checkout" prefetch={false} className={`pm-cta${ancho ? " pm-cta--ancho" : ""}`}>
      <Crown size={18} aria-hidden="true" /> {texto} <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
    </Link>
  );
}

export default async function PremiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, cursos] = await Promise.all([
    user ? supabase.from("profiles").select("role, full_name").eq("id", user.id).single() : Promise.resolve({ data: null }),
    cursosPublicados(),
  ]);
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const nombre = (profile as { full_name?: string | null } | null)?.full_name || user?.email?.split("@")[0] || null;
  const textoCta = user ? "Hazme Premium" : "Empezar ahora";

  // El primer curso publicado, completo: su logro y su color para la muestra del certificado.
  const destacado = cursos[0] ? await cursoPorSlug(cursos[0].slug) : null;
  const totalLecciones = cursos.reduce((t, c) => t + c.lecciones, 0);
  const totalMinutos = cursos.reduce((t, c) => t + c.minutos, 0);

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={!!user} isPremium={isPremium} />

      <main className="blog-main pr pm">
        {isPremium ? (
          /* ── Quien ya es Premium: sus accesos, no la venta ── */
          <section className="pm-socio">
            <span className="pm-socio-luz" aria-hidden="true" />
            <span className="pm-socio-corona" aria-hidden="true"><Crown size={30} /></span>
            <h1 className="pm-socio-titulo">Ya eres Premium</h1>
            <p className="pm-socio-sub">Tienes todo desbloqueado. Gracias por apoyar el proyecto.</p>
            <div className="pm-socio-accesos">
              <Link href="/dashboard/trading" className="pm-socio-acceso" style={{ "--pm-c": "#ff9a4d" } as React.CSSProperties}>
                <span className="pm-socio-icono"><IconoDiario size={20} /></span>
                <span><strong>Diario de Trading</strong><small>Apunta tu próxima operación</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/portfolio" className="pm-socio-acceso" style={{ "--pm-c": "#4f9dff" } as React.CSSProperties}>
                <span className="pm-socio-icono"><IconoPortfolio size={20} /></span>
                <span><strong>Portfolio Adelin</strong><small>Mira las últimas compras</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/cursos" className="pm-socio-acceso" style={{ "--pm-c": "#e6b455" } as React.CSSProperties}>
                <span className="pm-socio-icono"><IconoCursos size={20} /></span>
                <span><strong>Cursos</strong><small>Sigue donde lo dejaste</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/dashboard/certificados" className="pm-socio-acceso" style={{ "--pm-c": "#5ec8c4" } as React.CSSProperties}>
                <span className="pm-socio-icono"><Award size={20} /></span>
                <span><strong>Mis certificados</strong><small>Tu vitrina</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <Link href="/dashboard/perfil#suscripcion" className="pm-socio-enlace">Gestionar mi suscripción</Link>
          </section>
        ) : (
          <>
            {/* ── Hero ── */}
            <section className="pm-hero">
              <div className="pm-hero-fondo" aria-hidden="true">
                <span className="pm-rejilla" />
                <span className="pm-luz pm-luz--1" />
                <span className="pm-luz pm-luz--2" />
              </div>

              <div className="pm-hero-texto">
                <span className="pm-pildora"><span className="pm-pildora-punto" aria-hidden="true" /> AdelinBTC Premium</span>
                <h1 className="pm-titulo">
                  Opera con método.
                  <span className="pm-titulo-oro">Aprende con certificado.</span>
                </h1>
                <p className="pm-lead">
                  Tu <strong>Diario de Trading con Nova</strong>, la <strong>cartera real de AdelinBTC</strong> en directo
                  y <strong>cursos con examen y certificado</strong>. Una sola suscripción, todo incluido.
                </p>

                <div className="pm-compra">
                  <Cta texto={textoCta} />
                  <span className="pm-compra-precio">
                    <strong>{PRECIO}</strong><span>/mes</span>
                    <small>Unos {PRECIO_DIA} al día · Sin permanencia</small>
                  </span>
                </div>

                <ul className="pm-confianza">
                  <li><Lock size={15} aria-hidden="true" /> Pago seguro con Stripe</li>
                  <li><Zap size={15} aria-hidden="true" /> Acceso inmediato</li>
                  <li><ShieldCheck size={15} aria-hidden="true" /> Cancela cuando quieras</li>
                </ul>
              </div>

              {/* Las tres piezas, apiladas como un abanico. Decorativo. */}
              <div className="pm-abanico" aria-hidden="true">
                <div className="pm-carta pm-carta--diario">
                  <div className="pm-carta-cab"><span className="pm-carta-icono is-naranja"><IconoDiario size={15} /></span> Diario de Trading</div>
                  <div className="pm-carta-kpis">
                    <div><small>Win rate</small><strong>58 %</strong></div>
                    <div><small>P&amp;L</small><strong className="is-verde">+12,4 %</strong></div>
                    <div><small>Pulso Nova</small><strong>82</strong></div>
                  </div>
                  <svg className="pm-carta-curva" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="pm-relleno" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#ff9a4d" stopOpacity=".35" />
                        <stop offset="1" stopColor="#ff9a4d" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 70 L30 64 L60 67 L90 54 L120 58 L150 44 L180 48 L210 34 L240 38 L270 22 L300 12 L300 80 L0 80 Z" fill="url(#pm-relleno)" />
                    <path className="pm-carta-linea" d="M0 70 L30 64 L60 67 L90 54 L120 58 L150 44 L180 48 L210 34 L240 38 L270 22 L300 12" pathLength={1} fill="none" stroke="#ff9a4d" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                  <div className="pm-carta-nova"><Sparkles size={13} /> Nova: «Riesgo bajo control esta semana»</div>
                </div>

                <div className="pm-carta pm-carta--portfolio">
                  <div className="pm-carta-cab">
                    <span className="pm-carta-icono is-azul"><IconoPortfolio size={15} /></span> Portfolio Adelin
                    <span className="pm-directo"><span className="pm-directo-punto" /> En directo</span>
                  </div>
                  <div className="pm-carta-pestanas">
                    <span className="is-activa">Spot</span>
                    <span>DCA</span>
                  </div>
                  <div className="pm-carta-filas">
                    {[78, 54, 36].map((w, i) => (
                      <div key={i} className="pm-carta-fila">
                        <span className="pm-carta-moneda" />
                        <span className="pm-carta-barra"><span style={{ width: `${w}%` }} /></span>
                        <span className="pm-carta-velo" />
                      </div>
                    ))}
                  </div>
                </div>

                {destacado && (
                  <div className="pm-carta-cert">
                    <Certificado
                      muestra
                      nombre={nombre ?? "Tu nombre aquí"}
                      curso={destacado.curso.titulo}
                      logro={destacado.curso.logro}
                      notaFinal={8.75}
                      notaModulos={8.4}
                      notaExamen={9}
                      fecha={destacado.curso.updated_at}
                      codigo="XXXXXXXXXX"
                      color={destacado.curso.color}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* La barra de abajo aparece en cuanto el hero sale de la vista. */}
            <PremiumStickyBar isLoggedIn={!!user} />

            {/* ── Franja: todo lo que entra ── */}
            <section className="pm-franja" aria-label="Qué incluye Premium">
              <span><IconoDiario size={18} /> Diario de Trading</span>
              <span><Sparkles size={17} /> Nova, tu asistente</span>
              <span><IconoPortfolio size={18} /> Portfolio Adelin</span>
              <span><IconoCursos size={18} /> Cursos</span>
              <span><Award size={17} /> Certificados</span>
              <span><Trophy size={17} /> Insignia de Fundador</span>
            </section>

            {/* ── 01 · Diario de Trading ── */}
            <section className="pm-pieza" style={{ "--pm-c": "#ff9a4d" } as React.CSSProperties} aria-labelledby="pm-diario">
              <div className="pm-pieza-texto">
                <span className="pm-num">01</span>
                <span className="pm-kicker"><IconoDiario size={16} /> Diario de Trading</span>
                <h2 id="pm-diario" className="pm-h2">Deja de operar de memoria</h2>
                <p className="pm-p">
                  Apuntas cada operación en un minuto y el diario hace las cuentas: te dice cómo operas de verdad, no
                  cómo crees que operas. Y Nova te avisa de lo que se te escapa.
                </p>
                <ul className="pm-lista">
                  <li><LineChart size={17} /> <span><strong>Diez estadísticas</strong> y tu curva de capital</span></li>
                  <li><CalendarRange size={17} /> <span><strong>Calendario</strong> y desglose por par, estrategia, día y hora</span></li>
                  <li><Smile size={17} /> <span><strong>Tus emociones</strong> de cada día, junto a tus resultados</span></li>
                  <li><Sparkles size={17} /> <span><strong>Nova</strong>: tu pulso de 0 a 100 y avisos de riesgo, rachas y revancha</span></li>
                  <li><Trophy size={17} /> <span><strong>Hitos con niveles</strong> que premian la disciplina</span></li>
                  <li><EyeOff size={17} /> <span><strong>Privado</strong>: solo lo ves tú</span></li>
                </ul>
                <Link href="/herramientas/diario" className="pm-enlace">Ver el Diario por dentro <ArrowRight size={15} /></Link>
              </div>
              <div className="pm-pieza-arte" aria-hidden="true">
                <div className="pm-panel pm-nova">
                  <div className="pm-nova-cab">
                    <span className="pm-nova-cara"><NovaCara /></span>
                    <span><strong>Nova</strong><small>Lo más importante</small></span>
                    <span className="pm-nova-pulso">82<small>/100</small></span>
                  </div>
                  <p className="pm-nova-msg is-bien">Riesgo bajo control: ninguna operación pasa del 2 % de la cuenta.</p>
                  <p className="pm-nova-msg is-ojo">Cierras las ganadoras antes de tiempo: te quedas con el 45 % del objetivo.</p>
                  <p className="pm-nova-msg">Racha de 4 ganadas: cuidado con subir el tamaño por euforia.</p>
                </div>
              </div>
            </section>

            {/* ── 02 · Portfolio Adelin ── */}
            <section className="pm-pieza pm-pieza--inversa" style={{ "--pm-c": "#4f9dff" } as React.CSSProperties} aria-labelledby="pm-portfolio">
              <div className="pm-pieza-texto">
                <span className="pm-num">02</span>
                <span className="pm-kicker"><IconoPortfolio size={16} /> Portfolio Adelin</span>
                <h2 id="pm-portfolio" className="pm-h2">La cartera real, sin capturas ni promesas</h2>
                <p className="pm-p">
                  Qué compra AdelinBTC, a qué precio y cómo va, actualizado con precios de mercado. También las
                  posiciones que pierden.
                </p>
                <ul className="pm-lista">
                  <li><Radio size={17} /> <span><strong>Precios y rentabilidad</strong> en directo</span></li>
                  <li><Layers size={17} /> <span><strong>Cartera spot</strong>, moneda a moneda</span></li>
                  <li><Coins size={17} /> <span><strong>DCA de bitcoin</strong>, compra a compra</span></li>
                  <li><span className="pm-cg"><CoinGeckoGlyph size={16} /></span> <span>Datos de mercado de <strong>CoinGecko</strong></span></li>
                </ul>
                <Link href="/herramientas/portfolio" className="pm-enlace">Ver cómo funciona <ArrowRight size={15} /></Link>
              </div>
              <div className="pm-pieza-arte" aria-hidden="true">
                <div className="pm-panel pm-cartera">
                  <div className="pm-cartera-cab"><span>Spot</span><span className="pm-directo"><span className="pm-directo-punto" /> En directo</span></div>
                  {/* Sin nombres de monedas: es un dibujo, no la cartera de verdad. */}
                  {[82, 64, 48, 30].map((w, i) => (
                    <div key={i} className="pm-cartera-fila">
                      <span className="pm-cartera-moneda" />
                      <span className="pm-cartera-barra"><i style={{ width: `${w}%` }} /></span>
                      <span className="pm-cartera-velo"><Lock size={12} /></span>
                    </div>
                  ))}
                  <span className="pm-cartera-pie"><Lock size={13} /> Las cifras se ven con Premium</span>
                </div>
              </div>
            </section>

            {/* ── 03 · Cursos ── */}
            <section className="pm-pieza" style={{ "--pm-c": "#e6b455" } as React.CSSProperties} aria-labelledby="pm-cursos">
              <div className="pm-pieza-texto">
                <span className="pm-num">03</span>
                <span className="pm-kicker"><IconoCursos size={16} /> Cursos</span>
                <h2 id="pm-cursos" className="pm-h2">Aprende en orden, y termina con tu certificado</h2>
                <p className="pm-p">
                  Cursos completos, módulo a módulo y a tu ritmo, con un examen en cada módulo. Al aprobar el final
                  recibes un certificado con tu nombre, verificable, que se queda en tu vitrina para siempre.
                </p>
                {cursos.length > 0 && (
                  <ul className="pm-cursos">
                    {cursos.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/cursos/${c.slug}`} className="pm-curso" style={{ "--pm-cc": c.color } as React.CSSProperties}>
                          <span className="pm-curso-icono"><GraduationCap size={18} /></span>
                          <span className="pm-curso-texto">
                            <strong>{c.titulo}</strong>
                            <small>{c.modulos} módulos · {c.lecciones} lecciones · {duracion(c.minutos)}</small>
                          </span>
                          <ArrowRight size={15} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="pm-lista pm-lista--compacta">
                  <li><BookOpenText size={17} /> <span><strong>{totalLecciones} lecciones</strong> con gráficos y minijuegos ({duracion(totalMinutos)})</span></li>
                  <li><ClipboardCheck size={17} /> <span><strong>Examen en cada módulo</strong> y final con nota de 0 a 10</span></li>
                  <li><Siempre size={17} /> <span><strong>Todos los cursos</strong> que se publiquen, sin pagar aparte</span></li>
                </ul>
                <Link href="/cursos" className="pm-enlace">Ver los cursos <ArrowRight size={15} /></Link>
              </div>
              {destacado && (
                <div className="pm-pieza-arte" aria-hidden="true">
                  <div className="pm-cert-escena">
                    <span className="pm-cert-etiqueta"><Award size={13} /> Así será el tuyo</span>
                    <div className="pm-cert-marco">
                      <Certificado
                        muestra
                        nombre={nombre ?? "Tu nombre aquí"}
                        curso={destacado.curso.titulo}
                        logro={destacado.curso.logro}
                        notaFinal={8.75}
                        notaModulos={8.4}
                        notaExamen={9}
                        fecha={destacado.curso.updated_at}
                        codigo="XXXXXXXXXX"
                        color={destacado.curso.color}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ── Miembro Fundador ── */}
            <section className="pm-fundador">
              <span className="pm-fundador-medalla" aria-hidden="true"><Crown size={28} /></span>
              <div>
                <span className="pm-kicker">Con tu primer pago</span>
                <h2 className="pm-h2">Insignia de Miembro Fundador, para siempre en tu perfil</h2>
                <p className="pm-p">
                  Con tu primer pago Premium desbloqueas el logro especial «Miembro Fundador»: la marca de quien apoyó el
                  proyecto desde el principio. Y tu precio queda fijado mientras mantengas la suscripción.
                </p>
              </div>
            </section>

            {/* ── El precio ── */}
            <section className="pm-precio" aria-labelledby="pm-precio">
              <div className="pm-precio-texto">
                <span className="pm-kicker">Un solo plan</span>
                <h2 id="pm-precio" className="pm-h2">Todo incluido. Sin letra pequeña.</h2>
                <p className="pm-p">Ni niveles, ni extras de pago, ni permanencia. Pagas un mes y tienes todo ese mes.</p>
                <div className="pm-precio-datos">
                  <div><strong>{PRECIO_DIA}</strong><span>al día</span></div>
                  <div><strong>3</strong><span>piezas de pago</span></div>
                  <div><strong>0</strong><span>permanencia</span></div>
                </div>
              </div>

              <div className="pm-tarjeta">
                <span className="pm-tarjeta-brillo" aria-hidden="true" />
                <span className="pm-tarjeta-sello">Todo incluido</span>
                <div className="pm-tarjeta-cab">
                  <span className="pm-tarjeta-corona" aria-hidden="true"><Crown size={20} /></span>
                  <span>Premium</span>
                </div>
                <div className="pm-tarjeta-importe">{PRECIO}<small>/mes</small></div>
                <p className="pm-tarjeta-dia">Unos {PRECIO_DIA} al día</p>
                <ul className="pm-tarjeta-lista">
                  <li><Check size={16} /> Diario de Trading con Nova</li>
                  <li><Check size={16} /> Portfolio Adelin: spot y DCA en directo</li>
                  <li><Check size={16} /> Todos los cursos, con certificado</li>
                  <li><Check size={16} /> Insignia de Miembro Fundador</li>
                  <li><Check size={16} /> Todo lo gratuito, también</li>
                  <li className="is-pronto"><Clock3 size={16} /> El foro, cuando llegue</li>
                </ul>
                <Cta texto={textoCta} ancho />
                <p className="pm-tarjeta-pie"><CreditCard size={14} /> Pago cifrado con Stripe · Cancela cuando quieras</p>
                {!user && (
                  <p className="pm-tarjeta-login">¿Ya tienes cuenta? <Link href="/login?next=/api/checkout">Inicia sesión</Link></p>
                )}
              </div>
            </section>

            {/* ── Gratis frente a Premium ── */}
            <section className="pm-seccion" aria-labelledby="pm-compara">
              <header className="pm-cab">
                <span className="pm-kicker">Gratis frente a Premium</span>
                <h2 id="pm-compara" className="pm-h2">Lo gratuito sigue siendo tuyo</h2>
              </header>
              <div className="pm-tabla" role="table" aria-label="Qué incluye cada plan">
                <div className="pm-tabla-fila pm-tabla-cab" role="row">
                  <span role="columnheader">Qué incluye</span>
                  <span role="columnheader">Gratis</span>
                  <span role="columnheader" className="is-premium"><Crown size={13} aria-hidden="true" /> Premium</span>
                </div>
                {COMPARA.map((f) => (
                  <div key={f.label} className="pm-tabla-fila" role="row">
                    <span role="cell">{f.label}</span>
                    <span role="cell">
                      {f.free ? <Check size={17} className="pm-si" aria-label="Incluido" /> : <X size={16} className="pm-no" aria-label="No incluido" />}
                    </span>
                    <span role="cell" className="is-premium">
                      {f.premium === true ? <Check size={17} className="pm-si" aria-label="Incluido" /> : <span className="pm-pronto">Pronto</span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Preguntas ── */}
            <section className="pm-seccion" aria-labelledby="pm-faq">
              <header className="pm-cab">
                <span className="pm-kicker">Antes de suscribirte</span>
                <h2 id="pm-faq" className="pm-h2">Preguntas frecuentes</h2>
              </header>
              <div className="pm-faq">
                {FAQS.map((f) => (
                  <details key={f.q} className="pm-faq-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* ── Cierre ── */}
            <section className="pm-final">
              <span className="pm-final-luz" aria-hidden="true" />
              <span className="pm-final-corona" aria-hidden="true"><Crown size={26} /></span>
              <h2 className="pm-final-titulo">Empieza hoy. Opera con método y aprende con certificado.</h2>
              <p className="pm-p">{PRECIO} al mes · Sin permanencia · Acceso inmediato</p>
              <Cta texto={user ? "Hazme Premium" : "Hazte Premium"} />
            </section>

            <DisclaimerRiesgo variante="portfolio" />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
