"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Pickaxe, Hash, CheckCircle2, XCircle, Zap, RefreshCw, Cpu } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

async function sha256hex(msg: string): Promise<string> {
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const TXNS = [
  "Satoshi → Hal Finney: 10 BTC",
  "Alice → Bob: 0.5 BTC",
  "Recompensa minero: 3.125 BTC",
];
const PREV = "0000a3f8c2d1e94b7a6c5f8...";

function blockStr(nonce: number) {
  return `{"idx":842001,"prev":"${PREV}","ts":"2026-06-28T12:00:00Z","txs":["${TXNS.join('","')}"],"nonce":${nonce}}`;
}

export default function GuideMineBlock() {
  const [nonce, setNonce] = useState(0);
  const [nonceInput, setNonceInput] = useState("0");
  const [hash, setHash] = useState("");
  const [mining, setMining] = useState(false);
  const [found, setFound] = useState(false);
  const [difficulty, setDifficulty] = useState(2);
  const [attempts, setAttempts] = useState(0);
  const [hashRate, setHashRate] = useState(0); // Hashes por segundo simulados
  const stopRef = useRef(false);
  const nonceId = useId();

  useEffect(() => {
    sha256hex(blockStr(nonce)).then(setHash);
  }, [nonce]);

  const prefix = "0".repeat(difficulty);
  const valid = hash.startsWith(prefix);

  const handleNonceChange = (v: string) => {
    const n = Math.max(0, parseInt(v) || 0);
    setNonceInput(String(n));
    setNonce(n);
    setFound(false);
    setAttempts(0);
  };

  const autoMine = useCallback(async () => {
    if (mining) { stopRef.current = true; return; }
    stopRef.current = false;
    setMining(true);
    setFound(false);
    setAttempts(0);
    
    let n = 0;
    let att = 0;
    const startTime = performance.now();
    const BATCH = difficulty >= 3 ? 200 : 50;

    while (!stopRef.current) {
      const promises = Array.from({ length: BATCH }, (_, i) =>
        sha256hex(blockStr(n + i)).then((h) => ({ n: n + i, h }))
      );
      const results = await Promise.all(promises);
      att += BATCH;
      
      const currentTime = performance.now();
      const elapsedSec = (currentTime - startTime) / 1000;
      if (elapsedSec > 0.5) {
        setHashRate(Math.floor(att / elapsedSec));
      }

      const hit = results.find((r) => r.h.startsWith(prefix));
      if (hit) {
        setNonce(hit.n);
        setNonceInput(String(hit.n));
        setHash(hit.h);
        setAttempts(att);
        setFound(true);
        setMining(false);
        setHashRate(0);
        // Reto completado: la persona lanzó el minado y el bloque queda sellado.
        sonar("logro");
        return;
      }
      
      n += BATCH;
      
      // Actualizamos UI solo a veces para no trabar el navegador,
      // pero dando la sensación visual de que cambia súper rápido.
      if (att % (BATCH * 2) === 0) {
        setNonceInput(String(results[BATCH - 1].n));
        setHash(results[BATCH - 1].h);
        setAttempts(att);
      }
      
      await new Promise((r) => setTimeout(r, 0));
    }
    setMining(false);
    setHashRate(0);
  }, [mining, prefix, difficulty]);

  const reset = () => {
    stopRef.current = true;
    setTimeout(() => {
      setMining(false);
      setNonce(0);
      setNonceInput("0");
      setFound(false);
      setAttempts(0);
      setHashRate(0);
    }, 60);
  };

  const zeros = hash.slice(0, difficulty);
  const rest = hash.slice(difficulty);

  return (
    <div className={`bc-mine${found ? " is-mined" : ""}`}>
      {/* Header */}
      <div className="bc-mine-cab">
        <div>
          <div className="bc-mine-titulo">
            <span className="bc-mine-titulo-ic" aria-hidden="true"><Cpu size={20} /></span> Simulador: mina tu propio bloque
          </div>
          <div className="bc-mine-sub">
            Cambia el nonce para cambiar el hash. El bloque será válido cuando el hash empiece por{" "}
            <code className="bc-mine-code">{prefix}...</code>
          </div>
        </div>
        <div className="bc-mine-dif">
          <span className="bc-mine-dif-lbl">Nivel de dificultad</span>
          {[1, 2, 3].map((d) => (
            <Tecla
              key={d}
              tamano="peq"
              color={difficulty === d ? "cielo" : "blanca"}
              aria-pressed={difficulty === d}
              onClick={() => { setDifficulty(d); reset(); }}
              disabled={mining}
            >
              {"0".repeat(d)}…
            </Tecla>
          ))}
        </div>
      </div>

      <div className="bc-mine-cuerpo">
        {/* Block card */}
        <div className="bc-mine-bloque">
          <div className="bc-mine-bloque-cab">
            Bloque #842.001
          </div>
          <div className="bc-mine-fila">
            <span className="bc-mine-k">Bloque anterior (el enlace a la cadena)</span>
            <code className="bc-mine-v bc-mine-v--hash">{PREV}</code>
          </div>
          <div className="bc-mine-fila">
            <span className="bc-mine-k">Transacciones incluidas</span>
            <div className="bc-mine-txs">
              {TXNS.map((t, i) => (
                <div key={i} className="bc-mine-tx">{t}</div>
              ))}
            </div>
          </div>
          <div className="bc-mine-fila">
            <label htmlFor={nonceId} className="bc-mine-k bc-mine-k--nonce">
              Nonce (El número mágico)
            </label>
            <input
              id={nonceId}
              className={`bc-mine-nonce${mining ? " is-mining" : ""}`}
              type="number"
              inputMode="numeric"
              autoComplete="off"
              value={nonceInput}
              min={0}
              disabled={mining}
              onChange={(e) => handleNonceChange(e.target.value)}
            />
          </div>
        </div>

        {/* Result panel */}
        <div className="bc-mine-resultado">
          <div className="bc-mine-hash-lbl">
            <Hash size={14} aria-hidden="true" /> SHA-256 RESULTANTE
          </div>
          <div className={`bc-mine-hash${valid ? " bc-mine-hash--ok" : ""}`}>
            {hash ? (
              <>
                <span className="bc-mine-ceros">{zeros}</span>
                <span className="bc-mine-resto">{rest}</span>
              </>
            ) : (
              <span className="bc-mine-resto">calculando…</span>
            )}
          </div>

          <div className={`bc-mine-estado${valid ? " ok" : " ko"}`} role="status">
            {valid ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
            {valid
              ? `¡Válido! El hash empieza por los ${difficulty} ceros requeridos.`
              : `Inválido. Necesitas que el hash empiece por ${prefix}`}
          </div>

          <div className="bc-mine-stats">
            <div className="bc-mine-stat">
              <span className="bc-mine-stat-lbl">Intentos realizados</span>
              <span className="bc-mine-stat-val">{attempts > 0 ? attempts.toLocaleString("es-ES") : "0"}</span>
            </div>
            <div className="bc-mine-stat">
              <span className="bc-mine-stat-lbl">Potencia de minado</span>
              <span className="bc-mine-stat-val">
                <Zap size={16} aria-hidden="true" />
                {mining ? `${hashRate.toLocaleString("es-ES")} H/s` : "0 H/s"}
              </span>
            </div>
          </div>

          {found && (
            <div className="bc-mine-hallado">
              <strong>¡Bloque sellado!</strong> El Nonce {nonce.toLocaleString("es-ES")} es la solución al puzle matemático. Acabas de ganar la recompensa de bloque.
            </div>
          )}

          <div className="bc-mine-acciones">
            <Tecla
              color={mining ? "coral" : "naranja"}
              onClick={autoMine}
            >
              {mining ? (
                <><RefreshCw size={16} className="bc-girar" aria-hidden="true" /> Detener minado</>
              ) : (
                <><Pickaxe size={16} aria-hidden="true" /> Iniciar auto-minado</>
              )}
            </Tecla>
            <Tecla color="blanca" onClick={reset}>
              Reiniciar
            </Tecla>
          </div>
        </div>
      </div>
    </div>
  );
}
