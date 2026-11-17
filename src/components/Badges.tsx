"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Star, Trophy, Check, Lock, Target, ArrowRight, ArrowLeft, Zap, BookOpen, NotebookPen, GraduationCap } from "lucide-react";
import {
  BADGE_DEFS, DIARIO_BADGE_DEFS, GUIDE_BADGE_DEFS, diarioLevel, iconoCurso, isEarned,
  type BadgeDef, type BadgeStats,
} from "@/lib/logros";
import type { UnlockEventDetail } from "@/components/BadgeNotifier";
import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import PegatinaLogro, { colorDeLogro, type ColorPegatina } from "@/components/panel/PegatinaLogro";
import RachaSemana from "@/components/panel/RachaSemana";
import { semanaDeRacha } from "@/lib/rachaSemana";
import { todayStr } from "@/lib/streak";
import { sonar } from "@/lib/sonidos";

/** Logros guardados: id → fecha. null = concedido en esta visita, aún sin fecha leída. */
type Earned = Map<string, string | null>;

type CategoryId = "actividad" | "guias" | "cursos" | "diario";

/** Un curso publicado y, si lo aprobó, cuándo y con qué nota. Lo calcula el servidor. */
export interface LogroCurso {
  slug: string;
  titulo: string;
  logro: string;
  color: string;
  conseguido: { fecha: string; nota: number } | null;
}

const notaTexto = (n: number) => n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");

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

function LogroCard({ badge, earned, ids, stats, isPremium, notaCurso, indice }: {
  badge: BadgeDef;
  /** Su posición en la rejilla: decide cuánto se tuerce la pegatina. */
  indice: number;
  earned: Earned;
  ids: Set<string>;
  stats: BadgeStats | null;
  isPremium: boolean;
  /** Solo en los logros de curso: la nota final con la que se aprobó. */
  notaCurso?: number;
}) {
  const got = isEarned(ids, badge);
  const level = diarioLevel(ids, badge);
  const date = badge.diario ? diarioDate(earned, badge) : earned.get(badge.id) ?? null;
  const prog = !got ? progressOf(badge, stats) : null;

  let foot: React.ReactNode;
  if (badge.diario) {
    foot = (
      <>
        <span className="lg-niveles" aria-hidden="true">
          {Array.from({ length: badge.diario.levels }, (_, i) => <i key={i} className={i < level ? "is-on" : undefined} />)}
        </span>
        <span className="lg-foot-text">
          {level ? `Nivel ${level} de ${badge.diario.levels}${date ? ` · ${dateStr(date)}` : ""}` : "Aún sin niveles"}
        </span>
      </>
    );
  } else if (got) {
    foot = (
      <span className="pn-chip tono-menta">
        <Check size={12} strokeWidth={3.2} aria-hidden="true" /> Conseguido{date ? ` · ${dateStr(date)}` : " ahora"}
        {notaCurso !== undefined && ` · nota ${notaTexto(notaCurso)}`}
      </span>
    );
  } else if (prog) {
    foot = (
      <>
        <span className="pn-barra pn-barra--fina tono-amarillo"><i style={{ width: `${prog.pct}%` }} /></span>
        <span className="lg-foot-text">{prog.value} de {prog.target} {prog.unit}</span>
      </>
    );
  } else if (badge.guideSlug) {
    foot = <span className="lg-foot-text">Hacer el quiz de la guía <ArrowRight size={12} aria-hidden="true" /></span>;
  } else if (badge.cursoSlug) {
    foot = <span className="lg-foot-text">{isPremium ? "Hacer el curso" : "Ver el curso"} <ArrowRight size={12} aria-hidden="true" /></span>;
  } else if (badge.id === "first-premium" && !isPremium) {
    foot = <Tecla href="/premium" tamano="peq">Ver Premium <ArrowRight size={13} aria-hidden="true" /></Tecla>;
  } else {
    foot = <span className="lg-foot-text"><Lock size={11} aria-hidden="true" /> Bloqueado</span>;
  }

  const card = (
    <article className={`lg-card pgl-anfitrion${got ? " is-earned" : " is-locked"}${badge.special ? " is-special" : ""}`}>
      {badge.special && <span className="lg-especial">Especial</span>}
      <PegatinaLogro icono={badge.icon} color={colorDeLogro(badge)} conseguida={got} indice={indice} especial={badge.special} />
      <h3 className="lg-name">
        {badge.label}
        <span className="sr-only">{got ? " (conseguido)" : " (sin conseguir)"}</span>
      </h3>
      <p className="lg-cond">{badge.condition}</p>
      {badge.reward && (
        <p className="lg-reward"><Star size={11} fill="currentColor" aria-hidden="true" /> {badge.reward}</p>
      )}
      <div className="lg-foot">{foot}</div>
    </article>
  );

  if (badge.guideSlug) return <Link href={`/guias/${badge.guideSlug}`} className="lg-link">{card}</Link>;
  if (badge.cursoSlug) return <Link href={`/cursos/${badge.cursoSlug}`} className="lg-link">{card}</Link>;
  if (badge.diario) return <Link href="/dashboard/trading#hitos" className="lg-link">{card}</Link>;
  return card;
}

