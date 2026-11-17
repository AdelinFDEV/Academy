"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, ShieldAlert } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

type AttackState = "idle" | "classic" | "quantum" | "cracked";

// Las columnas de «ruido» del ataque cuántico: se sortean una vez al cargar el
// módulo (no en cada render, que es impuro) y solo se pintan tras un clic.
const LINEAS = Array.from({ length: 20 }, () => ({
  retraso: Math.random() * 0.5,
  texto: Math.random().toString(36).substring(2, 8).toUpperCase(),
}));

export default function GuideQuantumGame() {
  const [attackState, setAttackState] = useState<AttackState>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (attackState === "classic") {
      // El ataque clásico apenas se mueve: no acabaría nunca.
      interval = setInterval(() => {
        setProgress((p) => Math.min(p + 0.0001, 100));
      }, 100);
    } else if (attackState === "quantum") {
      // El cuántico termina en unos 3 segundos (30 pasos de 100 ms). La clave
      // cae al llegar al 100 %: suena `fallo` (una nota grave, la clave está
      // comprometida). El ataque lo lanzó la persona, no suena solo.
      let p = 0;
      interval = setInterval(() => {
        p = Math.min(p + 3.33, 100);
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setAttackState("cracked");
          sonar("fallo");
        }
      }, 100);
    }

    return () => clearInterval(interval);
  }, [attackState]);

  const reset = () => {
    setAttackState("idle");
    setProgress(0);
  };

  return (
    <div className="bcq">
      <div>
        <h3 className="bcq-titulo">Simulador: Ataque a ECDSA-256</h3>
        <p className="bcq-sub">
          Descifra la clave privada a partir de una clave pública expuesta.
        </p>
      </div>

      <div className="bcq-pantalla">
        <div className={`bcq-candado${attackState === "cracked" ? " cracked" : ""}`}>
          {attackState === "cracked" ? (
            <Unlock size={44} aria-hidden="true" />
          ) : (
            <Lock size={44} aria-hidden="true" className={attackState !== "idle" ? "bcq-temblando" : undefined} />
          )}
        </div>

        <div className="bcq-progreso">
          <div className="bcq-barra" aria-hidden="true">
            <div 
              className={`bcq-relleno ${attackState}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="bcq-estado" role="status">
            {attackState === "idle" && "Esperando orden de ataque..."}
            {attackState === "classic" && "Calculando... Tiempo estimado: 10 septillones de años."}
            {attackState === "quantum" && "Algoritmo de Shor iniciado. Superposición de 4000 qubits..."}
            {attackState === "cracked" && (
              <span className="bcq-roto">
                <ShieldAlert size={14} aria-hidden="true" />
                ¡CLAVE PRIVADA COMPROMETIDA!
              </span>
            )}
          </div>
        </div>

        {attackState === "quantum" && (
          <div className="bcq-matriz" aria-hidden="true">
            {LINEAS.map((l, i) => (
              <div key={i} className="bcq-linea" style={{ animationDelay: `${l.retraso}s` }}>
                {l.texto}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bcq-controles">
        <Tecla
          color="cielo"
          onClick={() => { setAttackState("classic"); setProgress(0); }}
          disabled={attackState !== "idle" && attackState !== "cracked"}
        >
          Superordenador Clásico
        </Tecla>
        <Tecla
          color="lila"
          onClick={() => { setAttackState("quantum"); setProgress(0); }}
          disabled={attackState !== "idle" && attackState !== "cracked"}
        >
          Ordenador Cuántico (Shor)
        </Tecla>
        {/* El ataque clásico no termina nunca: sin esta tecla, el simulador
            se quedaba bloqueado tras probarlo. */}
        {attackState !== "idle" && (
          <Tecla color="blanca" onClick={reset}>Reiniciar</Tecla>
        )}
      </div>
    </div>
  );
}
