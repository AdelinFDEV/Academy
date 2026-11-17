"use client";

import type { CSSProperties } from "react";
import { motion, type Variants } from "framer-motion";
import { Trophy, Lock, Crown, Check, Minus, ArrowRight } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import type { UnlockNotice } from "@/components/BadgeNotifier";
import { DIARIO_ICONS as ICONS } from "@/lib/logros";
import { MONTHS, dateLong, pnlStr } from "./tjFormat";
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

// ─────────────────────────── Las pegatinas ───────────────────────────

/*
 * Cada hito es una PEGATINA del sistema (sistema.html, «Etiquetas, notas y
 * pegatinas»), algo girada como pegada a mano. Su color dice el nivel al que
 * has llegado; la que aún no tiene ningún nivel sale apagada (gris y con el
 * borde discontinuo). Completado: amarillo, el color de los logros.
 */

const TIER_NAMES = ["Bronce", "Plata", "Oro", "Platino", "Diamante"];

/** El color de la pegatina según el nivel: sube por la paleta y acaba en amarillo. */
const COLOR_NIVEL: { c: string; t: string }[] = [
  { c: "var(--cielo)", t: "#fff" },
  { c: "var(--menta)", t: "#fff" },
  { c: "var(--lila)", t: "#fff" },
  { c: "var(--azul)", t: "#fff" },
  { c: "var(--naranja)", t: "#fff" },
];
const COLOR_HECHO = { c: "var(--amarillo)", t: "var(--tinta)" };

/** Giros de las pegatinas: cada una un poco distinta, como pegadas a mano. */
const GIROS = [-7, 5, -3, 8, -5, 3, -8, 6];

type Phase = "locked" | "sealed" | "active" | "done";

function phaseOf(m: Milestone): Phase {
  if (m.locked) return "locked";
  const { level, next } = milestoneProgress(m);
  if (next == null) return "done";
  return level ? "active" : "sealed";
}

/** Variables CSS en línea (el color y el giro de cada pegatina o barra). */
const vars = (v: Record<string, string>) => v as CSSProperties;

/** La pegatina de un hito: su icono y el nivel conseguido. */
function Pegatina({ m, giro, grande = false }: { m: Milestone; giro: number; grande?: boolean }) {
  const Icon = ICONS[m.id] ?? Trophy;
  const { level } = milestoneProgress(m);
  const phase = phaseOf(m);
  const apagada = phase === "locked" || phase === "sealed";
  const color = phase === "done" ? COLOR_HECHO : COLOR_NIVEL[Math.min(level, COLOR_NIVEL.length) - 1] ?? COLOR_HECHO;
  return (
    <span
      className={`dj-pegatina djh-pegatina${grande ? " is-grande" : ""}${apagada ? " is-apagada" : ""}`}
      style={vars(apagada ? { "--g": `${giro}deg` } : { "--c": color.c, "--t": color.t, "--g": `${giro}deg` })}
      aria-hidden="true"
    >
      <Icon size={grande ? 34 : 28} strokeWidth={2.4} />
      <span>{apagada ? <Lock size={12} strokeWidth={3} /> : phase === "done" ? "Completo" : `Nivel ${level}`}</span>
    </span>
  );
}

/** Versión del Resumen: el hito más cercano, con su pegatina, su barra y acceso a todos. */
export function TjMilestoneTeaser({ milestones, onOpen }: { milestones: Milestone[]; onOpen: () => void }) {
  const pick = nextMilestone(milestones);
  const reached = milestones.reduce((s, m) => s + m.reachedAt.filter(Boolean).length, 0);
  const total = milestones.reduce((s, m) => s + m.tiers.length, 0);
  if (!pick) return null;
  const { m, p } = pick;
  const note = m.tierNotes?.[p.level];

  return (
    <section className="dj-hoja djh-teaser">
      <header className="dj-cabeza">
        <div>
          <h3>Próximo hito</h3>
        </div>
        <span className="dj-chip dj-chip--amarillo">{reached} de {total} niveles</span>
      </header>
      <div className="djh-teaser-cuerpo">
        <Pegatina m={m} giro={-6} />
        <div className="djh-teaser-texto">
          <span className="dj-etq">Nivel {p.level + 1} de {m.tiers.length}</span>
          <h4>{m.title}</h4>
          <p>{m.desc}</p>
        </div>
      </div>
      <div className="djh-progreso">
        <strong className="dj-cifra">{m.format(m.best)} <span>/ {m.format(p.next!)}</span></strong>
        <span className="dj-nota">te faltan {m.format(Math.max(0, p.next! - m.best))}</span>
      </div>
      <div className="dj-barra" style={vars({ "--c": "var(--amarillo)" })} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.progress)} aria-label={`Progreso hacia el nivel ${p.level + 1}`}>
        <i style={{ width: `${p.progress}%` }} />
      </div>
      {note && <p className="djh-nota">Al llegar: {note.toLowerCase()}.</p>}
      <div className="djh-teaser-pie">
        <Tecla color="amarillo" tamano="peq" onClick={onOpen}>
          Ver todos los hitos <ArrowRight size={14} strokeWidth={3} aria-hidden="true" />
        </Tecla>
      </div>
    </section>
  );
}

