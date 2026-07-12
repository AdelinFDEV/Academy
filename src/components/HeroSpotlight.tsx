"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion, useMotionValue, useSpring, useReducedMotion,
} from "framer-motion";
import {
  NotebookPen, Map, GraduationCap, Unlock, Lock, ArrowRight, Crown,
  Trophy, ClipboardCheck, BadgeCheck, Hourglass, Sparkles, BookOpenText,
  LayoutDashboard, Gem,
} from "lucide-react";
import { DefiLlamaGlyph } from "@/components/BrandMarks";

interface Props {
  isLoggedIn: boolean;
  isPremium: boolean;
  latestGuide: { slug: string; shortTitle: string };
}

function DefiLlamaMark() {
  return (
    <span className="hero-collab-mark" aria-hidden="true">
      <DefiLlamaGlyph size={13} />
    </span>
  );
}

const FEATURES = [
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
  },
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
  },
  {
    id: "cursos",
    icon: GraduationCap,
    label: "Cursos",
    tag: "Próximamente",
    color: "#a3a3ff",
    desc: "Formación estructurada de principio a fin, con módulos y evaluaciones. Uno de los grandes pilares que llegan.",
    note: "Por muchos cursos que lancemos, todos estarán siempre incluidos en tu única suscripción Premium de 19,99€/mes.",
    chips: [
      { icon: Hourglass, label: "En preparación" },
    ],
    soon: true,
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
  },
];

function TiltCard({
  children, className, disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 260, damping: 22 });
  const springY = useSpring(rotY, { stiffness: 260, damping: 22 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotY.set(px * 9);
    rotX.set(-py * 9);
  }

  function handleMouseLeave() {
    rotX.set(0);
    rotY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSpotlight({ isLoggedIn, isPremium, latestGuide }: Props) {
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
      {/* ── Bento de las 4 herramientas destacadas ── */}
      <div className="hero-bento">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const locked = f.premiumGate && !isPremium;
          const href = f.soon ? null : f.premiumGate ? (isPremium ? (f.id === "diario" ? "/dashboard/trading" : "/herramientas/liberaciones") : "/premium") : f.href!;

          const cardInner = (
            <>
              <div className="hero-bento-glow" style={{ background: f.color }} />
              <div className="hero-bento-top">
                <div className="hero-bento-icon" style={{ color: f.color, background: `${f.color}1c`, boxShadow: `0 0 0 1px ${f.color}33 inset` }}>
                  <Icon size={22} strokeWidth={2} />
                </div>
                <span
                  className={`hero-bento-badge${f.soon ? " hero-bento-badge--soon" : f.premiumGate ? " hero-bento-badge--premium" : ""}`}
                  style={f.soon || f.premiumGate ? undefined : { color: f.color, background: `${f.color}22`, borderColor: `${f.color}44` }}
                >
                  {locked && <Lock size={10} aria-hidden="true" />}
                  {f.tag}
                </span>
              </div>

              <h3 className="hero-bento-label">{f.label}</h3>
              <p className="hero-bento-desc">{f.desc}</p>

              {"note" in f && f.note && (
                <p className="hero-bento-note" style={{ color: f.color, background: `${f.color}18`, borderColor: `${f.color}3a` }}>
                  <Gem size={12} aria-hidden="true" /> {f.note}
                </p>
              )}

              <div className="hero-bento-chips">
                {f.chips.map((c) => (
                  <span key={c.label} className="hero-bento-chip">
                    <c.icon size={11} aria-hidden="true" /> {c.label}
                  </span>
                ))}
              </div>

              {"collab" in f && f.collab === "defillama" && (
                <span className="hero-bento-collab">
                  Datos oficiales en colaboración con
                  <span className="hero-bento-collab-badge">
                    <DefiLlamaMark />
                    Defi<span>Llama</span>
                  </span>
                </span>
              )}

              {href && (
                <span className="hero-bento-cta" style={{ color: f.color }}>
                  {locked ? "Hazte Premium" : "Explorar"} <ArrowRight size={13} strokeWidth={2.5} />
                </span>
              )}
              {f.soon && <span className="hero-bento-cta hero-bento-cta--soon">Muy pronto</span>}
            </>
          );

          return (
            <motion.div
              key={f.id}
              className="hero-bento-cell"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <TiltCard
                className={`hero-bento-card${f.soon ? " hero-bento-card--soon" : ""}`}
                disabled={!!reduceMotion || f.soon}
              >
                {href ? (
                  <Link href={href} className="hero-bento-card-link">
                    {cardInner}
                  </Link>
                ) : (
                  <div className="hero-bento-card-link">{cardInner}</div>
                )}
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* ── CTA zone: premium band o bienvenida, según estado ── */}
      <motion.div
        className="hero-cta-zone"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.46, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {isLoggedIn && isPremium ? (
          <div className="hero-cta-row">
            <Link href="/dashboard" className="hero-premium-cta hero-premium-cta--dash">
              <span className="hero-premium-cta-shine" aria-hidden="true" />
              <span className="hero-premium-cta-icon">
                <LayoutDashboard size={19} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="hero-premium-cta-text">
                <strong>Ir a mi Academia</strong>
                <span>Continúa donde lo dejaste</span>
              </span>
              <ArrowRight size={18} strokeWidth={2.5} className="hero-premium-cta-arrow" />
            </Link>
            <Link href={`/guias/${latestGuide.slug}`} className="hero-cta-mini hero-cta-mini--gold">
              <span className="hero-cta-mini-icon">
                <BookOpenText size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="hero-cta-mini-text">
                <strong>Última guía</strong>
                <span>{latestGuide.shortTitle}</span>
              </span>
              <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
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
