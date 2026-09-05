"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
// Los iconos de las tarjetas viajaron con el catálogo a @/lib/herramientas.
// Aquí solo quedan los de la propia maquetación del hero y los microvisuales.
import {
  Lock, ArrowRight, Crown, Trophy, BookOpenText,
  LayoutDashboard, Check, Scale,
} from "lucide-react";
import { DefiLlamaGlyph } from "@/components/BrandMarks";
import { HERRAMIENTAS, herramienta, detalleDe } from "@/lib/herramientas";

/** Cifras reales de la cartera, calculadas en el servidor. `null` si fallan. */
export type ResumenHero = {
  posiciones: number;
  rentabilidadPct: number;
  desdeAnio: number | null;
} | null;

interface Props {
  isLoggedIn: boolean;
  isPremium: boolean;
  guidesCount: number;
  portfolio: ResumenHero;
}

function DefiLlamaMark() {
  return (
    <span className="hero-collab-mark" aria-hidden="true">
      <DefiLlamaGlyph size={13} />
    </span>
  );
}

/**
 * Las tres que se pintan en el hero, en este orden.
 *
 * Son las que convierten suscripción: las dos Premium que ya se pueden usar
 * (Portfolio y Diario) y el directo, que es el gancho de lo que viene. El resto
 * del catálogo vive en `@/lib/herramientas` y se enseña entero en la landing
 * pública /herramientas: seis tarjetas grandes competían entre sí y diluían
 * justo lo que se quiere que mire quien entra por primera vez.
 *
 * El orden importa y no es alfabético: Portfolio abre porque es la prueba
 * (posiciones reales), el directo va en medio porque es lo más llamativo, y el
 * Diario cierra porque es lo que retiene una vez dentro.
 */
const EN_EL_HERO = ["portfolio", "directo", "diario"] as const;

/* Microvisuales de producto — decorativos, cada tarjeta "enseña" su
   herramienta en miniatura en lugar de solo describirla. */

// Guías: ruta de pasos completados → nodo activo → logro final
function VizPath() {
  return (
    <div className="hero-viz-path" aria-hidden="true">
      <span className="hero-viz-node is-done"><Check size={11} strokeWidth={3.5} /></span>
      <span className="hero-viz-link is-done" />
      <span className="hero-viz-node is-done"><Check size={11} strokeWidth={3.5} /></span>
      <span className="hero-viz-link is-done" />
      <span className="hero-viz-node is-now" />
      <span className="hero-viz-link" />
      <span className="hero-viz-node is-badge"><Trophy size={12} strokeWidth={2.2} /></span>
    </div>
  );
}

// Diario: curva de equity.
//
// El micrográfico se estira a lo ancho de la tarjeta con
// preserveAspectRatio="none", lo que deforma el grosor del trazo según la
// inclinación de cada tramo. Por eso todos los trazos llevan
// vector-effect="non-scaling-stroke": el grosor se calcula tras la
// transformación y queda uniforme sea cual sea el ancho de la tarjeta.
// Termina en x=200 y no en 220: el punto final necesita aire contra el borde
// derecho de la tarjeta.
//
// Es el único gráfico del mosaico a propósito: el Diario sí vive de una curva.
// El resto de tarjetas enseña su herramienta con otro lenguaje visual.
const SPARK_LINE =
  "M0 50 C11 47 15 44 22 45 C31 46 33 48 40 48 C51 48 53 38 62 36 " +
  "C73 34 75 40 84 40 C95 40 96 29 105 28 C116 27 118 32 127 32 " +
  "C140 32 140 20 151 19 C162 18 164 23 173 23 C185 23 189 12 200 8";

function VizSpark() {
  return (
    <svg
      className="hero-viz-spark"
      viewBox="0 0 220 58"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a4d" stopOpacity="0.34" />
          <stop offset="0.7" stopColor="#ff9a4d" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ff9a4d" stopOpacity="0" />
        </linearGradient>
        {/* El trazo se enciende de izquierda a derecha: sugiere progresión. */}
        <linearGradient id="heroSparkLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff9a4d" stopOpacity="0.45" />
          <stop offset="0.55" stopColor="#ff9a4d" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb877" stopOpacity="1" />
        </linearGradient>
      </defs>

      <path d={`${SPARK_LINE} L200 58 L0 58 Z`} fill="url(#heroSparkFill)" />

      <path
        className="hero-viz-draw"
        d={SPARK_LINE}
        fill="none"
        stroke="url(#heroSparkLine)"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Último punto: donde está la cuenta ahora mismo */}
      <circle className="hero-viz-tip" cx="200" cy="8" r="3.6" fill="#ffb877" />
    </svg>
  );
}

