import React from "react";
import {
  Footprints, BookOpen, GraduationCap, Flame, Zap, Gem, Bookmark, Compass, Trophy,
  ListChecks, ShieldCheck, NotebookPen, Hourglass, CalendarCheck, TrendingUp, RefreshCw, type LucideIcon,
} from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { MILESTONES, milestoneBadgeId } from "@/components/trading/tjStats";

/**
 * Los logros de la academia — fuente única.
 *
 * Vivían dentro de `components/Badges.tsx`, que es un componente de cliente, así
 * que ninguna página de servidor podía leerlos. El resultado: la tarjeta del
 * dashboard llevaba **su propia lista escrita a mano con seis**, cuando en total
 * hay dieciséis. Enseñaba "3/6" a quien tenía tres de dieciséis.
 *
 * Los de guía NO se escriben: salen de `GUIDES`, así que una guía nueva trae su
 * logro sola. Este archivo no lleva "use client" a propósito — es lo que permite
 * que lo lean tanto el componente de cliente como las páginas de servidor.
 */

export interface BadgeDef {
  id: string;
  label: string;
  condition: string;
  reward?: string;
  icon: React.ReactNode;
  bigIcon: React.ReactNode;
  special?: boolean;
  guideSlug?: string;
  guideTitle?: string;
  /** Logro de un curso: se gana al aprobar su examen final. Sale de `curso_certificados`. */
  cursoSlug?: string;
  /** Hito del Diario de Trading: se guarda un logro por nivel ("diario-racha-2"). */
  diario?: { family: string; levels: number };
  /** Logro de actividad: qué contador mide y cuánto hace falta. /api/badges decide con esto. */
  progress?: { stat: keyof BadgeStats; target: number; unit: string };
}

/** Los contadores de actividad que calcula /api/badges. */
export interface BadgeStats {
  readCount: number;
  savedCount: number;
  categoriesRead: number;
  maxStreak: number;
}
function PremiumCrownIcon({ size = 24 }: { size?: number }) {
  // El escalado lo resuelve el viewBox, no hace falta factor manual.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.2" opacity="0.9"/>
      <circle cx="12" cy="10.5" r="0" fill="none"/>
      {/* Crown base */}
      <rect x="5.5" y="15" width="13" height="2.5" rx="0.8" fill="currentColor"/>
      {/* Crown body — 5 points */}
      <polygon points="5.5,15 5.5,10.5 8,12.5 10.5,7 12,5 13.5,7 16,12.5 18.5,10.5 18.5,15" fill="currentColor"/>
      {/* Center top gem */}
      <polygon points="12,5 10.8,7 12,7.8 13.2,7" fill="white" opacity="0.95"/>
      {/* Left gem */}
      <polygon points="5.5,10.5 6.8,11.5 8,10.5 6.8,9.5" fill="currentColor" opacity="0.6"/>
      {/* Right gem */}
      <polygon points="18.5,10.5 17.2,11.5 16,10.5 17.2,9.5" fill="currentColor" opacity="0.6"/>
      {/* Base gem center */}
      <circle cx="12" cy="16.3" r="0.9" fill="white" opacity="0.9"/>
      {/* Dot accents on ring */}
      <circle cx="12" cy="1.5" r="0.8" fill="currentColor"/>
      <circle cx="22.5" cy="12" r="0.8" fill="currentColor"/>
      <circle cx="12" cy="22.5" r="0.8" fill="currentColor"/>
      <circle cx="1.5" cy="12" r="0.8" fill="currentColor"/>
    </svg>
  );
}

function CyclesBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4a8 8 0 1 1-6.93 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 13l2.2 2.2L16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WorldcoinBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
      <path d="M2.5 12h4M17.5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function RenderBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Isometric cube — símbolo del renderizado 3D */}
      <path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9l8-4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M4 7l8 4.5L20 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 11.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="11.5" r="1.4" fill="currentColor"/>
    </svg>
  );
}

function XrpBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Red de validadores en consenso — tres nodos conectados de acuerdo */}
      <path d="M12 6.2 6 16M12 6.2 18 16M7 16.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="5" r="0.9" fill="currentColor"/>
    </svg>
  );
}

function HyperliquidBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Libro de órdenes — panel con niveles de asks/bids separados por el precio medio */}
      <rect x="3" y="3.5" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 7.5h9M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55"/>
      <path d="M7 14h8M7 16.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function BlockchainBadgeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="8.5" y="1" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="8.5" y="17" width="7" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="17" y="8.5" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 12h1.5M15.5 12H17M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

