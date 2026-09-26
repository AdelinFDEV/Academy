"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { TjSelect, TjCombobox, TjDateTimePicker, TjSegmented } from "./TjControls";
import { pctStr, pnlStr, ratioStr, toneOf } from "./tjFormat";
import { RISK_LIMIT_PCT, type Direction, type Trade, type TradeResult } from "./tjStats";

const NOTES_MAX = 150;

interface FormState {
  date: string;
  pair: string;
  direction: Direction;
  risk_amount: string;
  expected_gain: string;
  result: TradeResult;
  real_pnl: string;
  strategy: string;
  notes: string;
}

const RESULT_LABEL: Record<TradeResult, string> = { win: "Ganada", loss: "Perdida", breakeven: "Breakeven" };

/**
 * Instante real -> texto para el selector de fecha, que trabaja en hora de
 * pared sin zona ("2026-09-01T22:07"). Hay que desplazar el instante por el
 * desfase local ANTES de serializar para que salga la hora del reloj del visitante.
 */
function toInputValue(d: Date): string {
  const copia = new Date(d);
  copia.setSeconds(0, 0);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 16);
}

/**
 * Hora de pared -> instante real en ISO con zona. La columna `date` es
 * timestamptz: si recibe texto sin desfase lo da por UTC, y quien apuntaba una
 * operación a las 22:07 la veía a la 01:07 del día siguiente. `new Date(texto)`
 * lo interpreta como hora LOCAL, que es lo que quiso escribir el usuario.
 */
