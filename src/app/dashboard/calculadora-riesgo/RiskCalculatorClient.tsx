"use client";

import { useState, useMemo } from "react";

function parseNum(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmtMoney(n: number): string {
  if (!isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const RISK_PRESETS = [0.5, 1, 2, 3];

export default function RiskCalculatorClient() {
  const [capitalRaw, setCapitalRaw] = useState("");
  const [riskPct, setRiskPct] = useState(1);

  const capital = parseNum(capitalRaw);
  const hasResult = capital > 0 && riskPct > 0;

  const riskAmount = useMemo(() => {
    if (!hasResult) return null;
    return capital * (riskPct / 100);
  }, [hasResult, capital, riskPct]);

  return (
    <div className="calc-wrap">

      {/* Header */}
      <div className="calc-page-header">
        <h1 className="calc-page-title">Calculadora de Riesgo</h1>
        <p className="calc-page-sub">
          Introduce el capital de tu cuenta y el porcentaje que estás dispuesto a arriesgar
          para saber cuánto dinero es exactamente.
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
                className="calc-input calc-input--has-prefix"
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
                className="calc-input"
                placeholder="1"
                value={riskPct || ""}
                onChange={(e) => setRiskPct(parseNum(e.target.value))}
              />
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
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                    <circle cx="22" cy="22" r="21" stroke="rgba(240,244,255,0.08)" strokeWidth="2" />
                    <text x="22" y="30" textAnchor="middle" fontSize="20" fill="rgba(240,244,255,0.1)" fontFamily="monospace">%</text>
                  </svg>
                </div>
                <p>
                  Introduce tu capital y el % de riesgo<br />para ver el resultado
                </p>
              </div>
            ) : (
              <>
                <span className="calc-result-label">Tu riesgo por operación</span>

                <div className="calc-result-price">{fmtMoney(riskAmount!)}</div>

                <div className="calc-breakdown">
                  <span className="calc-breakdown-val">{fmtMoney(capital)}</span>
                  <span className="calc-breakdown-op">×</span>
                  <span className="calc-breakdown-val">{riskPct}%</span>
                  <span className="calc-breakdown-op">=</span>
                  <span className="calc-breakdown-result">{fmtMoney(riskAmount!)}</span>
                </div>

                <div className="calc-result-stats">
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Capital total</span>
                    <span className="calc-result-stat-v">{fmtMoney(capital)}</span>
                  </div>
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">% de riesgo</span>
                    <span className="calc-result-stat-v">{riskPct}%</span>
                  </div>
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Capital restante si pierdes</span>
                    <span className="calc-result-stat-v">{fmtMoney(capital - riskAmount!)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
