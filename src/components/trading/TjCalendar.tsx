"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Target, Crown } from "lucide-react";
import { WEEKDAYS, MONTHS } from "./tjDateConstants";
import { pnlStr } from "./tjFormat";

type TradeResult = "win" | "loss" | "breakeven";

interface CalendarTrade {
  id: string;
  date: string;
  pnl: number;
  result: TradeResult;
  pair: string;
}

interface DayInfo {
  pnl: number;
  wins: number;
  losses: number;
  bes: number;
  trades: CalendarTrade[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildDayMap(trades: CalendarTrade[]): Record<string, DayInfo> {
  const map: Record<string, DayInfo> = {};
  for (const t of trades) {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const key = dayKey(d);
    if (!map[key]) map[key] = { pnl: 0, wins: 0, losses: 0, bes: 0, trades: [] };
    map[key].pnl += t.pnl;
    if (t.result === "win") map[key].wins++;
    else if (t.result === "loss") map[key].losses++;
    else map[key].bes++;
    map[key].trades.push(t);
  }
  return map;
}

function dayClass(info: DayInfo | undefined): string {
  if (!info) return "";
  if (info.pnl > 0) return "win";
  if (info.pnl < 0) return "loss";
  return "neutral";
}

export default function TjTradeCalendar({ trades }: { trades: CalendarTrade[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [direction, setDirection] = useState(1);

  const dayMap = useMemo(() => buildDayMap(trades), [trades]);
  const today = dayKey(now);

  function shiftMonth(delta: number) {
    setDirection(delta);
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function goToday() {
    setDirection(0);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Resumen e intensidad del mes visible
  const monthDayInfos = cells
    .filter((d): d is number => d != null)
    .map(d => dayMap[dayKey(new Date(year, month, d))])
    .filter((info): info is DayInfo => !!info);

  const monthPnl = monthDayInfos.reduce((s, i) => s + i.pnl, 0);
  const monthWins = monthDayInfos.reduce((s, i) => s + i.wins, 0);
  const monthLosses = monthDayInfos.reduce((s, i) => s + i.losses, 0);
  const monthBes = monthDayInfos.reduce((s, i) => s + i.bes, 0);
  const monthTotal = monthWins + monthLosses + monthBes;
  const monthWinRate = monthTotal ? Math.round((monthWins / monthTotal) * 100) : 0;
  const maxAbsPnl = Math.max(...monthDayInfos.map(i => Math.abs(i.pnl)), 1);

  // Mejor día del mes: el de mayor P&L, solo si fue positivo
  let bestDay: number | null = null;
  let bestPnl = -Infinity;
  cells.forEach(d => {
    if (d == null) return;
    const info = dayMap[dayKey(new Date(year, month, d))];
    if (info && info.pnl > bestPnl) { bestPnl = info.pnl; bestDay = d; }
  });
  if (bestPnl <= 0) bestDay = null;

  return (
    <div className="tj-cal-card">
      <div className="tj-cal-head">
        <div className="tj-cal-nav">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="tj-cal-title">
            <CalendarDays size={15} />
            {MONTHS[month]} {year}
          </span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
        <button type="button" className="tj-cal-today-btn" onClick={goToday}>Hoy</button>
      </div>

      {monthTotal > 0 && (
        <div className="tj-cal-summary">
          <div className={`tj-cal-summary-item${monthPnl > 0 ? " positive" : monthPnl < 0 ? " negative" : ""}`}>
            <TrendingUp size={13} />
            <span>P&L del mes: <strong>{pnlStr(monthPnl)}</strong></span>
          </div>
          <div className="tj-cal-summary-item">
            <Target size={13} />
            <span>Win rate del mes: <strong>{monthWinRate}%</strong></span>
          </div>
          <div className="tj-cal-summary-item">
            <span>{monthTotal} {monthTotal === 1 ? "operación" : "operaciones"}</span>
          </div>
        </div>
      )}

      <div className="tj-cal-weekdays detailed">
        {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
      </div>

      <div className="tj-cal-viewport">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${year}-${month}`}
            className="tj-cal-grid detailed"
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {cells.map((day, i) => {
              if (day == null) return <div key={i} className="tj-cal-day empty" />;
              const key = dayKey(new Date(year, month, day));
              const info = dayMap[key];
              const cls = dayClass(info);
              const isToday = key === today;
              const intensity = info ? Math.min(1, 0.35 + 0.65 * (Math.abs(info.pnl) / maxAbsPnl)) : 1;
              const isBest = day === bestDay;
              return (
                <div
                  key={i}
                  className={`tj-cal-day${cls ? ` ${cls}` : ""}${isToday ? " today" : ""}${info ? " has-data" : ""}${isBest ? " best" : ""}`}
                  style={info ? { "--intensity": intensity } as React.CSSProperties : undefined}
                >
                  {isBest && (
                    <div className="tj-cal-best-badge" title="Mejor día del mes">
                      <Crown size={12} />
                    </div>
                  )}
                  <span className="tj-cal-daynum">{day}</span>
                  {info && (
                    <div className="tj-cal-detail">
                      <span className={`tj-cal-pnl ${cls}`}>{pnlStr(info.pnl)}</span>
                      <span className="tj-cal-count">
                        {info.wins > 0 && `${info.wins}G `}
                        {info.losses > 0 && `${info.losses}P `}
                        {info.bes > 0 && `${info.bes}BE`}
                      </span>
                    </div>
                  )}
                  {info && (
                    <div className="tj-cal-day-tooltip">
                      <div className="tj-cal-day-tooltip-head">
                        {day} de {MONTHS[month]} · {pnlStr(info.pnl)}
                      </div>
                      {info.trades.slice(0, 5).map(t => (
                        <div key={t.id} className={`tj-cal-day-tooltip-row ${t.result}`}>
                          <span>{t.pair}</span>
                          <span>{pnlStr(t.pnl)}</span>
                        </div>
                      ))}
                      {info.trades.length > 5 && (
                        <div className="tj-cal-day-tooltip-more">+{info.trades.length - 5} más</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="tj-cal-legend">
        <span><i className="tj-cal-dot win" /> Día ganador</span>
        <span><i className="tj-cal-dot loss" /> Día perdedor</span>
        <span><i className="tj-cal-dot neutral" /> Breakeven</span>
        <span><i className="tj-cal-dot today-dot" /> Hoy</span>
        <span><Crown size={11} className="tj-cal-dot-crown" /> Mejor día del mes</span>
      </div>
    </div>
  );
}
