"use client";

import { useState } from "react";
import { Wallet, Pencil, RotateCcw, Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { TjInfo } from "./TjControls";
import { factorStr, moneyStr, pctStr, pnlStr, rStr, toneOf, type Tone } from "./tjFormat";
import type { Insight, Stats } from "./tjStats";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Ha ocurrido un error inesperado");

interface Props {
  stats: Stats;
  capital: number | null;
  drawdown: { abs: number; pct: number | null };
  /** Controlado desde fuera: un hito bloqueado también puede abrir la edición del capital. */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onCapitalSaved: (value: number) => void;
  onReset: () => void;
}

export default function TjSummary({ stats, capital, drawdown, editing, onEditingChange, onCapitalSaved, onReset }: Props) {
  const [input, setInput] = useState(capital?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = capital != null ? capital + stats.totalPnl : null;
  const returnPct = capital ? (stats.totalPnl / capital) * 100 : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(input);
    if (isNaN(value) || value < 0) {
      setError("Introduce un capital válido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/trading-capital", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capital: value }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      onCapitalSaved(value);
      onEditingChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const pf = stats.profitFactor;
  const metrics: { label: string; hint: string; value: string; sub?: string; tone: Tone }[] = [
    {
      label: "Profit factor",
      hint: "Lo que ganan tus operaciones buenas dividido entre lo que pierden las malas. Por encima de 1,5 es un sistema sólido.",
      value: factorStr(pf),
      sub: pf == null ? "sin datos" : pf >= 1.5 ? "sólido" : pf >= 1 ? "justo" : "pierde dinero",
      tone: pf == null ? "be" : pf >= 1.5 ? "win" : pf >= 1 ? "be" : "loss",
    },
    {
      label: "Esperanza",
      hint: "Lo que deja de media cada operación, medido en R (unidades de riesgo). Es la cifra que dice si tu método tiene ventaja.",
      value: stats.expectancyR != null ? rStr(stats.expectancyR) : "—",
      sub: `${pnlStr(stats.avgPnl)} por operación`,
      tone: toneOf(stats.expectancyR ?? 0),
    },
    {
      label: "Drawdown máx.",
      hint: "La mayor caída desde un máximo de capital hasta el mínimo siguiente. Mide cuánto dolor aguanta tu cuenta.",
      value: drawdown.pct != null ? pctStr(drawdown.pct) : pnlStr(drawdown.abs),
      sub: drawdown.pct != null ? pnlStr(drawdown.abs) : "desde el máximo",
      tone: drawdown.abs < 0 ? "loss" : "be",
    },
    {
      label: "Ganancia / pérdida",
      hint: "Cuántas veces cabe tu pérdida media en tu ganancia media. Con un ratio alto puedes acertar menos de la mitad y ganar.",
      value: stats.payoff != null ? `${stats.payoff.toFixed(2).replace(".", ",")}×` : "—",
      sub: stats.payoff != null ? `${pnlStr(stats.avgWin)} frente a ${pnlStr(stats.avgLoss)}` : "faltan ganadas o perdidas",
      tone: stats.payoff == null ? "be" : stats.payoff >= 1 ? "win" : "loss",
    },
  ];

  return (
    <section className="tj-card tj-hero">
      <div className="tj-card-head">
        <span className="tj-label"><Wallet size={15} /> Resumen de rentabilidad</span>
        <div className="tj-actions">
          <button type="button" className="tj-btn" onClick={() => { onEditingChange(!editing); setError(""); }}>
            <Pencil size={13} /> {capital == null ? "Definir capital" : "Capital"}
          </button>
          <button type="button" className="tj-btn tone-loss" onClick={onReset}>
            <RotateCcw size={13} /> Resetear
          </button>
        </div>
      </div>

      {editing ? (
        <form className="tj-inline-form" onSubmit={save}>
          <div className="field">
            <label htmlFor="tj-capital">Capital inicial ($)</label>
            <input
              id="tj-capital" type="number" step="any" min="0" autoFocus required
              value={input} onChange={(e) => setInput(e.target.value)} placeholder="1000"
            />
          </div>
          <button type="submit" className="tj-btn is-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="tj-btn" onClick={() => onEditingChange(false)}>Cancelar</button>
          {error && <p className="auth-error">{error}</p>}
        </form>
      ) : current != null ? (
        <>
          <span className="tj-hero-caption">Capital actual</span>
          <strong className="tj-hero-value">{moneyStr(current)}</strong>
          <div className="tj-hero-sub">
            <span className={`tj-chip tone-${toneOf(stats.totalPnl)}`}>
              {stats.totalPnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {pctStr(returnPct ?? 0, true, 2)}
            </span>
            <span>{pnlStr(stats.totalPnl)} sobre {moneyStr(capital!)} iniciales</span>
          </div>
        </>
      ) : (
        <>
          <span className="tj-hero-caption">P&L acumulado</span>
          <strong className={`tj-hero-value tone-${toneOf(stats.totalPnl)}`}>{pnlStr(stats.totalPnl)}</strong>
          <p className="tj-hero-sub">
            Define tu capital inicial para ver la rentabilidad en %, el drawdown relativo y el riesgo de cada operación.
          </p>
        </>
      )}

      <dl className="tj-hero-metrics">
        {metrics.map(m => (
          <div key={m.label} className={`tj-metric tone-${m.tone}`}>
            <dt>{m.label} <TjInfo label={m.label}>{m.hint}</TjInfo></dt>
            <dd>{m.value}</dd>
            {m.sub && <dd className="tj-metric-sub">{m.sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function TjInsights({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null;
  return (
    <section className="tj-card tj-insights">
      <span className="tj-label"><Lightbulb size={15} /> Lo que dicen tus números</span>
      <ul>
        {insights.map(i => (
          <li key={i.text} className={`tone-${i.tone}`}>{i.text}</li>
        ))}
      </ul>
    </section>
  );
}
