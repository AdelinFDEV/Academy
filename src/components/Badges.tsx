"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Star, Trophy, Check, Lock, Target, ArrowRight, Zap, BookOpen, NotebookPen } from "lucide-react";
import {
  BADGE_DEFS, DIARIO_BADGE_DEFS, GUIDE_BADGE_DEFS, diarioLevel, isEarned,
  type BadgeDef, type BadgeStats,
} from "@/lib/logros";
import type { UnlockEventDetail } from "@/components/BadgeNotifier";

export function FeaturedStar() {
  return (
    <span className="featured-star" title="Usuario destacado — 30 días de racha">
      <Star size={14} fill="currentColor" aria-hidden="true" />
    </span>
  );
}

/** Logros guardados: id → fecha. null = concedido en esta visita, aún sin fecha leída. */
type Earned = Map<string, string | null>;

type CategoryId = "actividad" | "guias" | "diario";

const dateStr = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

function progressOf(b: BadgeDef, stats: BadgeStats | null) {
  if (!b.progress || !stats) return null;
  const value = Math.min(stats[b.progress.stat], b.progress.target);
  return { value, target: b.progress.target, unit: b.progress.unit, pct: (value / b.progress.target) * 100 };
}

/** Fecha del nivel más reciente de un hito del diario. */
function diarioDate(earned: Earned, b: BadgeDef): string | null {
  let last: string | null = null;
  for (const [id, date] of earned) {
    if (b.diario && id.startsWith(`${b.id}-`) && date && (!last || date > last)) last = date;
  }
  return last;
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 132 132" aria-hidden="true">
      <defs>
        <linearGradient id="lg-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d48a" />
          <stop offset="100%" stopColor="#d99a1e" />
        </linearGradient>
      </defs>
      <circle className="lg-ring-track" cx="66" cy="66" r={r} />
      <circle
        className="lg-ring-fill" cx="66" cy="66" r={r}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.max(0, Math.min(pct, 100)) / 100)}
      />
    </svg>
  );
}

function LogroCard({ badge, earned, ids, stats, isPremium }: {
  badge: BadgeDef;
  earned: Earned;
  ids: Set<string>;
  stats: BadgeStats | null;
  isPremium: boolean;
}) {
  const got = isEarned(ids, badge);
  const level = diarioLevel(ids, badge);
  const date = badge.diario ? diarioDate(earned, badge) : earned.get(badge.id) ?? null;
  const prog = !got ? progressOf(badge, stats) : null;

  let foot: React.ReactNode;
  if (badge.diario) {
    foot = (
      <>
        <span className="lg-levels" aria-hidden="true">
          {Array.from({ length: badge.diario.levels }, (_, i) => <i key={i} className={i < level ? "on" : undefined} />)}
        </span>
        <span className="lg-foot-text">
          {level ? `Nivel ${level} de ${badge.diario.levels}${date ? ` · ${dateStr(date)}` : ""}` : "Aún sin niveles"}
        </span>
      </>
    );
  } else if (got) {
    foot = (
      <span className="lg-got">
        <Check size={11} strokeWidth={3.2} aria-hidden="true" /> Conseguido{date ? ` · ${dateStr(date)}` : " ahora"}
      </span>
    );
  } else if (prog) {
    foot = (
      <>
        <span className="lg-bar"><i style={{ width: `${prog.pct}%` }} /></span>
        <span className="lg-foot-text">{prog.value} de {prog.target} {prog.unit}</span>
      </>
    );
  } else if (badge.guideSlug) {
    foot = <span className="lg-foot-text">Hacer el quiz de la guía <ArrowRight size={12} aria-hidden="true" /></span>;
  } else if (badge.id === "first-premium" && !isPremium) {
    foot = <Link href="/premium" className="lg-cta">Ver Premium <ArrowRight size={12} aria-hidden="true" /></Link>;
  } else {
    foot = <span className="lg-foot-text"><Lock size={11} aria-hidden="true" /> Bloqueado</span>;
  }

  const card = (
    <article className={`lg-card${got ? " is-earned" : " is-locked"}${badge.special ? " is-special" : ""}`}>
      {badge.special && <span className="lg-special"><Star size={9} fill="currentColor" aria-hidden="true" /> Especial</span>}
      <div className="lg-medal" aria-hidden="true">
        {badge.icon}
        {!got && <span className="lg-medal-lock"><Lock size={9} strokeWidth={3} /></span>}
      </div>
      <h3 className="lg-name">{badge.label}</h3>
      <p className="lg-cond">{badge.condition}</p>
      {badge.reward && (
        <p className="lg-reward"><Star size={11} fill="currentColor" aria-hidden="true" /> {badge.reward}</p>
      )}
      <div className="lg-foot">{foot}</div>
    </article>
  );

  if (badge.guideSlug) return <Link href={`/guias/${badge.guideSlug}`} className="lg-link">{card}</Link>;
  if (badge.diario) return <Link href="/dashboard/trading#hitos" className="lg-link">{card}</Link>;
  return card;
}

