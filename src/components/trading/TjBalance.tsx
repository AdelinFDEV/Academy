"use client";

import { useState } from "react";
import { Pencil, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./TjCharts";
import { moneyStr, pctStr, pnlStr, toneOf } from "./tjFormat";
import type { EquityPoint } from "./tjStats";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Ha ocurrido un error inesperado");

interface Props {
  /** P&L acumulado de todas las operaciones. */
  totalPnl: number;
  capital: number | null;
  series: EquityPoint[];
  /** Controlado desde fuera: un hito bloqueado también puede abrir la edición del capital. */
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onCapitalSaved: (value: number) => void;
  onReset: () => void;
}

/**
 * El balance de la cuenta, para la cabecera del diario: lo primero que se ve al
 * entrar. Capital actual, cuánto ha cambiado frente al inicial (en % y en $) y
 * la forma de la curva. Aquí también se define o cambia el capital y se resetea.
 * Se monta con key={capital}: al guardar un capital nuevo, el campo empieza limpio.
 */
export default function TjBalance({ totalPnl, capital, series, editing, onEditingChange, onCapitalSaved, onReset }: Props) {
  const [input, setInput] = useState(capital?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = capital != null ? capital + totalPnl : null;
  const returnPct = capital ? (totalPnl / capital) * 100 : null;
  const tone = toneOf(totalPnl);

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

  return (
    <div className="tjb">
      <div className="tjb-head">
        <span className="tjb-eyebrow">{current != null ? "Balance actual" : "P&L acumulado"}</span>
        <div className="tjb-tools">
          <button
            type="button" className="tj-icon-btn" onClick={() => { onEditingChange(!editing); setError(""); }}
            aria-label={capital == null ? "Definir capital inicial" : "Cambiar capital inicial"} title="Capital inicial"
          >
            <Pencil size={14} />
          </button>
          <button type="button" className="tj-icon-btn tone-loss" onClick={onReset} aria-label="Resetear el diario" title="Resetear el diario">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {editing ? (
        <form className="tjb-form" onSubmit={save}>
          <div className="field">
            <label htmlFor="tj-capital">Capital inicial ($)</label>
            <input
              id="tj-capital" type="number" step="any" min="0" autoFocus required
              value={input} onChange={(e) => setInput(e.target.value)} placeholder="1000"
            />
          </div>
          <div className="tj-actions">
            <button type="submit" className="tj-btn is-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" className="tj-btn" onClick={() => onEditingChange(false)}>Cancelar</button>
          </div>
          {error && <p className="auth-error">{error}</p>}
        </form>
      ) : (
        <>
          <div className="tjb-main">
            <strong className={`tjb-value${current == null ? ` tone-${tone}` : ""}`}>
              {current != null ? moneyStr(current) : pnlStr(totalPnl)}
            </strong>
            {returnPct != null && (
              <span className={`tjb-pct tone-${tone}`}>
                {totalPnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {pctStr(returnPct, true, 2)}
              </span>
            )}
          </div>
          {current != null ? (
            <span className="tjb-sub">
              <strong className={`tone-${tone}`}>{pnlStr(totalPnl)}</strong> desde los {moneyStr(capital!)} con los que empezaste
            </span>
          ) : (
            <button type="button" className="tjb-cta" onClick={() => onEditingChange(true)}>
              Define tu capital inicial para ver tu balance y la rentabilidad en %
            </button>
          )}
          {series.length > 1 && <Sparkline values={series.map(p => p.equity)} base={capital ?? 0} />}
        </>
      )}
    </div>
  );
}