/** La tarjeta de logro de un curso: se gana al aprobar su examen final. */
function defCurso(c: LogroCurso): BadgeDef {
  return {
    id: `curso-${c.slug}`,
    label: c.logro,
    condition: `Aprueba el examen final del curso «${c.titulo}»`,
    icon: iconoCurso(c.slug, 24),
    bigIcon: iconoCurso(c.slug, 48),
    cursoSlug: c.slug,
  };
}

interface Props {
  initialStreak: number;
  initialMax: number;
  initialFeatured: boolean;
  initialEarned: { badge_id: string; unlocked_at: string }[];
  /** Premium: ve los hitos del diario aunque aún no tenga ninguno. */
  showDiario: boolean;
  /** Un logro por curso publicado. Vacío si no hay cursos: la categoría no sale. */
  cursos?: LogroCurso[];
}

export default function Badges({ initialStreak, initialMax, initialFeatured, initialEarned, showDiario, cursos = [] }: Props) {
  const [streak, setStreak] = useState(initialStreak);
  const [maxStreak, setMaxStreak] = useState(initialMax);
  const [featured, setFeatured] = useState(initialFeatured);
  // Los logros de curso entran en el mismo mapa con el id `curso-<slug>`. No
  // vienen de `user_badges` sino del certificado, que solo emite el servidor.
  const [earned, setEarned] = useState<Earned>(() => new Map([
    ...initialEarned.map((b): [string, string] => [b.badge_id, b.unlocked_at]),
    ...cursos.filter(c => c.conseguido).map((c): [string, string] => [`curso-${c.slug}`, c.conseguido!.fecha]),
  ]));
  const cursoDefs = useMemo<BadgeDef[]>(() => cursos.map(defCurso), [cursos]);
  const notaPorCurso = useMemo(
    () => new Map(cursos.filter(c => c.conseguido).map(c => [c.slug, c.conseguido!.nota])),
    [cursos],
  );
  const [stats, setStats] = useState<BadgeStats | null>(null);
  // El día de hoy (zona de la academia) para pintar la semana de la racha. Se
  // fija al responder /api/streak, que acaba de apuntar la visita de hoy: así
  // la racha termina hoy y el HTML del servidor no depende de la hora.
  const [hoy, setHoy] = useState<string | null>(null);

  useEffect(() => {
    // Primero la racha de hoy; después los logros, que dependen de ella.
    fetch("/api/streak", { method: "POST" })
      .then(r => r.json())
      .then(s => {
        if (s.current_streak !== undefined) {
          // La racha se acaba de encender (o de sumar el día de hoy): su chispa.
          if (s.current_streak > initialStreak) sonar("racha");
          setStreak(s.current_streak);
          setMaxStreak(s.max_streak);
          setFeatured(s.is_featured);
          setHoy(todayStr());
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
    // Solo al entrar: la racha con la que se pintó la página es la de partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ids = useMemo(() => new Set(earned.keys()), [earned]);
  // Sin Premium solo se enseñan los del diario que ya se consiguieron: el resto no se puede ganar.
  const diarioDefs = DIARIO_BADGE_DEFS.filter(b => showDiario || isEarned(ids, b));

  const categories: { id: CategoryId; num: string; title: string; sub: string; icon: React.ReactNode; color: ColorPegatina; defs: BadgeDef[] }[] = [
    {
      id: "actividad", num: "01", title: "Actividad", icon: <Zap size={15} />, color: "naranja",
      sub: "Constancia: entra en la academia varios días seguidos y mantén tu racha.",
      defs: BADGE_DEFS,
    },
    {
      id: "guias", num: "02", title: "Guías", icon: <BookOpen size={15} />, color: "cielo",
      sub: "Completa el quiz de cada guía sin un solo fallo y gana su insignia exclusiva.",
      defs: GUIDE_BADGE_DEFS,
    },
    {
      id: "cursos", num: "03", title: "Cursos", icon: <GraduationCap size={15} />, color: "lila",
      sub: "Los logros de todos los cursos. Aprueba el examen final de un curso y gana el suyo, con la nota que sacaste.",
      defs: cursoDefs,
    },
    {
      id: "diario", num: "04", title: "Diario de Trading", icon: <NotebookPen size={15} />, color: "azul",
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

  const semana = hoy ? semanaDeRacha(streak, hoy, hoy) : null;
  const pctTotal = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="lg-page">
      <header className="pn-cab tono-amarillo">
        <Tecla href="/dashboard" color="blanca" tamano="peq" className="pn-volver">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" /> Mi panel
        </Tecla>
        <p className="pn-mano">tu colección de pegatinas</p>
        <h1 className="pn-titulo">
          Logros: cada paso deja <Anotacion tipo="highlight" color="var(--amarillo)" retraso={250}>huella</Anotacion>
        </h1>
        <p className="pn-lead">
          Constancia, guías y disciplina al operar: todo lo que vas desbloqueando en la academia, y lo que te falta.
        </p>
      </header>

      <section className="pn-hoja lg-hero" aria-label="Progreso total">
        <div className="lg-hero-main">
          <span className="pn-etiqueta">Progreso total</span>
          <p className="lg-total">
            <strong>{done}</strong>
            <span>de {total} logros</span>
          </p>
          <div className="pn-progreso">
            <span
              className="pn-barra tono-amarillo"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pctTotal}
              aria-label="Progreso total de logros"
            >
              <i style={{ width: `${pctTotal}%` }} />
            </span>
            <b>{pctTotal} %</b>
          </div>
          <p className="lg-hero-nota">
            {done === total ? "Los tienes todos: no queda ninguno por desbloquear." : `Te faltan ${total - done}. Toca una categoría para ir a ella.`}
          </p>
          <ul className="lg-cats">
            {visible.map(c => (
              <li key={c.id}>
                <a href={`#logros-${c.id}`} className={`lg-cat tono-${c.color}`}>
                  <span className="lg-cat-icon" aria-hidden="true">{c.icon}</span>
                  <span className="lg-cat-name">{c.title}</span>
                  <span className="pn-barra pn-barra--fina"><i style={{ width: `${(c.done / c.defs.length) * 100}%` }} /></span>
                  <span className="lg-cat-count">{c.done}/{c.defs.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {next && (
          <aside className="lg-next pgl-anfitrion">
            <span className="lg-next-postit">tu siguiente logro</span>
            <PegatinaLogro icono={next.b.icon} color="naranja" conseguida={false} tamano="grande" />
            <strong className="lg-next-nombre">{next.b.label}</strong>
            <span className="lg-next-cond">{next.b.condition}</span>
            <span className="pn-barra tono-naranja"><i style={{ width: `${next.p.pct}%` }} /></span>
            <span className="lg-foot-text">
              <Target size={13} aria-hidden="true" /> {next.p.value} de {next.p.target} {next.p.unit} · te {next.p.target - next.p.value === 1 ? "falta" : "faltan"} {next.p.target - next.p.value}
            </span>
          </aside>
        )}
      </section>

      <section className="pn-hoja lg-streak" aria-label="Racha">
        <div className="lg-streak-cifra">
          <span className="lg-flame" aria-hidden="true"><Flame size={28} /></span>
          <div>
            <strong className="lg-streak-num">{streak}</strong>
            <span className="lg-streak-label">{streak === 1 ? "día" : "días"} de racha actual</span>
          </div>
        </div>

        <div className="lg-streak-semana">
          <span className="pn-etiqueta">Esta semana</span>
          {semana ? (
            <RachaSemana dias={semana} etiqueta="Tu racha en los últimos siete días" />
          ) : (
            <ol className="rs is-cargando" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => <li key={i} className="rs-dia" />)}
            </ol>
          )}
          <div className="lg-chips">
            <span className="pn-chip tono-gris"><Trophy size={13} aria-hidden="true" /> Récord: <strong>{maxStreak}</strong> {maxStreak === 1 ? "día" : "días"}</span>
            {featured && <span className="pn-chip tono-amarillo"><Star size={12} fill="currentColor" aria-hidden="true" /> Destacado</span>}
          </div>
        </div>

        <div className="lg-streak-goal">
          {streakGoal ? (
            <>
              <p>
                Te {daysLeft === 1 ? "falta" : "faltan"} <strong>{daysLeft} {daysLeft === 1 ? "día" : "días"} seguidos</strong> para
                «{streakGoal.label}». Entra cada día a la academia para no romper la racha.
              </p>
              <span className="pn-barra tono-naranja"><i style={{ width: `${Math.min(100, (streak / streakGoal.progress!.target) * 100)}%` }} /></span>
            </>
          ) : (
            <p>Tienes todos los logros de racha. Mantenerla sigue sumando días a tu récord.</p>
          )}
        </div>
      </section>

      {visible.map(c => (
        <section key={c.id} id={`logros-${c.id}`} className={`lg-section tono-${c.color}`} aria-labelledby={`logros-${c.id}-titulo`}>
          <header className="lg-sechead">
            <span className="lg-sechead-num" aria-hidden="true">{c.num}</span>
            <div>
              <h2 id={`logros-${c.id}-titulo`} className="pn-h2">{c.title}</h2>
              <p className="pn-sub">{c.sub}</p>
            </div>
            <span className={`pn-chip tono-${c.color}`}>{c.done} de {c.defs.length}</span>
          </header>
          <div className="lg-grid">
            {c.defs.map((b, i) => (
              <LogroCard
                key={b.id} badge={b} earned={earned} ids={ids} stats={stats} isPremium={showDiario} indice={i}
                notaCurso={b.cursoSlug ? notaPorCurso.get(b.cursoSlug) : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
