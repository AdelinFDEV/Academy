"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Flame, Star, Trophy, Check, Lock, ArrowRight, Zap, BookOpen, NotebookPen, GraduationCap, X, TrendingUp } from "lucide-react";
import {
  BADGE_DEFS, DIARIO_BADGE_DEFS, GUIDE_BADGE_DEFS, coleccionDeLogros, diarioLevel, isEarned, logroDeCurso,
  type BadgeDef, type BadgeStats,
} from "@/lib/logros";
import type { UnlockEventDetail } from "@/components/BadgeNotifier";
import Tecla from "@/components/cuaderno/Tecla";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import { bloquearScroll } from "@/lib/bloquearScroll";
import { MILESTONES, VIVIR_MAX_RED, VIVIR_MIN_OPS, VIVIR_MONTHS } from "@/components/trading/tjStats";

/** El súper hito: el único hito del diario del grupo «leyenda». */
const SUPER_HITO = MILESTONES.find(m => m.group === "leyenda")?.id ?? "vivir";
import PegatinaLogro, { colorDeLogro, type ColorPegatina } from "@/components/panel/PegatinaLogro";
import RachaSemana from "@/components/panel/RachaSemana";
import GarabatosLogros from "@/components/panel/GarabatosLogros";
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

type DatosLogro = {
  badge: BadgeDef;
  earned: Earned;
  ids: Set<string>;
  stats: BadgeStats | null;
  isPremium: boolean;
  /** Solo en los logros de curso: la nota final con la que se aprobó. */
  notaCurso?: number;
};

/**
 * Un logro en la rejilla: SOLO su pegatina, con una «i» en la esquina
 * (23-11-2026, pedido por el admin). Toda la pegatina es el botón: al
 * pulsarla se abre su ficha (`FichaLogro`) con lo que pide y cómo va.
 */
function LogroCard({ badge, ids, indice, onAbrir }: {
  badge: BadgeDef;
  ids: Set<string>;
  /** Su posición en la rejilla: decide cuánto se tuerce la pegatina. */
  indice: number;
  onAbrir: () => void;
}) {
  const got = isEarned(ids, badge);
  // Conseguido, se mueve: flota y su icono late (logros.css, «Vivos»).
  return (
    <button
      type="button"
      className={`lg-tile pgl-anfitrion${got ? " is-earned" : " is-locked"}${badge.special ? " is-special" : ""}`}
      style={{ "--i": indice } as React.CSSProperties}
      onClick={onAbrir}
      aria-haspopup="dialog"
      aria-label={`${badge.label}${got ? " (conseguido)" : " (sin conseguir)"}: ver información`}
      title={badge.label}
    >
      <PegatinaLogro icono={badge.icon} color={colorDeLogro(badge)} conseguida={got} indice={indice} especial={badge.special} />
      <span className="lg-info" aria-hidden="true">i</span>
    </button>
  );
}

/**
 * La ficha de un logro, en una ventana que cae en mitad de la pantalla: la
 * pegatina en grande, su nombre, si lo tiene (con la fecha y, en un curso, la
 * nota), cómo va (niveles del diario, barra de la racha), lo que pide, su
 * recompensa y a dónde ir para conseguirlo.
 */
