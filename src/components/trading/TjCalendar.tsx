"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, CalendarCheck, ChevronLeft, ChevronRight, Crown, Target, TrendingDown, TrendingUp, X, ArrowUpRight, ArrowDownRight, Pencil, Plus, NotebookPen } from "lucide-react";
import { TjSegmented } from "./TjControls";
import { WEEKDAYS, WEEKDAY_NAMES, MONTHS, pnlStr, rStr, toneOf } from "./tjFormat";
import { rOf, resultTone, type Trade } from "./tjStats";
import { animoDeMedia, animoInfo, fechaKey, type DiaDiario, type DiasMap } from "./tjDias";
import { Cara } from "./TjDayJournal";

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

/**
 * Puntos de un día: uno por operación, hasta este tope; el resto va como «+n».
 * Cuatro caben siempre en su hueco junto a las marcas, en cualquier ancho.
 */
const MAX_DOTS = 4;

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

function DayDots({ trades }: { trades: Trade[] }) {
  return (
    <span className="tjc-dots" aria-hidden="true">
      {trades.slice(0, MAX_DOTS).map(t => <i key={t.id} className={`tone-${resultTone(t.result)}`} />)}
      {trades.length > MAX_DOTS && <em>+{trades.length - MAX_DOTS}</em>}
    </span>
  );
}