// Liberaciones: barra de vesting con marcador del próximo unlock
function VizVest() {
  return (
    <div className="hero-viz-vest" aria-hidden="true">
      <div className="hero-viz-vest-bar">
        <span className="hero-viz-vest-fill" />
        <i className="hero-viz-vest-mark" />
      </div>
      <div className="hero-viz-vest-meta">
        <span>Circulante</span>
        <span>Próximo unlock</span>
      </div>
    </div>
  );
}

// Predicción: la lectura que devuelve la calculadora, no un gráfico. La
// herramienta no dibuja una curva — responde a "¿cuánto market cap hace falta
// para ese precio?", así que la tarjeta enseña justo eso: la pregunta, el
// número que sale y contra qué se mide. Cifras de ejemplo, deliberadamente
// redondas: ilustran la lectura, no fingen ser el dato en vivo.
function VizReadout() {
  return (
    <div className="hero-viz-readout" aria-hidden="true">
      <div className="hero-viz-readout-line">
        <span className="hero-viz-readout-key">Precio objetivo</span>
        <span className="hero-viz-readout-num">10,00$</span>
      </div>

      <div className="hero-viz-readout-op">
        <span>necesita</span>
      </div>

      <div className="hero-viz-readout-line">
        <span className="hero-viz-readout-key">Market cap</span>
        <span className="hero-viz-readout-num is-result">96,4 B$</span>
      </div>

      <span className="hero-viz-readout-ref">
        <Scale size={11} strokeWidth={2.2} aria-hidden="true" />
        Casi el market cap de SOL hoy
      </span>
    </div>
  );
}

/**
 * Portfolio: la rentabilidad REAL de la cartera, en grande.
 *
 * Sustituye a las barras de asignación que había antes. Un número verificable
 * convierte más que un gráfico decorativo, y aquí además es real: sale de
 * `resumenPortfolioPublico()` en el servidor y llega por props.
 *
 * Si el cálculo falla —Supabase caído, CoinGecko sin responder— no se inventa
 * nada: la tarjeta se queda sin bloque de datos. Ver `VIZ_CON_DATOS`.
 */
function VizFolioDatos({ datos }: { datos: ResumenHero }) {
  if (!datos) return null;
  const positiva = datos.rentabilidadPct >= 0;

  return (
    <div className="hero-cifras" aria-hidden="true">
      <div className="hero-cifras-main">
        <span className={`hero-cifras-num${positiva ? " es-verde" : " es-rojo"}`}>
          {positiva ? "+" : ""}
          {datos.rentabilidadPct.toFixed(1).replace(".", ",")} %
        </span>
        <span className="hero-cifras-key">Rentabilidad de la cartera</span>
      </div>
      <div className="hero-cifras-pie">
        <span>{datos.posiciones} posiciones abiertas</span>
        {datos.desdeAnio && <span>Desde {datos.desdeAnio}</span>}
      </div>
    </div>
  );
}

/**
 * Diario: las estadísticas que devuelve, con cifras de EJEMPLO.
 *
 * Aquí no hay dato real que enseñar y es importante entender por qué: las
 * estadísticas del diario son de cada usuario, privadas, así que no existe una
 * rentabilidad global del producto. Poner un número sin marcar sería inventar
 * una rentabilidad, que es justo lo que no se hace en esta web.
 *
 * Por eso van etiquetadas como ejemplo, con cifras deliberadamente redondas.
 */
function VizSparkDatos() {
  return (
    <div className="hero-cifras" aria-hidden="true">
      <div className="hero-cifras-main">
        <span className="hero-cifras-num es-verde">58 %</span>
        <span className="hero-cifras-key">
          Win rate <i className="hero-cifras-tag">ejemplo</i>
        </span>
      </div>
      <div className="hero-cifras-pie">
        <span>+1.240 $ acumulado</span>
        <span>47 operaciones</span>
      </div>
    </div>
  );
}

