"use client";

import { motion, type Variants } from "framer-motion";
import { Trophy, Lock, Crown, Check, Minus } from "lucide-react";
import type { UnlockNotice } from "@/components/BadgeNotifier";
import { DIARIO_ICONS as ICONS } from "@/lib/logros";
import { dateLong, pnlStr } from "./tjFormat";
import {
  VIVIR_MAX_RED, VIVIR_MIN_OPS, VIVIR_MONTHS, milestoneProgress, nextMilestone, parseStoredLevels, vivirWindow,
  type Milestone, type MilestoneGroup, type Trade,
} from "./tjStats";

const GROUPS: { id: MilestoneGroup; title: string; sub: string }[] = [
  { id: "proceso", title: "Proceso", sub: "Lo que depende de ti en cada operación" },
  { id: "resultado", title: "Resultados", sub: "La consecuencia de hacer bien lo anterior" },
];

/** Lo que un aviso necesita saber de un hito: su definición, no los datos del usuario. */
type MilestoneInfo = Pick<Milestone, "id" | "title" | "desc" | "tiers" | "tierNotes" | "format">;

/** Qué dice un nivel concreto: la cifra y, si la tiene, su lectura. */
function tierText(m: MilestoneInfo, level: number): string {
  const base = `${m.desc}: ${m.format(m.tiers[level - 1])}.`;
  const note = m.tierNotes?.[level - 1];
  return note ? `${base} ${note}.` : base;
}

/**
 * Avisos para los niveles que el servidor acaba de guardar como logro. Si un
 * hito salta varios niveles de golpe, se anuncia solo el más alto.
 */
export function milestoneNotices(milestones: MilestoneInfo[], unlockedIds: string[]): UnlockNotice[] {
  const unlocked = parseStoredLevels(unlockedIds.map(badge_id => ({ badge_id, unlocked_at: "" })));
  const notices: UnlockNotice[] = [];
  for (const m of milestones) {
    const levels = unlocked.get(m.id);
    if (!levels) continue;
    const level = Math.max(...levels.keys());
    const next = m.tiers[level] ?? null;
    const Icon = ICONS[m.id] ?? Trophy;
    notices.push({
      id: `hito-${m.id}-${level}`,
      eyebrow: "¡Hito conseguido!",
      label: `${m.title} · Nivel ${level}`,
      condition: tierText(m, level),
      reward: next != null ? `Siguiente nivel: ${m.format(next)}` : "Has completado este hito",
      bigIcon: <Icon size={48} aria-hidden="true" />,
      special: next == null,
      link: { href: "#hitos", label: "Ver hitos" },
    });
  }
  return notices;
}

/** Versión del Resumen: el hito más cercano, con anillo de progreso y acceso a todos. */
export function TjMilestoneTeaser({ milestones, onOpen }: { milestones: Milestone[]; onOpen: () => void }) {
  const pick = nextMilestone(milestones);
  const reached = milestones.reduce((s, m) => s + m.reachedAt.filter(Boolean).length, 0);
  const total = milestones.reduce((s, m) => s + m.tiers.length, 0);
  if (!pick) return null;
  const { m, p } = pick;
  const Icon = ICONS[m.id] ?? Trophy;
  const note = m.tierNotes?.[p.level];
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <section className="tj-card tjm">
      <header className="tjr-head">
        <h3>Próximo hito</h3>
        <span className="tj-count">{reached} de {total} niveles</span>
      </header>
      <div className="tjm-body">
        <div className="tjm-ring" aria-hidden="true">
          <svg viewBox="0 0 80 80" className="tjm-ring-svg">
            <circle cx="40" cy="40" r={R} className="tjm-ring-track" />
            <circle cx="40" cy="40" r={R} className="tjm-ring-arc" strokeDasharray={`${(p.progress / 100) * C} ${C}`} />
          </svg>
          <Icon size={22} />
        </div>
        <div className="tjm-text">
          <span className="tjm-level">Nivel {p.level + 1} de {m.tiers.length}</span>
          <h4>{m.title}</h4>
          <p>{m.desc}</p>
        </div>
      </div>
      <div className="tjm-progress">
        <strong>{m.format(m.best)} <span>/ {m.format(p.next!)}</span></strong>
        <span>te faltan {m.format(Math.max(0, p.next! - m.best))}</span>
      </div>
      <span className="tj-bar is-accent"><i style={{ width: `${p.progress}%` }} /></span>
      {note && <p className="tjm-note">Al llegar: {note.toLowerCase()}.</p>}
      <button type="button" className="tj-btn tjm-all" onClick={onOpen}>Ver todos los hitos</button>
    </section>
  );
}

// ─────────────────────────── Pestaña Hitos ───────────────────────────

/*
 * Cada hito es una medalla con su icono EN MOVIMIENTO (cada uno el suyo, en
 * trading.css: .tjh-ic-<id>). Dos fases:
 *   · Bloqueado (sin ningún nivel): gris, quieto, con candado y el anillo de
 *     progreso hacia el primer nivel.
 *   · Desbloqueado: con el color de su nivel (bronce, plata, oro, platino,
 *     diamante), brillo y el icono animado. Completado: aura y destellos.
 * Arriba de todo, el SÚPER HITO «Conseguiste vivir del trading», con sus 12 meses.
 */

