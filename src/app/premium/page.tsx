import type { Metadata } from "next";
import Link from "next/link";
import {
  Check, X, ArrowRight, Crown, ShieldCheck, Lock, Zap, CreditCard, LineChart, CalendarRange, Trophy,
  EyeOff, Radio, Coins, Layers, GraduationCap, Smile, BookOpenText, ClipboardCheck, Scale,
  Award, MessagesSquare, Infinity as Siempre,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Certificado from "@/components/aula/Certificado";
import Tecla from "@/components/cuaderno/Tecla";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import Anotacion from "@/components/cuaderno/Anotacion";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";
import { CoinGeckoGlyph } from "@/components/BrandMarks";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { cursoPorSlug, cursosPublicados, duracion } from "@/lib/cursos";
import { PREGUNTAS_FRECUENTES } from "@/lib/preguntas-frecuentes";
import "./premium.css";

export const metadata: Metadata = {
  alternates: { canonical: "/premium" },
  title: "Hazte Premium",
  description:
    `Diario de Trading, la cartera real de AdelinBTC en directo y cursos con certificado, por ${PREMIUM_PRICE_EUR.toFixed(2).replace(".", ",")} €/mes. Sin permanencia.`,
};

/**
 * /premium — la página que vende la suscripción.
 *
 * Pasada al estilo «Cuaderno de estudio» el 17-11-2026 (ESTILO.md,
 * disenos/sistema.html). Premium es naranja de marca y cierra en un bloque de
 * tinta; dentro, cada pieza lleva el color de su sección: Diario azul,
 * Portfolio menta y Cursos lila. Todos los botones son `<Tecla>`.
 *
 * Todo lo que se promete existe y se puede comprobar:
 *  · Cursos: los datos salen de Supabase (los publicados), nunca a mano.
 *  · El foro está abierto desde el 13-11-2026 y publicar en él es de Premium
 *    (FORO.md): por eso sale como incluido.
 *  · La insignia «Miembro Fundador» existe (logros.tsx: primer pago Premium).
 *  · El precio queda fijado mientras la suscripción siga activa (FAQ).
 *  · Se cancela desde «Mi perfil», en el portal de Stripe.
 *
 *  · Del Diario solo se dice lo que hace (src/components/trading/): cuentas,
 *    calendario, desgloses, emociones, riesgo e hitos. No da avisos ni lee
 *    los datos por nadie: no se promete.
 *
 * Lo que se quitó el 06-11-2026 por no ser verdad (reseñas inventadas, «+100
 * traders», «soporte prioritario», «cancela en 1 clic») no vuelve: presentar
 * reseñas que no son de clientes reales lo prohíbe la normativa europea.
 */

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/** Free frente a Premium. */
const COMPARA: { label: string; free: boolean; premium: boolean }[] = [
  { label: "Guías interactivas con quiz y logros", free: true, premium: true },
  { label: "Diccionario cripto", free: true, premium: true },
  { label: "Predicción de Precio", free: true, premium: true },
  { label: "Logros y rachas", free: true, premium: true },
  { label: "Leer el foro", free: true, premium: true },
  { label: "Diario de Trading", free: false, premium: true },
  { label: "Portfolio Adelin: spot y DCA de bitcoin", free: false, premium: true },
  { label: "Cursos con examen y certificado", free: false, premium: true },
  { label: "Insignia de Miembro Fundador", free: false, premium: true },
  { label: "Preguntar y responder en el foro", free: false, premium: true },
];

/** El color de cada pregunta, en rueda: la tarjeta lo toma al abrirse. */
const COLORES_PREGUNTA = ["naranja", "azul", "menta", "lila", "cielo", "coral"] as const;

/** El botón de compra: va al checkout de Stripe (que manda al registro si hace falta). */
function Cta({ texto, ancho = false, tamano = "grande" }: { texto: string; ancho?: boolean; tamano?: "normal" | "grande" }) {
  return (
    <TeclaPremium tamano={tamano} ancho={ancho}>{texto}</TeclaPremium>
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

  const certificado = destacado ? (
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
  ) : null;

  return (
    <div className="blog-page pm-pagina">
      <SiteNav user={!!user} isPremium={isPremium} />

      <main className="pm">
        {isPremium ? (
          /* ── Quien ya es Premium: sus accesos, no la venta ── */
          <section className="pm-socio" aria-labelledby="pm-socio-titulo">
            <span className="pm-pegatina pm-socio-pegatina" aria-hidden="true">Tu<br />Premium</span>
            <p className="pm-mano">todo desbloqueado</p>
            <h1 id="pm-socio-titulo" className="pm-socio-titulo">Ya eres <span className="fluor">Premium</span></h1>
            <p className="pm-socio-sub">Tienes todo desbloqueado. Gracias por apoyar el proyecto.</p>
            <ul className="pm-socio-accesos">
              <li>
                <Link href="/dashboard/trading" className="pm-acceso pm-c-azul">
                  <span className="pm-acceso-ic" aria-hidden="true"><IconoDiario size={22} /></span>
                  <span className="pm-acceso-txt"><strong>Diario de Trading</strong><small>Apunta tu próxima operación</small></span>
                  <ArrowRight className="pm-acceso-flecha" size={18} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="pm-acceso pm-c-menta">
                  <span className="pm-acceso-ic" aria-hidden="true"><IconoPortfolio size={22} /></span>
                  <span className="pm-acceso-txt"><strong>Portfolio Adelin</strong><small>Mira las últimas compras</small></span>
                  <ArrowRight className="pm-acceso-flecha" size={18} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="pm-acceso pm-c-lila">
                  <span className="pm-acceso-ic" aria-hidden="true"><IconoCursos size={22} /></span>
                  <span className="pm-acceso-txt"><strong>Cursos</strong><small>Sigue donde lo dejaste</small></span>
                  <ArrowRight className="pm-acceso-flecha" size={18} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard/certificados" className="pm-acceso pm-c-amarillo">
                  <span className="pm-acceso-ic" aria-hidden="true"><Award size={22} /></span>
                  <span className="pm-acceso-txt"><strong>Mis certificados</strong><small>Tu vitrina</small></span>
                  <ArrowRight className="pm-acceso-flecha" size={18} aria-hidden="true" />
                </Link>
              </li>
            </ul>
            <Tecla href="/dashboard/perfil#suscripcion" color="blanca" tamano="peq">Gestionar mi suscripción</Tecla>
          </section>
        ) : (
          <>
            {/* ── Hero: la promesa, el precio y las tres piezas sobre la mesa ── */}
            <section className="pm-hero" aria-labelledby="pm-titulo">
              <div className="pm-hero-texto">
                <span className="pm-sello"><Crown size={14} aria-hidden="true" /> AdelinBTC Premium</span>
                <h1 id="pm-titulo" className="pm-titulo">
                  Opera con <Anotacion tipo="circle" retraso={350}>método</Anotacion>.{" "}
                  <span className="pm-titulo-2">Aprende con <span className="fluor">certificado</span>.</span>
                </h1>
                <p className="pm-lead">
                  Tu <strong>Diario de Trading</strong>, la <strong>cartera real de AdelinBTC</strong> en directo
                  y <strong>cursos con examen y certificado</strong>. Una sola suscripción, todo incluido.
                </p>

                <div className="pm-compra">
                  <Cta texto={textoCta} />
                  <p className="pm-compra-precio">
                    <strong>{PRECIO}</strong><span>/mes</span>
                    <small>Unos {PRECIO_DIA} al día · Sin permanencia</small>
                  </p>
                </div>

                <ul className="pm-confianza">
                  <li><Lock size={14} aria-hidden="true" /> Pago seguro con Stripe</li>
                  <li><Zap size={14} aria-hidden="true" /> Acceso inmediato</li>
                  <li><ShieldCheck size={14} aria-hidden="true" /> Cancela cuando quieras</li>
                </ul>
              </div>

              {/* Las tres piezas, como tarjetas sobre la mesa. Decorativo: son
                  dibujos de cada herramienta, no datos de nadie. */}
              <div className="pm-mesa" aria-hidden="true">
                <div className="pm-carta pm-carta--diario pm-c-azul">
                  <span className="pm-carta-cab">
                    <span className="pm-carta-ic"><IconoDiario size={16} /></span> Diario de Trading
                  </span>
                  <span className="pm-carta-kpis">
                    <span><small>Win rate</small><b>58 %</b></span>
                    <span><small>P&amp;L</small><b className="es-sube">+12,4 %</b></span>
                    <span><small>Esperanza</small><b>+0,4R</b></span>
                  </span>
                  <svg className="pm-carta-curva" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <path className="pm-curva-relleno" d="M0 70 L30 64 L60 67 L90 54 L120 58 L150 44 L180 48 L210 34 L240 38 L270 22 L300 12 L300 80 L0 80 Z" />
                    <path className="pm-curva-linea" d="M0 70 L30 64 L60 67 L90 54 L120 58 L150 44 L180 48 L210 34 L240 38 L270 22 L300 12" pathLength={1} />
                  </svg>
                </div>

                <div className="pm-carta pm-carta--portfolio pm-c-menta">
                  <span className="pm-carta-cab">
                    <span className="pm-carta-ic"><IconoPortfolio size={16} /></span> Portfolio Adelin
                    <span className="pm-directo"><span className="pm-directo-punto" /> En directo</span>
                  </span>
                  <span className="pm-carta-pestanas"><span className="is-activa">Spot</span><span>DCA</span></span>
                  <span className="pm-carta-filas">
                    {[78, 54, 36].map((w, i) => (
                      <span key={i} className="pm-carta-fila">
                        <span className={`pm-moneda pm-moneda--${i}`} />
                        <span className="pm-barrita"><i style={{ width: `${w}%` }} /></span>
                        <span className="pm-velo"><Lock size={11} /></span>
                      </span>
                    ))}
                  </span>
                </div>

                {certificado && (
                  <div className="pm-carta-cert">
                    {certificado}
                  </div>
                )}

                <span className="pm-mano pm-mesa-nota">una suscripción, las tres piezas</span>
              </div>
            </section>

            {/* ── Franja: todo lo que entra ── */}
            <section className="pm-franja" aria-label="Qué incluye Premium">
              <span className="pm-c-azul"><IconoDiario size={17} /> Diario de Trading</span>
              <span className="pm-c-menta"><IconoPortfolio size={17} /> Portfolio Adelin</span>
              <span className="pm-c-lila"><IconoCursos size={17} /> Cursos</span>
              <span className="pm-c-amarillo"><Award size={16} /> Certificados</span>
              <span className="pm-c-naranja"><Trophy size={16} /> Insignia de Fundador</span>
              <span className="pm-c-coral"><MessagesSquare size={16} /> Participar en el foro</span>
            </section>

            {/* ── 01 · Diario de Trading ── */}
            <section className="pm-pieza pm-c-azul" aria-labelledby="pm-diario">
              <div className="pm-pieza-texto">
                <span className="pm-num">01</span>
                <span className="pm-kicker"><IconoDiario size={15} /> Diario de Trading</span>
                <h2 id="pm-diario" className="pm-h2">Deja de operar de memoria</h2>
                <p className="pm-p">
                  Apuntas cada operación en un minuto y el diario hace las cuentas. Así ves cómo operas de verdad, no
                  cómo crees que operas: dónde ganas, dónde pierdes y cuánto arriesgas.
                </p>
                <ul className="pm-lista">
                  <li><span className="pm-lista-ic"><LineChart size={16} /></span> <span><strong>Diez estadísticas</strong> y tu curva de capital</span></li>
                  <li><span className="pm-lista-ic"><CalendarRange size={16} /></span> <span><strong>Calendario</strong> y desglose por par, estrategia, día y hora</span></li>
                  <li><span className="pm-lista-ic"><Smile size={16} /></span> <span><strong>Tus emociones</strong> de cada día, junto a tus resultados</span></li>
                  <li><span className="pm-lista-ic"><Scale size={16} /></span> <span><strong>Tu riesgo</strong> en cada operación y cuánto cumples tu plan</span></li>
                  <li><span className="pm-lista-ic"><Trophy size={16} /></span> <span><strong>Hitos con niveles</strong> que premian la disciplina</span></li>
                  <li><span className="pm-lista-ic"><EyeOff size={16} /></span> <span><strong>Privado</strong>: solo lo ves tú</span></li>
                </ul>
                <Tecla href="/herramientas/diario" color="azul" tamano="peq">
                  Ver el Diario por dentro <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </div>

              <div className="pm-pieza-arte" aria-hidden="true">
                {/* Una hoja del diario: lo que se apunta y lo que sale solo. */}
                <div className="pm-panel pm-hoja">
                  <span className="pm-hoja-cab"><span>Operación nueva</span><span className="pm-hoja-chip">BTC · Long</span></span>
                  <span className="pm-hoja-linea"><small>Riesgo</small><b>1 % de la cuenta</b></span>
                  <span className="pm-hoja-linea"><small>Por qué entro</small><b className="pm-hoja-mano">rompe el máximo semanal</b></span>
                  <span className="pm-hoja-linea"><small>Cómo me siento</small><b>Bien</b></span>
                  <span className="pm-hoja-sale">
                    <span><small>Win rate</small><b>58 %</b></span>
                    <span><small>P&amp;L medio</small><b className="es-sube">+26 $</b></span>
                    <span><small>Ratio R</small><b>1,8</b></span>
                  </span>
                  <span className="pm-hoja-hito"><Trophy size={14} /> Disciplina de riesgo · Nivel 2</span>
                </div>
              </div>
            </section>

            {/* ── 02 · Portfolio Adelin ── */}
            <section className="pm-pieza pm-pieza--inversa pm-c-menta" aria-labelledby="pm-portfolio">
              <div className="pm-pieza-texto">
                <span className="pm-num">02</span>
                <span className="pm-kicker"><IconoPortfolio size={15} /> Portfolio Adelin</span>
                <h2 id="pm-portfolio" className="pm-h2">La cartera real, sin capturas ni promesas</h2>
                <p className="pm-p">
                  Qué compra AdelinBTC, a qué precio y cómo va, actualizado con precios de mercado. También las
                  posiciones que pierden.
                </p>
                <ul className="pm-lista">
                  <li><span className="pm-lista-ic"><Radio size={16} /></span> <span><strong>Precios y rentabilidad</strong> en directo</span></li>
                  <li><span className="pm-lista-ic"><Layers size={16} /></span> <span><strong>Cartera spot</strong>, moneda a moneda</span></li>
                  <li><span className="pm-lista-ic"><Coins size={16} /></span> <span><strong>DCA de bitcoin</strong>, compra a compra</span></li>
                  <li><span className="pm-lista-ic"><CoinGeckoGlyph size={15} /></span> <span>Datos de mercado de <strong>CoinGecko</strong></span></li>
                </ul>
                <Tecla href="/herramientas/portfolio" color="menta" tamano="peq">
                  Ver cómo funciona <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </div>
              <div className="pm-pieza-arte" aria-hidden="true">
                <div className="pm-panel pm-cartera">
                  <span className="pm-cartera-cab"><span>Spot</span><span className="pm-directo"><span className="pm-directo-punto" /> En directo</span></span>
                  {/* Sin nombres de monedas: es un dibujo, no la cartera de verdad. */}
                  {[82, 64, 48, 30].map((w, i) => (
                    <span key={i} className="pm-cartera-fila">
                      <span className={`pm-moneda pm-moneda--${i}`} />
                      <span className="pm-barrita"><i style={{ width: `${w}%` }} /></span>
                      <span className="pm-velo pm-velo--ancho"><Lock size={12} /></span>
                    </span>
                  ))}
                  <span className="pm-cartera-pie"><Lock size={13} /> Las cifras se ven con Premium</span>
                </div>
              </div>
            </section>

            {/* ── 03 · Cursos ── */}
            <section className="pm-pieza pm-c-lila" aria-labelledby="pm-cursos">
              <div className="pm-pieza-texto">
                <span className="pm-num">03</span>
                <span className="pm-kicker"><IconoCursos size={15} /> Cursos</span>
                <h2 id="pm-cursos" className="pm-h2">Aprende en orden, y termina con tu certificado</h2>
                <p className="pm-p">
                  Cursos completos, módulo a módulo y a tu ritmo, con un examen en cada módulo. Al aprobar el final
                  recibes un certificado con tu nombre, verificable, que se queda en tu vitrina para siempre.
                </p>
                {cursos.length > 0 && (
                  <ul className="pm-cursos">
                    {cursos.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/cursos/${c.slug}`} className="pm-curso" style={{ "--cc": c.color } as React.CSSProperties}>
                          <span className="pm-curso-ic" aria-hidden="true"><GraduationCap size={18} /></span>
                          <span className="pm-curso-txt">
                            <strong>{c.titulo}</strong>
                            <small>{c.modulos} módulos · {c.lecciones} lecciones · {duracion(c.minutos)}</small>
                          </span>
                          <ArrowRight className="pm-curso-flecha" size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="pm-lista pm-lista--compacta">
                  <li><span className="pm-lista-ic"><BookOpenText size={16} /></span> <span><strong>{totalLecciones} lecciones</strong> con gráficos y minijuegos ({duracion(totalMinutos)})</span></li>
                  <li><span className="pm-lista-ic"><ClipboardCheck size={16} /></span> <span><strong>Examen en cada módulo</strong> y final con nota de 0 a 10</span></li>
                  <li><span className="pm-lista-ic"><Siempre size={16} /></span> <span><strong>Todos los cursos</strong> que se publiquen, sin pagar aparte</span></li>
                </ul>
                <Tecla href="/cursos" color="lila" tamano="peq">
                  Ver los cursos <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </div>
              {certificado && (
                <div className="pm-pieza-arte" aria-hidden="true">
                  <div className="pm-cert-escena">
                    <span className="pm-postit">así será el tuyo</span>
                    <div className="pm-cert-marco">{certificado}</div>
                  </div>
                </div>
              )}
            </section>

            {/* ── Miembro Fundador: un logro, en amarillo ── */}
            <section className="pm-fundador" aria-labelledby="pm-fundador">
              <span className="pm-pegatina pm-fundador-pegatina" aria-hidden="true">Miembro<br />Fundador</span>
              <div>
                <span className="pm-kicker">Con tu primer pago</span>
                <h2 id="pm-fundador" className="pm-h2">Insignia de Miembro Fundador, para siempre en tu perfil</h2>
                <p className="pm-p">
                  Con tu primer pago Premium desbloqueas el logro especial «Miembro Fundador»: la marca de quien apoyó el
                  proyecto desde el principio. Y tu precio queda fijado mientras mantengas la suscripción.
                </p>
              </div>
            </section>

            {/* ── El precio, en el bloque de tinta ── */}
            <section className="pm-precio" aria-labelledby="pm-precio">
              <div className="pm-precio-texto">
                <span className="pm-sello"><Crown size={14} aria-hidden="true" /> Un solo plan</span>
                <h2 id="pm-precio" className="pm-h2">Todo incluido. Sin <span className="pm-fluor-naranja">letra pequeña</span>.</h2>
                <p className="pm-p">Ni niveles, ni extras de pago, ni permanencia. Pagas un mes y tienes todo ese mes.</p>
                <ul className="pm-precio-datos">
                  <li><strong>{PRECIO_DIA}</strong><span>al día</span></li>
                  <li><strong>3</strong><span>piezas de pago</span></li>
                  <li><strong>0</strong><span>permanencia</span></li>
                </ul>
                <p className="pm-mano pm-mano--clara">y el precio se te queda fijado</p>
              </div>

              <div className="pm-tarjeta">
                <span className="pm-tarjeta-cab"><span className="pm-tarjeta-ic" aria-hidden="true"><Crown size={20} /></span> Premium</span>
                <p className="pm-tarjeta-importe">{PRECIO}<small>/mes</small></p>
                <p className="pm-tarjeta-dia">Unos {PRECIO_DIA} al día</p>
                <ul className="pm-tarjeta-lista">
                  <li><span className="pm-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> Diario de Trading</li>
                  <li><span className="pm-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> Portfolio Adelin: spot y DCA en directo</li>
                  <li><span className="pm-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> Todos los cursos, con certificado</li>
                  <li><span className="pm-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> Insignia de Miembro Fundador</li>
                  <li><span className="pm-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> Preguntar y responder en el foro</li>
                  <li><span className="pm-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> Todo lo gratuito, también</li>
                </ul>
                <Cta texto={textoCta} ancho />
                <p className="pm-tarjeta-pie"><CreditCard size={14} aria-hidden="true" /> Pago cifrado con Stripe · Cancela cuando quieras</p>
                {!user && (
                  <p className="pm-tarjeta-login">¿Ya tienes cuenta? <Link href="/login?next=/api/checkout">Inicia sesión</Link></p>
                )}
              </div>
            </section>

            {/* ── Gratis frente a Premium ── */}
            <section className="pm-seccion" aria-labelledby="pm-compara">
              <header className="pm-cab">
                <span className="pm-kicker pm-kicker--menta">Gratis frente a Premium</span>
                <h2 id="pm-compara" className="pm-h2">Lo gratuito sigue siendo <span className="fluor">tuyo</span></h2>
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
                      {f.free
                        ? <span className="pm-si"><Check size={15} strokeWidth={3.2} aria-label="Incluido" /></span>
                        : <span className="pm-no"><X size={14} strokeWidth={3} aria-label="No incluido" /></span>}
                    </span>
                    <span role="cell" className="is-premium">
                      {f.premium
                        ? <span className="pm-si"><Check size={15} strokeWidth={3.2} aria-label="Incluido" /></span>
                        : <span className="pm-no"><X size={14} strokeWidth={3} aria-label="No incluido" /></span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Preguntas: tarjetas que se hunden al pulsarlas y se abren con
                rebote. La altura la anima AcordeonesSuaves (layout raíz), que
                marca `data-acordeon` mientras abre o cierra. ── */}
            <section className="pm-seccion pm-faq" aria-labelledby="pm-faq">
              <div className="pm-faq-lado">
                <p className="pm-mano pm-mano--naranja">antes de suscribirte</p>
                <h2 id="pm-faq" className="pm-h2">Preguntas <Anotacion tipo="underline" color="var(--azul)">frecuentes</Anotacion></h2>
                <p className="pm-p">Lo que más me preguntan sobre Premium, contestado sin rodeos.</p>
              </div>
              <div className="pm-faq-lista">
                {PREGUNTAS_FRECUENTES.filter((f) => !f.soloPortada).map((f, i) => (
                  <details key={f.q} className={`pm-pregunta pm-c-${COLORES_PREGUNTA[i % COLORES_PREGUNTA.length]}`}>
                    <summary>
                      <span className="pm-pregunta-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                      <span className="pm-pregunta-q">{f.q}</span>
                      <span className="pm-pregunta-icono" aria-hidden="true"><ArrowRight size={16} strokeWidth={3} /></span>
                    </summary>
                    <div className="pm-respuesta"><p>{f.a}</p></div>
                  </details>
                ))}
              </div>
            </section>

            {/* ── Cierre ── */}
            <section className="pm-final" aria-labelledby="pm-final">
              <span className="pm-pegatina pm-final-pegatina" aria-hidden="true">Sin<br />perma-<br />nencia</span>
              <p className="pm-mano pm-mano--naranja">¿empezamos?</p>
              <h2 id="pm-final" className="pm-final-titulo">Empieza hoy. Opera con método y aprende con certificado.</h2>
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
