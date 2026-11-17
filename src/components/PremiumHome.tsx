import {
  ArrowRight, ArrowUpRight, Award, CalendarRange, Check, Crown, LineChart, Lock, Plus, ShieldCheck, Smile, Zap,
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
import { MOSTRAR_NOVA } from "@/components/trading/nova-visible";
import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import type { ResumenHero } from "@/lib/portfolio-publico";
import "./premium-home.css";

/**
 * El cierre de la portada: Premium, lo gratuito y las preguntas frecuentes.
 *
 * Pasado al estilo «Cuaderno de estudio» el 17-11-2026 (ESTILO.md). Como en la
 * maqueta aprobada (disenos/version-o-equilibrio.html), Premium cierra en un
 * bloque de tinta oscura; dentro, cada pieza es una «tarjeta de producto» de
 * disenos/sistema.html, con el color de su sección: Diario azul, Portfolio
 * menta y Cursos lila. Debajo, lo gratuito y las dudas, sobre el fondo claro.
 *
 * Dos bloques:
 *  1. Las tres piezas de pago y la oferta (precio, lo que entra y el botón).
 *     Quien ya es Premium ve en su lugar los accesos a sus herramientas.
 *  2. Preguntas frecuentes y contacto. Para todos.
 *
 * Repaso del 17-11-2026, para no repetir lo que la portada ya enseña arriba:
 * se quitó la franja de lo gratuito (guías, diccionario, calculadora y
 * logros: las tres primeras tienen su propia sección más arriba) y la lista
 * de títulos de la tarjeta de Cursos (la lleva entera `CursosHome`). La
 * tarjeta de Cursos se queda con sus cifras: dice qué entra en la suscripción.
 *
 * Todo lo que dice es verdad y sale de su fuente:
 *  · La rentabilidad de la cartera, de `resumenPortfolioPublico()` (la misma
 *    del slider del hero). Sin importes: solo porcentajes, en verde o en rojo
 *    según su signo.
 *  · Cursos, lecciones y horas, de `cursosPublicados()` en Supabase.
 *  · Las preguntas, de `preguntas-frecuentes.ts`, compartidas con /premium.
 *  · El panel del Diario es un dibujo y lo dice («Ejemplo»): no son datos de
 *    nadie.
 * Ni reseñas ni contadores de usuarios: se quitaron de /premium el 06-11-2026
 * por inventados, y no vuelven por aquí.
 *
 * Nova está oculta mientras llega la mascota (ESTILO.md): su cara solo se pinta
 * en el panel del Diario si `MOSTRAR_NOVA` lo dice. Los textos que la nombran
 * se quedan: cambiarlos lo decide el admin.
 */

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;
/** Verde o rojo, solo para cifras con signo (ESTILO.md). */
const signo = (n: number) => (n >= 0 ? "is-sube" : "is-baja");

const INCLUYE = [
  "Diario de Trading con Nova",
  "Portfolio Adelin: spot y DCA de bitcoin",
  "Todos los cursos, con examen y certificado",
  "Insignia de Miembro Fundador",
  "Todo lo que se añada, sin pagar más",
];

/** El color de cada pregunta, en rueda: la tarjeta lo toma al abrirse. */
const COLORES_PREGUNTA = ["cielo", "lila", "azul", "menta", "naranja", "coral"] as const;

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
  const horas = minutos >= 60 ? `${Math.round(minutos / 60)} h` : `${minutos} min`;
  const preguntas = PREGUNTAS_FRECUENTES.filter((p) => p.portada);

  return (
    <section id="premium" className="pf" aria-labelledby={isPremium ? "pf-faq-titulo" : "pf-titulo"}>
      {/* ── 1 · Premium, en su bloque de tinta ─────────────────────────── */}
      {isPremium ? (
        /* A quien ya es Premium no se le vende lo que ya tiene (13-11-2026):
           en vez del escaparate y la oferta, tres accesos a sus herramientas. */
        <nav className="pf-tinta pf-tinta--mio" aria-label="Tus herramientas">
          <div className="pf-tinta-inner">
            <p className="pf-mio-titulo">
              <span className="pf-sello"><Crown size={14} aria-hidden="true" /> Tu Premium</span>
              <span className="pf-mano pf-mano--clara">¿qué toca hoy?</span>
            </p>
            <div className="pf-piezas pf-piezas--mio">
              <article className="pf-pieza pf-pieza--azul">
                <span className="pf-pieza-ic" aria-hidden="true"><IconoDiario size={26} /></span>
                <h3 className="pf-pieza-titulo">Diario de Trading</h3>
                <p className="pf-pieza-texto">Apunta tu próxima operación.</p>
                <Tecla href={destino(diario)} color="azul" tamano="peq">
                  Abrir el diario <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </article>
              <article className="pf-pieza pf-pieza--menta">
                <span className="pf-pieza-ic" aria-hidden="true"><IconoPortfolio size={26} /></span>
                <h3 className="pf-pieza-titulo">Portfolio Adelin</h3>
                {portfolio ? (
                  <p className="pf-pieza-texto">
                    <strong className={`pf-signo ${signo(portfolio.rentabilidadPct)}`}>{pct(portfolio.rentabilidadPct)}</strong>
                    {" "}· {portfolio.posiciones} posiciones
                  </p>
                ) : (
                  <p className="pf-pieza-texto">La cartera, en vivo.</p>
                )}
                <Tecla href={destino(cartera)} color="menta" tamano="peq">
                  Ver la cartera <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </article>
              <article className="pf-pieza pf-pieza--lila">
                <span className="pf-pieza-ic" aria-hidden="true"><IconoCursos size={26} /></span>
                <h3 className="pf-pieza-titulo">Cursos</h3>
                <p className="pf-pieza-texto">
                  {cursos.length > 0 ? `${cursos.length} ${cursos.length === 1 ? "curso" : "cursos"} · ${lecciones} lecciones` : "Con examen y certificado."}
                </p>
                <Tecla href={destino(aula)} color="lila" tamano="peq">
                  Ir a mis cursos <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </article>
            </div>
          </div>
        </nav>
      ) : (
        <div className="pf-tinta">
          <div className="pf-tinta-inner">
            <header className="pf-cabecera">
              <div>
                <span className="pf-sello"><Crown size={14} aria-hidden="true" /> AdelinBTC Premium</span>
                <h2 id="pf-titulo" className="pf-titulo">
                  Opera con <span className="fluor">método</span>.{" "}
                  <span className="pf-titulo-2">Aprende con certificado.</span>
                </h2>
              </div>
              <div>
                <p className="pf-lead">
                  Tu diario con una asistente que te avisa de lo que se te escapa, mi cartera real en directo y
                  cursos con examen.
                </p>
                <p className="pf-mano pf-mano--clara">una suscripción, las tres piezas ↓</p>
              </div>
            </header>

            <div className="pf-piezas">
              {/* Diario: la pieza grande, con un dibujo de su panel */}
              <article className="pf-pieza pf-pieza--azul pf-pieza--diario">
                <span className="pf-pieza-ic" aria-hidden="true"><IconoDiario size={26} /></span>
                <h3 className="pf-pieza-titulo">Diario de Trading</h3>
                <p className="pf-pieza-texto">
                  Deja de operar de memoria. Apuntas cada operación en un minuto y el diario hace las cuentas. Nova lee
                  tus datos y te avisa.
                </p>

                {/* Un dibujo del panel, no datos reales: lo dice la etiqueta. */}
                <div className="pf-panel" aria-hidden="true">
                  <span className="pf-panel-cab">
                    <span className="pf-puntos"><i /><i /><i /></span>
                    <span className="pf-ejemplo">Ejemplo</span>
                  </span>
                  <span className="pf-kpis">
                    <span><small>Win rate</small><strong>58 %</strong></span>
                    <span><small>Ratio R</small><strong>1,8</strong></span>
                    <span><small>P&amp;L</small><strong className="pf-signo is-sube">+12,4 %</strong></span>
                    <span><small>Objetivo</small><strong>4/5</strong></span>
                  </span>
                  <svg className="pf-curva" viewBox="0 0 320 90" preserveAspectRatio="none">
                    <path className="pf-curva-relleno" d="M0 78 L28 72 L56 75 L84 62 L112 66 L140 52 L168 56 L196 41 L224 45 L252 30 L280 33 L320 14 L320 90 L0 90 Z" />
                    <path className="pf-curva-linea" d="M0 78 L28 72 L56 75 L84 62 L112 66 L140 52 L168 56 L196 41 L224 45 L252 30 L280 33 L320 14" pathLength={1} />
                  </svg>
                  <span className="pf-nova">
                    {MOSTRAR_NOVA && <NovaMini size={30} />}
                    <span><strong>Nova</strong> · Cierras las ganadoras antes de tiempo: te quedas con el 45 % del objetivo.</span>
                  </span>
                </div>

                <span className="pf-chips">
                  <span><LineChart size={13} aria-hidden="true" /> 10 estadísticas</span>
                  <span><CalendarRange size={13} aria-hidden="true" /> Calendario</span>
                  <span><Smile size={13} aria-hidden="true" /> Emociones</span>
                  <span><Lock size={13} aria-hidden="true" /> Privado</span>
                </span>

                <Tecla href={destino(diario)} color="azul" tamano="peq">
                  Ver el diario <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </article>

              {/* Portfolio: la cifra real */}
              <article className="pf-pieza pf-pieza--menta">
                <span className="pf-pieza-cab">
                  <span className="pf-pieza-ic" aria-hidden="true"><IconoPortfolio size={26} /></span>
                  <span className="pf-directo"><span className="pf-directo-punto" aria-hidden="true" /> En directo</span>
                </span>
                <h3 className="pf-pieza-titulo">Portfolio Adelin</h3>

                {portfolio ? (
                  <>
                    <p className={`pf-cifra pf-signo ${signo(portfolio.rentabilidadPct)}`}>{pct(portfolio.rentabilidadPct)}</p>
                    <p className="pf-pieza-texto">
                      Rentabilidad real de la cartera spot{portfolio.desdeAnio ? `, desde ${portfolio.desdeAnio}` : ""}.
                    </p>
                    <span className="pf-datos">
                      <span><strong>{portfolio.posiciones}</strong> posiciones</span>
                      {portfolio.dca && (
                        <span>
                          <strong className={`pf-signo ${signo(portfolio.dca.rentabilidadPct)}`}>{pct(portfolio.dca.rentabilidadPct)}</strong> DCA de bitcoin
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="pf-cifra">En vivo</p>
                    <p className="pf-pieza-texto">Precio de entrada y rentabilidad de cada compra.</p>
                  </>
                )}

                <p className="pf-mano">mis compras reales, también las que pierden</p>
                <Tecla href={destino(cartera)} color="menta" tamano="peq">
                  Ver la cartera <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </article>

              {/* Cursos: lo publicado, de Supabase */}
              <article className="pf-pieza pf-pieza--lila">
                <span className="pf-pieza-cab">
                  <span className="pf-pieza-ic" aria-hidden="true"><IconoCursos size={26} /></span>
                  <span className="pf-pegatina" aria-hidden="true">Con<br />certi-<br />ficado</span>
                </span>
                <h3 className="pf-pieza-titulo">Cursos</h3>

                {cursos.length > 0 ? (
                  <span className="pf-cifras">
                    <span><strong>{cursos.length}</strong><small>{cursos.length === 1 ? "curso" : "cursos"}</small></span>
                    <span><strong>{lecciones}</strong><small>lecciones</small></span>
                    <span><strong>{horas}</strong><small>de contenido</small></span>
                  </span>
                ) : (
                  <p className="pf-pieza-texto">Por módulos, con examen en cada uno y certificado al aprobar el final.</p>
                )}

                <p className="pf-pieza-nota"><Award size={14} aria-hidden="true" /> Examen por módulo y certificado verificable.</p>
                <Tecla href={destino(aula)} color="lila" tamano="peq">
                  Ver cursos <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
              </article>
            </div>

            {/* ── La oferta ── */}
            <div className="pf-oferta">
              <div className="pf-oferta-precio">
                <span className="pf-sello pf-sello--naranja"><Crown size={14} aria-hidden="true" /> Premium</span>
                <p className="pf-precio">
                  {PRECIO}<small>/mes</small>
                </p>
                <p className="pf-precio-dia">Unos {PRECIO_DIA} al día · el precio se te queda fijado</p>
              </div>

              <ul className="pf-incluye">
                {INCLUYE.map((t) => (
                  <li key={t}><span className="pf-check" aria-hidden="true"><Check size={13} strokeWidth={3.4} /></span> {t}</li>
                ))}
              </ul>

              <div className="pf-oferta-accion">
                {/* Directo al pago: /api/checkout manda antes al registro si no hay
                    sesión y vuelve sola a Stripe (10-11-2026, pedido por el admin:
                    antes llevaba a /premium, un paso de más). */}
                <Tecla href="/api/checkout" prefetch={false} tamano="grande" ancho>
                  Hazte Premium <ArrowRight size={19} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
                <ul className="pf-garantias">
                  <li><Lock size={13} aria-hidden="true" /> Pago seguro con Stripe</li>
                  <li><Zap size={13} aria-hidden="true" /> Acceso inmediato</li>
                  <li><ShieldCheck size={13} aria-hidden="true" /> Sin permanencia</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pf-inner">
        {/* ── 2 · Preguntas frecuentes y contacto ─────────────────────────
            Cada pregunta es una tarjeta-tecla: se hunde al pulsarla y se abre
            con rebote. La altura la anima AcordeonesSuaves (layout raíz), que
            marca `data-acordeon` mientras abre o cierra: los estilos de
            «abierta» lo respetan para no cambiar de golpe al cerrar. */}
        <div className="pf-faq" id="preguntas">
          <div className="pf-faq-lado">
            <p className="pf-mano pf-mano--naranja">dudas</p>
            <h2 id="pf-faq-titulo" className="pf-faq-titulo">
              Lo que más me <Anotacion tipo="underline" color="var(--azul)">preguntan</Anotacion>
            </h2>
            <p className="pf-faq-texto">Si la tuya no está, escríbeme. Te contesto yo, de tú a tú.</p>

            <div className="pf-contacto">
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
              <Tecla href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" prefetch={false} ancho>
                <InstagramIcon size={18} /> Escríbeme por Instagram
                <ArrowUpRight size={16} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>

            {!isPremium && (
              <Tecla href="/premium" color="blanca" tamano="peq">
                Todas las preguntas en Premium <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            )}
          </div>

          <div className="pf-faq-lista">
            {preguntas.map((p, i) => (
              <details
                key={p.q}
                className={`pf-pregunta pf-pregunta--${COLORES_PREGUNTA[i % COLORES_PREGUNTA.length]}`}
                open={i === 0}
              >
                <summary>
                  <span className="pf-pregunta-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pf-pregunta-q">{p.q}</span>
                  <span className="pf-pregunta-icono" aria-hidden="true"><Plus size={18} strokeWidth={3} /></span>
                </summary>
                <div className="pf-respuesta">
                  <p>{p.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