// ─────────────────────────── Pestaña Hitos ───────────────────────────

function MilestoneCard({ m, giro, onDefineCapital }: { m: Milestone; giro: number; onDefineCapital: () => void }) {
  const { level, next, progress } = milestoneProgress(m);
  const phase = phaseOf(m);
  const lastDate = level ? m.reachedAt[level - 1] : null;
  const noteNext = m.tierNotes?.[level];

  return (
    <motion.article className={`dj-hoja djh-hito is-${phase}`} variants={cardVariants}>
      <header className="djh-hito-cabeza">
        <Pegatina m={m} giro={giro} />
        <div className="djh-hito-titulo">
          <span className="dj-etq">
            {phase === "locked" ? "Bloqueado" : phase === "sealed" ? "Por desbloquear" : phase === "done" ? "Completado" : `Nivel ${level} · ${TIER_NAMES[level - 1] ?? ""}`}
          </span>
          <h4>{m.title}</h4>
          <p>{m.desc}</p>
        </div>
      </header>

      {m.locked ? (
        <div className="djh-bloqueado">
          <p className="dj-aviso dj-aviso--peq">
            <span className="ic" aria-hidden="true">i</span>
            <span>{m.locked}.</span>
          </p>
          <Tecla color="azul" tamano="peq" onClick={onDefineCapital}>Definir capital inicial</Tecla>
        </div>
      ) : (
        <>
          <div className="djh-progreso">
            <strong className="dj-cifra">{m.format(m.best)}</strong>
            <span>{next == null ? "¡Todos los niveles!" : `siguiente: ${m.format(next)}`}</span>
          </div>
          <div
            className="dj-barra"
            style={vars({ "--c": phase === "done" ? "var(--amarillo)" : "var(--azul)" })}
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(phase === "done" ? 100 : progress)}
            aria-label={next == null ? `${m.title}: completado` : `${m.title}: progreso hacia ${m.format(next)}`}
          >
            <i style={{ width: `${phase === "done" ? 100 : progress}%` }} />
          </div>
          <ol className="djh-niveles">
            {m.tiers.map((tier, i) => (
              <li
                key={tier}
                className={m.reachedAt[i] ? "is-on" : undefined}
                title={m.reachedAt[i] ? `${TIER_NAMES[i] ?? `Nivel ${i + 1}`}: conseguido el ${dateLong(m.reachedAt[i]!)}` : `${TIER_NAMES[i] ?? `Nivel ${i + 1}`}: pendiente`}
              >
                {m.reachedAt[i] && <Check size={12} strokeWidth={3.4} aria-hidden="true" />}
                {m.format(tier)}
              </li>
            ))}
          </ol>
          <p className="djh-nota">
            {next != null && noteNext ? `Al llegar: ${noteNext.toLowerCase()}. ` : ""}
            {lastDate ? `Último nivel: ${dateLong(lastDate)}.` : "Aún sin niveles."}
            {m.current !== m.best && ` Ahora: ${m.format(m.current)}.`}
          </p>
        </>
      )}
    </motion.article>
  );
}