// Trading en Directo: la cabecera de la sala — señal en directo, el par y la
// temporalidad que se opera, y debajo lo que se ve durante la sesión.
function VizLive() {
  return (
    <div className="hero-viz-live" aria-hidden="true">
      <div className="hero-viz-live-bar">
        <span className="hero-viz-live-tag">
          <i className="hero-viz-live-dot" />
          En directo
        </span>
        <span className="hero-viz-live-pair">
          NASDAQ <em>Futuros</em> <b>5m</b>
        </span>
      </div>
      <div className="hero-viz-live-feed">
        <span>Operativa comentada</span>
        <span>Gestión de riesgo en vivo</span>
      </div>
    </div>
  );
}

const VIZ: Record<string, () => React.JSX.Element> = {
  path: VizPath,
  spark: VizSpark,
  vest: VizVest,
  readout: VizReadout,
  live: VizLive,
};

/**
 * Herramientas cuya tarjeta enseña CIFRAS en lugar de un microvisual.
 *
 * Un número grande convierte más que un gráfico decorativo, sobre todo cuando
 * es verificable. Decidido el 05-09-2026 para Portfolio —donde la cifra es
 * real— y Diario, donde va etiquetada como ejemplo porque las estadísticas son
 * privadas de cada usuario y no existe una rentabilidad global del producto.
 */
const CIFRAS = new Set(["portfolio", "diario"]);

