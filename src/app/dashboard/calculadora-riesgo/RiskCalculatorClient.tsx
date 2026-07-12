"use client";

import { useState, useMemo } from "react";
import { Shield, TrendingUp, TrendingDown, Target, Scale, AlertTriangle, Info } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────
function parseNum(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmtMoney(n: number): string {
  if (!isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function fmtUnits(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1)    return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toFixed(2) + "%";
}

const RISK_PRESETS = [0.5, 1, 2, 3];

// ── Component ──────────────────────────────────────────────
export default function RiskCalculatorClient() {
  const [capitalRaw, setCapitalRaw] = useState("");
  const [riskPct, setRiskPct]       = useState(1);
  const [entryRaw, setEntryRaw]     = useState("");
  const [stopRaw, setStopRaw]       = useState("");
  const [tpRaw, setTpRaw]           = useState("");

  const capital = parseNum(capitalRaw);
  const entry   = parseNum(entryRaw);
  const stop    = parseNum(stopRaw);
  const tp      = parseNum(tpRaw);

  const hasResult = capital > 0 && riskPct > 0;
  const riskAmount = hasResult ? capital * (riskPct / 100) : 0;

  // Position sizing (needs entry + stop, distintos)
  const sizing = useMemo(() => {
    if (!hasResult || entry <= 0 || stop <= 0 || entry === stop) return null;
    const direction: "long" | "short" = stop < entry ? "long" : "short";
    const stopDist = Math.abs(entry - stop);
    const stopDistPct = (stopDist / entry) * 100;
    const units = riskAmount / stopDist;
    const positionValue = units * entry;
    const leverage = positionValue / capital;

    let rr: number | null = null;
    let potentialProfit: number | null = null;
    let tpDistPct: number | null = null;
    let tpValid = false;
    if (tp > 0 && tp !== entry) {
      // TP debe estar en la dirección correcta del trade
      tpValid = direction === "long" ? tp > entry : tp < entry;
      if (tpValid) {
        const reward = Math.abs(tp - entry);
        rr = reward / stopDist;
        potentialProfit = units * reward;
        tpDistPct = (reward / entry) * 100;
      }
    }

    return { direction, stopDist, stopDistPct, units, positionValue, leverage, rr, potentialProfit, tpDistPct, tpValid };
  }, [hasResult, entry, stop, tp, riskAmount, capital]);

  // Posiciones (0-100) para la visualización del trade
  const viz = useMemo(() => {
    if (!sizing) return null;
    const pts = [stop, entry, ...(sizing.tpValid ? [tp] : [])];
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    if (min === max) return null;
    const pos = (p: number) => ((p - min) / (max - min)) * 100;
    return { entryPos: pos(entry), stopPos: pos(stop), tpPos: sizing.tpValid ? pos(tp) : null };
  }, [sizing, entry, stop, tp]);

  // Nivel de riesgo para el color del medidor
  const riskLevel = riskPct <= 1 ? "bajo" : riskPct <= 2 ? "medio" : riskPct <= 5 ? "alto" : "extremo";
  const riskColor = riskPct <= 1 ? "#34d399" : riskPct <= 2 ? "#fbbf24" : riskPct <= 5 ? "#f97316" : "#f87171";

  return (
    <div className="calc-wrap">

      {/* Header */}
      <div className="calc-page-header">
        <span className="calc-eyebrow">
          <span className="calc-eyebrow-dot" />
          Gestión de riesgo · Trading
        </span>
        <h1 className="calc-page-title">Calculadora de Riesgo</h1>
        <p className="calc-page-sub">
          Define cuánto arriesgas por operación y, con tu entrada y stop-loss, calcula el
          tamaño exacto de la posición, el apalancamiento y tu ratio riesgo/beneficio.
        </p>
      </div>

      {/* Formula */}
      <div className="calc-formula-bar">
        <span className="calc-formula-pill">Riesgo en $</span>
        <span className="calc-formula-eq">=</span>
        <span className="calc-formula-pill">Capital</span>
        <span className="calc-formula-div">×</span>
        <span className="calc-formula-pill">% de riesgo</span>
      </div>

      {/* Grid */}
      <div className="calc-grid">

        {/* ── Inputs ── */}
        <div className="calc-inputs-col">

          {/* Capital */}
          <div className="calc-field">
            <label className="calc-label">
              Capital total
              <span className="calc-label-hint">El tamaño de tu cuenta de trading</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix calc-input--hero"
                placeholder="5000"
                value={capitalRaw}
                onChange={(e) => setCapitalRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
          </div>

          {/* Risk % */}
          <div className="calc-field">
            <label className="calc-label">
              Riesgo por operación
              <span className="calc-label-hint">% del capital que aceptas perder si te saltan el stop</span>
            </label>
            <div className="calc-input-wrap">
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--hero"
                placeholder="1"
                value={riskPct || ""}
                onChange={(e) => setRiskPct(parseNum(e.target.value))}
              />
              <span className="calc-input-parsed" style={{ color: riskColor }}>
                riesgo {riskLevel}
              </span>
            </div>
            <div className="calc-presets">
              {RISK_PRESETS.map((p) => (
                <button
                  key={p}
                  className={`calc-preset-btn${riskPct === p ? " active" : ""}`}
                  onClick={() => setRiskPct(p)}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Trade setup — optional */}
          <div className="risk-optional-head">
            <span>Tamaño de posición</span>
            <span className="risk-optional-tag">opcional</span>
          </div>

          <div className="risk-inline-fields">
            <div className="calc-field">
              <label className="calc-label">
                Entrada
                <span className="calc-label-hint">Precio de entrada</span>
              </label>
              <div className="calc-input-wrap calc-input-wrap--dollar">
                <span className="calc-input-prefix">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="calc-input calc-input--has-prefix"
                  placeholder="100"
                  value={entryRaw}
                  onChange={(e) => setEntryRaw(e.target.value.replace(/\$/g, ""))}
                />
              </div>
            </div>

            <div className="calc-field">
              <label className="calc-label">
                Stop-loss
                <span className="calc-label-hint">Precio del stop</span>
              </label>
              <div className="calc-input-wrap calc-input-wrap--dollar">
                <span className="calc-input-prefix">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="calc-input calc-input--has-prefix"
                  placeholder="95"
                  value={stopRaw}
                  onChange={(e) => setStopRaw(e.target.value.replace(/\$/g, ""))}
                />
              </div>
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">
              Take-profit
              <span className="calc-label-hint">Precio objetivo — para ver tu ratio riesgo/beneficio</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix"
                placeholder="110"
                value={tpRaw}
                onChange={(e) => setTpRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
          </div>

          <div className="calc-tip">
            <strong>Regla general:</strong> la mayoría de traders profesionales arriesgan entre el 0.5% y el 2% de su capital por operación — nunca todo de golpe.
          </div>
        </div>

        {/* ── Result ── */}
        <div className="calc-result-col">
          <div className={`calc-result-card${hasResult ? " calc-result-card--active" : ""}`}>

            {!hasResult ? (
              <div className="calc-result-empty">
                <div className="calc-result-empty-icon">
                  <Shield size={40} aria-hidden="true" />
                </div>
                <p>
                  Introduce tu capital y el % de riesgo<br />para ver el resultado
                </p>
              </div>
            ) : (
              <>
                <span className="calc-result-label">Tu riesgo por operación</span>

                <div className="calc-result-price">{fmtMoney(riskAmount)}</div>

                <div className="calc-breakdown">
                  <span className="calc-breakdown-val">{fmtMoney(capital)}</span>
                  <span className="calc-breakdown-op">×</span>
                  <span className="calc-breakdown-val">{riskPct}%</span>
                  <span className="calc-breakdown-op">=</span>
                  <span className="calc-breakdown-result">{fmtMoney(riskAmount)}</span>
                </div>

                {/* Risk bar: riesgo vs capital */}
                <div className="risk-bar">
                  <div className="risk-bar-track">
                    <div
                      className="risk-bar-safe"
                      style={{ width: `${Math.max(0, 100 - riskPct)}%` }}
                    />
                    <div
                      className="risk-bar-risk"
                      style={{ width: `${Math.min(100, riskPct)}%`, background: riskColor }}
                    />
                  </div>
                  <div className="risk-bar-labels">
                    <span>En riesgo: <strong style={{ color: riskColor }}>{fmtMoney(riskAmount)}</strong></span>
                    <span>A salvo: <strong>{fmtMoney(capital - riskAmount)}</strong></span>
                  </div>
                </div>

                <div className="calc-result-stats">
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Capital total</span>
                    <span className="calc-result-stat-v">{fmtMoney(capital)}</span>
                  </div>
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Nivel de riesgo</span>
                    <span className="calc-result-stat-v" style={{ color: riskColor, textTransform: "capitalize" }}>{riskLevel}</span>
                  </div>
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Capital restante si pierdes</span>
                    <span className="calc-result-stat-v">{fmtMoney(capital - riskAmount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Position sizing panel ── */}
      {sizing && (
        <div className="risk-panel">
          <div className="risk-panel-head">
            <div>
              <h2 className="risk-panel-title">
                <Scale size={16} aria-hidden="true" />
                Tamaño de posición
              </h2>
              <p className="risk-panel-sub">
                Con un riesgo de <strong>{fmtMoney(riskAmount)}</strong> y tu stop a <strong>{fmtPct(sizing.stopDistPct)}</strong> de la entrada
              </p>
            </div>
            <span className={`risk-dir-badge risk-dir-badge--${sizing.direction}`}>
              {sizing.direction === "long" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {sizing.direction === "long" ? "Largo" : "Corto"}
            </span>
          </div>

          {/* Trade visualization */}
          {viz && (
            <div className="risk-viz">
              <div className="risk-viz-track">
                {/* Zona de pérdida (entrada → stop) */}
                <div
                  className="risk-viz-loss"
                  style={{
                    left: `${Math.min(viz.entryPos, viz.stopPos)}%`,
                    width: `${Math.abs(viz.entryPos - viz.stopPos)}%`,
                  }}
                />
                {/* Zona de beneficio (entrada → tp) */}
                {viz.tpPos !== null && (
                  <div
                    className="risk-viz-profit"
                    style={{
                      left: `${Math.min(viz.entryPos, viz.tpPos)}%`,
                      width: `${Math.abs(viz.entryPos - viz.tpPos)}%`,
                    }}
                  />
                )}
                {/* Marcadores */}
                <div className="risk-viz-marker risk-viz-marker--stop" style={{ left: `${viz.stopPos}%` }}>
                  <span className="risk-viz-flag">Stop</span>
                  <span className="risk-viz-price">{fmtMoney(stop)}</span>
                </div>
                <div className="risk-viz-marker risk-viz-marker--entry" style={{ left: `${viz.entryPos}%` }}>
                  <span className="risk-viz-flag">Entrada</span>
                  <span className="risk-viz-price">{fmtMoney(entry)}</span>
                </div>
                {viz.tpPos !== null && (
                  <div className="risk-viz-marker risk-viz-marker--tp" style={{ left: `${viz.tpPos}%` }}>
                    <span className="risk-viz-flag">Take-profit</span>
                    <span className="risk-viz-price">{fmtMoney(tp)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="risk-metrics">
            <div className="risk-metric risk-metric--primary">
              <span className="risk-metric-l">Tamaño de posición</span>
              <span className="risk-metric-v">{fmtUnits(sizing.units)}</span>
              <span className="risk-metric-sub">unidades</span>
            </div>
            <div className="risk-metric">
              <span className="risk-metric-l">Valor de la posición</span>
              <span className="risk-metric-v">{fmtMoney(sizing.positionValue)}</span>
              <span className="risk-metric-sub">{fmtUnits(sizing.units)} × {fmtMoney(entry)}</span>
            </div>
            <div className="risk-metric">
              <span className="risk-metric-l">Apalancamiento implícito</span>
              <span className={`risk-metric-v${sizing.leverage > 3 ? " risk-metric-v--warn" : ""}`}>
                {sizing.leverage.toFixed(2)}×
              </span>
              <span className="risk-metric-sub">posición ÷ capital</span>
            </div>
            <div className="risk-metric">
              <span className="risk-metric-l">Distancia al stop</span>
              <span className="risk-metric-v">{fmtPct(sizing.stopDistPct)}</span>
              <span className="risk-metric-sub">{fmtMoney(sizing.stopDist)} por unidad</span>
            </div>
          </div>

          {/* Risk/Reward */}
          {sizing.rr !== null ? (
            <div className="risk-rr">
              <div className="risk-rr-ratio">
                <Target size={15} aria-hidden="true" />
                <span className="risk-rr-label">Ratio Riesgo / Beneficio</span>
                <span className={`risk-rr-value${sizing.rr >= 2 ? " good" : sizing.rr >= 1 ? " ok" : " bad"}`}>
                  1 : {Number(sizing.rr.toFixed(2))}
                </span>
              </div>
              <div className="risk-rr-cols">
                <div className="risk-rr-col risk-rr-col--loss">
                  <span className="risk-rr-col-l">Pérdida potencial</span>
                  <span className="risk-rr-col-v">−{fmtMoney(riskAmount)}</span>
                </div>
                <div className="risk-rr-col risk-rr-col--profit">
                  <span className="risk-rr-col-l">Beneficio potencial</span>
                  <span className="risk-rr-col-v">+{fmtMoney(sizing.potentialProfit!)}</span>
                </div>
              </div>
              {sizing.rr < 1 && (
                <p className="risk-rr-note">
                  <AlertTriangle size={13} aria-hidden="true" />
                  Arriesgas más de lo que puedes ganar. Los pros buscan un ratio de al menos 1:2.
                </p>
              )}
            </div>
          ) : (
            <p className="risk-panel-hint">
              <Info size={13} aria-hidden="true" />
              Añade un <strong>take-profit</strong> {tp > 0 ? "válido (en la dirección del trade) " : ""}para ver tu ratio riesgo/beneficio y el beneficio potencial.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