/**
 * El súper hito, la pieza estrella: una hoja de tinta oscura (como el bloque
 * Premium del sistema) con la corona, las tres reglas, la cuenta de meses
 * válidos seguidos con su barra y los doce meses como casillas de racha
 * (sistema.html, «Progreso y racha»), cada una con el estado de su mes.
 */
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
  const faltan = VIVIR_MONTHS - win.run;
  const cierre = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const esteMes = trades.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const pnlMes = esteMes.reduce((s, t) => s + t.pnl, 0);
  const faltanOps = Math.max(0, VIVIR_MIN_OPS - esteMes.length);
  const siguiente = done
    ? "Un año entero viviendo de tu método. Es tuyo para siempre."
    : `${faltan === 1 ? "Te falta un mes válido" : `Te faltan ${faltan} meses válidos`}. ${MONTHS[now.getMonth()]} cierra el 1 de ${MONTHS[cierre.getMonth()]}: ${faltanOps ? `${faltanOps} ${faltanOps === 1 ? "operación" : "operaciones"} más para que cuente` : `ya cuenta (${esteMes.length} op.)`}${esteMes.length ? `, y va en ${pnlStr(pnlMes)}` : ""}.`;
  const meses = done ? VIVIR_MONTHS : win.run;

  return (
    <motion.section className={`djh-leyenda${done ? " is-hecha" : ""}`} variants={cardVariants}>
      <div className="djh-leyenda-cabeza">
        <span className={`djh-corona${done ? " is-hecha" : ""}`} aria-hidden="true">
          <Crown size={46} strokeWidth={2.2} />
          {!done && <span className="djh-corona-candado"><Lock size={13} strokeWidth={3} /></span>}
        </span>
        <div className="djh-leyenda-titulo">
          <span className="dj-etq">{done ? "Súper hito conseguido" : "El súper hito"}</span>
          <h3>{m.title}</h3>
          <p>
            {done
              ? "Doce meses seguidos operando con método y en beneficio. Lo que separa a quien prueba de quien vive de esto, y lo has hecho."
              : "Doce meses seguidos operando con método y en beneficio. Es lo que separa a quien prueba de quien vive de esto."}
          </p>
        </div>
        {done && <span className="dj-posit djh-leyenda-posit">¡Conseguido!</span>}
      </div>

      <div className="djh-leyenda-cuerpo">
        <ul className="djh-reglas">
          {rules.map(r => (
            <li key={r.text} className={r.ok ? "is-ok" : undefined}>
              <span className="djh-regla-marca" aria-hidden="true">{r.ok ? <Check size={14} strokeWidth={3.4} /> : <Minus size={14} strokeWidth={3.4} />}</span>
              <span>{r.text}</span>
              <span className="sr-only">{r.ok ? " (cumplida)" : " (pendiente)"}</span>
            </li>
          ))}
        </ul>

        <div className="djh-meses">
          <div className="djh-cuenta">
            <strong className="dj-cifra">{meses}</strong>
            <span><b>/ {VIVIR_MONTHS}</b> meses válidos seguidos</span>
          </div>
          {/* El camino hasta el año: se llena con los meses válidos seguidos. */}
          <div className="dj-barra djh-leyenda-barra" style={vars({ "--c": "var(--amarillo)" })} aria-hidden="true">
            <i style={{ width: `${(meses / VIVIR_MONTHS) * 100}%` }} />
          </div>
          <ol className="djh-racha">
            {win.months.map((x, i) => (
              <li
                key={x.key}
                className={`is-${done ? "hecho" : x.status}`}
                style={vars({ "--i": String(i) })}
                title={`${x.label}: ${STATUS[x.status]}${x.n ? ` · ${x.n} op. · ${pnlStr(x.pnl)}` : ""}`}
              >
                {x.label}
                <span className="sr-only">: {STATUS[x.status]}</span>
              </li>
            ))}
          </ol>
          <p className="djh-racha-leyenda" aria-hidden="true">
            <span className="is-ok">válido</span><span className="is-red">en rojo</span><span className="is-few">pocas op.</span>
          </p>
        </div>
      </div>

      <p className="djh-leyenda-siguiente">{siguiente}</p>
    </motion.section>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 26 } },
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

  return (
    <motion.div className="djh" variants={gridVariants} initial="hidden" animate="show">
      {/*
        Resumen. Dos medidas distintas, cada una con su nombre para no confundirlas:
        HITOS (la pegatina: cuántos tienen al menos un nivel) y NIVELES (la barra:
        cada hito tiene varios, bronce, plata, oro…).
      */}
      <motion.section className="dj-hoja djh-resumen" variants={cardVariants}>
        <span className="dj-pegatina djh-resumen-pegatina" aria-hidden="true">
          <b>{unlocked}<small>/{milestones.length}</small></b>
          <span>hitos</span>
        </span>
        <div className="djh-resumen-texto">
          <span className="dj-etq">Tus hitos</span>
          <h3>Has desbloqueado {unlocked} {unlocked === 1 ? "hito" : "hitos"} de {milestones.length}</h3>
          <dl className="djh-resumen-datos">
            <div className="dj-ficha djh-resumen-niveles">
              <dt className="dj-etq">Niveles conseguidos</dt>
              <dd>
                <strong className="dj-cifra">{reached} de {total}</strong>
                <span className="dj-barra dj-barra--fina" style={vars({ "--c": "var(--amarillo)" })}>
                  <i style={{ width: `${total ? (reached / total) * 100 : 0}%` }} />
                </span>
              </dd>
            </div>
            <div className="dj-ficha">
              <dt className="dj-etq">Completados</dt>
              <dd><strong className="dj-cifra">{completed} de {milestones.length}</strong></dd>
            </div>
            <div className="dj-ficha">
              <dt className="dj-etq">Lo más cercano</dt>
              <dd className="djh-resumen-cerca">
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
        <section key={g.id} className="djh-grupo">
          <header className="djh-grupo-cabeza">
            <h3>{g.title}</h3>
            <p>{g.sub}</p>
          </header>
          <motion.div className="djh-rejilla" variants={gridVariants}>
            {milestones.filter(m => m.group === g.id).map((m, i) => (
              <MilestoneCard key={m.id} m={m} giro={GIROS[i % GIROS.length]} onDefineCapital={onDefineCapital} />
            ))}
          </motion.div>
        </section>
      ))}
    </motion.div>
  );
}
