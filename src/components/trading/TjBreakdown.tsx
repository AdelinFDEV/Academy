"use client";

import { useMemo, useState } from "react";
import { TjSegmented } from "./TjControls";
import DivergingBar from "./TjDivergingBar";
import { factorStr, rStr, toneOf } from "./tjFormat";
import { BREAKDOWNS, groupStats, type BreakdownId, type Trade } from "./tjStats";

const OPTIONS = (Object.keys(BREAKDOWNS) as BreakdownId[]).map(id => ({ value: id, label: BREAKDOWNS[id].label }));

/** Días y franjas se leen en su orden natural; el resto, del que más aporta al que más resta. */
const NATURAL_ORDER: BreakdownId[] = ["weekday", "hour"];

export default function TjBreakdown({ trades }: { trades: Trade[] }) {
  const [by, setBy] = useState<BreakdownId>("pair");

  const rows = useMemo(() => {
    const groups = groupStats(trades, BREAKDOWNS[by].keyOf);
    return NATURAL_ORDER.includes(by) ? groups.sort((a, b) => a.sort - b.sort) : groups.sort((a, b) => b.pnl - a.pnl);
  }, [trades, by]);

  const maxAbs = Math.max(...rows.map(r => Math.abs(r.pnl)), 1);

  return (
    <section className="tj-card">
      <header className="tjr-head">
        <div>
          <h3>¿Dónde ganas y dónde pierdes?</h3>
          <span className="tj-count">
            {by === "hour" ? "Franjas de cuatro horas en tu hora local" : `Tu resultado repartido por ${BREAKDOWNS[by].label.toLowerCase()}`}
          </span>
        </div>
        <TjSegmented label="Agrupar por" value={by} onChange={setBy} options={OPTIONS} />
      </header>

      <div className="tj-table-wrap">
        <table className="tj-table tjn-table">
          <thead>
            <tr>
              <th>{BREAKDOWNS[by].label}</th>
              <th className="num">Ops.</th>
              <th className="num">Acierto</th>
              <th className="num tj-hide-sm">P. factor</th>
              <th className="num tj-hide-sm">Esperanza</th>
              <th className="num">P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td className="cap strong">{r.label}</td>
                <td className="num">{r.count}</td>
                <td className="num">{Math.round(r.winRate)} %</td>
                <td className="num tj-hide-sm">{factorStr(r.profitFactor)}</td>
                <td className={`num tj-hide-sm tone-${toneOf(r.expectancyR ?? 0)}`}>
                  {r.expectancyR != null ? rStr(r.expectancyR) : "—"}
                </td>
                <td className={`num tone-${toneOf(r.pnl)}`}>
                  <DivergingBar value={r.pnl} max={maxAbs} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