const TIER_NAMES = ["Bronce", "Plata", "Oro", "Platino", "Diamante"];

type Phase = "locked" | "sealed" | "active" | "done";

function phaseOf(m: Milestone): Phase {
  if (m.locked) return "locked";
  const { level, next } = milestoneProgress(m);
  if (next == null) return "done";
  return level ? "active" : "sealed";
}

/** Medalla: anillo de progreso hacia el siguiente nivel, icono animado y el nivel. */
function Medal({ m, size = 78 }: { m: Milestone; size?: number }) {
  const Icon = ICONS[m.id] ?? Trophy;
  const { level, progress } = milestoneProgress(m);
  const phase = phaseOf(m);
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <span className={`tjh-medal is-${phase} tier-${level}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="tjh-medal-ring">
        <circle cx="50" cy="50" r={R} className="tjh-medal-track" />
        <motion.circle
          cx="50" cy="50" r={R} className="tjh-medal-arc"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - ((phase === "done" ? 100 : progress) / 100) * C }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <span className="tjh-medal-core">
        <Icon className={`tjh-ic tjh-ic-${m.id}`} size={size * 0.36} strokeWidth={2} />
      </span>
      {(phase === "sealed" || phase === "locked") && <span className="tjh-lock"><Lock size={11} /></span>}
      {level > 0 && <span className="tjh-level">{level}</span>}
    </span>
  );
}

function MilestoneCard({ m, onDefineCapital }: { m: Milestone; onDefineCapital: () => void }) {
  const { level, next, progress } = milestoneProgress(m);
  const phase = phaseOf(m);
  const lastDate = level ? m.reachedAt[level - 1] : null;
  const noteNext = m.tierNotes?.[level];

  return (
    <motion.article className={`tjh-card is-${phase} tier-${level}`} variants={cardVariants}>
      {phase === "done" && <span className="tjh-aura" aria-hidden="true" />}
      <header className="tjh-card-head">
        <Medal m={m} />
        <div className="tjh-card-title">
          <span className="tjh-kicker">
            {phase === "locked" ? "Bloqueado" : phase === "sealed" ? "Por desbloquear" : phase === "done" ? "Completado" : `Nivel ${level} · ${TIER_NAMES[level - 1] ?? ""}`}
          </span>
          <h4>{m.title}</h4>
          <p>{m.desc}</p>
        </div>
      </header>

      {m.locked ? (
        <div className="tjh-locked">
          <p>{m.locked}.</p>
          <button type="button" className="tj-btn is-primary" onClick={onDefineCapital}>Definir capital inicial</button>
        </div>
      ) : (
        <>
          <div className="tjh-progress">
            <strong>{m.format(m.best)}</strong>
            <span>{next == null ? "¡Todos los niveles!" : `siguiente: ${m.format(next)}`}</span>
          </div>
          <span className="tjh-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${phase === "done" ? 100 : progress}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} /></span>
          <ol className="tjh-tiers">
            {m.tiers.map((tier, i) => (
              <li
                key={tier}
                className={`tier-${i + 1}${m.reachedAt[i] ? " is-on" : ""}`}
                title={m.reachedAt[i] ? `${TIER_NAMES[i] ?? `Nivel ${i + 1}`}: conseguido el ${dateLong(m.reachedAt[i]!)}` : `${TIER_NAMES[i] ?? `Nivel ${i + 1}`}: pendiente`}
              >
                <i aria-hidden="true" />
                {m.format(tier)}
              </li>
            ))}
          </ol>
          <p className="tjh-note">
            {next != null && noteNext ? `Al llegar: ${noteNext.toLowerCase()}. ` : ""}
            {lastDate ? `Último nivel: ${dateLong(lastDate)}.` : "Aún sin niveles."}
            {m.current !== m.best && ` Ahora: ${m.format(m.current)}.`}
          </p>
        </>
      )}
    </motion.article>
  );
}

/** El súper hito: tarjeta legendaria con corona, rayos y los últimos 12 meses. */
function LegendCard({ m, trades, now }: { m: Milestone; trades: Trade[]; now: Date }) {
  const done = milestoneProgress(m).next == null;
  const win = vivirWindow(trades, now);
  const rules = [
    { ok: win.months.slice(-Math.max(1, win.run)).every(x => x.n >= VIVIR_MIN_OPS) && win.run > 0, text: `${VIVIR_MIN_OPS}+ operaciones cada mes` },
    { ok: win.reds <= VIVIR_MAX_RED, text: `Como mucho ${VIVIR_MAX_RED} meses en rojo (llevas ${win.reds})` },
    { ok: win.sum > 0, text: `El año en beneficio (${pnlStr(win.sum)})` },
  ];
  const STATUS: Record<string, string> = {
    ok: "Mes válido en verde",
    red: "Mes válido, pero en rojo",
    few: `Menos de ${VIVIR_MIN_OPS} operaciones`,
    empty: "Sin operaciones",
  };

  return (
    <motion.section className={`tjh-legend${done ? " is-done" : ""}`} variants={cardVariants}>
      <span className="tjh-legend-glow" aria-hidden="true" />
      <div className="tjh-legend-crown" aria-hidden="true">
        <span className="tjh-rays" />
        <span className="tjh-legend-medal">
          <Crown className="tjh-ic tjh-ic-vivir" size={46} strokeWidth={1.8} />
        </span>
        {!done && <span className="tjh-lock is-big"><Lock size={14} /></span>}
        {done && <span className="tjh-legend-sparks"><i>✦</i><i>✦</i><i>✦</i><i>✦</i></span>}
      </div>

      <div className="tjh-legend-text">
        <span className="tjh-kicker is-legend">{done ? "Súper hito conseguido" : "Súper hito"}</span>
        <h3>{m.title}</h3>
        <p>{m.desc}. Una vez conseguido, es tuyo para siempre.</p>
        <ul className="tjh-rules">
          {rules.map(r => (
            <li key={r.text} className={r.ok ? "is-ok" : undefined}>
              {r.ok ? <Check size={13} /> : <Minus size={13} />} {r.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="tjh-legend-months">
        <div className="tjh-legend-count">
          <strong>{done ? VIVIR_MONTHS : win.run}</strong>
          <span>de {VIVIR_MONTHS} meses</span>
        </div>
        <ol>
          {win.months.map((x, i) => (
            <motion.li
              key={x.key}
              className={`is-${x.status}`}
              title={`${x.label}: ${STATUS[x.status]}${x.n ? ` · ${x.n} op. · ${pnlStr(x.pnl)}` : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
            >
              <i />
              <span>{x.label}</span>
            </motion.li>
          ))}
        </ol>
        <p className="tjh-legend-legend">
          <span className="is-ok">válido</span><span className="is-red">en rojo</span><span className="is-few">pocas op.</span>
        </p>
      </div>
    </motion.section>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 30 } },
};

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export default function TjMilestones({ milestones, trades, now, onDefineCapital }: {
  milestones: Milestone[];
  trades: Trade[];
  now: Date;
  onDefineCapital: () => void;
}) {
  const reached = milestones.reduce((s, m) => s + milestoneProgress(m).level, 0);
  const total = milestones.reduce((s, m) => s + m.tiers.length, 0);
  const unlocked = milestones.filter(m => milestoneProgress(m).level > 0).length;
  const completed = milestones.filter(m => milestoneProgress(m).next == null).length;
  const legend = milestones.find(m => m.group === "leyenda");
  const pick = nextMilestone(milestones);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <motion.div className="tjh" variants={gridVariants} initial="hidden" animate="show">
      {/*
        Resumen. Dos medidas distintas, cada una con su nombre para no confundirlas:
        HITOS (el anillo: cuántos tienen al menos un nivel) y NIVELES (la barra:
        cada hito tiene varios, bronce, plata, oro…).
      */}
      <motion.section className="tj-card tjh-summary" variants={cardVariants}>
        <div className="tjh-summary-ring" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} className="tjh-medal-track" />
            <motion.circle
              cx="60" cy="60" r={R} className="tjh-summary-arc"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - (unlocked / milestones.length) * C }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="tjh-summary-value">
            <span><strong>{unlocked}</strong><small>/{milestones.length}</small></span>
            <em>hitos</em>
          </span>
        </div>
        <div className="tjh-summary-text">
          <span className="tjh-kicker">Tus hitos</span>
          <h3>Has desbloqueado {unlocked} {unlocked === 1 ? "hito" : "hitos"} de {milestones.length}</h3>
          <dl className="tjh-summary-stats">
            <div className="tjh-summary-levels">
              <dt>Niveles conseguidos</dt>
              <dd>
                <strong>{reached} de {total}</strong>
                <span className="tjh-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${(reached / total) * 100}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} /></span>
              </dd>
            </div>
            <div>
              <dt>Completados</dt>
              <dd><strong>{completed} de {milestones.length}</strong></dd>
            </div>
            <div>
              <dt>Lo más cercano</dt>
              <dd>
                {pick
                  ? <><strong>{pick.m.title}</strong> · nivel {pick.p.level + 1}, al {Math.round(pick.p.progress)} %</>
                  : "Define tu capital o apunta operaciones para empezar"}
              </dd>
            </div>
          </dl>
        </div>
      </motion.section>

      {legend && <LegendCard m={legend} trades={trades} now={now} />}

      {GROUPS.map(g => (
        <section key={g.id} className="tjh-group">
          <header className="tjh-group-head">
            <h3>{g.title}</h3>
            <p>{g.sub}</p>
          </header>
          <motion.div className="tjh-grid" variants={gridVariants}>
            {milestones.filter(m => m.group === g.id).map(m => <MilestoneCard key={m.id} m={m} onDefineCapital={onDefineCapital} />)}
          </motion.div>
        </section>
      ))}
    </motion.div>
  );
}
