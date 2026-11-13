import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Award, BookOpenText, CalendarRange, Check, ChevronDown, Crown, LineChart, Lock,
  Medal, MessageCircleQuestion, ShieldCheck, Smile, Sparkles, Target, Zap,
} from "lucide-react";
import { detalleDe, herramienta } from "@/lib/herramientas";
import type { CursoResumen } from "@/lib/cursos";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { INSTAGRAM_DM_URL } from "@/lib/contacto";
import { AVATAR_ADMIN } from "@/lib/perfilPublico";
import { PREGUNTAS_FRECUENTES } from "@/lib/preguntas-frecuentes";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import { InstagramIcon } from "@/components/SocialLinks";
import NovaMini from "@/components/NovaMini";
import type { ResumenHero } from "@/components/HeroSlider";
import "./premium-home.css";

/**
 * El cierre de la portada: Premium, lo gratuito y las preguntas frecuentes.
 *
 * Rehecho de cero el 08-11-2026. Sustituye a la sección de tres tarjetas del
 * 04-11 y absorbe el popup flotante de dudas (`DudasInstagram`), que se quitó
 * de toda la web: sus preguntas viven ahora aquí, al final de la portada, con
 * el enlace a Instagram para lo que no esté.
 *
 * Tres bloques:
 *  1. Un bento con las tres piezas de pago y una franja con lo gratuito.
 *  2. La oferta: precio, lo que entra y el botón. Solo para quien no es Premium.
 *  3. Preguntas frecuentes y contacto. Para todos.
 *
 * Todo lo que dice es verdad y sale de su fuente:
 *  · La rentabilidad de la cartera, de `resumenPortfolioPublico()` (la misma
 *    del slider del hero). Sin importes: solo porcentajes.
 *  · Cursos, lecciones y horas, de `cursosPublicados()` en Supabase.
 *  · Las preguntas, de `preguntas-frecuentes.ts`, compartidas con /premium.
 *  · El panel del Diario es un dibujo y lo dice («Ejemplo»): no son datos de
 *    nadie.
 * Ni reseñas ni contadores de usuarios: se quitaron de /premium el 06-11-2026
 * por inventados, y no vuelven por aquí.
 */

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;

/** Lo que se queda gratis para siempre, con cuenta o sin ella. */
const GRATIS = [
  { href: "/guias", Icono: BookOpenText, titulo: "Guías interactivas", texto: "Con quiz y logro" },
  { href: "/glosario", Icono: Sparkles, titulo: "Diccionario cripto", texto: "Cada término, explicado" },
  { href: "/calculadora", Icono: Target, titulo: "Predicción de Precio", texto: "Market cap objetivo" },
  { href: "/logros", Icono: Medal, titulo: "Logros y rachas", texto: "Con cuenta gratuita" },
];

const INCLUYE = [
  "Diario de Trading con Nova",
  "Portfolio Adelin: spot y DCA de bitcoin",
  "Todos los cursos, con examen y certificado",
  "Insignia de Miembro Fundador",
  "Todo lo que se añada, sin pagar más",
];

interface Props {
  portfolio: ResumenHero;
  cursos: CursoResumen[];
  isPremium: boolean;
}

