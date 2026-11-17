"use client";

import { useMemo, useState } from "react";
import { TjSegmented } from "./TjControls";
import DivergingBar from "./TjDivergingBar";
import { factorStr, rStr, toneOf } from "./tjFormat";
import { BREAKDOWNS, groupStats, type BreakdownId, type Trade } from "./tjStats";

const OPTIONS = (Object.keys(BREAKDOWNS) as BreakdownId[]).map(id => ({ value: id, label: BREAKDOWNS[id].label }));

/** Días y franjas se leen en su orden natural; el resto, del que más aporta al que más resta. */
const NATURAL_ORDER: BreakdownId[] = ["weekday", "hour"];

/**
 * El desglose: una tabla en el ordenador y, en el móvil, un renglón por grupo
 * con sus cuatro datos rotulados y la barra del resultado a todo el ancho
 * (diario-analisis.css, `.dja-tabla`). No se esconde ninguna columna.
 */
export default function TjBreakdown({ trades }: { trades: Trade[] }) {
  const [by, setBy] = useState<BreakdownId>("pair");

  const rows = useMemo(() => {
    const groups = groupStats(trades, BREAKDOWNS[by].keyOf);
    return NATURAL_ORDER.includes(by) ? groups.sort((a, b) => a.sort - b.sort) : groups.sort((a, b) => b.pnl - a.pnl);
  }, [trades, by]);

  const maxAbs = Math.max(...rows.map(r => Math.abs(r.pnl)), 1);

  return (
    <section className="dj-hoja">
      <header className="dj-cabeza">
        <div>
          <h3>¿Dónde ganas y dónde pierdes?</h3>
          <p>
            {by === "hour" ? "Franjas de cuatro horas en tu hora local" : `Tu resultado repartido por ${BREAKDOWNS[by].label.toLowerCase()}`}
          </p>
        </div>
        <TjSegmented label="Agrupar por" value={by} onChange={setBy} options={OPTIONS} />
      </header>

      <table className="dja-tabla">
        <thead>
          <tr>
            <th scope="col">{BREAKDOWNS[by].label}</th>
            <th scope="col" className="num">Ops.</th>
            <th scope="col" className="num">Acierto</th>
            <th scope="col" className="num">P. factor</th>
            <th scope="col" className="num">Esperanza</th>
            <th scope="col" className="dja-tabla-pnl">P&L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key}>
              <th scope="row" className="cap">{r.label}</th>
              <td className="num" data-et="Ops.">{r.count}</td>
              <td className="num" data-et="Acierto">{Math.round(r.winRate)} %</td>
              <td className="num" data-et="P. factor">{factorStr(r.profitFactor)}</td>
              <td className={`num tone-${toneOf(r.expectancyR ?? 0)}`} data-et="Esperanza">
                {r.expectancyR != null ? rStr(r.expectancyR) : "—"}
              </td>
              <td className="dja-tabla-pnl">
                <DivergingBar value={r.pnl} max={maxAbs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
