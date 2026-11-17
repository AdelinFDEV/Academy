"use client";

import { useEffect, useState } from "react";
import { Eye, Check, X, Scan } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

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
        // El resultado del escaneo que ha lanzado la persona: el bot no pasa.
        setState("rejected");
        sonar("fallo");
      } else {
        setHash(generateHash());
        setGrant(parseFloat((Math.random() * 2 + 1.5).toFixed(2)));
        setState("verified");
        sonar("acierto");
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
    <div className="wld-orb">
      <div className="wld-orb-cab">
        <h3 className="wld-orb-titulo">Simulador: escaneo del Orb</h3>
        <p className="wld-orb-pista">
          Así es como World ID decide en segundos si eres un humano único — o un bot intentando colarse.
        </p>
      </div>

      <div className="wld-orb-escena">
        <div className={`wld-orb-esfera wld-orb-esfera--${state}`} aria-hidden="true">
          <div className="wld-orb-anillo wld-orb-anillo-1" />
          <div className="wld-orb-anillo wld-orb-anillo-2" />
          <div className="wld-orb-anillo wld-orb-anillo-3" />
          {state === "scanning" && <div className="wld-orb-linea" />}
          <div className="wld-orb-nucleo">
            {state === "verified" ? (
              <Check size={30} strokeWidth={2.4} />
            ) : state === "rejected" ? (
              <X size={30} strokeWidth={2.4} />
            ) : (
              <Eye size={30} strokeWidth={1.8} />
            )}
          </div>
        </div>

        <div className="wld-orb-estado" role="status">
          {state === "idle" && <span>Esperando iris…</span>}
          {state === "scanning" && (
            <>
              <span>{isBot ? "Analizando imagen sospechosa…" : "Escaneando patrón del iris…"}</span>
              <div className="wld-orb-pista-barra" aria-hidden="true">
                <div className="wld-orb-relleno" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          {state === "verified" && (
            <div className="wld-orb-resultado wld-orb-resultado--ok">
              <span className="wld-orb-resultado-titulo"><Check size={14} aria-hidden="true" /> Humano único verificado</span>
              <span className="wld-orb-resultado-hash">World ID hash: <code>{hash}</code></span>
              <span className="wld-orb-resultado-grant">+{grant} WLD de grant recibidos</span>
            </div>
          )}
          {state === "rejected" && (
            <div className="wld-orb-resultado wld-orb-resultado--ko">
              <span className="wld-orb-resultado-titulo"><X size={14} aria-hidden="true" /> Prueba de humanidad fallida</span>
              <span className="wld-orb-resultado-hash">No se detectó un patrón de iris humano válido</span>
              <span className="wld-orb-resultado-grant">Así se bloquea un intento de ataque Sybil</span>
            </div>
          )}
        </div>
      </div>

      <div className="wld-orb-mandos">
        {state === "idle" && (
          <>
            <Tecla color="naranja" onClick={() => start(false)}>
              <Scan size={18} aria-hidden="true" />
              Escanear iris humano
            </Tecla>
            <Tecla color="blanca" onClick={() => start(true)}>
              Intentar colar una foto (bot)
            </Tecla>
          </>
        )}
        {(state === "verified" || state === "rejected") && (
          <Tecla color="cielo" onClick={reset}>Reiniciar simulador</Tecla>
        )}
      </div>
    </div>
  );
}
