"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSonidoVentana } from "./useSonidoVentana";
import { bloquearScroll } from "./useVentanaMovil";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, TrendingDown, TrendingUp, X, ArrowUpRight, ArrowDownRight, Pencil, Plus, NotebookPen } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { TjSegmented } from "./TjControls";
import { WEEKDAYS, WEEKDAY_NAMES, MONTHS, pnlStr, rStr, toneOf } from "./tjFormat";
import { rOf, resultTone, type Trade } from "./tjStats";
import { animoDeMedia, animoInfo, fechaKey, type DiaDiario, type DiasMap } from "./tjDias";
import { Cara } from "./TjDayJournal";

/*
 * El calendario del Diario (17-11-2026, estilo «Cuaderno de estudio»): una hoja
 * de calendario de papel, con sus anillas arriba y el mes en grande. Cada día
 * pulsable es una tecla teñida por el signo de su resultado (verde suave si
 * ganó, rojo suave si perdió, gris si quedó en breakeven, papel si no hubo
 * operaciones); los días futuros, apagados; hoy, rodeado a boli. El CSS vive
 * en src/app/dashboard/trading/diario-calendario.css (prefijo djc-).
 */

interface DayInfo {
  pnl: number;
  /** Suma de R de las operaciones con riesgo apuntado. */
  r: number;
  wins: number;
  losses: number;
  bes: number;
  trades: Trade[];
}

type Mode = "month" | "year";
type Unit = "usd" | "r";
type Pestana = "resumen" | "dias" | "pares";

/**
 * Puntos de un día: uno por operación, hasta este tope; el resto va como «+n».
 * Cuatro caben siempre en su hueco junto a las marcas, en cualquier ancho.
 */
const MAX_DOTS = 4;

/** Anillas de la hoja (en móvil se esconden las que no caben). */
const ANILLAS = 14;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildDayMap(trades: Trade[]): Map<string, DayInfo> {
  const map = new Map<string, DayInfo>();
  for (const t of trades) {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const info = map.get(dayKey(d)) ?? { pnl: 0, r: 0, wins: 0, losses: 0, bes: 0, trades: [] };
    info.pnl += t.pnl;
    info.r += rOf(t) ?? 0;
    if (t.result === "win") info.wins++;
    else if (t.result === "loss") info.losses++;
    else info.bes++;
    info.trades.push(t);
    map.set(dayKey(d), info);
  }
  return map;
}

/** Suma de varios días: lo que necesitan la semana, el mes y el año. */
function sumInfos(infos: DayInfo[]) {
  return {
    pnl: infos.reduce((s, i) => s + i.pnl, 0),
    r: infos.reduce((s, i) => s + i.r, 0),
    wins: infos.reduce((s, i) => s + i.wins, 0),
    count: infos.reduce((s, i) => s + i.trades.length, 0),
    days: infos.length,
    green: infos.filter(i => i.pnl > 0).length,
  };
}

/** Semana ISO (de lunes a domingo): la numeración que usan los calendarios de trading. */
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}

