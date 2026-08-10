"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  NotebookPen, Map, GraduationCap, Unlock, Lock, ArrowRight, Crown,
  Trophy, ClipboardCheck, BadgeCheck, Hourglass, Sparkles, BookOpenText,
  LayoutDashboard, Gem, UserRound, Check, Wallet, LineChart,
} from "lucide-react";
import { DefiLlamaGlyph } from "@/components/BrandMarks";
import { ASESORIA_PLANS } from "@/lib/asesoria";

interface Props {
  isLoggedIn: boolean;
  isPremium: boolean;
  guidesCount: number;
}

function DefiLlamaMark() {
  return (
    <span className="hero-collab-mark" aria-hidden="true">
      <DefiLlamaGlyph size={13} />
    </span>
  );
}

// El arsenal: showcase de la academia (la etiqueta cuenta 8 herramientas
// reales; aquí se enseñan las 6 destacadas). `viz` decide qué microvisual
// de producto pinta la tarjeta — enseñar la herramienta vende más que
// describirla.
const FEATURES = [
  {
    id: "guias",
    icon: Map,
    label: "Guías Interactivas",
    tag: "★ Lo más top",
    color: "#ffd166",
    desc: "El elemento estrella de la academia: aprende paso a paso con quizzes y logros exclusivos.",
    chips: [
      { icon: Sparkles, label: "100% interactivas" },
      { icon: BadgeCheck, label: "Logros exclusivos" },
    ],
    href: "/guias",
    viz: "path",
  },
  {
    id: "prediccion",
    icon: LineChart,
    label: "Predicción de Precio",
    tag: "Gratis",
    color: "#22d3ee",
    desc: "Calcula qué market cap necesita un token para llegar a tu precio objetivo, comparado con BTC, ETH y SOL en tiempo real.",
    chips: [
      { icon: Sparkles, label: "Market cap objetivo" },
      { icon: BadgeCheck, label: "Datos en tiempo real" },
    ],
    href: "/calculadora",
    viz: "target",
  },
  {
    id: "diario",
    icon: NotebookPen,
    label: "Diario de Trading",
    tag: "Premium",
    color: "#ff9a4d",
    desc: "No es solo un registro: son retos que te convierten, operación a operación, en un trader disciplinado.",
    chips: [
      { icon: ClipboardCheck, label: "Registro de operaciones" },
      { icon: Trophy, label: "Retos y niveles" },
    ],
    premiumGate: true,
    premiumHref: "/dashboard/trading",
    viz: "spark",
  },
  {
    id: "portfolio",
    icon: Wallet,
    label: "Portfolio Adelin",
    tag: "Premium",
    color: "#4f9dff",
    desc: "Todas mis compras en spot de este ciclo, publicadas con precio de entrada y rentabilidad en tiempo real.",
    chips: [
      { icon: ClipboardCheck, label: "Mis posiciones reales" },
      { icon: BadgeCheck, label: "PnL en vivo" },
    ],
    premiumGate: true,
    premiumHref: "/portfolio",
    viz: "folio",
  },
  {
    id: "liberaciones",
    icon: Unlock,
    label: "Liberaciones de Tokens",
    tag: "Premium",
    color: "#34d399",
    desc: "Anticipa la presión vendedora con el calendario de vesting del mercado en tiempo real.",
    chips: [
      { icon: ClipboardCheck, label: "Calendario en vivo" },
      { icon: BadgeCheck, label: "Datos por token" },
    ],
    collab: "defillama",
    premiumGate: true,
    premiumHref: "/herramientas/liberaciones",
    viz: "vest",
  },
  {
    id: "cursos",
    icon: GraduationCap,
    label: "Cursos",
    tag: "Próximamente",
    color: "#a3a3ff",
    desc: "Formación estructurada de principio a fin, con módulos y evaluaciones.",
    note: "Por muchos cursos que lancemos, todos estarán siempre incluidos en tu única suscripción Premium de 19,99€/mes.",
    chips: [
      { icon: Hourglass, label: "En preparación" },
    ],
    soon: true,
    viz: "modules",
  },
];

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
// Los dos micrográficos se estiran a lo ancho de la tarjeta con
// preserveAspectRatio="none", lo que deforma el grosor del trazo según la
// inclinación de cada tramo. Por eso todos los trazos llevan
// vector-effect="non-scaling-stroke": el grosor se calcula tras la
// transformación y queda uniforme sea cual sea el ancho de la tarjeta.
// Termina en x=200 y no en 220: el punto final necesita aire contra el borde
// derecho de la tarjeta. Queda a la altura de la diana del gráfico de
// Predicción (x=192), así las dos tarjetas respiran igual.
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

