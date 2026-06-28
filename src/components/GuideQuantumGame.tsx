"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, AlertTriangle, ShieldAlert } from "lucide-react";

type AttackState = "idle" | "classic" | "quantum" | "cracked";

export default function GuideQuantumGame() {
  const [attackState, setAttackState] = useState<AttackState>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (attackState === "classic") {
      // Classic attack barely moves
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 0.0001, 100));
      }, 100);
    } else if (attackState === "quantum") {
      // Quantum attack finishes in 3 seconds (3000ms => 30 steps of 100ms)
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setAttackState("cracked");
            return 100;
          }
          return p + 3.33;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [attackState]);

  const reset = () => {
    setAttackState("idle");
    setProgress(0);
  };

  return (
    <div className="quantum-game-container">
      <div className="quantum-game-header">
        <h3 className="gbc-title" style={{ margin: 0, fontSize: "1.1rem" }}>Simulador: Ataque a ECDSA-256</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>
          Descifra la clave privada a partir de una clave pública expuesta.
        </p>
      </div>

      <div className="quantum-game-screen">
        <div className={`quantum-lock ${attackState === "cracked" ? "cracked" : ""}`}>
          {attackState === "cracked" ? (
            <Unlock size={48} className="icon-cracked" />
          ) : (
            <Lock size={48} className={`icon-locked ${attackState !== "idle" ? "vibrating" : ""}`} />
          )}
        </div>

        <div className="quantum-progress-wrapper">
          <div className="quantum-progress-bar">
            <div 
              className={`quantum-progress-fill ${attackState}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="quantum-status">
            {attackState === "idle" && "Esperando orden de ataque..."}
            {attackState === "classic" && "Calculando... Tiempo estimado: 10 septillones de años."}
            {attackState === "quantum" && "Algoritmo de Shor iniciado. Superposición de 4000 qubits..."}
            {attackState === "cracked" && (
              <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                <ShieldAlert size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                ¡CLAVE PRIVADA COMPROMETIDA!
              </span>
            )}
          </div>
        </div>

        {attackState === "quantum" && (
          <div className="quantum-matrix">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="quantum-line" style={{ animationDelay: `${Math.random() * 0.5}s` }}>
                {Math.random().toString(36).substring(2, 8).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quantum-game-controls">
        <button 
          className="q-btn q-btn-classic" 
          onClick={() => { setAttackState("classic"); setProgress(0); }}
          disabled={attackState !== "idle" && attackState !== "cracked"}
        >
          Superordenador Clásico
        </button>
        <button 
          className="q-btn q-btn-quantum" 
          onClick={() => { setAttackState("quantum"); setProgress(0); }}
          disabled={attackState !== "idle" && attackState !== "cracked"}
        >
          Ordenador Cuántico (Shor)
        </button>
        {attackState === "cracked" && (
          <button className="q-btn q-btn-reset" onClick={reset}>Reiniciar</button>
        )}
      </div>
    </div>
  );
}