interface Props {
  initialStreak: number;
  initialMax: number;
  initialFeatured: boolean;
  initialEarned: { badge_id: string; unlocked_at: string }[];
  /** Premium: ve los hitos del diario aunque aún no tenga ninguno. */
  showDiario: boolean;
}

export default function Badges({ initialStreak, initialMax, initialFeatured, initialEarned, showDiario }: Props) {
  const [streak, setStreak] = useState(initialStreak);
  const [maxStreak, setMaxStreak] = useState(initialMax);
  const [featured, setFeatured] = useState(initialFeatured);
  const [earned, setEarned] = useState<Earned>(() => new Map(initialEarned.map(b => [b.badge_id, b.unlocked_at])));
  const [stats, setStats] = useState<BadgeStats | null>(null);

  useEffect(() => {
    // Primero la racha de hoy; después los logros, que dependen de ella.
    fetch("/api/streak", { method: "POST" })
      .then(r => r.json())
      .then(s => {
        if (s.current_streak !== undefined) {
          setStreak(s.current_streak);
          setMaxStreak(s.max_streak);
          setFeatured(s.is_featured);
        }
        return fetch("/api/badges", { method: "POST" });
      })
      .then(r => r.json())
      .then((data: { earned?: string[]; newlyUnlocked?: string[]; stats?: BadgeStats }) => {
        if (!data.earned) return;
        setEarned(prev => {
          const next = new Map(prev);
          for (const id of data.earned!) if (!next.has(id)) next.set(id, null);
          return next;
        });
        if (data.stats) setStats(data.stats);
        // El aviso es el global (BadgeNotifier), el mismo que en el resto de la web.
        if (data.newlyUnlocked?.length) {
          window.dispatchEvent(new CustomEvent<UnlockEventDetail>("badge-unlocked", { detail: { ids: data.newlyUnlocked } }));
        }
      })
      .catch(() => {});
  }, []);

  const ids = useMemo(() => new Set(earned.keys()), [earned]);
  // Sin Premium solo se enseñan los del diario que ya se consiguieron: el resto no se puede ganar.
  const diarioDefs = DIARIO_BADGE_DEFS.filter(b => showDiario || isEarned(ids, b));

  const categories: { id: CategoryId; num: string; title: string; sub: string; icon: React.ReactNode; defs: BadgeDef[] }[] = [
    {
      id: "actividad", num: "01", title: "Actividad", icon: <Zap size={15} />,
      sub: "Lectura, constancia y curiosidad: lo que haces cada día en la academia.",
      defs: BADGE_DEFS,
    },
    {
      id: "guias", num: "02", title: "Guías", icon: <BookOpen size={15} />,
      sub: "Completa el quiz de cada guía sin un solo fallo y gana su insignia exclusiva.",
      defs: GUIDE_BADGE_DEFS,
    },
    {
      id: "diario", num: "03", title: "Diario de Trading", icon: <NotebookPen size={15} />,
      sub: "Hitos que premian la disciplina al operar. Cada uno tiene varios niveles.",
      defs: diarioDefs,
    },
  ];
  const visible = categories.filter(c => c.defs.length > 0).map(c => ({ ...c, done: c.defs.filter(b => isEarned(ids, b)).length }));
  const total = visible.reduce((s, c) => s + c.defs.length, 0);
  const done = visible.reduce((s, c) => s + c.done, 0);

  // El logro de actividad bloqueado más cerca de conseguirse.
  const next = BADGE_DEFS
    .filter(b => !ids.has(b.id))
    .map(b => ({ b, p: progressOf(b, stats) }))
    .filter((x): x is { b: BadgeDef; p: NonNullable<ReturnType<typeof progressOf>> } => !!x.p && x.p.pct < 100)
    .sort((a, b) => b.p.pct - a.p.pct)[0];

  // El siguiente logro de racha, medido con la racha de hoy.
  const streakGoal = BADGE_DEFS
    .filter(b => b.progress?.stat === "maxStreak" && !ids.has(b.id))
    .sort((a, b) => a.progress!.target - b.progress!.target)[0];
  const daysLeft = streakGoal ? Math.max(0, streakGoal.progress!.target - streak) : 0;

  return (
    <div className="imm lg-page">
      <div className="imm-backdrop" aria-hidden="true">
        <span className="imm-grid" />
        <span className="imm-orb imm-orb--1" />
        <span className="imm-orb imm-orb--2" />
        <span className="imm-orb imm-orb--3" />
      </div>

      <header className="imm-head">
        <span className="imm-watermark" aria-hidden="true">{done}/{total}</span>
        <span className="imm-eyebrow">
          <span className="imm-eyebrow-dot" aria-hidden="true" />
          Tu progreso
        </span>
        <h1 className="imm-title">
          Logros
          <span className="imm-title-grad">Cada paso deja huella.</span>
        </h1>
        <p className="imm-sub">
          Lectura, constancia, guías y disciplina al operar: todo lo que vas desbloqueando en la academia, y lo que te falta.
        </p>
      </header>

      <section className="lg-panel lg-hero" aria-label="Progreso total">
        <div className="lg-ring">
          <ProgressRing pct={total ? (done / total) * 100 : 0} />
          <div className="lg-ring-center">
            <strong>{done}</strong>
            <span>de {total}</span>
          </div>
        </div>

        <div className="lg-hero-main">
          <span className="lg-kicker">Progreso total</span>
          <h2>{done === total ? "Los tienes todos" : `${done} de ${total} logros`}</h2>
          <p>{done === total ? "No queda ninguno por desbloquear." : `Te faltan ${total - done}. Toca una categoría para ir a ella.`}</p>
          <ul className="lg-cats">
            {visible.map(c => (
              <li key={c.id} className={`lg-cat--${c.id}`}>
                <a href={`#logros-${c.id}`}>
                  <span className="lg-cat-icon">{c.icon}</span>
                  <span className="lg-cat-name">{c.title}</span>
                  <span className="lg-bar"><i style={{ width: `${(c.done / c.defs.length) * 100}%` }} /></span>
                  <span className="lg-cat-count">{c.done}/{c.defs.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {next && (
          <aside className="lg-next lg-cat--actividad">
            <span className="lg-kicker"><Target size={13} aria-hidden="true" /> Tu siguiente logro</span>
            <div className="lg-next-row">
              <div className="lg-medal is-small" aria-hidden="true">{next.b.icon}</div>
              <div>
                <strong>{next.b.label}</strong>
                <span>{next.b.condition}</span>
              </div>
            </div>
            <span className="lg-bar"><i style={{ width: `${next.p.pct}%` }} /></span>
            <span className="lg-foot-text">
              {next.p.value} de {next.p.target} {next.p.unit} · te {next.p.target - next.p.value === 1 ? "falta" : "faltan"} {next.p.target - next.p.value}
            </span>
          </aside>
        )}
      </section>

      <section className="lg-panel lg-streak" aria-label="Racha">
        <span className="lg-flame"><Flame size={26} aria-hidden="true" /></span>
        <div>
          <strong className="lg-streak-num">{streak}</strong>
          <span className="lg-streak-label">{streak === 1 ? "día" : "días"} de racha actual</span>
        </div>
        <div className="lg-chips">
          <span className="lg-chip"><Trophy size={13} aria-hidden="true" /> Récord: <strong>{maxStreak}</strong> {maxStreak === 1 ? "día" : "días"}</span>
          {featured && <span className="lg-chip is-gold"><Star size={12} fill="currentColor" aria-hidden="true" /> Destacado</span>}
        </div>
        <div className="lg-streak-goal lg-cat--actividad">
          {streakGoal ? (
            <>
              <p>
                Te {daysLeft === 1 ? "falta" : "faltan"} <strong>{daysLeft} {daysLeft === 1 ? "día" : "días"} seguidos</strong> para
                «{streakGoal.label}». Entra cada día a la academia para no romper la racha.
              </p>
              <span className="lg-bar"><i style={{ width: `${Math.min(100, (streak / streakGoal.progress!.target) * 100)}%` }} /></span>
            </>
          ) : (
            <p>Tienes todos los logros de racha. Mantenerla sigue sumando días a tu récord.</p>
          )}
        </div>
      </section>

      {visible.map(c => (
        <section key={c.id} id={`logros-${c.id}`} className={`lg-section lg-cat--${c.id}`}>
          <header className="imm-sechead">
            <span className="imm-sechead-num">{c.num}</span>
            <div>
              <h2>{c.title}</h2>
              <p>{c.sub}</p>
            </div>
            <span className="lg-count">{c.done} de {c.defs.length}</span>
          </header>
          <div className="lg-grid">
            {c.defs.map(b => (
              <LogroCard key={b.id} badge={b} earned={earned} ids={ids} stats={stats} isPremium={showDiario} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