export default function PremiumHome({ portfolio, cursos, isPremium }: Props) {
  const diario = herramienta("diario");
  const cartera = herramienta("portfolio");
  const aula = herramienta("cursos");
  // Quien ya es Premium va a la herramienta; el resto, a su ficha pública.
  const destino = (h: typeof diario) => (isPremium && h.premiumHref ? h.premiumHref : detalleDe(h));

  const lecciones = cursos.reduce((t, c) => t + c.lecciones, 0);
  const minutos = cursos.reduce((t, c) => t + c.minutos, 0);
  const preguntas = PREGUNTAS_FRECUENTES.filter((p) => p.portada);

  return (
    <section className="pf" aria-labelledby="pf-titulo">
      <div className="pf-fondo" aria-hidden="true">
        <span className="pf-rejilla" />
        <span className="pf-luz pf-luz--oro" />
        <span className="pf-luz pf-luz--azul" />
      </div>

      <div className={`pf-inner${isPremium ? " pf-inner--premium" : ""}`}>
        {/* A quien ya es Premium no se le vende lo que ya tiene (13-11-2026):
            en vez del escaparate y la oferta, tres accesos a sus herramientas. */}
        {isPremium ? (
          <nav className="pf-accesos" aria-label="Tus herramientas">
            <p className="pf-accesos-titulo"><Crown size={15} aria-hidden="true" /> Tu Premium</p>
            <Link href={destino(diario)} className="pf-acceso" style={{ "--c": diario.color } as React.CSSProperties}>
              <span className="pf-icono" aria-hidden="true"><IconoDiario size={22} /></span>
              <span><strong>Diario de Trading</strong><small>Apunta tu próxima operación</small></span>
              <ArrowUpRight className="pf-ir" size={18} aria-hidden="true" />
            </Link>
            <Link href={destino(cartera)} className="pf-acceso" style={{ "--c": cartera.color } as React.CSSProperties}>
              <span className="pf-icono" aria-hidden="true"><IconoPortfolio size={22} /></span>
              <span>
                <strong>Portfolio Adelin</strong>
                <small>{portfolio ? `${pct(portfolio.rentabilidadPct)} · ${portfolio.posiciones} posiciones` : "La cartera, en vivo"}</small>
              </span>
              <ArrowUpRight className="pf-ir" size={18} aria-hidden="true" />
            </Link>
            <Link href={destino(aula)} className="pf-acceso" style={{ "--c": aula.color } as React.CSSProperties}>
              <span className="pf-icono" aria-hidden="true"><IconoCursos size={22} /></span>
              <span><strong>Cursos</strong><small>{cursos.length > 0 ? `${cursos.length} cursos · ${lecciones} lecciones` : "Con examen y certificado"}</small></span>
              <ArrowUpRight className="pf-ir" size={18} aria-hidden="true" />
            </Link>
          </nav>
        ) : (
        <>
        <header className="pf-cabecera">
          <span className="pf-sello"><Crown size={13} aria-hidden="true" /> AdelinBTC Premium</span>
          <h2 id="pf-titulo" className="pf-titulo">
            Opera con método.
            <span>Aprende con certificado.</span>
          </h2>
          <p className="pf-lead">
            Tu diario con una asistente que te avisa de lo que se te escapa, mi cartera real en directo y cursos con
            examen. Una suscripción, las tres piezas.
          </p>
        </header>

        {/* ── 1 · El bento ───────────────────────────────────────────────── */}
        <div className="pf-bento">
          {/* Diario: la pieza grande */}
          <Link href={destino(diario)} className="pf-celda pf-celda--diario" style={{ "--c": diario.color } as React.CSSProperties}>
            <span className="pf-celda-cab">
              <span className="pf-icono" aria-hidden="true"><IconoDiario size={22} /></span>
              <span className="pf-kicker">Diario de Trading</span>
              <ArrowUpRight className="pf-ir" size={18} aria-hidden="true" />
            </span>
            <span className="pf-celda-titulo">Deja de operar de memoria</span>
            <span className="pf-celda-texto">
              Apuntas cada operación en un minuto y el diario hace las cuentas. Nova lee tus datos y te avisa.
            </span>

            {/* Un dibujo del panel, no datos reales: lo dice la etiqueta. */}
            <span className="pf-panel" aria-hidden="true">
              <span className="pf-panel-cab">
                <span className="pf-puntos"><i /><i /><i /></span>
                <span className="pf-ejemplo">Ejemplo</span>
              </span>
              <span className="pf-kpis">
                <span><small>Win rate</small><strong>58 %</strong></span>
                <span><small>Ratio R</small><strong>1,8</strong></span>
                <span><small>P&amp;L</small><strong className="is-verde">+12,4 %</strong></span>
                <span><small>Objetivo</small><strong>4/5</strong></span>
              </span>
              <svg className="pf-curva" viewBox="0 0 320 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pf-relleno" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff9a4d" stopOpacity=".38" />
                    <stop offset="1" stopColor="#ff9a4d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 78 L28 72 L56 75 L84 62 L112 66 L140 52 L168 56 L196 41 L224 45 L252 30 L280 33 L320 14 L320 90 L0 90 Z" fill="url(#pf-relleno)" />
                <path className="pf-curva-linea" d="M0 78 L28 72 L56 75 L84 62 L112 66 L140 52 L168 56 L196 41 L224 45 L252 30 L280 33 L320 14" pathLength={1} fill="none" stroke="#ff9a4d" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <span className="pf-nova">
                <NovaMini size={30} />
                <span><strong>Nova</strong> · Cierras las ganadoras antes de tiempo: te quedas con el 45 % del objetivo.</span>
              </span>
            </span>

            <span className="pf-chips">
              <span><LineChart size={13} aria-hidden="true" /> 10 estadísticas</span>
              <span><CalendarRange size={13} aria-hidden="true" /> Calendario</span>
              <span><Smile size={13} aria-hidden="true" /> Emociones</span>
              <span><Lock size={13} aria-hidden="true" /> Privado</span>
            </span>
          </Link>

          {/* Portfolio: la cifra real */}
          <Link href={destino(cartera)} className="pf-celda pf-celda--cartera" style={{ "--c": cartera.color } as React.CSSProperties}>
            <span className="pf-celda-cab">
              <span className="pf-icono" aria-hidden="true"><IconoPortfolio size={22} /></span>
              <span className="pf-kicker">Portfolio Adelin</span>
              <span className="pf-directo"><span className="pf-directo-punto" aria-hidden="true" /> En directo</span>
            </span>

            {portfolio ? (
              <>
                <span className="pf-cifra">{pct(portfolio.rentabilidadPct)}</span>
                <span className="pf-cifra-texto">
                  rentabilidad real de la cartera spot
                  {portfolio.desdeAnio ? `, desde ${portfolio.desdeAnio}` : ""}
                </span>
                <span className="pf-datos">
                  <span><strong>{portfolio.posiciones}</strong> posiciones</span>
                  {portfolio.dca && (
                    <span><strong>{pct(portfolio.dca.rentabilidadPct)}</strong> DCA de bitcoin</span>
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="pf-cifra">En vivo</span>
                <span className="pf-cifra-texto">precio de entrada y rentabilidad de cada compra</span>
              </>
            )}

            <span className="pf-celda-pie">
              <span>Mis compras reales, también las que pierden.</span>
              <ArrowUpRight className="pf-ir" size={18} aria-hidden="true" />
            </span>
          </Link>

          {/* Cursos: lo publicado, de Supabase */}
          <Link href={destino(aula)} className="pf-celda pf-celda--cursos" style={{ "--c": aula.color } as React.CSSProperties}>
            <span className="pf-celda-cab">
              <span className="pf-icono" aria-hidden="true"><IconoCursos size={22} /></span>
              <span className="pf-kicker">Cursos</span>
              <span className="pf-sello-cert"><Award size={13} aria-hidden="true" /> Certificado</span>
            </span>

            {cursos.length > 0 ? (
              <>
                <span className="pf-cifras">
                  <span><strong>{cursos.length}</strong><small>{cursos.length === 1 ? "curso" : "cursos"}</small></span>
                  <span><strong>{lecciones}</strong><small>lecciones</small></span>
                  <span><strong>{minutos >= 60 ? `${Math.round(minutos / 60)} h` : `${minutos} min`}</strong><small>de contenido</small></span>
                </span>
                <span className="pf-lista-cursos">
                  {cursos.slice(0, 3).map((c) => (
                    <span key={c.slug} style={{ "--cc": c.color } as React.CSSProperties}>
                      <i aria-hidden="true" /> {c.titulo}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="pf-cifra-texto">Por módulos, con examen en cada uno y certificado al aprobar el final.</span>
            )}

            <span className="pf-celda-pie">
              <span>Examen por módulo y certificado verificable.</span>
              <ArrowUpRight className="pf-ir" size={18} aria-hidden="true" />
            </span>
          </Link>

          {/* Lo gratuito, para siempre */}
          <div className="pf-celda pf-celda--gratis">
            <p className="pf-gratis-cab">
              <span className="pf-gratis-sello">Gratis</span>
              <span>Y esto, para todo el mundo. Sin tarjeta.</span>
            </p>
            <ul className="pf-gratis">
              {GRATIS.map(({ href, Icono, titulo, texto }) => (
                <li key={href}>
                  <Link href={href} className="pf-gratis-item">
                    <span className="pf-gratis-icono" aria-hidden="true"><Icono size={17} /></span>
                    <span><strong>{titulo}</strong><small>{texto}</small></span>
                    <ArrowRight className="pf-gratis-flecha" size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── 2 · La oferta ──────────────────────────────────────────────── */}
          <div className="pf-oferta">
            <span className="pf-oferta-borde" aria-hidden="true" />
            <div className="pf-oferta-precio">
              <span className="pf-oferta-plan"><Crown size={15} aria-hidden="true" /> Premium</span>
              <p className="pf-precio">
                {PRECIO}<small>/mes</small>
              </p>
              <p className="pf-precio-dia">Unos {PRECIO_DIA} al día · el precio se te queda fijado</p>
            </div>

            <ul className="pf-incluye">
              {INCLUYE.map((t) => (
                <li key={t}><span className="pf-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span> {t}</li>
              ))}
            </ul>

            <div className="pf-oferta-accion">
              {/* Directo al pago: /api/checkout manda antes al registro si no hay
                  sesión y vuelve sola a Stripe (10-11-2026, pedido por el admin:
                  antes llevaba a /premium, un paso de más). */}
              <Link href="/api/checkout" prefetch={false} className="pf-cta">
                Hazte Premium <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
              <ul className="pf-garantias">
                <li><Lock size={13} aria-hidden="true" /> Pago seguro con Stripe</li>
                <li><Zap size={13} aria-hidden="true" /> Acceso inmediato</li>
                <li><ShieldCheck size={13} aria-hidden="true" /> Sin permanencia</li>
              </ul>
            </div>
          </div>
        </>
        )}

        {/* ── 3 · Preguntas frecuentes y contacto ─────────────────────────
            Rediseñado el 13-11-2026: un panel propio, con el contacto en una
            tarjeta con los colores de Instagram y cada pregunta con su color. */}
        <div className="pf-faq" id="preguntas">
          <span className="pf-faq-luz pf-faq-luz--rosa" aria-hidden="true" />
          <span className="pf-faq-luz pf-faq-luz--oro" aria-hidden="true" />

          <div className="pf-faq-lado">
            <span className="pf-faq-sello"><MessageCircleQuestion size={13} aria-hidden="true" /> Dudas</span>
            <h3 className="pf-faq-titulo">Lo que más me <em>preguntan</em></h3>
            <p className="pf-faq-texto">
              Si la tuya no está, escríbeme. Te contesto yo, de tú a tú.
            </p>

            <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" className="pf-contacto">
              <span className="pf-contacto-cab">
                <span className="pf-contacto-avatar" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- estático, 256 px, ya optimizado */}
                  <img src={AVATAR_ADMIN.src ?? ""} alt="" width={60} height={60} className="pf-contacto-foto" />
                  <span className="pf-contacto-online" />
                </span>
                <span className="pf-contacto-texto">
                  <strong>AdelinBTC</strong>
                  <small>@adelinbtc · en Instagram</small>
                </span>
              </span>
              <span className="pf-contacto-boton">
                <InstagramIcon size={17} /> Escríbeme por Instagram
                <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </span>
            </a>

            {!isPremium && (
              <Link href="/premium" className="pf-faq-mas">
                Todas las preguntas en Premium <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>

          <div className="pf-faq-lista">
            {preguntas.map((p, i) => (
              <details key={p.q} className="pf-pregunta" open={i === 0}>
                <summary>
                  <span className="pf-pregunta-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pf-pregunta-q">{p.q}</span>
                  <span className="pf-pregunta-icono" aria-hidden="true"><ChevronDown size={16} /></span>
                </summary>
                <p>{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
