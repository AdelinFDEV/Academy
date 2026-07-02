"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";

type Direction = "long" | "short";

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
  if (!isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

const RISK_PRESETS = [0.5, 1, 2, 3];

type Quality = "excelente" | "buena" | "aceptable" | "pobre";

const QUALITY: Record<Quality, { label: string; desc: string; color: string; icon: "check" | "warn" | "x" }> = {
  excelente: { label: "Excelente ratio", desc: "Riesgo/beneficio muy favorable para tu sistema a largo plazo.", color: "#34d399", icon: "check" },
  buena:     { label: "Buen ratio",      desc: "Relación riesgo/beneficio saludable.",                          color: "#34d399", icon: "check" },
  aceptable: { label: "Ratio aceptable", desc: "Funciona si tu win rate lo compensa, pero está justo.",         color: "#fbbf24", icon: "warn"  },
  pobre:     { label: "Ratio pobre",     desc: "Necesitarías acertar la mayoría de las veces para ser rentable.", color: "#f87171", icon: "x"    },
};

function getQuality(rr: number): Quality {
  if (rr >= 3) return "excelente";
  if (rr >= 2) return "buena";
  if (rr >= 1) return "aceptable";
  return "pobre";
}

export default function RiskCalculatorClient() {
  const [direction, setDirection] = useState<Direction>("long");
  const [capitalRaw, setCapitalRaw] = useState("");
  const [riskPct, setRiskPct] = useState(1);
  const [entryRaw, setEntryRaw] = useState("");
  const [stopRaw, setStopRaw] = useState("");
  const [targetRaw, setTargetRaw] = useState("");

  const capital = parseNum(capitalRaw);
  const entry = parseNum(entryRaw);
  const stop = parseNum(stopRaw);
  const target = parseNum(targetRaw);

  const stopValid = direction === "long" ? stop < entry : stop > entry;
  const targetValid = target === 0 || (direction === "long" ? target > entry : target < entry);

  const hasInputs = capital > 0 && entry > 0 && stop > 0;
  const hasResult = hasInputs && stopValid;

  const result = useMemo(() => {
    if (!hasResult) return null;

    const riskAmount = capital * (riskPct / 100);
    const stopDistance = Math.abs(entry - stop);
    const stopDistancePct = (stopDistance / entry) * 100;
    const positionSize = riskAmount / stopDistance;
    const positionValue = positionSize * entry;
    const leverage = positionValue / capital;

    let rr: number | null = null;
    let rewardAmount: number | null = null;
    if (target > 0 && targetValid) {
      const rewardDistance = Math.abs(target - entry);
      rr = rewardDistance / stopDistance;
      rewardAmount = rewardDistance * positionSize;
    }

    return { riskAmount, stopDistance, stopDistancePct, positionSize, positionValue, leverage, rr, rewardAmount };
  }, [hasResult, capital, riskPct, entry, stop, target, targetValid]);

  const quality = result?.rr != null ? QUALITY[getQuality(result.rr)] : null;

  return (
    <div className="calc-wrap">

      {/* Header */}
      <div className="calc-page-header">
        <h1 className="calc-page-title">Calculadora de Riesgo</h1>
        <p className="calc-page-sub">
          Calcula el tamaño exacto de tu posición según tu capital y el riesgo que estás dispuesto a asumir.
          Gestiona el riesgo antes de entrar, no después.
        </p>
      </div>

      {/* Formula */}
      <div className="calc-formula-bar">
        <span className="calc-formula-pill">Tamaño de posición</span>
        <span className="calc-formula-eq">=</span>
        <span className="calc-formula-pill">Riesgo en €</span>
        <span className="calc-formula-div">÷</span>
        <span className="calc-formula-pill">Distancia al Stop</span>
      </div>

      {/* Grid */}
      <div className="calc-grid">

        {/* ── Inputs ── */}
        <div className="calc-inputs-col">

          {/* Direction */}
          <div className="calc-field">
            <label className="calc-label">Dirección</label>
            <div className="calc-tabs">
              <button
                className={`calc-tab${direction === "long" ? " active" : ""}`}
                onClick={() => setDirection("long")}
              >
                <TrendingUp size={13} style={{ display: "inline", marginRight: 5, marginBottom: -2 }} />
                Long
              </button>
              <button
                className={`calc-tab${direction === "short" ? " active" : ""}`}
                onClick={() => setDirection("short")}
              >
                <TrendingDown size={13} style={{ display: "inline", marginRight: 5, marginBottom: -2 }} />
                Short
              </button>
            </div>
          </div>

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
                placeholder="10000"
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

          {/* Entry / Stop */}
          <div className="calc-field">
            <label className="calc-label">
              Precio de entrada
              <span className="calc-label-hint">A qué precio abres la posición</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix"
                placeholder="65000"
                value={entryRaw}
                onChange={(e) => setEntryRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">
              Precio de stop-loss
              <span className="calc-label-hint">Dónde cierras si el precio va en tu contra</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix"
                placeholder={direction === "long" ? "63000" : "67000"}
                value={stopRaw}
                onChange={(e) => setStopRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
            {stopRaw && entry > 0 && stop > 0 && !stopValid && (
              <p className="calc-field-note" style={{ color: "#f87171" }}>
                En {direction === "long" ? "Long" : "Short"}, el stop debe quedar {direction === "long" ? "por debajo" : "por encima"} del precio de entrada.
              </p>
            )}
          </div>

          {/* Target (optional) */}
          <div className="calc-field">
            <label className="calc-label">
              Precio objetivo
              <span className="calc-label-opt">Opcional</span>
              <span className="calc-label-hint">Para calcular tu ratio riesgo/beneficio</span>
            </label>
            <div className="calc-input-wrap calc-input-wrap--dollar">
              <span className="calc-input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="calc-input calc-input--has-prefix"
                placeholder={direction === "long" ? "70000" : "60000"}
                value={targetRaw}
                onChange={(e) => setTargetRaw(e.target.value.replace(/\$/g, ""))}
              />
            </div>
            {targetRaw && target > 0 && !targetValid && (
              <p className="calc-field-note" style={{ color: "#f87171" }}>
                En {direction === "long" ? "Long" : "Short"}, el objetivo debe quedar {direction === "long" ? "por encima" : "por debajo"} del precio de entrada.
              </p>
            )}
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
                  {capital > 0 && entry > 0 && stop > 0 && !stopValid
                    ? "Revisa que el stop tenga sentido para la dirección elegida"
                    : <>Introduce capital, entrada y stop<br />para ver el resultado</>}
                </p>
              </div>
            ) : (
              <>
                <span className="calc-result-label">Tamaño de la posición</span>

                <div className="calc-result-price">{fmtUnits(result!.positionSize)}</div>

                <div className="calc-breakdown">
                  <span className="calc-breakdown-val">{fmtMoney(result!.riskAmount)}</span>
                  <span className="calc-breakdown-op">÷</span>
                  <span className="calc-breakdown-val">{fmtMoney(result!.stopDistance)}</span>
                  <span className="calc-breakdown-op">=</span>
                  <span className="calc-breakdown-result">{fmtUnits(result!.positionSize)}</span>
                </div>

                {/* Leverage warning */}
                {result!.leverage > 1.05 && (
                  <div className="calc-feasibility" style={{ borderColor: "#fbbf2450", background: "#fbbf2412" }}>
                    <span className="calc-feasibility-label" style={{ color: "#fbbf24" }}>
                      <AlertTriangle size={13} />
                      Apalancamiento ≈ {result!.leverage.toFixed(2)}×
                    </span>
                    <span className="calc-feasibility-desc">
                      El valor de la posición ({fmtMoney(result!.positionValue)}) supera tu capital. Solo es viable con margen/futuros.
                    </span>
                  </div>
                )}

                {/* Quality badge (only with target) */}
                {quality && (
                  <div className="calc-feasibility" style={{ borderColor: quality.color + "50", background: quality.color + "12" }}>
                    <span className="calc-feasibility-label" style={{ color: quality.color }}>
                      {quality.icon === "check" && <CheckCircle size={13} />}
                      {quality.icon === "warn" && <AlertTriangle size={13} />}
                      {quality.icon === "x" && <XCircle size={13} />}
                      {quality.label} · {result!.rr!.toFixed(2)}R
                    </span>
                    <span className="calc-feasibility-desc">{quality.desc}</span>
                  </div>
                )}

                <div className="calc-result-stats">
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Riesgo en esta operación</span>
                    <span className="calc-result-stat-v">{fmtMoney(result!.riskAmount)} ({riskPct}% del capital)</span>
                  </div>
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Distancia al stop</span>
                    <span className="calc-result-stat-v">{result!.stopDistancePct.toFixed(2)}%</span>
                  </div>
                  <div className="calc-result-stat">
                    <span className="calc-result-stat-l">Valor de la posición</span>
                    <span className="calc-result-stat-v">{fmtMoney(result!.positionValue)}</span>
                  </div>
                  {result!.rewardAmount != null && (
                    <div className="calc-result-stat">
                      <span className="calc-result-stat-l">Beneficio potencial</span>
                      <span className="calc-result-stat-v">{fmtMoney(result!.rewardAmount)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