function FichaLogro({ badge, earned, ids, stats, isPremium, notaCurso, onCerrar }: DatosLogro & { onCerrar: () => void }) {
  const got = isEarned(ids, badge);
  const level = diarioLevel(ids, badge);
  const date = badge.diario ? diarioDate(earned, badge) : earned.get(badge.id) ?? null;
  const prog = !got ? progressOf(badge, stats) : null;
  const cerrar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const soltar = bloquearScroll();
    cerrar.current?.focus({ preventScroll: true });
    const alTeclear = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", alTeclear);
    return () => { soltar(); document.removeEventListener("keydown", alTeclear); };
  }, [onCerrar]);

  let estado: React.ReactNode;
  if (badge.diario) {
    estado = (
      <div className="lgf-estado">
        <span className="lg-niveles" aria-hidden="true">
          {Array.from({ length: badge.diario.levels }, (_, i) => <i key={i} className={i < level ? "is-on" : undefined} />)}
        </span>
        <span className="lgf-estado-texto">
          {level ? `Nivel ${level} de ${badge.diario.levels}${date ? ` · ${dateStr(date)}` : ""}` : "Aún sin niveles"}
        </span>
      </div>
    );
  } else if (got) {
    estado = (
      <span className="pn-chip tono-menta">
        <Check size={13} strokeWidth={3.2} aria-hidden="true" /> Conseguido{date ? ` el ${dateStr(date)}` : " ahora"}
        {notaCurso !== undefined && ` · nota ${notaTexto(notaCurso)}`}
      </span>
    );
  } else if (prog) {
    estado = (
      <div className="lgf-estado">
        <span className="pn-barra tono-amarillo"><i style={{ width: `${prog.pct}%` }} /></span>
        <span className="lgf-estado-texto">{prog.value} de {prog.target} {prog.unit}</span>
      </div>
    );
  } else {
    estado = <span className="pn-chip tono-gris"><Lock size={12} strokeWidth={3} aria-hidden="true" /> Sin conseguir</span>;
  }

  let accion: React.ReactNode = null;
  if (badge.guideSlug) {
    accion = <Tecla href={`/guias/${badge.guideSlug}`} color="cielo" ancho>{got ? "Volver a la guía" : "Hacer el quiz de la guía"} <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" /></Tecla>;
  } else if (badge.cursoSlug) {
    accion = <Tecla href={`/cursos/${badge.cursoSlug}`} color="lila" ancho>{!got && isPremium ? "Hacer el curso" : "Ver el curso"} <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" /></Tecla>;
  } else if (badge.diario) {
    accion = <Tecla href="/dashboard/trading#hitos" color="azul" ancho>Abrir mi diario <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" /></Tecla>;
  } else if (badge.id === "first-premium" && !isPremium) {
    accion = <TeclaPremium href="/premium" />;
  }

  return createPortal(
    <div className="lgf-velo" onClick={onCerrar}>
      <div
        className={`lgf-hoja tono-${colorDeLogro(badge)}${got ? " is-earned" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgf-nombre"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={cerrar} type="button" className="lgf-cerrar" aria-label="Cerrar" onClick={onCerrar}>
          <X size={18} strokeWidth={2.8} aria-hidden="true" />
        </button>
        {badge.special && <span className="lg-especial">Especial</span>}
        <div className={`lgf-pegatina pgl-anfitrion${got ? " is-viva" : ""}`}>
          <PegatinaLogro icono={badge.bigIcon} color={colorDeLogro(badge)} conseguida={got} tamano="grande" especial={badge.special} />
        </div>
        <h2 id="lgf-nombre" className="lgf-nombre">{badge.label}</h2>
        {estado}
        <p className="lgf-cond">{badge.condition}</p>
        {badge.reward && (
          <p className="lgf-premio"><Star size={13} fill="currentColor" aria-hidden="true" /> {badge.reward}</p>
        )}
        {accion && <div className="lgf-accion">{accion}</div>}
      </div>
    </div>,
    document.body,
  );
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
  const cursoDefs = useMemo<BadgeDef[]>(() => cursos.map(logroDeCurso), [cursos]);
  const notaPorCurso = useMemo(
    () => new Map(cursos.filter(c => c.conseguido).map(c => [c.slug, c.conseguido!.nota])),
    [cursos],
  );
  const [stats, setStats] = useState<BadgeStats | null>(null);
  // El logro cuya ficha está abierta (su id), o null.
  const [abierto, setAbierto] = useState<string | null>(null);
  const abrir = (id: string) => { sonar("abrir"); setAbierto(id); };
  const cerrarFicha = useCallback(() => { sonar("cerrar"); setAbierto(null); }, []);
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
      id: "diario", num: "04", title: "Diario de Trading", icon: <NotebookPen size={15} />, color: "menta",
      sub: "Hitos que premian la disciplina al operar. Cada uno tiene varios niveles.",
      defs: diarioDefs,
    },
  ];
  const visible = categories.filter(c => c.defs.length > 0).map(c => ({ ...c, done: c.defs.filter(b => isEarned(ids, b)).length }));
  // El total sale de la cuenta única de la web (`coleccionDeLogros`): la misma del dashboard.
  const { total, conseguidos: done } = coleccionDeLogros(ids, cursos, showDiario);

  // El siguiente logro de racha, medido con la racha de hoy.
  const streakGoal = BADGE_DEFS
    .filter(b => b.progress?.stat === "maxStreak" && !ids.has(b.id))
    .sort((a, b) => a.progress!.target - b.progress!.target)[0];
  const daysLeft = streakGoal ? Math.max(0, streakGoal.progress!.target - streak) : 0;

  const semana = hoy ? semanaDeRacha(streak, hoy, hoy) : null;
  const pctTotal = total ? Math.round((done / total) * 100) : 0;
  // El súper hito: el hito «leyenda» del diario. Cuenta en su categoría, pero
  // tiene su propio bloque, así que no se repite en la rejilla.
  const superHito = DIARIO_BADGE_DEFS.find(b => b.id === `diario-${SUPER_HITO}`) ?? null;
  const superHecho = superHito ? isEarned(ids, superHito) : false;
  const superFecha = superHito ? diarioDate(earned, superHito) : null;
  const fichaAbierta = abierto ? visible.flatMap(c => c.defs).find(b => b.id === abierto) ?? null : null;

  return (
    <div className="lg-page">
      {/* Sin cabecera (23-11-2026, pedido por el admin: la página empieza
          directamente con los paneles). El título sigue para Google y para el
          lector de pantalla. */}
      <h1 className="sr-only">Mis logros</h1>
      <GarabatosLogros />

      {/* ── El progreso: un anillo con el total y una ficha por categoría, en el
          amarillo de los Logros, con la copa en la esquina (23-11-2026). ── */}
      <section className="lgh" aria-label="Progreso total">
        <Image src="/cuaderno/copa-pegatina.webp" alt="" width={240} height={250} className="lgh-copa" draggable={false} />

        <div className="lgh-anillo" style={{ "--pct": pctTotal } as React.CSSProperties}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="lgh-anillo-fondo" cx="60" cy="60" r="52" />
            <circle className="lgh-anillo-lleno" cx="60" cy="60" r="52" pathLength={100} />
          </svg>
          <div className="lgh-anillo-cifra">
            <strong>{done}</strong>
            <span>de {total}</span>
          </div>
        </div>

        <div className="lgh-texto">
          <span className="pn-etiqueta lgh-etiqueta"><Trophy size={14} aria-hidden="true" /> Tus logros</span>
          <p className="lgh-titulo">
            {done === total ? "¡Los tienes todos!" : <>Llevas el <span className="fluor">{pctTotal} %</span> de tu colección</>}
          </p>
        </div>
        {/* Fuera del texto: en el móvil va al lado del anillo (logros.css). */}
        <p className="lgh-sub">
          {done === total ? "No queda ninguno por desbloquear." : `Te ${total - done === 1 ? "falta" : "faltan"} ${total - done}. Toca una categoría para ir a ella.`}
        </p>

        <ul className="lgh-cats">
          {visible.map(c => (
            <li key={c.id}>
              <a href={`#logros-${c.id}`} className={`lgh-cat tono-${c.color}`}>
                <span className="lgh-cat-icono" aria-hidden="true">{c.icon}</span>
                <span className="lgh-cat-nombre">{c.title}</span>
                <span className="lgh-cat-cuenta"><b>{c.done}</b>/{c.defs.length}</span>
                <span className="pn-barra pn-barra--fina"><i style={{ width: `${(c.done / c.defs.length) * 100}%` }} /></span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ── La racha, en el naranja de la marca: los días que lleva, la semana,
          el récord y el siguiente logro de racha, medido con la racha de HOY
          (el anterior medía con el récord y daba dos cifras distintas). ── */}
      <section className="lgr" aria-label="Racha">
        <div className="lgr-cifra">
          {/* Con la racha encendida, un 🔥 que arde (23-11-2026, pedido por el
              admin; la única excepción a «sin emojis»). Apagada, la llama dibujada. */}
          <span className={`lgr-llama${streak > 0 ? " is-encendida" : ""}`} aria-hidden="true">
            {streak > 0 ? <span className="lgr-fuego">🔥</span> : <Flame size={30} />}
          </span>
          <div>
            <strong className="lgr-num">{streak}</strong>
            <span className="lgr-label">{streak === 1 ? "día seguido" : "días seguidos"}</span>
          </div>
        </div>

        <div className="lgr-semana">
          <span className="pn-etiqueta lgr-etiqueta">Esta semana</span>
          {semana ? (
            <RachaSemana dias={semana} etiqueta="Tu racha en los últimos siete días" />
          ) : (
            <ol className="rs is-cargando" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => <li key={i} className="rs-dia" />)}
            </ol>
          )}
          <div className="lgr-chips">
            <span className="lgr-chip"><Trophy size={13} aria-hidden="true" /> Récord: <b>{maxStreak}</b> {maxStreak === 1 ? "día" : "días"}</span>
            {featured && <span className="lgr-chip"><Star size={12} fill="currentColor" aria-hidden="true" /> Destacado</span>}
          </div>
        </div>

        <div className="lgr-meta pgl-anfitrion">
          {streakGoal ? (
            <>
              <PegatinaLogro icono={streakGoal.icon} color="naranja" conseguida={false} tamano="peq" />
              <div className="lgr-meta-texto">
                <span className="pn-etiqueta">Tu siguiente logro</span>
                <strong>{streakGoal.label}</strong>
                <span className="pn-barra pn-barra--fina tono-naranja"><i style={{ width: `${Math.min(100, (streak / streakGoal.progress!.target) * 100)}%` }} /></span>
                <span className="lgr-meta-falta">
                  {streak} de {streakGoal.progress!.target} días · te {daysLeft === 1 ? "falta" : "faltan"} {daysLeft}
                </span>
              </div>
            </>
          ) : (
            <div className="lgr-meta-texto">
              <span className="pn-etiqueta">Racha</span>
              <strong>Tienes todos los logros de racha</strong>
              <span className="lgr-meta-falta">Mantenerla sigue sumando días a tu récord.</span>
            </div>
          )}
        </div>
      </section>

      {/* ── El súper hito del Diario: la mayor maestría de la web, con su
          espacio propio (23-11-2026, pedido por el admin). Tinta oscura y oro,
          como en el diario; cuenta en el Diario de Trading, pero no se repite
          en su rejilla. ── */}
      {superHito && (
        <section className={`lgs${superHecho ? " is-hecho" : ""}`} aria-labelledby="lgs-titulo">
          {/* El fondo: rayos de oro que giran despacio y polvo dorado que sube. */}
          <span className="lgs-rayos" aria-hidden="true" />
          <span className="lgs-polvo" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
          </span>

          <div className="lgs-emblema">
            {/* La pegatina del súper hito (del admin, 23-11-2026): el trofeo en la
                cima de las velas, con su corona, su capa y su bandera. */}
            <Image src="/cuaderno/superhito-pegatina.webp" alt="" width={640} height={678} className="lgs-emblema-dibujo" draggable={false} />
            {!superHecho && <span className="lgs-candado" aria-hidden="true"><Lock size={18} strokeWidth={3} /></span>}
          </div>

          <div className="lgs-texto">
            <span className="lgs-cinta">{superHecho ? "Leyenda de la academia" : "Solo para leyendas"}</span>
            <span className="lgs-etiqueta">{superHecho ? "Súper hito conseguido" : "El súper hito · la mayor maestría de la web"}</span>
            <h2 id="lgs-titulo" className="lgs-titulo">
              Conseguiste <span className="lgs-oro">vivir del trading</span>
            </h2>
            <p className="lgs-sub">
              {superHecho
                ? "Un año entero viviendo de tu método. Muy pocos llegan aquí, y es tuyo para siempre."
                : "El reto definitivo del Diario de Trading: un año entero operando con método y en beneficio. Lo que separa a quien prueba de quien vive de esto."}
            </p>
            <ul className="lgs-reglas">
              <li><span className="lgs-regla-cifra">{VIVIR_MONTHS}</span><span>meses seguidos</span></li>
              <li><span className="lgs-regla-cifra">{VIVIR_MIN_OPS}+</span><span>operaciones cada mes</span></li>
              <li><span className="lgs-regla-cifra"><TrendingUp className="lgs-regla-icono" size={32} strokeWidth={3} aria-hidden="true" /></span><span>el año en beneficio</span></li>
              <li><span className="lgs-regla-cifra"><span className="lgs-regla-signo" aria-hidden="true">≤</span><span className="sr-only">como mucho </span>{VIVIR_MAX_RED}</span><span>meses en rojo</span></li>
            </ul>
            <div className="lgs-accion">
              {superHecho ? (
                <span className="lgs-sello">¡Conseguido!{superFecha ? <small>{dateStr(superFecha)}</small> : null}</span>
              ) : showDiario ? (
                <Tecla href="/dashboard/trading#hitos" color="amarillo" tamano="grande">
                  Empezar mi camino <ArrowRight size={18} strokeWidth={2.8} aria-hidden="true" />
                </Tecla>
              ) : (
                <TeclaPremium href="/premium" tamano="grande" />
              )}
            </div>
          </div>
        </section>
      )}

      {visible.map(c => (
        <section key={c.id} id={`logros-${c.id}`} className={`lg-section tono-${c.color}`} aria-labelledby={`logros-${c.id}-titulo`}>
          {/* La cabecera de la categoría (23-11-2026): su icono en una tecla de
              su color, el número a mano, el título grande y, a la derecha, cuántos
              lleva con su barra. Todo sobre el pastel de la categoría. */}
          <header className="lg-sechead">
            <span className="lg-sechead-icono" aria-hidden="true">{c.icon}</span>
            <div className="lg-sechead-texto">
              <span className="lg-sechead-num" aria-hidden="true">capítulo {c.num}</span>
              <h2 id={`logros-${c.id}-titulo`} className="lg-sechead-titulo">{c.title}</h2>
              <p className="lg-sechead-sub">{c.sub}</p>
            </div>
            <div className="lg-sechead-cuenta">
              <span><b>{c.done}</b> de {c.defs.length}</span>
              <span className="pn-barra pn-barra--fina"><i style={{ width: `${(c.done / c.defs.length) * 100}%` }} /></span>
            </div>
          </header>
          <div className="lg-grid">
            {c.defs.filter(b => b.id !== superHito?.id).map((b, i) => (
              <LogroCard key={b.id} badge={b} ids={ids} indice={i} onAbrir={() => abrir(b.id)} />
            ))}
          </div>
        </section>
      ))}

      {fichaAbierta && (
        <FichaLogro
          badge={fichaAbierta} earned={earned} ids={ids} stats={stats} isPremium={showDiario}
          notaCurso={fichaAbierta.cursoSlug ? notaPorCurso.get(fichaAbierta.cursoSlug) : undefined}
          onCerrar={cerrarFicha}
        />
      )}
    </div>
  );
}