// Foco que sigue al cursor: expone la posición como variables CSS que el
// ::spot de la tarjeta usa para pintar el halo.
function trackSpot(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export default function HeroSpotlight({ isLoggedIn, isPremium, guidesCount, portfolio }: Props) {
  const reduceMotion = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : 0.08 + i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <div className="hero-spotlight">

      {/* ── Las tres piezas de la academia ──────────────────────────────────
          Sin cabecera de sección: el "Arsenal · 08 herramientas" ponía una
          etiqueta de catálogo encima de lo que tiene que leerse como producto,
          y una cifra que además contradecía las tres tarjetas visibles.

          Cada tarjeta se lee de arriba abajo como un argumento: qué es, qué
          promete, cómo se ve por dentro y con qué se respalda. La prueba —el
          microvisual— pesa más que el texto a propósito: enseñar el producto
          convence más que adjetivarlo. */}
      <div className="hero-arsenal">
        {EN_EL_HERO.map((id) => herramienta(id)).map((f, i) => {
          const conCifras = CIFRAS.has(f.id);
          const Viz = !conCifras && f.viz ? VIZ[f.viz] : undefined;
          const bloqueada = f.premiumGate && !isPremium;
          const href = f.premiumGate ? (isPremium ? f.premiumHref! : "/premium") : f.href!;

          const cuerpo = (
            <>
              {/* Halo que sigue al cursor: da profundidad sin adornos. */}
              <span className="tool-aura" aria-hidden="true" />
              <span className="tool-edge" aria-hidden="true" />

              <span className="tool-eyebrow">
                {bloqueada && <Lock size={9} strokeWidth={2.6} aria-hidden="true" />}
                {f.tag}
              </span>

              <h3 className="tool-name">{f.label}</h3>
              <p className="tool-claim">{f.desc}</p>

              {/* La ventana al producto. Va enmarcada para que se lea como una
                  captura de la herramienta y no como un adorno del fondo.
                  Portfolio y Diario enseñan cifras en vez de microvisual. */}
              {conCifras ? (
                <span className="tool-stage">
                  {f.id === "portfolio" ? <VizFolioDatos datos={portfolio} /> : <VizSparkDatos />}
                </span>
              ) : Viz ? (
                <span className="tool-stage" aria-hidden="true">
                  <Viz />
                </span>
              ) : null}

              {/* Respaldo en una sola línea, sin pastillas: las cápsulas
                  sueltas ensucian y restan seriedad a un precio de 49,99€. */}
              <span className="tool-proof">
                {f.chips.map((c, n) => (
                  <span key={c.label} className="tool-proof-item">
                    {n > 0 && <i className="tool-proof-sep" aria-hidden="true" />}
                    {c.label}
                  </span>
                ))}
              </span>

              {"collab" in f && f.collab === "defillama" && (
                <span className="tool-collab">
                  Datos en colaboración con
                  <span className="tool-collab-badge">
                    <DefiLlamaMark />
                    Defi<span>Llama</span>
                  </span>
                </span>
              )}

              {/* Dos acciones, y la tarjeta ya NO es un enlace envolvente: un
                  <a> dentro de otro <a> es HTML inválido y el navegador lo
                  deshace por su cuenta. Con dos enlaces hermanos, además, el
                  teclado los recorre por separado. */}
              <span className="tool-actions">
                {/* Etiqueta corta a propósito: con dos botones en línea, una
                    tarjeta de tres columnas mide unos 340 px y "Desbloquear con
                    Premium" desbordaba contra el secundario. */}
                <Link href={href} className="tool-action">
                  {bloqueada ? "Hazte Premium" : "Entrar"}
                  <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                <Link href={detalleDe(f)} className="tool-detalle">
                  Ver detalles
                </Link>
              </span>
            </>
          );

          return (
            <motion.div
              key={f.id}
              className={`tool tool--${f.id}`}
              style={{ "--tool-color": f.color } as React.CSSProperties}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              onMouseMove={trackSpot}
            >
              <article className="tool-link">{cuerpo}</article>
            </motion.div>
          );
        })}
      </div>

      {/* ── Dock de acciones: banda premium o accesos, según estado ── */}
      <motion.div
        className="hero-cta-zone"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.46, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {isLoggedIn && isPremium ? (
          <div className="hero-dock">
            <Link href="/dashboard" className="hero-dock-primary">
              <span className="hero-dock-shine" aria-hidden="true" />
              <span className="hero-dock-primary-icon" aria-hidden="true">
                <LayoutDashboard size={19} strokeWidth={2.2} />
              </span>
              <span className="hero-dock-primary-text">
                <strong>Ir a mi Academia</strong>
                <span>Continúa donde lo dejaste</span>
              </span>
              <ArrowRight size={18} strokeWidth={2.5} className="hero-dock-arrow" aria-hidden="true" />
            </Link>
            <Link href="/guias" className="hero-dock-guide">
              <span className="hero-dock-guide-icon" aria-hidden="true">
                <BookOpenText size={17} strokeWidth={2} />
              </span>
              <span className="hero-dock-guide-text">
                <span className="hero-dock-guide-eyebrow">Guías de la academia</span>
                <strong>Explora las {guidesCount} guías publicadas</strong>
              </span>
              <span className="hero-dock-guide-cta">
                Ver <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
              </span>
            </Link>
          </div>
        ) : (
          <>
            {/* Una sola banda, no dos seguidas.
                Arriba, la tira con las ocho herramientas y su enlace; abajo, la
                oferta Premium. Antes eran dos bloques pegados —un botón suelto
                y la banda— y se leían como una repetición.

                Deja de ser un <Link> envolvente: dentro hay dos destinos
                distintos, y un <a> dentro de otro es HTML inválido. */}
            <div className="hero-premium-band">
              <span className="hero-premium-band-glow" aria-hidden="true" />
              <span className="hero-premium-band-shine" aria-hidden="true" />

              <div className="hero-band-tools">
                <span className="hero-band-tools-icons" aria-hidden="true">
                  {HERRAMIENTAS.map((h) => {
                    const Icono = h.icon;
                    return (
                      <span
                        key={h.id}
                        className="hero-band-tool-icon"
                        style={{ "--icon-color": h.color } as React.CSSProperties}
                      >
                        <Icono size={15} strokeWidth={2} />
                      </span>
                    );
                  })}
                </span>
                <Link href="/herramientas" className="hero-band-tools-link">
                  Ver las {HERRAMIENTAS.length} herramientas
                  <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              </div>

              <span className="hero-band-sep" aria-hidden="true" />

              <div className="hero-premium-band-main">
                <div className="hero-premium-band-left">
                  <span className="hero-premium-band-eyebrow"><Crown size={12} aria-hidden="true" /> Premium</span>
                  <h3 className="hero-premium-band-title">Dale la vuelta a tu curva de aprendizaje</h3>
                  <p className="hero-premium-band-sub">
                    Diario de trading con estadísticas, liberaciones de tokens en tiempo real y todas las herramientas exclusivas de la academia.
                  </p>
                </div>
                <div className="hero-premium-band-right">
                  <div className="hero-premium-band-price">
                    <span className="hero-premium-band-amount">49,99€</span>
                    <span className="hero-premium-band-period">/mes</span>
                  </div>
                  <Link href="/premium" className="hero-premium-band-cta">
                    Hazte Premium <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>

            {!isLoggedIn && (
              <Link href="/register" className="hero-cta-mini">
                ¿Prefieres empezar gratis? Crea tu cuenta <ArrowRight size={13} aria-hidden="true" />
              </Link>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
