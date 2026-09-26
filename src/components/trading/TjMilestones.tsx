"use client";

import { Trophy, Lock, Target } from "lucide-react";
import type { UnlockNotice } from "@/components/BadgeNotifier";
import { DIARIO_ICONS as ICONS } from "@/lib/logros";
import { dateLong } from "./tjFormat";
import { milestoneProgress, nextMilestone, parseStoredLevels, type Milestone, type MilestoneGroup } from "./tjStats";

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

function MilestoneHead({ m, level }: { m: Milestone; level: number }) {
  const Icon = ICONS[m.id] ?? Trophy;
  return (
    <div className="tj-milestone-top">
      <span className="tj-milestone-icon">{m.locked ? <Lock size={16} /> : <Icon size={16} />}</span>
      <div>
        <h4>{m.title}</h4>
        <p>{m.desc}</p>
      </div>
      <span className="tj-milestone-level">Nv. {level}/{m.tiers.length}</span>
    </div>
  );
}

export function TjNextMilestone({ milestones }: { milestones: Milestone[] }) {
  const pick = nextMilestone(milestones);
  if (!pick) return null;
  const { m, p } = pick;
  const note = m.tierNotes?.[p.level];

  return (
    <section className="tj-card tj-next">
      <span className="tj-label"><Target size={15} /> Próximo hito</span>
      <MilestoneHead m={m} level={p.level} />
      <div className="tj-milestone-value">
        <strong>{m.format(m.best)} / {m.format(p.next!)}</strong>
        <span>te faltan {m.format(Math.max(0, p.next! - m.best))}</span>
      </div>
      <span className="tj-bar is-accent"><i style={{ width: `${p.progress}%` }} /></span>
      {note && <p className="tj-note">Al llegar: {note.toLowerCase()}.</p>}
    </section>
  );
}

function MilestoneCard({ m, onDefineCapital }: { m: Milestone; onDefineCapital: () => void }) {
  const { level, next, progress } = milestoneProgress(m);
  const lastDate = level ? m.reachedAt[level - 1] : null;
  const note = level ? m.tierNotes?.[level - 1] : null;

  return (
    <article className={`tj-milestone${m.locked ? " is-locked" : ""}${next == null ? " is-done" : ""}`}>
      <MilestoneHead m={m} level={level} />

      {m.locked ? (
        <div className="tj-milestone-locked">
          <p className="tj-note">{m.locked}</p>
          <button type="button" className="tj-btn is-primary" onClick={onDefineCapital}>Definir capital inicial</button>
        </div>
      ) : (
        <>
          <div className="tj-milestone-value">
            <strong>{m.format(m.best)}</strong>
            <span>{next == null ? "Completado" : `siguiente: ${m.format(next)}`}</span>
          </div>
          <span className="tj-bar is-accent"><i style={{ width: `${progress}%` }} /></span>
          <ol className="tj-milestone-tiers">
            {m.tiers.map((tier, i) => (
              <li
                key={tier}
                className={m.reachedAt[i] ? "on" : undefined}
                title={m.reachedAt[i] ? `Conseguido el ${dateLong(m.reachedAt[i]!)}` : "Pendiente"}
              >
                {m.format(tier)}
              </li>
            ))}
          </ol>
          <p className="tj-note">
            {note ? `${note}. ` : ""}
            {lastDate ? `Último nivel: ${dateLong(lastDate)}` : "Aún sin niveles"}
            {m.current !== m.best && ` · ahora: ${m.format(m.current)}`}
          </p>
        </>
      )}
    </article>
  );
}

export default function TjMilestones({ milestones, onDefineCapital }: { milestones: Milestone[]; onDefineCapital: () => void }) {
  const reached = milestones.reduce((s, m) => s + milestoneProgress(m).level, 0);
  const total = milestones.reduce((s, m) => s + m.tiers.length, 0);

  return (
    <section className="tj-card">
      <div className="tj-card-head">
        <span className="tj-label"><Trophy size={15} /> Hitos</span>
        <span className="tj-count">{reached} de {total} niveles conseguidos</span>
      </div>
      <span className="tj-bar is-accent tj-milestones-total"><i style={{ width: `${(reached / total) * 100}%` }} /></span>

      {GROUPS.map(g => (
        <div key={g.id} className="tj-milestone-group">
          <div className="tj-milestone-group-head">
            <h3>{g.title}</h3>
            <p>{g.sub}</p>
          </div>
          <div className="tj-milestones">
            {milestones.filter(m => m.group === g.id).map(m => <MilestoneCard key={m.id} m={m} onDefineCapital={onDefineCapital} />)}
          </div>
        </div>
      ))}
    </section>
  );
}