// Predicción: histórico sólido → proyección punteada hasta el precio objetivo.
const TARGET_HIST =
  "M0 50 C14 47 18 43 30 43 C42 43 44 46 56 45 C70 44 70 34 84 33 " +
  "C96 32 100 36 112 34 C118 33 120 31 124 30";
const TARGET_PROJ = "M124 30 C148 26 168 18 192 11";

function VizTarget() {
  return (
    <svg
      className="hero-viz-target"
      viewBox="0 0 220 58"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroTargetFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="0.75" stopColor="#22d3ee" stopOpacity="0.05" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area del tramo ya conocido, para que no flote una linea suelta */}
      <path d={`${TARGET_HIST} L124 58 L0 58 Z`} fill="url(#heroTargetFill)" />

      {/* Nivel del precio objetivo: explica hacia donde apunta la proyeccion */}
      <line
        x1="0" y1="11" x2="192" y2="11"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeDasharray="2 6"
        opacity="0.28"
        vectorEffect="non-scaling-stroke"
      />

      <path
        className="hero-viz-draw"
        d={TARGET_HIST}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      <path
        className="hero-viz-proj"
        d={TARGET_PROJ}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
        opacity="0.8"
        vectorEffect="non-scaling-stroke"
      />

      {/* Diana del objetivo */}
      <circle className="hero-viz-halo" cx="192" cy="11" r="7.5" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.45" vectorEffect="non-scaling-stroke" />
      <circle className="hero-viz-tip" cx="192" cy="11" r="3.6" fill="#22d3ee" />
    </svg>
  );
}

// Portfolio: posiciones reales con barra de asignación, cada activo con su
// color de marca (SOL rosa, BTC naranja, HYPE verde)
const FOLIO_ROWS = [
  { sym: "SOL", color: "#f472b6", w: 72 },
  { sym: "BTC", color: "#f7931a", w: 48 },
  { sym: "HYPE", color: "#34d399", w: 30 },
];

function VizFolio() {
  return (
    <div className="hero-viz-folio" aria-hidden="true">
      {FOLIO_ROWS.map((r) => (
        <div
          key={r.sym}
          className="hero-viz-folio-row"
          style={{ "--row-color": r.color } as React.CSSProperties}
        >
          <span className="hero-viz-folio-dot" />
          <span className="hero-viz-folio-bar"><i style={{ width: `${r.w}%` }} /></span>
          <span className="hero-viz-folio-tag">{r.sym}</span>
        </div>
      ))}
    </div>
  );
}

// Cursos: módulos en construcción, uno encendiéndose
function VizModules() {
  return (
    <div className="hero-viz-modules" aria-hidden="true">
      <span className="is-on" />
      <span className="is-pulse" />
      <span />
      <span />
    </div>
  );
}

const VIZ: Record<string, () => React.JSX.Element> = {
  path: VizPath,
  spark: VizSpark,
  vest: VizVest,
  folio: VizFolio,
  target: VizTarget,
  modules: VizModules,
};