/** Celdas de un mes empezando en lunes, con huecos (null) para completar semanas. */
function monthCells(year: number, month: number): (number | null)[] {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return cells;
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** El tono de un día o de un mes, como clase de la tecla (el color lo pone el CSS). */
const SIGNO = { win: "gana", loss: "pierde", be: "be" } as const;

function DayDots({ trades }: { trades: Trade[] }) {
  return (
    <span className="djc-puntos" aria-hidden="true">
      {trades.slice(0, MAX_DOTS).map(t => <i key={t.id} className={`tone-${resultTone(t.result)}`} />)}
      {trades.length > MAX_DOTS && <em>+{trades.length - MAX_DOTS}</em>}
    </span>
  );
}

/** La pegatina del mejor día (o mes): una estrella pequeña, ladeada. */
function Estrella({ className = "" }: { className?: string }) {
  return (
    <span className={`djc-estrella ${className}`} aria-hidden="true">
      <Star size={12} strokeWidth={2.6} />
    </span>
  );
}

interface Props {
  trades: Trade[];
  /** Abre el formulario para editar una operación. */
  onEdit: (t: Trade) => void;
  /** Abre el formulario de operación nueva con esa fecha. */
  onAdd: (date: Date) => void;
  /** Ánimo y nota de cada día, para marcarlos en su casilla. Se apuntan desde el formulario de operación. */
  dias: DiasMap;
}

export default function TjCalendar({ trades, onEdit, onAdd, dias }: Props) {
  const [now] = useState(() => new Date());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [mode, setMode] = useState<Mode>("month");
  const [unit, setUnit] = useState<Unit>("usd");
  const [direction, setDirection] = useState(1);
  // Día abierto: solo los días con operaciones tienen panel (sus operaciones, para verlas o editarlas).
  const [selected, setSelected] = useState<number | null>(null);
  // Vista Año: el mes cuyo resumen está abierto en una ventana, y su pestaña.
  const [mesAbierto, setMesAbierto] = useState<number | null>(null);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const abrirResumen = (m: number) => { setPestana("resumen"); setMesAbierto(m); };

  const dayMap = useMemo(() => buildDayMap(trades), [trades]);
  const today = dayKey(now);
  const infoOf = (y: number, m: number, d: number) => dayMap.get(dayKey(new Date(y, m, d)));
  const valueOf = (x: { pnl: number; r: number }) => (unit === "r" ? x.r : x.pnl);
  const fmt = (x: { pnl: number; r: number }) => (unit === "r" ? rStr(x.r) : pnlStr(x.pnl));
  const isFuture = (y: number, m: number, d: number) => new Date(y, m, d).getTime() > now.getTime();
  const diaOf = (y: number, m: number, d: number): DiaDiario | undefined => dias[fechaKey(new Date(y, m, d))];

  function shift(delta: number) {
    setDirection(delta);
    setSelected(null);
    setMesAbierto(null);
    if (mode === "year") {
      setYear(y => y + delta);
      return;
    }
    const d = new Date(year, month + delta, 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  }

  function goToday() {
    setDirection(0);
    setSelected(null);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  function openMonth(m: number) {
    setMesAbierto(null);
    setDirection(0);
    setMonth(m);
    setMode("month");
  }

  // Flechas del teclado: mes (o año) anterior y siguiente; Escape cierra el detalle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "Escape") { setSelected(null); setMesAbierto(null); }
      // Con una ventana abierta, las flechas no cambian de mes por detrás.
      else if (selected != null || mesAbierto != null) return;
      else if (e.key === "ArrowLeft") shift(-1);
      else if (e.key === "ArrowRight") shift(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Con una ventana abierta (un día o el resumen de un mes), la página de detrás no se desplaza.
  const hayVentana = selected != null || mesAbierto != null;
  useSonidoVentana(selected != null);
  useSonidoVentana(mesAbierto != null);
  useEffect(() => {
    if (!hayVentana) return;
    return bloquearScroll();
  }, [hayVentana]);

  const isCurrent = mode === "year" ? year === now.getFullYear() : year === now.getFullYear() && month === now.getMonth();
  const totalDias = new Date(year, month + 1, 0).getDate();

  return (
    <MotionConfig reducedMotion="user">
      <section className="dj-hoja djc" aria-label="Calendario de operaciones">
        {/* Las anillas de la hoja de calendario: puro adorno. */}
        <div className="djc-anillas" aria-hidden="true">
          {Array.from({ length: ANILLAS }, (_, i) => <i key={i} />)}
        </div>

        <header className="djc-cab">
          <div className="djc-titulo">
            <span className="dj-etq">{mode === "month" ? "Calendario de operaciones" : "El año, mes a mes"}</span>
            <h2 className="djc-mes">
              {mode === "month" ? (
                <><span className="cap">{MONTHS[month]}</span> <span className="djc-anio">{year}</span></>
              ) : (
                <>{year}</>
              )}
            </h2>
            {mode === "month" && isCurrent && (
              <div className="djc-avance">
                <span className="dj-nota">Día {now.getDate()} de {totalDias}</span>
                <span className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(now.getDate() / totalDias) * 100}%` }} /></span>
              </div>
            )}
          </div>

          <div className="djc-mandos">
            <div className="djc-nav">
              <Tecla color="blanca" tamano="peq" icono onClick={() => shift(-1)} aria-label={mode === "year" ? "Año anterior" : "Mes anterior"} title="Flecha izquierda">
                <ChevronLeft size={18} strokeWidth={2.6} />
              </Tecla>
              <Tecla color="azul" tamano="peq" onClick={goToday} disabled={isCurrent}>Hoy</Tecla>
              <Tecla color="blanca" tamano="peq" icono onClick={() => shift(1)} aria-label={mode === "year" ? "Año siguiente" : "Mes siguiente"} title="Flecha derecha">
                <ChevronRight size={18} strokeWidth={2.6} />
              </Tecla>
            </div>
            <div className="djc-vistas">
              <TjSegmented label="Unidad" value={unit} onChange={setUnit}
                options={[{ value: "usd", label: "$" }, { value: "r", label: "R" }]} />
              <TjSegmented label="Vista del calendario" value={mode} onChange={v => { setSelected(null); setMode(v); }}
                options={[{ value: "month", label: "Mes" }, { value: "year", label: "Año" }]} />
            </div>
          </div>
        </header>

        {mode === "month" ? renderMonth() : renderYear()}
      </section>
    </MotionConfig>
  );

  // Vistas como funciones de render, no como componentes: un componente definido
  // aquí dentro sería otro en cada render y React lo remontaría (adiós animaciones).

  // ─────────────────────────── Mes ───────────────────────────

  function renderMonth() {
    const cells = monthCells(year, month);
    const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
    const days = cells.filter((d): d is number => d != null);
    const active = days.map(d => ({ day: d, info: infoOf(year, month, d) })).filter((d): d is { day: number; info: DayInfo } => !!d.info);
    const sum = sumInfos(active.map(d => d.info));
    const prevDate = new Date(year, month - 1, 1);
    const prevDays = monthCells(prevDate.getFullYear(), prevDate.getMonth()).filter((d): d is number => d != null);
    const prev = sumInfos(prevDays.map(d => infoOf(prevDate.getFullYear(), prevDate.getMonth(), d)).filter((i): i is DayInfo => !!i));
    const diff = { pnl: sum.pnl - prev.pnl, r: sum.r - prev.r };
    // Mejor día del mes: el de mayor resultado, solo si fue positivo.
    const best = active.reduce<{ day: number; info: DayInfo } | null>(
      (b, d) => (valueOf(d.info) > (b ? valueOf(b.info) : 0) ? d : b),
      null,
    );
    // Ánimo del mes: la media de los días con ánimo apuntado.
    const moods = days.map(d => diaOf(year, month, d)?.animo).filter((a): a is NonNullable<typeof a> => a != null);
    const moodAvg = moods.length ? animoInfo(animoDeMedia(moods.reduce((s, a) => s + a, 0) / moods.length)) : null;

    return (
      <>
        <dl className="djc-franja">
          <div className={`djc-dato djc-dato--total djc-${SIGNO[toneOf(valueOf(sum))]}`}>
            <dt className="dj-etq">
              <span className="djc-dato-ico" aria-hidden="true">{valueOf(sum) < 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}</span>
              Resultado del mes
            </dt>
            <dd className={`dj-cifra djc-dato-grande tone-${toneOf(valueOf(sum))}`}>{sum.count ? fmt(sum) : "—"}</dd>
            {prev.count > 0 && (
              <dd className={`dj-chip tone-${toneOf(valueOf(diff))}`}>
                {valueOf(diff) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {fmt(diff)} frente a {MONTHS[prevDate.getMonth()]}
              </dd>
            )}
          </div>
          <div className="djc-dato">
            <dt className="dj-etq">Operaciones</dt>
            <dd className="dj-cifra">{sum.count}</dd>
          </div>
          <div className="djc-dato">
            <dt className="dj-etq">Acierto</dt>
            <dd className="dj-cifra">{sum.count ? `${Math.round((sum.wins / sum.count) * 100)} %` : "—"}</dd>
            {sum.count > 0 && <dd className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(sum.wins / sum.count) * 100}%` }} /></dd>}
          </div>
          <div className="djc-dato">
            <dt className="dj-etq">Días en verde</dt>
            <dd className="dj-cifra">{sum.days ? `${sum.green}/${sum.days}` : "—"}</dd>
            {sum.days > 0 && <dd className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(sum.green / sum.days) * 100}%` }} /></dd>}
          </div>
          <div className={`djc-dato${best ? " is-mejor" : ""}`}>
            <dt className="dj-etq">{best && <Estrella className="djc-estrella--linea" />}Mejor día</dt>
            <dd className="dj-cifra">{best ? `${best.day} de ${MONTHS[month].slice(0, 3)}.` : "—"}</dd>
            {best && <dd className="djc-dato-sub tone-win">{fmt(best.info)}</dd>}
          </div>
          <div className={`djc-dato djc-dato--animo${moodAvg ? ` mood-${moodAvg.value}` : ""}`}>
            <dt className="dj-etq">Ánimo del mes</dt>
            <dd className="djc-dato-animo">{moodAvg ? <><Cara valor={moodAvg.value} /> {moodAvg.label}</> : "—"}</dd>
          </div>
        </dl>

        <div>
          <div className="djc-cols djc-dias-sem" aria-hidden="true">
            {WEEKDAYS.map((w, i) => <span key={w} className={i > 4 ? "is-finde" : undefined}>{w}</span>)}
            <span className="djc-dias-sem-tot">Semana</span>
          </div>

          <div className="djc-ventanilla">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${year}-${month}`}
                className="djc-cols djc-rejilla"
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {weeks.map((week, w) => {
                  const wk = sumInfos(week.map(d => (d ? infoOf(year, month, d) : undefined)).filter((i): i is DayInfo => !!i));
                  const firstDay = week.find((d): d is number => d != null)!;
                  return (
                    <Fragment key={w}>
                      {week.map((day, i) => {
                        if (day == null) return <div key={i} className="djc-hueco" aria-hidden="true" />;
                        const info = infoOf(year, month, day);
                        const isToday = dayKey(new Date(year, month, day)) === today;
                        const future = isFuture(year, month, day);
                        const dia = diaOf(year, month, day);
                        const mood = dia?.animo ? animoInfo(dia.animo) : null;
                        const isBest = best?.day === day;
                        const signo = info ? SIGNO[toneOf(valueOf(info))] : null;
                        const cls = [
                          "djc-dia",
                          i > 4 && "is-finde",
                          signo ? `djc-${signo}` : "is-vacio",
                          isToday && "is-hoy",
                          isBest && "is-mejor",
                          selected === day && "is-pulsada",
                        ].filter(Boolean).join(" ");
                        const label = [
                          `${day} de ${MONTHS[month]}`,
                          info ? `${fmt(info)} en ${info.trades.length} ${info.trades.length === 1 ? "operación" : "operaciones"}` : "sin operaciones",
                          isBest && "mejor día del mes",
                          mood && `ánimo: ${mood.label.toLowerCase()}`,
                          dia?.nota && "con nota",
                        ].filter(Boolean).join(", ");

                        if (future) {
                          return (
                            <div key={i} className={`djc-dia is-futuro${isToday ? " is-hoy" : ""}`}>
                              <span className="djc-num">{day}</span>
                            </div>
                          );
                        }
                        // Día con operaciones: abre su panel. Día pasado sin operaciones: el «+»
                        // abre el formulario de operación nueva en esa fecha, que ya trae sus sensaciones.
                        const addOn = () => onAdd(isToday ? now : new Date(year, month, day, now.getHours(), now.getMinutes()));
                        return (
                          <Tecla
                            key={i}
                            color="blanca"
                            className={cls}
                            onClick={info ? () => setSelected(selected === day ? null : day) : addOn}
                            aria-pressed={info ? selected === day : undefined}
                            aria-label={info ? label : `${label}. Apuntar una operación este día`}
                          >
                            {/*
                              Huecos fijos (rejilla con áreas en diario-calendario.css), uno por
                              cosa: número · ánimo / resultado / puntos · nota. Nada comparte
                              hueco, así que nada se pisa. Si el calendario se estrecha (móvil),
                              la casilla se queda en lo mínimo: número, ánimo y un punto de color.
                            */}
                            {isBest && <Estrella />}
                            <span className="djc-num">{day}</span>
                            {mood && <span className="djc-emoji" title={mood.label} aria-hidden="true"><Cara valor={mood.value} peq /></span>}
                            {info && <strong className={`djc-pnl tone-${toneOf(valueOf(info))}`}>{fmt(info)}</strong>}
                            {info && <DayDots trades={info.trades} />}
                            {info && <i className={`djc-punto tone-${toneOf(valueOf(info))}`} aria-hidden="true" />}
                            {!info && <span className="djc-mas" aria-hidden="true"><Plus size={14} strokeWidth={3} /></span>}
                            {dia?.nota && <span className="djc-con-nota" aria-hidden="true"><NotebookPen size={12} /></span>}
                          </Tecla>
                        );
                      })}
                      <div className={`djc-semana${wk.count ? ` djc-${SIGNO[toneOf(valueOf(wk))]}` : " is-quieta"}`}>
                        <span className="djc-semana-n">Sem. {isoWeek(new Date(year, month, firstDay))}</span>
                        {wk.count ? (
                          <>
                            <strong className={`djc-semana-pnl tone-${toneOf(valueOf(wk))}`}>{fmt(wk)}</strong>
                            <span className="djc-semana-meta">{wk.count} op. · {Math.round((wk.wins / wk.count) * 100)} %</span>
                            <span className="dj-barra dj-barra--fina djc-semana-barra" aria-hidden="true"><i style={{ width: `${(wk.wins / wk.count) * 100}%` }} /></span>
                          </>
                        ) : (
                          <span className="djc-semana-meta">Sin operaciones</span>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ul className="djc-leyenda" aria-label="Qué significa cada marca">
          <li><i className="djc-muestra djc-gana" /> Día en ganancia</li>
          <li><i className="djc-muestra djc-pierde" /> Día en pérdida</li>
          <li><i className="djc-muestra djc-be" /> Breakeven</li>
          <li><span className="djc-puntos"><i className="tone-win" /><i className="tone-loss" /><i className="tone-be" /></span> Un punto por operación</li>
          <li><Estrella className="djc-estrella--linea" /> Mejor día del mes</li>
          <li><NotebookPen size={13} /> Con nota</li>
          <li><span className="djc-leyenda-mas"><Plus size={11} strokeWidth={3} /></span> Pulsa un día vacío para apuntar</li>
        </ul>

        {/* Las operaciones del día pulsado: una ventana en el centro de la pantalla
            (pedido por el admin el 13-11-2026; antes se desplegaba bajo el calendario
            y había que bajar a buscarla). Va en un portal para quedar por encima de
            todo; el velo lleva `trading-journal` para heredar las piezas del Diario. */}
        {selected != null && infoOf(year, month, selected) && createPortal(
          <div className="dj-velo trading-journal" onClick={() => setSelected(null)}>
            <div
              className={`dj-ventana djc-ventana${best?.day === selected ? " is-mejor" : ""}`}
              role="dialog" aria-modal="true" aria-label={`Operaciones del ${selected} de ${MONTHS[month]}`}
              onClick={e => e.stopPropagation()}
            >
              {renderDayDetail(selected, infoOf(year, month, selected)!, best?.day === selected)}
            </div>
          </div>,
          document.body,
        )}
      </>
    );
  }

  /** Panel de un día con operaciones: la lista para verlas o editarlas, y añadir otra. */
  function renderDayDetail(day: number, info: DayInfo, esMejor: boolean) {
    const date = new Date(year, month, day);
    const weekday = WEEKDAY_NAMES[(date.getDay() + 6) % 7];
    const isToday = dayKey(date) === today;
    const dia = diaOf(year, month, day);
    const mood = dia?.animo ? animoInfo(dia.animo) : null;
    return (
      <>
        <Tecla color="blanca" tamano="peq" icono className="dj-ventana-cerrar" onClick={() => setSelected(null)} aria-label="Cerrar el detalle del día" title="Cerrar (Esc)" autoFocus>
          <X size={18} strokeWidth={2.6} />
        </Tecla>

        <header className="djc-v-cab">
          {esMejor && (
            <span className="djc-v-mejor"><Estrella className="djc-estrella--linea" /> Tu mejor día de {MONTHS[month]}</span>
          )}
          <span className="dj-etq">{isToday ? "Hoy" : "El día"}</span>
          <h3 className="djc-v-fecha"><span className="cap">{weekday}</span> {day} de {MONTHS[month]}</h3>
          <p className="djc-v-meta">
            {info.trades.length} {info.trades.length === 1 ? "operación" : "operaciones"}
            {info.wins > 0 && ` · ${info.wins} ganada${info.wins === 1 ? "" : "s"}`}
            {info.losses > 0 && ` · ${info.losses} perdida${info.losses === 1 ? "" : "s"}`}
            {info.bes > 0 && ` · ${info.bes} BE`}
          </p>
        </header>

        <div className={`djc-v-total djc-${SIGNO[toneOf(info.pnl)]}`}>
          <strong className={`dj-cifra tone-${toneOf(info.pnl)}`}>{pnlStr(info.pnl)}</strong>
          <span className={`dj-chip tone-${toneOf(info.r)}`}>{rStr(info.r)}</span>
        </div>

        {(mood || dia?.nota) && (
          <div className={`djc-v-animo${mood ? ` mood-${mood.value}` : ""}`}>
            {mood && <span className="djc-v-animo-cara"><Cara valor={mood.value} peq /> {mood.label}</span>}
            {dia?.nota && <p className="djc-v-nota">{dia.nota}</p>}
          </div>
        )}

        <ul className="djc-v-lista">
          {info.trades.map(t => {
            const r = rOf(t);
            return (
              <li key={t.id} className={`djc-v-op djc-${SIGNO[resultTone(t.result)]}`}>
                <span className="djc-v-hora">{timeOf(t.date)}</span>
                <span className="djc-v-par">
                  {t.pair}
                  <span className={`dj-dir is-${t.direction}`}>
                    {t.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {t.direction === "long" ? "Long" : "Short"}
                  </span>
                </span>
                {t.strategy && <span className="djc-v-estrategia">{t.strategy}</span>}
                <span className={`djc-v-r tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</span>
                <strong className={`djc-v-pnl tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</strong>
                <Tecla
                  color="blanca"
                  tamano="peq"
                  icono
                  className="djc-v-editar"
                  onClick={() => { setSelected(null); onEdit(t); }}
                  aria-label={`Editar ${t.pair} de las ${timeOf(t.date)}`}
                  title="Editar"
                >
                  <Pencil size={15} />
                </Tecla>
              </li>
            );
          })}
        </ul>

        <Tecla
          color="azul"
          ancho
          onClick={() => { setSelected(null); onAdd(isToday ? now : new Date(year, month, day, now.getHours(), now.getMinutes())); }}
        >
          <Plus size={16} strokeWidth={3} /> Añadir otra operación este día
        </Tecla>
      </>
    );
  }

  // ─────────────────────────── Año ───────────────────────────

  function renderYear() {
    const months = Array.from({ length: 12 }, (_, m) => {
      const cells = monthCells(year, m);
      const infos = cells.map(d => (d ? infoOf(year, m, d) : undefined));
      return { m, cells, infos, sum: sumInfos(infos.filter((i): i is DayInfo => !!i)) };
    });
    const total = sumInfos(months.flatMap(x => x.infos.filter((i): i is DayInfo => !!i)));
    const traded = months.filter(x => x.sum.count);
    const greenMonths = traded.filter(x => x.sum.pnl > 0).length;
    const best = traded.reduce<(typeof months)[number] | null>((b, x) => (valueOf(x.sum) > (b ? valueOf(b.sum) : 0) ? x : b), null);
    // El peor mes solo se señala si de verdad acabó en negativo.
    const worst = traded.reduce<(typeof months)[number] | null>((b, x) => (valueOf(x.sum) < (b ? valueOf(b.sum) : 0) ? x : b), null);
    const maxMes = Math.max(...months.map(x => Math.abs(valueOf(x.sum))), 1e-9);
    const mediaMes = traded.length ? { pnl: total.pnl / traded.length, r: total.r / traded.length } : null;
    const maxAbs = Math.max(...months.flatMap(x => x.infos.map(i => (i ? Math.abs(valueOf(i)) : 0))), 1e-9);
    // Ánimo del año: la media de los días del año con ánimo apuntado (la franja del mes tiene el suyo).
    const yearMoods = Object.values(dias)
      .filter(d => d.animo != null && d.fecha.startsWith(`${year}-`))
      .map(d => d.animo!);
    const yearMood = yearMoods.length ? animoInfo(animoDeMedia(yearMoods.reduce((s, a) => s + a, 0) / yearMoods.length)) : null;

    return (
      <>
        <dl className="djc-franja">
          <div className={`djc-dato djc-dato--total djc-${SIGNO[toneOf(valueOf(total))]}`}>
            <dt className="dj-etq">
              <span className="djc-dato-ico" aria-hidden="true">{valueOf(total) < 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}</span>
              Resultado de {year}
            </dt>
            <dd className={`dj-cifra djc-dato-grande tone-${toneOf(valueOf(total))}`}>{total.count ? fmt(total) : "—"}</dd>
            {mediaMes && <dd className="djc-dato-sub">{fmt(mediaMes)} de media por mes operado</dd>}
          </div>
          <div className="djc-dato">
            <dt className="dj-etq">Operaciones</dt>
            <dd className="dj-cifra">{total.count}</dd>
          </div>
          <div className="djc-dato">
            <dt className="dj-etq">Acierto</dt>
            <dd className="dj-cifra">{total.count ? `${Math.round((total.wins / total.count) * 100)} %` : "—"}</dd>
            {total.count > 0 && <dd className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(total.wins / total.count) * 100}%` }} /></dd>}
          </div>
          <div className="djc-dato">
            <dt className="dj-etq">Meses en verde</dt>
            <dd className="dj-cifra">{traded.length ? `${greenMonths}/${traded.length}` : "—"}</dd>
            {traded.length > 0 && <dd className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(greenMonths / traded.length) * 100}%` }} /></dd>}
          </div>
          <div className={`djc-dato${best ? " is-mejor" : ""}`}>
            <dt className="dj-etq">{best && <Estrella className="djc-estrella--linea" />}Mejor mes</dt>
            <dd className="dj-cifra cap">{best ? MONTHS[best.m] : "—"}</dd>
            {best && <dd className="djc-dato-sub tone-win">{fmt(best.sum)}</dd>}
          </div>
          <div className={`djc-dato djc-dato--animo${yearMood ? ` mood-${yearMood.value}` : ""}`}>
            <dt className="dj-etq">Ánimo del año</dt>
            <dd className="djc-dato-animo">{yearMood ? <><Cara valor={yearMood.value} /> {yearMood.label}</> : "—"}</dd>
          </div>
        </dl>

        {/* El año de un vistazo: una tecla por mes con su barra, hacia arriba si acabó en verde. */}
        <div className="djc-anual" role="group" aria-label={`Resultado de cada mes de ${year}`}>
          {months.map(({ m, sum }) => {
            const v = valueOf(sum);
            const alto = sum.count ? Math.max((Math.abs(v) / maxMes) * 100, 6) : 0;
            const esMejor = best?.m === m;
            return (
              <Tecla
                key={m}
                color="blanca"
                className={`djc-ab${sum.count ? ` djc-${SIGNO[toneOf(v)]}` : " is-quieta"}${worst?.m === m ? " is-peor" : ""}`}
                onClick={() => abrirResumen(m)}
                title={`${MONTHS[m]}: ${sum.count ? fmt(sum) : "sin operaciones"}`}
                aria-label={`${MONTHS[m]}: ${sum.count ? fmt(sum) : "sin operaciones"}${esMejor ? ", el mejor mes del año" : ""}. Ver su resumen`}
              >
                {esMejor && <Estrella />}
                <span className="djc-ab-arriba">{v > 0 && <i style={{ height: `${alto}%` }} />}</span>
                <span className="djc-ab-abajo">{v < 0 && <i style={{ height: `${alto}%` }} />}</span>
                <span className="djc-ab-mes cap">{MONTHS[m].slice(0, 3)}</span>
              </Tecla>
            );
          })}
        </div>

        <div className="djc-ventanilla">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={year}
              className="djc-hojitas"
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {months.map(({ m, cells, infos, sum }) => {
                const isNow = year === now.getFullYear() && m === now.getMonth();
                const esMejor = best?.m === m;
                return (
                  <Tecla
                    key={m}
                    color="blanca"
                    className={`djc-hojita${sum.count ? ` djc-${SIGNO[toneOf(valueOf(sum))]}` : " is-quieta"}${isNow ? " is-ahora" : ""}${esMejor ? " is-mejor" : ""}`}
                    onClick={() => abrirResumen(m)}
                    aria-label={`${MONTHS[m]} de ${year}: ${sum.count ? `${fmt(sum)} en ${sum.count} operaciones` : "sin operaciones"}${esMejor ? ". El mejor mes del año" : ""}. Ver su resumen`}
                  >
                    {esMejor && <Estrella />}
                    <span className="djc-hojita-cab">
                      <span className="djc-hojita-mes cap">{MONTHS[m]}</span>
                      {isNow && <span className="dj-chip dj-chip--azul">En curso</span>}
                    </span>
                    <strong className={`djc-hojita-pnl${sum.count ? ` tone-${toneOf(valueOf(sum))}` : ""}`}>{sum.count ? fmt(sum) : "—"}</strong>
                    <span className="djc-hojita-dias" aria-hidden="true">
                      {cells.map((d, i) => {
                        const info = infos[i];
                        if (d == null) return <i key={i} className="is-hueco" />;
                        return (
                          <i
                            key={i}
                            className={info ? `djc-${SIGNO[toneOf(valueOf(info))]}` : undefined}
                            style={info ? ({ "--intensidad": 0.35 + 0.65 * (Math.abs(valueOf(info)) / maxAbs) } as React.CSSProperties) : undefined}
                          />
                        );
                      })}
                    </span>
                    {sum.count > 0 && <span className="dj-barra dj-barra--fina djc-hojita-barra" aria-hidden="true"><i style={{ width: `${(sum.wins / sum.count) * 100}%` }} /></span>}
                    <span className="djc-hojita-meta">
                      {sum.count ? `${sum.count} op. · ${Math.round((sum.wins / sum.count) * 100)} % de acierto · ${sum.green}/${sum.days} días en verde` : "Sin operaciones"}
                    </span>
                  </Tecla>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {mesAbierto != null && renderMonthSummary(mesAbierto, best?.m === mesAbierto)}
      </>
    );
  }

  /**
   * El resumen de un mes, en una ventana (13-11-2026): se abre al pulsar un
   * mes en la vista Año. Tres pestañas para no amontonar: las cifras del mes,
   * sus días uno a uno y el desglose por par y por estrategia. Desde aquí se
   * puede saltar al mes en el calendario.
   */
  function renderMonthSummary(m: number, esMejor: boolean) {
    const diasMes = monthCells(year, m)
      .filter((d): d is number => d != null)
      .map(d => ({ day: d, info: infoOf(year, m, d) }))
      .filter((d): d is { day: number; info: DayInfo } => !!d.info);
    const sum = sumInfos(diasMes.map(d => d.info));
    const ops = diasMes.flatMap(d => d.info.trades);
    const mejor = diasMes.reduce<(typeof diasMes)[number] | null>((b, d) => (valueOf(d.info) > (b ? valueOf(b.info) : 0) ? d : b), null);
    const peor = diasMes.reduce<(typeof diasMes)[number] | null>((b, d) => (valueOf(d.info) < (b ? valueOf(b.info) : 0) ? d : b), null);
    const media = sum.count ? { pnl: sum.pnl / sum.count, r: sum.r / sum.count } : null;
    const animos = diasMes.map(d => diaOf(year, m, d.day)?.animo).filter((a): a is NonNullable<typeof a> => a != null);
    const animo = animos.length ? animoInfo(animoDeMedia(animos.reduce((x, a) => x + a, 0) / animos.length)) : null;

    // Agrupa las operaciones del mes por una clave (el par, la estrategia).
    const agrupar = (clave: (t: Trade) => string) => {
      const grupos = new Map<string, { nombre: string; count: number; wins: number; pnl: number; r: number }>();
      for (const t of ops) {
        const k = clave(t);
        const g = grupos.get(k) ?? { nombre: k, count: 0, wins: 0, pnl: 0, r: 0 };
        g.count++;
        if (t.result === "win") g.wins++;
        g.pnl += t.pnl;
        g.r += rOf(t) ?? 0;
        grupos.set(k, g);
      }
      return [...grupos.values()].sort((a, b) => valueOf(b) - valueOf(a));
    };
    const porPar = agrupar(t => t.pair);
    const porEstrategia = agrupar(t => t.strategy ?? "Sin estrategia");

    const tabla = (titulo: string, filas: ReturnType<typeof agrupar>) => (
      <div className="djc-tabla">
        <h4 className="dj-etq">{titulo}</h4>
        <ul>
          {filas.map(g => (
            <li key={g.nombre}>
              <span className="djc-tabla-nombre">{g.nombre}</span>
              <span className="djc-tabla-meta">{g.count} op. · {Math.round((g.wins / g.count) * 100)} %</span>
              <strong className={`tone-${toneOf(valueOf(g))}`}>{fmt(g)}</strong>
            </li>
          ))}
        </ul>
      </div>
    );

    return createPortal(
      <div className="dj-velo trading-journal" onClick={() => setMesAbierto(null)}>
        <div
          className={`dj-ventana djc-ventana djc-ventana--mes${esMejor ? " is-mejor" : ""}`}
          role="dialog" aria-modal="true" aria-label={`Resumen de ${MONTHS[m]} de ${year}`}
          onClick={e => e.stopPropagation()}
        >
          <Tecla color="blanca" tamano="peq" icono className="dj-ventana-cerrar" onClick={() => setMesAbierto(null)} aria-label="Cerrar el resumen" title="Cerrar (Esc)" autoFocus>
            <X size={18} strokeWidth={2.6} />
          </Tecla>

          <header className="djc-v-cab">
            {esMejor && <span className="djc-v-mejor"><Estrella className="djc-estrella--linea" /> Tu mejor mes de {year}</span>}
            <span className="dj-etq">Resumen del mes</span>
            <h3 className="djc-v-fecha"><span className="cap">{MONTHS[m]}</span> <span className="djc-anio">{year}</span></h3>
          </header>

          {sum.count === 0 ? (
            <p className="djc-v-vacio">No apuntaste ninguna operación en {MONTHS[m]}.</p>
          ) : (
            <>
              <TjSegmented
                label="Apartados del resumen"
                className="djc-v-pestanas"
                value={pestana}
                onChange={setPestana}
                options={[
                  { value: "resumen", label: "Resumen" },
                  { value: "dias", label: `Días (${diasMes.length})` },
                  { value: "pares", label: "Pares y estrategias" },
                ]}
              />

              {pestana === "resumen" && (
                <div className="djc-v-panel" role="tabpanel">
                  <div className={`djc-v-total djc-${SIGNO[toneOf(valueOf(sum))]}`}>
                    <span className="dj-etq">Resultado de {MONTHS[m]}</span>
                    <strong className={`dj-cifra tone-${toneOf(valueOf(sum))}`}>{fmt(sum)}</strong>
                    {media && <small>{fmt(media)} de media por operación</small>}
                  </div>
                  <dl className="djc-v-datos">
                    <div><dt className="dj-etq">Operaciones</dt><dd className="dj-cifra">{sum.count}</dd></div>
                    <div>
                      <dt className="dj-etq">Acierto</dt><dd className="dj-cifra">{Math.round((sum.wins / sum.count) * 100)} %</dd>
                      <dd className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(sum.wins / sum.count) * 100}%` }} /></dd>
                    </div>
                    <div>
                      <dt className="dj-etq">Días en verde</dt><dd className="dj-cifra">{sum.green}/{sum.days}</dd>
                      <dd className="dj-barra dj-barra--fina" aria-hidden="true"><i style={{ width: `${(sum.green / sum.days) * 100}%` }} /></dd>
                    </div>
                    <div>
                      <dt className="dj-etq">{unit === "r" ? "En dólares" : "En R"}</dt>
                      <dd className={`dj-cifra tone-${toneOf(unit === "r" ? sum.pnl : sum.r)}`}>{unit === "r" ? pnlStr(sum.pnl) : rStr(sum.r)}</dd>
                    </div>
                    <div className={mejor ? "is-mejor" : undefined}>
                      <dt className="dj-etq">{mejor && <Estrella className="djc-estrella--linea" />}Mejor día</dt>
                      <dd className="dj-cifra">{mejor ? `${mejor.day} de ${MONTHS[m].slice(0, 3)}.` : "—"}</dd>
                      {mejor && <dd className="djc-dato-sub tone-win">{fmt(mejor.info)}</dd>}
                    </div>
                    <div>
                      <dt className="dj-etq">Peor día</dt>
                      <dd className="dj-cifra">{peor ? `${peor.day} de ${MONTHS[m].slice(0, 3)}.` : "Ninguno en rojo"}</dd>
                      {peor && <dd className="djc-dato-sub tone-loss">{fmt(peor.info)}</dd>}
                    </div>
                    <div><dt className="dj-etq">Par más operado</dt><dd className="dj-cifra">{[...porPar].sort((a, b) => b.count - a.count)[0]?.nombre ?? "—"}</dd></div>
                    <div className={animo ? `mood-${animo.value}` : undefined}>
                      <dt className="dj-etq">Ánimo del mes</dt>
                      <dd className="djc-dato-animo">{animo ? <><Cara valor={animo.value} /> {animo.label}</> : "Sin apuntar"}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {pestana === "dias" && (
                <ul className="djc-v-panel djc-v-dias" role="tabpanel">
                  {diasMes.map(({ day, info }) => {
                    const fecha = new Date(year, m, day);
                    const an = diaOf(year, m, day)?.animo;
                    return (
                      <li key={day} className={`djc-${SIGNO[toneOf(valueOf(info))]}${mejor?.day === day ? " is-mejor" : ""}`}>
                        <span className="djc-v-dia-n">{day}</span>
                        <span className="djc-v-dia-sem cap">{WEEKDAY_NAMES[(fecha.getDay() + 6) % 7]}</span>
                        <DayDots trades={info.trades} />
                        <span className="djc-tabla-meta">{info.trades.length} op.</span>
                        {an ? <span className="djc-emoji" role="img" aria-label={`Ánimo: ${animoInfo(an).label}`} title={animoInfo(an).label}><Cara valor={an} peq /></span> : <span />}
                        <strong className={`tone-${toneOf(valueOf(info))}`}>{fmt(info)}</strong>
                      </li>
                    );
                  })}
                </ul>
              )}

              {pestana === "pares" && (
                <div className="djc-v-panel djc-v-dos" role="tabpanel">
                  {tabla("Por par", porPar)}
                  {tabla("Por estrategia", porEstrategia)}
                </div>
              )}
            </>
          )}

          <Tecla color="azul" ancho className="djc-v-pie" onClick={() => openMonth(m)}>
            Ver <span className="cap">{MONTHS[m]}</span> en el calendario <ArrowUpRight size={16} strokeWidth={2.6} />
          </Tecla>
        </div>
      </div>,
      document.body,
    );
  }
}
