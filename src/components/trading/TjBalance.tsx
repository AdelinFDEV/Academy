"use client";

import { useState } from "react";
import { Pencil, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
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
  /** Aún no hay capital: el formulario está siempre a la vista y no se puede cerrar. */
  obligatorio?: boolean;
}

/**
 * El balance de la cuenta, para la cabecera del diario: lo primero que se ve al
 * entrar. Capital actual, cuánto ha cambiado frente al inicial (en % y en $) y
 * la forma de la curva. Aquí también se define o cambia el capital y se resetea.
 * Se monta con key={capital}: al guardar un capital nuevo, el campo empieza limpio.
 */
export default function TjBalance({ totalPnl, capital, series, editing, onEditingChange, onCapitalSaved, onReset, obligatorio = false }: Props) {
  const [input, setInput] = useState(capital?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = capital != null ? capital + totalPnl : null;
  const returnPct = capital ? (totalPnl / capital) * 100 : null;
  const tone = toneOf(totalPnl);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(input);
    if (!Number.isFinite(value) || value <= 0) {
      sonar("error");
      setError("Escribe una cantidad mayor que cero");
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
      sonar("guardado");
      onCapitalSaved(value);
      onEditingChange(false);
    } catch (err) {
      sonar("error");
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`djb${obligatorio ? " is-primer-paso" : ""}`}>
      <div className="djb-cab">
        <span className="dj-etq">{obligatorio ? "Primer paso" : current != null ? "Balance actual" : "P&L acumulado"}</span>
        {!obligatorio && <div className="djb-herramientas">
          <Tecla
            color="blanca" tamano="peq" icono onClick={() => { onEditingChange(!editing); setError(""); }}
            aria-label={capital == null ? "Definir capital inicial" : "Cambiar capital inicial"} title="Capital inicial"
          >
            <Pencil size={15} strokeWidth={2.4} />
          </Tecla>
          <Tecla color="coral" tamano="peq" icono onClick={onReset} aria-label="Reiniciar el diario" title="Reiniciar el diario">
            <RotateCcw size={15} strokeWidth={2.4} />
          </Tecla>
        </div>}
      </div>

      {editing || obligatorio ? (
        <form className="djb-form" onSubmit={save}>
          <div className={`dj-campo${error ? " error" : ""}`}>
            <label htmlFor="tj-capital">{obligatorio ? "¿Con cuánto capital empiezas?" : "Capital inicial"}</label>
            <div className="djb-dinero">
              <input
                id="tj-capital" type="number" step="any" min="0.01" inputMode="decimal" autoFocus required
                value={input} onChange={(e) => setInput(e.target.value)} placeholder="1000"
              />
              <span aria-hidden="true">$</span>
            </div>
            {error ? <span className="ayuda">{error}</span> : <span className="ayuda">en dólares; podrás cambiarlo luego</span>}
          </div>
          <div className="djb-acciones">
            <Tecla type="submit" color={obligatorio ? "naranja" : "azul"} disabled={saving} ancho={obligatorio}>
              {saving ? "Guardando..." : obligatorio ? "Empezar mi diario" : "Guardar"}
            </Tecla>
            {!obligatorio && <Tecla color="blanca" onClick={() => onEditingChange(false)}>Cancelar</Tecla>}
          </div>
        </form>
      ) : (
        <>
          <div className="djb-cifra">
            <strong className={`dj-cifra${current == null ? ` tone-${tone}` : ""}`}>
              {current != null ? moneyStr(current) : pnlStr(totalPnl)}
            </strong>
            {returnPct != null && (
              <span className={`dj-chip tone-${tone}`}>
                {totalPnl >= 0 ? <TrendingUp size={15} strokeWidth={2.6} /> : <TrendingDown size={15} strokeWidth={2.6} />}
                {pctStr(returnPct, true, 2)}
              </span>
            )}
          </div>
          {series.length > 1 && <Sparkline values={series.map(p => p.equity)} base={capital ?? 0} />}
          {current != null ? (
            <dl className="djb-pie">
              <div><dt>Empezaste con</dt><dd>{moneyStr(capital!)}</dd></div>
              <div><dt>{totalPnl >= 0 ? "Llevas ganado" : "Llevas perdido"}</dt><dd className={`tone-${tone}`}>{pnlStr(totalPnl)}</dd></div>
            </dl>
          ) : (
            <Tecla color="azul" ancho className="dj-llana" onClick={() => onEditingChange(true)}>
              Define tu capital inicial para ver tu balance y la rentabilidad en %
            </Tecla>
          )}
        </>
      )}
    </div>
  );
}
