"use client";

import { Fragment, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Crown, X } from "lucide-react";
import { WEEKDAYS, MONTHS, pnlStr, toneOf } from "./tjFormat";
import { resultTone, type Trade } from "./tjStats";

interface DayInfo {
  pnl: number;
  wins: number;
  losses: number;
  bes: number;
  trades: Trade[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildDayMap(trades: Trade[]): Map<string, DayInfo> {
  const map = new Map<string, DayInfo>();
  for (const t of trades) {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const info = map.get(dayKey(d)) ?? { pnl: 0, wins: 0, losses: 0, bes: 0, trades: [] };
    info.pnl += t.pnl;
    if (t.result === "win") info.wins++;
    else if (t.result === "loss") info.losses++;
    else info.bes++;
    info.trades.push(t);
    map.set(dayKey(d), info);
  }
  return map;
}

/** Semana ISO (de lunes a domingo): la numeración que usan los calendarios de trading. */
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}

function DayCount({ info }: { info: DayInfo }) {
  return (
    <span className="tj-cal-count">
      {info.wins > 0 && `${info.wins}G `}
      {info.losses > 0 && `${info.losses}P `}
      {info.bes > 0 && `${info.bes}BE`}
    </span>
  );
}

export default function TjCalendar({ trades }: { trades: Trade[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);

  const dayMap = useMemo(() => buildDayMap(trades), [trades]);
  const today = dayKey(now);
  const infoOf = (day: number) => dayMap.get(dayKey(new Date(year, month, day)));

  function shiftMonth(delta: number) {
    setDirection(delta);
    setSelected(null);
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

  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  const monthInfos = cells.map(d => (d ? infoOf(d) : undefined)).filter((i): i is DayInfo => !!i);
  const monthPnl = monthInfos.reduce((s, i) => s + i.pnl, 0);
  const monthWins = monthInfos.reduce((s, i) => s + i.wins, 0);
  const monthTotal = monthInfos.reduce((s, i) => s + i.trades.length, 0);
  const greenDays = monthInfos.filter(i => i.pnl > 0).length;
  const maxAbs = Math.max(...monthInfos.map(i => Math.abs(i.pnl)), 1);

  // Mejor día del mes: el de mayor P&L, solo si fue positivo.
  let bestDay: number | null = null;
  let bestPnl = 0;
  for (const d of cells) {
    const pnl = d ? infoOf(d)?.pnl ?? 0 : 0;
    if (d && pnl > bestPnl) { bestPnl = pnl; bestDay = d; }
  }

  const selectedInfo = selected != null ? infoOf(selected) : undefined;

  return (
    <section className="tj-card">
      <div className="tj-card-head">
        <div className="tj-cal-nav">
          <button type="button" className="tj-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></button>
          <span className="tj-label cap"><CalendarDays size={15} /> {MONTHS[month]} <span className="tj-cal-year">{year}</span></span>
          <button type="button" className="tj-icon-btn" onClick={() => shiftMonth(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></button>
        </div>
        <div className="tj-actions">
          {monthTotal > 0 ? (
            <dl className="tj-cal-stats">
              <div className={`tj-cal-stat is-main tone-${toneOf(monthPnl)}`}><dt>P&L del mes</dt><dd>{pnlStr(monthPnl)}</dd></div>
              <div className="tj-cal-stat"><dt>Operaciones</dt><dd>{monthTotal}</dd></div>
              <div className="tj-cal-stat"><dt>Acierto</dt><dd>{Math.round((monthWins / monthTotal) * 100)} %</dd></div>
              <div className="tj-cal-stat"><dt>Días en verde</dt><dd>{greenDays}/{monthInfos.length}</dd></div>
            </dl>
          ) : (
            <span className="tj-count">Sin operaciones este mes</span>
          )}
          <button type="button" className="tj-btn" onClick={goToday}>Hoy</button>
        </div>
      </div>

      <div className="tj-cal-grid tj-cal-weekdays">
        {WEEKDAYS.map((w, i) => <span key={w} className={i > 4 ? "is-weekend" : undefined}>{w}</span>)}
        <span className="tj-cal-weekhead">Semana</span>
      </div>

      <div className="tj-cal-viewport">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${year}-${month}`}
            className="tj-cal-grid"
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {weeks.map((week, w) => {
              const weekInfos = week.map(d => (d ? infoOf(d) : undefined)).filter((i): i is DayInfo => !!i);
              const weekPnl = weekInfos.reduce((s, i) => s + i.pnl, 0);
              const weekOps = weekInfos.reduce((s, i) => s + i.trades.length, 0);
              const weekWins = weekInfos.reduce((s, i) => s + i.wins, 0);
              const firstDay = week.find((d): d is number => d != null)!;
              return (
                <Fragment key={w}>
                  {week.map((day, i) => {
                    if (day == null) return <div key={i} className="tj-cal-day is-empty" />;
                    const info = infoOf(day);
                    const isToday = dayKey(new Date(year, month, day)) === today;
                    const cls = [
                      "tj-cal-day",
                      i > 4 && "is-weekend",
                      info && `tone-${toneOf(info.pnl)} has-data`,
                      isToday && "is-today",
                      day === bestDay && "is-best",
                    ].filter(Boolean).join(" ");
                    return (
                      <div
                        key={i}
                        className={cls}
                        style={info ? ({ "--intensity": 0.3 + 0.7 * (Math.abs(info.pnl) / maxAbs) } as React.CSSProperties) : undefined}
                        onClick={info ? () => setSelected(day) : undefined}
                      >
                        {day === bestDay && <span className="tj-cal-crown" title="Mejor día del mes"><Crown size={11} /></span>}
                        <span className="tj-cal-num">{day}</span>
                        {info && (
                          <>
                            <strong className="tj-cal-pnl">{pnlStr(info.pnl)}</strong>
                            <DayCount info={info} />
                            <div className="tj-tip tj-cal-tip">
                              <span className="tj-tip-head">{day} de {MONTHS[month]} · {pnlStr(info.pnl)}</span>
                              {info.trades.slice(0, 5).map(t => (
                                <span key={t.id} className={`tj-tip-row tone-${resultTone(t.result)}`}>
                                  <span>{t.pair}</span><span>{pnlStr(t.pnl)}</span>
                                </span>
                              ))}
                              {info.trades.length > 5 && <span className="muted">+{info.trades.length - 5} más</span>}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className={`tj-cal-week${weekOps ? ` tone-${toneOf(weekPnl)}` : " is-quiet"}`}>
                    <span className="tj-cal-week-label">Sem. {isoWeek(new Date(year, month, firstDay))}</span>
                    {weekOps ? (
                      <>
                        <strong>{pnlStr(weekPnl)}</strong>
                        <span className="tj-cal-week-meta">{weekOps} op. · {Math.round((weekWins / weekOps) * 100)} %</span>
                      </>
                    ) : (
                      <span className="tj-cal-week-meta">sin operaciones</span>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* En móvil el detalle del día se abre en un modal; en PC basta el tooltip. */}
      <AnimatePresence>
        {selectedInfo && selected != null && (
          <motion.div
            className="tj-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="tj-modal" role="dialog" aria-modal="true"
              initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="tj-card-head">
                <span className="tj-label cap">{selected} de {MONTHS[month]}</span>
                <strong className={`tone-${toneOf(selectedInfo.pnl)}`}>{pnlStr(selectedInfo.pnl)}</strong>
                <button type="button" className="tj-icon-btn" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={16} /></button>
              </div>
              <DayCount info={selectedInfo} />
              <ul className="tj-modal-list">
                {selectedInfo.trades.map(t => (
                  <li key={t.id} className={`tone-${resultTone(t.result)}`}>
                    <span>{t.pair}</span><strong>{pnlStr(t.pnl)}</strong>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
