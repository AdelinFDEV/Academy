"use client";

import { useRef } from "react";
import {
  motion, useMotionValue, useSpring, useReducedMotion,
} from "framer-motion";
import {
  NotebookPen, Gem, Radio, Unlock, Wallet, Sparkles,
  ClipboardCheck, Trophy, BadgeCheck, Infinity as InfinityIcon, Send,
} from "lucide-react";

const PERKS = [
  {
    id: "diario",
    icon: NotebookPen,
    color: "#ff9a4d",
    title: "Diario de Trading",
    desc: "Cada operación con su riesgo y su resultado, y diez estadísticas que te dicen cómo operas de verdad. Retos y niveles, próximamente.",
    chips: ["P&L y ratio riesgo/beneficio", "Retos y niveles (pronto)"],
  },
  {
    id: "guias",
    icon: Gem,
    color: "#ffd166",
    title: "Guías Premium",
    desc: "Desbloquea todas las guías interactivas, no solo las básicas — con gráficas, quizzes y pasos accionables.",
    chips: ["Todas desbloqueadas", "Quizzes y logros"],
  },
  {
    id: "directo",
    icon: Radio,
    color: "#a3a3ff",
    title: "Trading en Directo",
    desc: "Futuros de NASDAQ, Bitcoin, Solana y XRP en gráficos de 5 minutos, operados en directo y con cada decisión explicada en el momento.",
    chips: ["3 sesiones por semana", "Incluido sin coste extra"],
  },
  {
    id: "liberaciones",
    icon: Unlock,
    color: "#34d399",
    title: "Liberaciones de Tokens",
    desc: "Anticipa la presión vendedora con el calendario de vesting del mercado en tiempo real.",
    chips: ["Calendario en vivo", "Datos por token"],
  },
  {
    id: "portfolio",
    icon: Wallet,
    color: "#fb923c",
    title: "Portfolio Adelin",
    desc: "Sigue en directo las compras reales de AdelinBTC, con precios de entrada y contexto.",
    chips: ["Compras en directo", "Contexto real"],
  },
  {
    id: "comunidad",
    icon: Send,
    color: "#2aabee",
    title: "Comunidad en Telegram",
    desc: "Canal privado solo para miembros, y a mí al otro lado: escríbeme por Telegram y te contesto yo en persona.",
    chips: ["Canal privado", "Hablas conmigo"],
  },
  {
    id: "futuro",
    icon: InfinityIcon,
    color: "#e6b455",
    title: "Todo lo nuevo, incluido",
    desc: "Cada herramienta y contenido que lancemos a partir de ahora entra directo en tu suscripción, sin pagar aparte.",
    // "Para siempre" prometía más de lo que es: el precio se conserva mientras
    // la suscripción siga activa, y quien cancela y vuelve entra con la tarifa
    // vigente — así lo explica la FAQ de esta misma página.
    chips: ["Mientras seas Premium", "Sin sorpresas"],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function TiltCard({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
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
    rotY.set(px * 8);
    rotX.set(-py * 8);
  }

  function handleMouseLeave() {
    rotX.set(0);
    rotY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className="prem-feat-card"
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

const CHIP_ICONS = [ClipboardCheck, Trophy, BadgeCheck, Sparkles];

export default function PremiumFeatureGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="prem-feat-grid">
      {PERKS.map((p, i) => {
        const Icon = p.icon;
        return (
          <motion.div
            key={p.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={cardVariants}
          >
            <TiltCard disabled={!!reduceMotion}>
              <span className="prem-feat-glow" style={{ background: p.color }} aria-hidden="true" />
              <div className="prem-feat-icon" style={{ color: p.color, background: `${p.color}1c`, boxShadow: `0 0 0 1px ${p.color}33 inset` }}>
                <Icon size={22} strokeWidth={2} />
              </div>
              <h3 className="prem-feat-title">{p.title}</h3>
              <p className="prem-feat-desc">{p.desc}</p>
              <div className="prem-feat-chips">
                {p.chips.map((c, ci) => {
                  const ChipIcon = CHIP_ICONS[ci % CHIP_ICONS.length];
                  return (
                    <span key={c} className="prem-feat-chip">
                      <ChipIcon size={11} aria-hidden="true" /> {c}
                    </span>
                  );
                })}
              </div>
            </TiltCard>
          </motion.div>
        );
      })}
    </div>
  );
}
