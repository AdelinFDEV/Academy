"use client";

import { useEffect, useState } from "react";
import { Eye, Check, X, Scan } from "lucide-react";

type ScanState = "idle" | "scanning" | "verified" | "rejected";

function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 12; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return hash + "…";
}

export default function GuideOrbScanner() {
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);
  const [hash, setHash] = useState("");
  const [grant, setGrant] = useState(0);
  const [isBot, setIsBot] = useState(false);

  useEffect(() => {
    if (state !== "scanning") return;
    const duration = isBot ? 900 : 2200;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      setProgress(Math.round(p * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (isBot) {
        setState("rejected");
      } else {
        setHash(generateHash());
        setGrant(parseFloat((Math.random() * 2 + 1.5).toFixed(2)));
        setState("verified");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, isBot]);

  const start = (bot: boolean) => {
    setIsBot(bot);
    setProgress(0);
    setState("scanning");
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
  };

  return (
    <div className="orb-game">
      <div className="orb-game-header">
        <h3 className="gbc-title" style={{ margin: 0, fontSize: "1.1rem" }}>Simulador: escaneo del Orb</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>
          Así es como World ID decide en segundos si eres un humano único — o un bot intentando colarse.
        </p>
      </div>

      <div className="orb-game-stage">
        <div className={`orb-sphere orb-sphere--${state}`}>
          <div className="orb-ring orb-ring-1" />
          <div className="orb-ring orb-ring-2" />
          <div className="orb-ring orb-ring-3" />
          {state === "scanning" && <div className="orb-scan-line" />}
          <div className="orb-core">
            {state === "verified" ? (
              <Check size={30} strokeWidth={2.4} />
            ) : state === "rejected" ? (
              <X size={30} strokeWidth={2.4} />
            ) : (
              <Eye size={30} strokeWidth={1.8} />
            )}
          </div>
        </div>

        <div className="orb-status">
          {state === "idle" && <span>Esperando iris…</span>}
          {state === "scanning" && (
            <>
              <span>{isBot ? "Analizando imagen sospechosa…" : "Escaneando patrón del iris…"}</span>
              <div className="orb-progress-track">
                <div className="orb-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          {state === "verified" && (
            <div className="orb-result orb-result--ok">
              <span className="orb-result-title"><Check size={14} /> Humano único verificado</span>
              <span className="orb-result-hash">World ID hash: <code>{hash}</code></span>
              <span className="orb-result-grant">+{grant} WLD de grant recibidos</span>
            </div>
          )}
          {state === "rejected" && (
            <div className="orb-result orb-result--ko">
              <span className="orb-result-title"><X size={14} /> Prueba de humanidad fallida</span>
              <span className="orb-result-hash">No se detectó un patrón de iris humano válido</span>
              <span className="orb-result-grant">Así se bloquea un intento de sybil attack</span>
            </div>
          )}
        </div>
      </div>

      <div className="orb-game-controls">
        {state === "idle" && (
          <>
            <button className="q-btn q-btn-quantum" onClick={() => start(false)}>
              <Scan size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Escanear iris humano
            </button>
            <button className="q-btn q-btn-classic" onClick={() => start(true)}>
              Intentar colar una foto (bot)
            </button>
          </>
        )}
        {(state === "verified" || state === "rejected") && (
          <button className="q-btn q-btn-reset" onClick={reset}>Reiniciar simulador</button>
        )}
      </div>
    </div>
  );
}
