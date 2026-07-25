"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  NotebookPen, Map, GraduationCap, Lock, Sparkles, Trophy,
  ClipboardCheck, BadgeCheck, Hourglass, ArrowRight,
  Radar, Unlock, Target, Eye, PieChart, Wallet, TrendingUp,
} from "lucide-react";

interface Props {
  isPremium: boolean;
}

// Tarjetas de herramientas añadidas (fila 2 y 3 del spotlight). Cada una
// lleva su color de acento via --spot; el CSS genérico .dash-spot-*--accent
// lo resuelve con color-mix, así no hace falta una clase por color.
type SpotTool = {
  id: string;
  accent: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge: "premium" | "free";
  premiumGate: boolean;
  href: string;
  ctaLabel: string;
  chips: { icon: LucideIcon; label: string }[];
};

const EXTRA_TOOLS: SpotTool[] = [
  {
    id: "radar", accent: "#38bdf8", icon: Radar, title: "Radar Diario",
    desc: "Tu resumen del mercado cada día: Bitcoin en 24h, miedo y codicia, macro de EE. UU. y los mayores movimientos.",
    badge: "premium", premiumGate: true, href: "/herramientas/radar", ctaLabel: "Abrir radar",
    chips: [{ icon: ClipboardCheck, label: "Resumen diario" }, { icon: BadgeCheck, label: "Macro EE. UU." }],
  },
  {
    id: "liberaciones", accent: "#34d399", icon: Unlock, title: "Liberaciones de Tokens",
    desc: "Anticipa la presión vendedora con el calendario de vesting del mercado en tiempo real.",
    badge: "premium", premiumGate: true, href: "/herramientas/liberaciones", ctaLabel: "Ver liberaciones",
    chips: [{ icon: ClipboardCheck, label: "Calendario en vivo" }, { icon: BadgeCheck, label: "Datos por token" }],
  },
  {
    id: "mi-portfolio", accent: "#a78bfa", icon: PieChart, title: "Mi Portfolio",
    desc: "Registra tus compras y ventas y sigue tu precio medio, valor actual y P&L en tiempo real.",
    badge: "premium", premiumGate: true, href: "/dashboard/mi-portfolio", ctaLabel: "Abrir mi portfolio",
    chips: [{ icon: ClipboardCheck, label: "Compras y ventas" }, { icon: TrendingUp, label: "P&L en vivo" }],
  },
  {
    id: "portfolio-adelin", accent: "#f472b6", icon: Wallet, title: "Portfolio Adelin",
    desc: "Sigue en directo las compras reales de AdelinBTC en spot, con precios de entrada y contexto.",
    badge: "premium", premiumGate: true, href: "/portfolio", ctaLabel: "Ver portfolio",
    chips: [{ icon: Wallet, label: "Compras reales" }, { icon: BadgeCheck, label: "Precios de entrada" }],
  },
  {
    id: "prediccion", accent: "#60a5fa", icon: Target, title: "Predicción de Precio",
    desc: "¿Qué market cap necesita tu token para llegar a un precio objetivo? Calcúlalo al instante.",
    badge: "free", premiumGate: false, href: "/calculadora", ctaLabel: "Abrir calculadora",
    chips: [{ icon: Sparkles, label: "Cálculo al instante" }],
  },
  {
    id: "watchlist", accent: "#22d3ee", icon: Eye, title: "Watchlist",
    desc: "Sigue el precio de las criptomonedas que te interesan, todas de un vistazo.",
    badge: "free", premiumGate: false, href: "/dashboard/watchlist", ctaLabel: "Abrir watchlist",
    chips: [{ icon: Eye, label: "Precios en vivo" }],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DashboardSpotlight({ isPremium }: Props) {
  return (
    <div className="dash-spot-grid">
      {/* ── Diario de Trading ── */}
      <motion.div
        className="dash-spot-card dash-spot-card--trading"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ y: -6 }}
      >
        <div className="dash-spot-glow" />
        <div className="dash-spot-top">
          <div className="dash-spot-icon dash-spot-icon--trading">
            <NotebookPen size={22} strokeWidth={2} />
          </div>
          <span className="dash-spot-badge dash-spot-badge--premium">
            <Sparkles size={11} /> Premium
          </span>
        </div>

        <h3 className="dash-spot-title">Diario de Trading</h3>
        <p className="dash-spot-desc">
          El diario de trading más completo e interactivo de internet. No solo registras
          tus operaciones — completas <strong>retos</strong> que te convierten, paso a paso, en un trader disciplinado.
        </p>

        <div className="dash-spot-chips">
          <span className="dash-spot-chip"><ClipboardCheck size={12} /> Registro de operaciones</span>
          <span className="dash-spot-chip"><Trophy size={12} /> Retos y niveles</span>
          <span className="dash-spot-chip"><BadgeCheck size={12} /> Estadísticas reales</span>
        </div>

        {isPremium ? (
          <Link href="/dashboard/trading" className="dash-spot-cta dash-spot-cta--trading">
            Abrir mi diario <ArrowRight size={15} />
          </Link>
        ) : (
          <Link href="/premium" className="dash-spot-cta dash-spot-cta--locked">
            <Lock size={13} /> Hazte Premium <ArrowRight size={15} />
          </Link>
        )}
      </motion.div>

      {/* ── Guías Interactivas ── */}
      <motion.div
        className="dash-spot-card dash-spot-card--guias"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ y: -6 }}
      >
        <div className="dash-spot-glow" />
        <div className="dash-spot-top">
          <div className="dash-spot-icon dash-spot-icon--guias">
            <Map size={22} strokeWidth={2} />
          </div>
          <span className="dash-spot-badge dash-spot-badge--star">
            ★ Lo más top
          </span>
        </div>

        <h3 className="dash-spot-title">Guías Interactivas</h3>
        <p className="dash-spot-desc">
          El elemento <strong>estrella</strong> de toda la academia. Aprende con quizzes,
          progreso guardado y logros exclusivos por cada guía completada.
        </p>

        <div className="dash-spot-chips">
          <span className="dash-spot-chip"><Sparkles size={12} /> 100% interactivas</span>
          <span className="dash-spot-chip"><Trophy size={12} /> Logros exclusivos</span>
        </div>

        <Link href="/guias" className="dash-spot-cta dash-spot-cta--guias">
          Explorar guías <ArrowRight size={15} />
        </Link>
      </motion.div>

      {/* ── Cursos ── */}
      <motion.div
        className="dash-spot-card dash-spot-card--cursos"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="dash-spot-glow" />
        <div className="dash-spot-top">
          <div className="dash-spot-icon dash-spot-icon--cursos">
            <GraduationCap size={22} strokeWidth={2} />
          </div>
          <span className="dash-spot-badge dash-spot-badge--soon">
            <Hourglass size={11} /> Próximamente
          </span>
        </div>

        <h3 className="dash-spot-title">Cursos</h3>
        <p className="dash-spot-desc">
          Formación estructurada de principio a fin, con módulos y evaluaciones.
          Uno de los pilares que vienen para la academia.
        </p>

        <div className="dash-spot-chips">
          <span className="dash-spot-chip dash-spot-chip--muted"><GraduationCap size={12} /> Formación paso a paso</span>
        </div>

        <span className="dash-spot-cta dash-spot-cta--soon">Muy pronto disponible</span>
      </motion.div>

      {/* ── Resto de herramientas (data-driven) ── */}
      {EXTRA_TOOLS.map((t, idx) => {
        const IconEl = t.icon;
        const locked = t.premiumGate && !isPremium;
        return (
          <motion.div
            key={t.id}
            className="dash-spot-card dash-spot-card--accent"
            style={{ "--spot": t.accent } as React.CSSProperties}
            custom={3 + idx}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -6 }}
          >
            <div className="dash-spot-glow" />
            <div className="dash-spot-top">
              <div className="dash-spot-icon dash-spot-icon--accent">
                <IconEl size={22} strokeWidth={2} />
              </div>
              {t.badge === "premium" ? (
                <span className="dash-spot-badge dash-spot-badge--premium">
                  <Sparkles size={11} /> Premium
                </span>
              ) : (
                <span className="dash-spot-badge dash-spot-badge--free">
                  <BadgeCheck size={11} /> Free · Registro
                </span>
              )}
            </div>

            <h3 className="dash-spot-title">{t.title}</h3>
            <p className="dash-spot-desc">{t.desc}</p>

            <div className="dash-spot-chips">
              {t.chips.map((c) => {
                const ChipIcon = c.icon;
                return (
                  <span key={c.label} className="dash-spot-chip">
                    <ChipIcon size={12} /> {c.label}
                  </span>
                );
              })}
            </div>

            {locked ? (
              <Link href="/premium" className="dash-spot-cta dash-spot-cta--locked">
                <Lock size={13} /> Hazte Premium <ArrowRight size={15} />
              </Link>
            ) : (
              <Link href={t.href} className="dash-spot-cta dash-spot-cta--accent">
                {t.ctaLabel} <ArrowRight size={15} />
              </Link>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
