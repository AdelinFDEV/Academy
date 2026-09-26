"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { TjSegmented } from "./TjControls";
import { factorStr, pnlStr, rStr, toneOf } from "./tjFormat";
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
      <div className="tj-card-head">
        <span className="tj-label"><Layers size={15} /> ¿Dónde ganas y dónde pierdes?</span>
        <TjSegmented label="Agrupar por" value={by} onChange={setBy} options={OPTIONS} />
      </div>

      {by === "hour" && <p className="tj-note">Franjas de cuatro horas en tu hora local.</p>}

      <div className="tj-table-wrap">
        <table className="tj-table">
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
                  <span className="tj-bar-cell">
                    <span className="tj-bar"><i style={{ width: `${(Math.abs(r.pnl) / maxAbs) * 100}%` }} /></span>
                    <strong>{pnlStr(r.pnl)}</strong>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