interface Props {
  trades: Trade[];
  /** Abre el formulario para editar una operación. */
  onEdit: (t: Trade) => void;
  /** Abre el formulario de operación nueva con esa fecha. */
  onAdd: (date: Date) => void;
  /** Ánimo y nota de cada día, por fecha AAAA-MM-DD. */
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
    setDirection(0);
    setMonth(m);
    setMode("month");
  }

  // Flechas del teclado: mes (o año) anterior y siguiente; Escape cierra el detalle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "Escape") setSelected(null);
      // Con la ventana de un día abierta, las flechas no cambian de mes por detrás.
      else if (selected != null) return;
      else if (e.key === "ArrowLeft") shift(-1);
      else if (e.key === "ArrowRight") shift(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Con la ventana de un día abierta, la página de detrás no se desplaza.
  useEffect(() => {
    if (selected == null) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = antes; };
  }, [selected]);

  const isCurrent = mode === "year" ? year === now.getFullYear() : year === now.getFullYear() && month === now.getMonth();

  return (
    <section className="tj-card tjc" aria-label="Calendario de operaciones">
      <header className="tjc-head">
        <div className="tjc-head-main">
          <div className="tjc-titulo">
            <h2 className="tjc-title">
              {mode === "month" ? (
                <><span className="cap">{MONTHS[month]}</span> <span className="tjc-year">{year}</span></>
              ) : (
                <>{year}</>
              )}
            </h2>
            {mode === "month" && isCurrent && (() => {
              const total = new Date(year, month + 1, 0).getDate();
              return (
                <span className="tjc-avance">
                  <i aria-hidden="true"><b style={{ width: `${(now.getDate() / total) * 100}%` }} /></i>
                  Día {now.getDate()} de {total}
                </span>
              );
            })()}
          </div>
          <div className="tjc-nav">
            <button type="button" onClick={() => shift(-1)} aria-label={mode === "year" ? "Año anterior" : "Mes anterior"} title="Flecha izquierda">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={goToday} disabled={isCurrent} className="tjc-today">Hoy</button>
            <button type="button" onClick={() => shift(1)} aria-label={mode === "year" ? "Año siguiente" : "Mes siguiente"} title="Flecha derecha">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="tjc-head-tools">
          <TjSegmented label="Unidad" value={unit} onChange={setUnit}
            options={[{ value: "usd", label: "$" }, { value: "r", label: "R" }]} />
          <TjSegmented label="Vista del calendario" value={mode} onChange={v => { setSelected(null); setMode(v); }}
            options={[{ value: "month", label: "Mes" }, { value: "year", label: "Año" }]} />
        </div>
      </header>

      {mode === "month" ? renderMonth() : renderYear()}
    </section>
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
    const maxAbs = Math.max(...active.map(d => Math.abs(valueOf(d.info))), 1e-9);
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
        <dl className="tjc-band">
          <div className={`tjc-band-main tone-${toneOf(valueOf(sum))}`}>
            <span className="tjc-band-ico" aria-hidden="true">{valueOf(sum) < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}</span>
            <dt>Resultado del mes</dt>
            <dd>{sum.count ? fmt(sum) : "—"}</dd>
            {prev.count > 0 && (
              <dd className={`tjc-band-diff tone-${toneOf(valueOf(diff))}`}>
                {valueOf(diff) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {fmt(diff)} frente a {MONTHS[prevDate.getMonth()]}
              </dd>
            )}
          </div>
          <div>
            <span className="tjc-band-ico" aria-hidden="true"><Activity size={15} /></span>
            <dt>Operaciones</dt><dd>{sum.count}</dd>
          </div>
          <div>
            <span className="tjc-band-ico" aria-hidden="true"><Target size={15} /></span>
            <dt>Acierto</dt><dd>{sum.count ? `${Math.round((sum.wins / sum.count) * 100)} %` : "—"}</dd>
            {sum.count > 0 && <i className="tjc-band-barra" aria-hidden="true"><b style={{ width: `${(sum.wins / sum.count) * 100}%` }} /></i>}
          </div>
          <div>
            <span className="tjc-band-ico" aria-hidden="true"><CalendarCheck size={15} /></span>
            <dt>Días en verde</dt><dd>{sum.days ? `${sum.green}/${sum.days}` : "—"}</dd>
            {sum.days > 0 && <i className="tjc-band-barra" aria-hidden="true"><b style={{ width: `${(sum.green / sum.days) * 100}%` }} /></i>}
          </div>
          <div className={best ? "tjc-band-mejor" : undefined}>
            <span className="tjc-band-ico" aria-hidden="true"><Crown size={15} /></span>
            <dt>Mejor día</dt>
            <dd>{best ? `${best.day} de ${MONTHS[month]}` : "—"}</dd>
            {best && <dd className="tjc-band-sub">{fmt(best.info)}</dd>}
          </div>
          <div className={`tjc-band-mood${moodAvg ? ` mood-${moodAvg.value}` : ""}`}>
            <dt>Ánimo del mes</dt>
            <dd>{moodAvg ? <><Cara valor={moodAvg.value} /> {moodAvg.label}</> : "—"}</dd>
          </div>
        </dl>

        <div className="tjc-grid tjc-weekdays" aria-hidden="true">
          {WEEKDAYS.map((w, i) => <span key={w} className={i > 4 ? "is-weekend" : undefined}>{w}</span>)}
          <span className="tjc-weekhead">Semana</span>
        </div>

        <div className="tjc-viewport">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${year}-${month}`}
              className="tjc-grid"
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
                      if (day == null) return <div key={i} className="tjc-day is-empty" />;
                      const info = infoOf(year, month, day);
                      const isToday = dayKey(new Date(year, month, day)) === today;
                      const future = isFuture(year, month, day);
                      const dia = diaOf(year, month, day);
                      const mood = dia?.animo ? animoInfo(dia.animo) : null;
                      const isBest = best?.day === day;
                      const cls = [
                        "tjc-day",
                        i > 4 && "is-weekend",
                        info && `tone-${toneOf(valueOf(info))} has-data`,
                        !info && !future && "is-open",
                        mood && `mood-${mood.value}`,
                        future && "is-future",
                        isToday && "is-today",
                        isBest && "is-best",
                        selected === day && "is-selected",
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
                          <div key={i} className={cls}>
                            <span className="tjc-num">{day}</span>
                          </div>
                        );
                      }
                      // Día con operaciones: abre su panel. Día pasado sin operaciones: el «+»
                      // abre el formulario de operación nueva en esa fecha, que ya trae sus sensaciones.
                      const addOn = () => onAdd(isToday ? now : new Date(year, month, day, now.getHours(), now.getMinutes()));
                      return (
                        <button
                          key={i}
                          type="button"
                          className={cls}
                          style={info ? ({ "--intensity": 0.25 + 0.75 * (Math.abs(valueOf(info)) / maxAbs) } as React.CSSProperties) : undefined}
                          onClick={info ? () => setSelected(selected === day ? null : day) : addOn}
                          aria-pressed={info ? selected === day : undefined}
                          aria-label={info ? label : `${label}. Apuntar una operación este día`}
                        >
                          {/*
                            Cinco huecos fijos (rejilla con áreas en trading.css), uno por cosa:
                            número · ánimo / resultado / operaciones · marcas. Nada comparte
                            hueco, así que nada se pisa; si la casilla se estrecha, se ocultan
                            por orden según su propio ancho, no el de la pantalla.
                          */}
                          {isBest && <span className="tjc-corona" title="Tu mejor día del mes" aria-hidden="true"><Crown size={17} strokeWidth={2.3} /></span>}
                          <span className="tjc-num">{day}</span>
                          {mood && <span className="tjc-mood" title={mood.label} aria-hidden="true"><Cara valor={mood.value} /></span>}
                          {info && <strong className="tjc-pnl">{fmt(info)}</strong>}
                          {info && <DayDots trades={info.trades} />}
                          {!info && <span className="tjc-plus" aria-hidden="true"><Plus size={14} /></span>}
                          {dia?.nota && (
                            <span className="tjc-flags" aria-hidden="true">
                              <NotebookPen size={12} className="tjc-flag-note" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <div className={`tjc-week${wk.count ? ` tone-${toneOf(valueOf(wk))}` : " is-quiet"}`}>
                      <span className="tjc-week-label">Sem. {isoWeek(new Date(year, month, firstDay))}</span>
                      {wk.count ? (
                        <>
                          <strong>{fmt(wk)}</strong>
                          <span className="tjc-week-meta">{wk.count} op. · {Math.round((wk.wins / wk.count) * 100)} %</span>
                          <i className="tjc-week-barra" aria-hidden="true"><b style={{ width: `${(wk.wins / wk.count) * 100}%` }} /></i>
                        </>
                      ) : (
                        <span className="tjc-week-meta">—</span>
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <ul className="tjc-leyenda" aria-label="Qué significa cada marca">
          <li><i className="tone-win" /> Ganada</li>
          <li><i className="tone-loss" /> Perdida</li>
          <li><i className="tone-be" /> Breakeven</li>
          <li><span className="tjc-leyenda-corona"><Crown size={11} strokeWidth={2.4} /></span> Mejor día del mes</li>
          <li><NotebookPen size={12} /> Con nota</li>
          <li><span className="tjc-leyenda-mas"><Plus size={11} /></span> Pulsa un día vacío para apuntar</li>
        </ul>

        {/* Las operaciones del día pulsado: una ventana en el centro de la pantalla
            (pedido por el admin el 13-11-2026; antes se desplegaba bajo el calendario
            y había que bajar a buscarla). Va en un portal para quedar por encima de
            todo; `tjc-dia-velo` recibe las variables de color del Diario en el CSS. */}
        {selected != null && infoOf(year, month, selected) && createPortal(
          <div className="tjc-dia-velo" onClick={() => setSelected(null)}>
            <div
              className={`tjc-dia${best?.day === selected ? " is-mejor" : ""}`}
              role="dialog" aria-modal="true" aria-label={`Operaciones del ${selected} de ${MONTHS[month]}`}
              onClick={e => e.stopPropagation()}
            >
              {best?.day === selected && (
                <p className="tjc-dia-mejor"><span className="tjc-leyenda-corona" aria-hidden="true"><Crown size={11} strokeWidth={2.4} /></span> Tu mejor día de {MONTHS[month]}</p>
              )}
              {renderDayDetail(selected, infoOf(year, month, selected)!)}
            </div>
          </div>,
          document.body,
        )}
      </>
    );
  }

  /** Panel de un día con operaciones: la lista para verlas o editarlas, y añadir otra. */
  function renderDayDetail(day: number, info: DayInfo) {
    const date = new Date(year, month, day);
    const weekday = WEEKDAY_NAMES[(date.getDay() + 6) % 7];
    const isToday = dayKey(date) === today;
    return (
      <div className="tjc-detail-inner">
        <div className="tjc-detail-head">
          <div>
            <span className="tjc-detail-date">{isToday ? "Hoy, " : ""}{weekday} {day} de {MONTHS[month]}</span>
            <span className="tjc-detail-meta">
              {info.trades.length} {info.trades.length === 1 ? "operación" : "operaciones"}
              {info.wins > 0 && ` · ${info.wins} ganada${info.wins === 1 ? "" : "s"}`}
              {info.losses > 0 && ` · ${info.losses} perdida${info.losses === 1 ? "" : "s"}`}
              {info.bes > 0 && ` · ${info.bes} BE`}
            </span>
          </div>
          <div className="tjc-detail-total">
            <strong className={`tone-${toneOf(info.pnl)}`}>{pnlStr(info.pnl)}</strong>
            <span className={`tone-${toneOf(info.r)}`}>{rStr(info.r)}</span>
          </div>
          <button type="button" className="tj-icon-btn" onClick={() => setSelected(null)} aria-label="Cerrar el detalle del día" title="Cerrar (Esc)" autoFocus>
            <X size={15} />
          </button>
        </div>
        <ul className="tjc-detail-list">
          {info.trades.map(t => {
            const r = rOf(t);
            return (
              <li key={t.id} className={`tone-${resultTone(t.result)}`}>
                <span className="tjc-detail-time">{timeOf(t.date)}</span>
                <span className="tjc-detail-pair">
                  {t.pair}
                  <span className={`tj-dir is-${t.direction}`}>
                    {t.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {t.direction === "long" ? "Long" : "Short"}
                  </span>
                </span>
                <span className="tjc-detail-strategy">{t.strategy ?? ""}</span>
                <span className={`tjc-detail-r tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</span>
                <strong className={`tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</strong>
                <button type="button" className="tj-icon-btn" onClick={() => { setSelected(null); onEdit(t); }} aria-label={`Editar ${t.pair} de las ${timeOf(t.date)}`} title="Editar">
                  <Pencil size={13} />
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="tjc-detail-add"
          onClick={() => { setSelected(null); onAdd(isToday ? now : new Date(year, month, day, now.getHours(), now.getMinutes())); }}
        >
          <Plus size={14} /> Añadir otra operación este día
        </button>
      </div>
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
    const maxAbs = Math.max(...months.flatMap(x => x.infos.map(i => (i ? Math.abs(valueOf(i)) : 0))), 1e-9);
    // Ánimo del año: la media de los días del año con ánimo apuntado (la franja del mes tiene el suyo).
    const yearMoods = Object.values(dias)
      .filter(d => d.animo != null && d.fecha.startsWith(`${year}-`))
      .map(d => d.animo!);
    const yearMood = yearMoods.length ? animoInfo(animoDeMedia(yearMoods.reduce((s, a) => s + a, 0) / yearMoods.length)) : null;

    return (
      <>
        <dl className="tjc-band">
          <div className={`tjc-band-main tone-${toneOf(valueOf(total))}`}>
            <dt>Resultado de {year}</dt>
            <dd>{total.count ? fmt(total) : "—"}</dd>
          </div>
          <div><dt>Operaciones</dt><dd>{total.count}</dd></div>
          <div><dt>Acierto</dt><dd>{total.count ? `${Math.round((total.wins / total.count) * 100)} %` : "—"}</dd></div>
          <div><dt>Meses en verde</dt><dd>{traded.length ? `${greenMonths}/${traded.length}` : "—"}</dd></div>
          <div className={best ? "tone-win" : undefined}>
            <dt>Mejor mes</dt>
            <dd className="cap">{best ? `${MONTHS[best.m].slice(0, 3)} · ${fmt(best.sum)}` : "—"}</dd>
          </div>
          <div className="tjc-band-mood">
            <dt>Ánimo del año</dt>
            <dd>{yearMood ? <><span aria-hidden="true">{yearMood.emoji}</span> {yearMood.label}</> : "—"}</dd>
          </div>
        </dl>

        <div className="tjc-viewport">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={year}
              className="tjy-grid"
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {months.map(({ m, cells, infos, sum }) => {
                const isNow = year === now.getFullYear() && m === now.getMonth();
                return (
                  <button
                    key={m}
                    type="button"
                    className={`tjy-month${sum.count ? ` tone-${toneOf(valueOf(sum))}` : " is-quiet"}${isNow ? " is-now" : ""}`}
                    onClick={() => openMonth(m)}
                    aria-label={`${MONTHS[m]} de ${year}: ${sum.count ? `${fmt(sum)} en ${sum.count} operaciones` : "sin operaciones"}. Abrir el mes`}
                  >
                    <span className="tjy-head">
                      <span className="tjy-name cap">{MONTHS[m]}</span>
                      <strong>{sum.count ? fmt(sum) : "—"}</strong>
                    </span>
                    <span className="tjy-mini" aria-hidden="true">
                      {cells.map((d, i) => {
                        const info = infos[i];
                        if (d == null) return <i key={i} className="is-empty" />;
                        return (
                          <i
                            key={i}
                            className={info ? `tone-${toneOf(valueOf(info))} has-data` : undefined}
                            style={info ? ({ "--intensity": 0.3 + 0.7 * (Math.abs(valueOf(info)) / maxAbs) } as React.CSSProperties) : undefined}
                          />
                        );
                      })}
                    </span>
                    <span className="tjy-meta">
                      {sum.count ? `${sum.count} op. · ${Math.round((sum.wins / sum.count) * 100)} % · ${sum.green}/${sum.days} días en verde` : "Sin operaciones"}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  }
}