// Foco que sigue al cursor: expone la posición como variables CSS que el
// ::spot de la tarjeta usa para pintar el halo.
function trackSpot(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export default function HeroSpotlight({ isLoggedIn, isPremium, guidesCount }: Props) {
  const reduceMotion = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: reduceMotion ? 0 : 0.08 + i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const asesoriaFrom = ASESORIA_PLANS.reduce((min, p) => (p.priceValue < min.priceValue ? p : min)).price;

  return (
    <div className="hero-spotlight">
      {/* ── Dúo 50/50: Asesoría 1:1 + Academia Premium ── */}
      <motion.div
        className="hero-duo"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/asesoria" className="hero-duo-card hero-duo-card--ase">
          <span className="hero-duo-glow" aria-hidden="true" />
          <div className="hero-duo-top">
            <span className="hero-duo-icon" aria-hidden="true">
              <UserRound size={20} strokeWidth={2} />
            </span>
            <span className="hero-duo-eyebrow">Asesoría 1:1</span>
          </div>
          <h3 className="hero-duo-title">Sesiones privadas conmigo</h3>
          <p className="hero-duo-desc">
            Trading, estrategia, gestión de riesgo y psicología — sobre tu operativa real, no sobre teoría.
          </p>
          <div className="hero-duo-foot">
            <span className="hero-duo-price">
              <em>desde</em>
              <strong>{asesoriaFrom}</strong>
            </span>
            <span className="hero-duo-btn">
              Ver asesorías <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </span>
          </div>
        </Link>

        <Link href="/premium" className="hero-duo-card hero-duo-card--prem">
          <span className="hero-duo-glow" aria-hidden="true" />
          <div className="hero-duo-top">
            <span className="hero-duo-icon" aria-hidden="true">
              <Crown size={20} strokeWidth={2} />
            </span>
            <span className="hero-duo-eyebrow">Academia Premium</span>
          </div>
          <h3 className="hero-duo-title">Todas las herramientas de la academia</h3>
          <p className="hero-duo-desc">
            Diario de trading, liberaciones de tokens y cada herramienta nueva — una sola suscripción.
          </p>
          <div className="hero-duo-foot">
            <span className="hero-duo-price">
              <strong>19,99€</strong>
              <em>/mes</em>
            </span>
            <span className="hero-duo-btn">
              Hazte Premium <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </span>
          </div>
        </Link>
      </motion.div>

      {/* ── Riel editorial: título del arsenal ── */}
      <motion.div
        className="hero-arsenal-head"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.05, duration: 0.5 }}
      >
        <span className="hero-arsenal-eyebrow">Arsenal de la academia</span>
        <span className="hero-arsenal-rule" aria-hidden="true" />
        <span className="hero-arsenal-count">08 herramientas</span>
      </motion.div>

      {/* ── Mosaico asimétrico de herramientas ── */}
      <div className="hero-arsenal">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const Viz = VIZ[f.viz];
          const locked = f.premiumGate && !isPremium;
          const href = f.soon ? null : f.premiumGate ? (isPremium ? f.premiumHref! : "/premium") : f.href!;

          const inner = (
            <>
              <span className="hero-tool-spot" aria-hidden="true" />
              <span className="hero-tool-topline" aria-hidden="true" />

              <div className="hero-tool-head">
                <span className="hero-tool-icon" aria-hidden="true">
                  <Icon size={21} strokeWidth={2} />
                </span>
                <span className={`hero-tool-badge${f.soon ? " hero-tool-badge--soon" : f.premiumGate ? " hero-tool-badge--premium" : " hero-tool-badge--top"}`}>
                  {locked && <Lock size={10} aria-hidden="true" />}
                  {f.tag}
                </span>
              </div>

              <h3 className="hero-tool-name">{f.label}</h3>
              <p className="hero-tool-desc">{f.desc}</p>

              {Viz && <div className="hero-tool-viz"><Viz /></div>}

              {"note" in f && f.note && (
                <p className="hero-tool-note">
                  <Gem size={12} aria-hidden="true" /> {f.note}
                </p>
              )}

              <div className="hero-tool-chips">
                {f.chips.map((c) => (
                  <span key={c.label} className="hero-tool-chip">
                    <c.icon size={11} aria-hidden="true" /> {c.label}
                  </span>
                ))}
              </div>

              {"collab" in f && f.collab === "defillama" && (
                <span className="hero-tool-collab">
                  Datos oficiales en colaboración con
                  <span className="hero-tool-collab-badge">
                    <DefiLlamaMark />
                    Defi<span>Llama</span>
                  </span>
                </span>
              )}

              {href ? (
                <span className="hero-tool-cta">
                  {locked ? "Hazte Premium" : "Explorar"}
                  <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
                </span>
              ) : (
                <span className="hero-tool-cta hero-tool-cta--soon">Muy pronto</span>
              )}
            </>
          );

          return (
            <motion.div
              key={f.id}
              className={`hero-tool hero-tool--${f.id}${f.soon ? " hero-tool--soon" : ""}`}
              style={{ "--tool-color": f.color } as React.CSSProperties}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              onMouseMove={trackSpot}
            >
              {href ? (
                <Link href={href} className="hero-tool-link">{inner}</Link>
              ) : (
                <div className="hero-tool-link">{inner}</div>
              )}
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
            <Link href="/premium" className="hero-premium-band">
              <span className="hero-premium-band-glow" aria-hidden="true" />
              <span className="hero-premium-band-shine" aria-hidden="true" />
              <div className="hero-premium-band-left">
                <span className="hero-premium-band-eyebrow"><Crown size={12} aria-hidden="true" /> Premium</span>
                <h3 className="hero-premium-band-title">Dale la vuelta a tu curva de aprendizaje</h3>
                <p className="hero-premium-band-sub">
                  Diario de trading con retos, liberaciones de tokens en tiempo real y todas las herramientas exclusivas de la academia.
                </p>
              </div>
              <div className="hero-premium-band-right">
                <span className="hero-premium-band-limited">Por tiempo limitado</span>
                <div className="hero-premium-band-price">
                  <span className="hero-premium-band-old">49,99€</span>
                  <span className="hero-premium-band-amount">19,99€</span>
                  <span className="hero-premium-band-period">/mes</span>
                </div>
                <span className="hero-premium-band-cta">
                  Hazte Premium <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
                </span>
              </div>
            </Link>

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
