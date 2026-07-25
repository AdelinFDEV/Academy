"use client";

import { useState } from "react";
import { Network, RotateCcw, Check } from "lucide-react";

const VALIDATORS = 8;
// Nº de validadores que coinciden en cada ronda de consenso (didáctico).
const AGREE_BY_ROUND = [3, 5, 6, 7, 8];
const LAST_ROUND = AGREE_BY_ROUND.length - 1;
const THRESHOLD = 80; // supermayoría necesaria para cerrar el ledger (~80%)

export default function GuideXrpConsensus() {
  const [round, setRound] = useState(0);

  const agree = AGREE_BY_ROUND[round];
  const pct = Math.round((agree / VALIDATORS) * 100);
  const validated = pct >= THRESHOLD;

  const nextRound = () => setRound((r) => Math.min(r + 1, LAST_ROUND));
  const reset = () => setRound(0);

  return (
    <div className="xrp-cs">
      <div className="xrp-cs-head">
        <span className="xrp-cs-eyebrow">
          <Network size={14} /> Consenso del XRP Ledger · RPCA
        </span>
        <span className="xrp-cs-round">Ronda {round}</span>
      </div>

      {/* Validadores (UNL) */}
      <div className="xrp-cs-nodes">
        {Array.from({ length: VALIDATORS }).map((_, i) => {
          const agreed = i < agree;
          return (
            <div key={i} className={`xrp-cs-node${agreed ? " agreed" : ""}`}>
              <span className="xrp-cs-node-dot" />
              <span className="xrp-cs-node-lbl">V{i + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Medidor de acuerdo con el umbral del 80% */}
      <div className="xrp-cs-meter">
        <div className="xrp-cs-meter-track">
          <div
            className={`xrp-cs-meter-fill${validated ? " ok" : ""}`}
            style={{ width: `${pct}%` }}
          />
          <span className="xrp-cs-threshold" style={{ left: `${THRESHOLD}%` }}>
            <span className="xrp-cs-threshold-lbl">80%</span>
          </span>
        </div>
        <div className="xrp-cs-meter-row">
          <span className="xrp-cs-meter-val">{agree}/{VALIDATORS} validadores de acuerdo</span>
          <span className="xrp-cs-meter-pct">{pct}%</span>
        </div>
      </div>

      {/* Estado */}
      <div className={`xrp-cs-status${validated ? " ok" : ""}`}>
        {validated ? (
          <>
            <Check size={16} />
            <span><strong>Ledger cerrado.</strong> Se superó el ~80% de acuerdo: la transacción queda validada de forma irreversible.</span>
          </>
        ) : (
          <span>Los validadores aún no alcanzan la supermayoría. Avanza otra ronda para que converjan.</span>
        )}
      </div>

      {/* Controles */}
      <div className="xrp-cs-actions">
        <button
          type="button"
          className="gbc-quiz-btn"
          onClick={nextRound}
          disabled={validated}
          style={{ margin: 0 }}
        >
          {validated ? "Consenso alcanzado" : "Siguiente ronda de consenso"}
        </button>
        {round > 0 && (
          <button type="button" className="xrp-cs-reset" onClick={reset}>
            <RotateCcw size={14} style={{ marginRight: 5, verticalAlign: -2 }} />
            Reiniciar
          </button>
        )}
      </div>

      <p className="xrp-cs-note">
        Cada nodo confía en una lista de validadores (su <em>Unique Node List</em> o UNL). No hay minería:
        el ledger se cierra en segundos cuando una supermayoría de esos validadores coincide en el mismo estado.
      </p>
    </div>
  );
}