function inputValueToIso(valor: string): string {
  const d = new Date(valor);
  return isNaN(d.getTime()) ? valor : d.toISOString();
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Ha ocurrido un error inesperado");

function fromTrade(t: Trade | null): FormState {
  if (!t) {
    return {
      date: toInputValue(new Date()), pair: "", direction: "long", risk_amount: "", expected_gain: "",
      result: "win", real_pnl: "", strategy: "", notes: "",
    };
  }
  return {
    date: toInputValue(new Date(t.date)), pair: t.pair, direction: t.direction,
    risk_amount: String(t.risk_amount), expected_gain: String(t.expected_gain),
    result: t.result, real_pnl: t.real_pnl != null ? String(t.real_pnl) : "",
    strategy: t.strategy ?? "", notes: t.notes ?? "",
  };
}

interface Props {
  editing: Trade | null;
  pairOptions: string[];
  strategyOptions: string[];
  equity: number | null;
  onSaved: (trade: Trade) => void;
  onClose: () => void;
}

export default function TjTradeForm({ editing, pairOptions, strategyOptions, equity, onSaved, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => fromTrade(editing));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const risk = parseFloat(form.risk_amount);
  const gain = parseFloat(form.expected_gain);
  const hasRisk = !isNaN(risk) && risk > 0;
  // Con P&L real, manda él: la API guarda ese importe y saca el resultado de su signo.
  const real = form.real_pnl.trim() === "" ? null : Number(form.real_pnl);
  const hasReal = real != null && Number.isFinite(real);
  const result: TradeResult = hasReal ? (real > 0 ? "win" : real < 0 ? "loss" : "breakeven") : form.result;
  const planned = result === "breakeven" ? 0 : result === "win" ? (isNaN(gain) ? null : gain) : hasRisk ? -risk : null;
  const pnl = hasReal ? real : planned;
  const riskPct = hasRisk && equity && equity > 0 ? (risk / equity) * 100 : null;
  const ratio = hasRisk && !isNaN(gain) && gain > 0 ? gain / risk : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/trades", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: inputValueToIso(form.date), ...(editing ? { id: editing.id } : {}) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      onSaved(await res.json());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tj-card tj-form" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="tj-card-head">
        <span className="tj-label">{editing ? "Editar operación" : "Nueva operación"}</span>
        <button type="button" className="tj-icon-btn" onClick={onClose} aria-label="Cerrar formulario">
          <X size={15} />
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="tj-form-grid">
          <div className="field">
            <label>Fecha y hora</label>
            <TjDateTimePicker value={form.date} onChange={v => set("date", v)} />
          </div>
          <div className="field">
            <label>Par</label>
            <TjCombobox value={form.pair} onChange={v => set("pair", v.toUpperCase())} options={pairOptions} placeholder="BTC/USDT" required />
          </div>
          <div className="field">
            <label>Dirección</label>
            <TjSegmented
              label="Dirección" value={form.direction} onChange={v => set("direction", v)}
              options={[{ value: "long", label: "Long" }, { value: "short", label: "Short" }]}
            />
          </div>
          <div className="field">
            <label>Resultado</label>
            {hasReal ? (
              <div className="tj-select-btn is-derived" title="Se deduce del signo del P&L real">
                {RESULT_LABEL[result]} · según el P&L real
              </div>
            ) : (
              <TjSelect
                value={form.result}
                onChange={v => set("result", v as TradeResult)}
                options={(Object.keys(RESULT_LABEL) as TradeResult[]).map(r => ({ value: r, label: RESULT_LABEL[r] }))}
              />
            )}
          </div>
          <div className="field">
            <label htmlFor="tj-risk">Riesgo asumido ($)</label>
            <input id="tj-risk" type="number" value={form.risk_amount} onChange={e => set("risk_amount", e.target.value)} step="any" min="0" placeholder="0,00" required />
          </div>
          <div className="field">
            <label htmlFor="tj-gain">Ganancia objetivo ($)</label>
            <input id="tj-gain" type="number" value={form.expected_gain} onChange={e => set("expected_gain", e.target.value)} step="any" min="0" placeholder="0,00" required />
          </div>
          <div className="field">
            <label htmlFor="tj-real">P&L real ($, opcional)</label>
            <input
              id="tj-real" type="number" value={form.real_pnl} onChange={e => set("real_pnl", e.target.value)}
              step="any" placeholder="Si cerraste distinto del plan"
            />
          </div>
          <div className="field">
            <label>Estrategia (opcional)</label>
            <TjCombobox value={form.strategy} onChange={v => set("strategy", v)} options={strategyOptions} placeholder="Scalping, swing, breakout..." />
          </div>
          <div className="field field-full">
            <label htmlFor="tj-notes">
              Notas (opcional) <span className="tj-count">{form.notes.length}/{NOTES_MAX}</span>
            </label>
            <textarea
              id="tj-notes" value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} maxLength={NOTES_MAX} placeholder="Por qué entré, qué aprendí, qué mejorar..."
            />
          </div>
        </div>

        <dl className="tj-strip">
          <div className={`tj-metric${pnl == null ? "" : ` tone-${toneOf(pnl)}`}`}>
            <dt>P&L que se registra</dt>
            <dd>{pnl == null ? "—" : pnlStr(pnl)}</dd>
            <dd className="tj-metric-sub">
              {!hasReal ? "según el plan" : planned != null && real !== planned ? `real · el plan era ${pnlStr(planned)}` : "real, igual que el plan"}
            </dd>
          </div>
          <div className={`tj-metric${riskPct != null && riskPct > RISK_LIMIT_PCT ? " tone-loss" : ""}`}>
            <dt>Riesgo de la cuenta</dt>
            <dd>{riskPct != null ? pctStr(riskPct, false, 2) : "—"}</dd>
            {riskPct != null && riskPct > RISK_LIMIT_PCT && (
              <dd className="tj-metric-sub"><AlertTriangle size={12} /> Por encima del {RISK_LIMIT_PCT} %</dd>
            )}
            {equity == null && <dd className="tj-metric-sub">Define tu capital para calcularlo</dd>}
          </div>
          <div className={`tj-metric${ratio == null ? "" : ` tone-${ratio >= 2 ? "win" : ratio >= 1 ? "be" : "loss"}`}`}>
            <dt>Ratio R:R planeado</dt>
            <dd>{ratio != null ? ratioStr(ratio) : "—"}</dd>
          </div>
        </dl>

        {error && <p className="auth-error">{error}</p>}

        <div className="tj-actions is-end">
          <button type="button" className="tj-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tj-btn is-primary" disabled={submitting}>
            {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Guardar operación"}
          </button>
        </div>
      </form>
    </section>
  );
}