/* ─── Las definiciones ─────────────────────────────────── */

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-premium",
    label: "Miembro Fundador",
    condition: "Realizaste tu primer pago Premium en AdelinBTC Academy",
    reward: "Tu perfil lleva la corona dorada — apoyas el proyecto desde el principio",
    icon: <PremiumCrownIcon size={24} />,
    bigIcon: <PremiumCrownIcon size={48} />,
    special: true,
  },
  {
    id: "first-read",
    label: "Primer paso",
    condition: "Lee tu primer artículo de la academia",
    icon: <Footprints size={24} aria-hidden="true" />,
    bigIcon: <Footprints size={48} aria-hidden="true" />,
    progress: { stat: "readCount", target: 1, unit: "artículos leídos" },
  },
  {
    id: "reader",
    label: "Lector",
    condition: "Completa 5 artículos leídos",
    icon: <BookOpen size={24} aria-hidden="true" />,
    bigIcon: <BookOpen size={48} aria-hidden="true" />,
    progress: { stat: "readCount", target: 5, unit: "artículos leídos" },
  },
  {
    id: "scholar",
    label: "Estudioso",
    condition: "Alcanza 10 artículos leídos",
    icon: <GraduationCap size={24} aria-hidden="true" />,
    bigIcon: <GraduationCap size={48} aria-hidden="true" />,
    progress: { stat: "readCount", target: 10, unit: "artículos leídos" },
  },
  {
    id: "streak3",
    label: "Constante",
    condition: "Entra 3 días seguidos a la academia",
    icon: <Flame size={24} aria-hidden="true" />,
    bigIcon: <Flame size={48} aria-hidden="true" />,
    progress: { stat: "maxStreak", target: 3, unit: "días seguidos" },
  },
  {
    id: "streak7",
    label: "Dedicado",
    condition: "Mantén una racha de 7 días consecutivos",
    icon: <Zap size={24} aria-hidden="true" />,
    bigIcon: <Zap size={48} aria-hidden="true" />,
    progress: { stat: "maxStreak", target: 7, unit: "días seguidos" },
  },
  {
    id: "streak30",
    label: "Imparable",
    condition: "Consigue 30 días consecutivos en la academia",
    reward: "Tu perfil lucirá una ★ dorada visible en todos tus comentarios",
    icon: <Gem size={24} aria-hidden="true" />,
    bigIcon: <Gem size={48} aria-hidden="true" />,
    special: true,
    progress: { stat: "maxStreak", target: 30, unit: "días seguidos" },
  },
  {
    id: "collector",
    label: "Coleccionista",
    condition: "Guarda 5 artículos en tu lista",
    icon: <Bookmark size={24} aria-hidden="true" />,
    bigIcon: <Bookmark size={48} aria-hidden="true" />,
    progress: { stat: "savedCount", target: 5, unit: "artículos guardados" },
  },
  {
    id: "explorer",
    label: "Explorador",
    condition: "Lee artículos de al menos 3 categorías distintas",
    icon: <Compass size={24} aria-hidden="true" />,
    bigIcon: <Compass size={48} aria-hidden="true" />,
    progress: { stat: "categoriesRead", target: 3, unit: "categorías leídas" },
  },
];

// Icono propio por guía — añade una entrada aquí si quieres un icono a medida
// para una guía nueva. Si no se registra ninguno, se usa un trofeo genérico,
// así que toda guía nueva en GUIDES aparece en Logros aunque no tenga icono propio.
const GUIDE_BADGE_ICON_BY_SLUG: Record<string, (size: number) => React.ReactNode> = {
  "que-es-la-blockchain": (size) => <BlockchainBadgeIcon size={size} />,
  "ciclos-de-bitcoin": (size) => <CyclesBadgeIcon size={size} />,
  "worldcoin": (size) => <WorldcoinBadgeIcon size={size} />,
  "render": (size) => <RenderBadgeIcon size={size} />,
  "hyperliquid": (size) => <HyperliquidBadgeIcon size={size} />,
  "xrp": (size) => <XrpBadgeIcon size={size} />,
};

// Derivado de GUIDES (fuente única de verdad) — cada guía nueva con su
// `badge`/`badgeId` aparece aquí automáticamente, sin tocar este archivo.
export const GUIDE_BADGE_DEFS: BadgeDef[] = GUIDES.map((g) => {
  const iconFor = GUIDE_BADGE_ICON_BY_SLUG[g.slug] ?? ((size: number) => <Trophy size={size} aria-hidden="true" />);
  return {
    id: g.badgeId,
    label: g.badge,
    condition: `Completa el quiz de "${g.title}" con puntuación perfecta`,
    icon: iconFor(24),
    bigIcon: iconFor(48),
    special: true,
    guideSlug: g.slug,
    guideTitle: g.title,
  };
});

// Los hitos del Diario de Trading. Salen de MILESTONES (tjStats.ts), la misma
// definición que usa el diario: un hito nuevo allí aparece aquí solo.
export const DIARIO_ICONS: Record<string, LucideIcon> = {
  muestra: ListChecks,
  disciplina: ShieldCheck,
  porque: NotebookPen,
  revancha: Hourglass,
  meses: CalendarCheck,
  rentabilidad: TrendingUp,
  recuperacion: RefreshCw,
};

export const DIARIO_BADGE_DEFS: BadgeDef[] = MILESTONES.map((m) => {
  const Icon = DIARIO_ICONS[m.id] ?? Trophy;
  return {
    id: `diario-${m.id}`,
    label: m.title,
    condition: `${m.desc}. Niveles: ${m.tiers.map(m.format).join(" · ")}${m.needsCapital ? " (necesita tu capital inicial)" : ""}.`,
    icon: <Icon size={24} aria-hidden="true" />,
    bigIcon: <Icon size={48} aria-hidden="true" />,
    diario: { family: m.id, levels: m.tiers.length },
  };
});

/** Nivel alcanzado en un hito del diario, según los logros guardados. */
export function diarioLevel(earned: Set<string>, badge: BadgeDef): number {
  if (!badge.diario) return 0;
  let level = 0;
  for (let i = 1; i <= badge.diario.levels; i++) if (earned.has(milestoneBadgeId(badge.diario.family, i))) level = i;
  return level;
}

/** Un hito del diario cuenta como logro conseguido desde su primer nivel. */
export function isEarned(earned: Set<string>, badge: BadgeDef): boolean {
  return badge.diario ? diarioLevel(earned, badge) > 0 : earned.has(badge.id);
}

/** Todos: los de actividad, el de Miembro Fundador, uno por guía y uno por hito del diario. */
export const LOGROS: BadgeDef[] = [...BADGE_DEFS, ...GUIDE_BADGE_DEFS, ...DIARIO_BADGE_DEFS];
