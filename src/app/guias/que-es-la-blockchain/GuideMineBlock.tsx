"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pickaxe, Hash, CheckCircle2, XCircle, Zap, RefreshCw, Cpu } from "lucide-react";

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
    let startTime = performance.now();
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
    <div className={`gbc-mine-wrap ${found ? 'is-mined' : ''}`}>
      {/* Header */}
      <div className="gbc-mine-header">
        <div>
          <div className="gbc-mine-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} /> Simulador: Mina tu propio Bloque
          </div>
          <div className="gbc-mine-sub">
            Modifica el Nonce para cambiar el Hash. El bloque será válido cuando el Hash empiece por{" "}
            <code className="gbc-mine-code">{prefix}...</code>
          </div>
        </div>
        <div className="gbc-mine-diff">
          <span className="gbc-mine-diff-lbl">Nivel de Dificultad</span>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              className={`gbc-diff-btn${difficulty === d ? " active" : ""}`}
              onClick={() => { setDifficulty(d); reset(); }}
              disabled={mining}
            >
              {"0".repeat(d)}…
            </button>
          ))}
        </div>
      </div>

      <div className="gbc-mine-body">
        {/* Block card */}
        <div className="gbc-mine-block">
          <div className="gbc-mine-block-hd" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Bloque #842.001
          </div>
          <div className="gbc-mine-row">
            <span className="gbc-mine-k">Bloque anterior (Link a la cadena)</span>
            <code className="gbc-mine-v gbc-mine-v--hash">{PREV}</code>
          </div>
          <div className="gbc-mine-row gbc-mine-row--txs">
            <span className="gbc-mine-k">Transacciones incluidas</span>
            <div className="gbc-mine-txs">
              {TXNS.map((t, i) => (
                <div key={i} className="gbc-mine-tx">{t}</div>
              ))}
            </div>
          </div>
          <div className="gbc-mine-row gbc-mine-row--nonce">
            <span className="gbc-mine-k" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gold)' }}>
              Nonce (El número mágico)
            </span>
            <input
              className={`gbc-mine-nonce-inp ${mining ? 'is-mining' : ''}`}
              type="number"
              value={nonceInput}
              min={0}
              disabled={mining}
              onChange={(e) => handleNonceChange(e.target.value)}
            />
          </div>
        </div>

        {/* Result panel */}
        <div className="gbc-mine-result">
          <div className="gbc-mine-hash-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hash size={14} /> SHA-256 RESULTANTE
          </div>
          <div className={`gbc-mine-hash${valid ? " gbc-mine-hash--ok" : ""}`}>
            {hash ? (
              <>
                <span className="gbc-hash-zeros">{zeros}</span>
                <span className="gbc-hash-rest">{rest}</span>
              </>
            ) : (
              <span className="gbc-hash-rest">calculando…</span>
            )}
          </div>
          
          <div className={`gbc-mine-status${valid ? " ok" : " ko"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {valid
              ? `¡VÁLIDO! El hash empieza por los ${difficulty} ceros requeridos.`
              : `Inválido. Necesitas que el hash empiece por ${prefix}`}
          </div>

          <div className="gbc-mine-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div className="gbc-mine-stat-box">
              <span className="stat-label">Intentos realizados</span>
              <span className="stat-value">{attempts > 0 ? attempts.toLocaleString("es-ES") : "0"}</span>
            </div>
            <div className="gbc-mine-stat-box">
              <span className="stat-label">Poder de Minado</span>
              <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="var(--gold)" />
                {mining ? `${hashRate.toLocaleString("es-ES")} H/s` : "0 H/s"}
              </span>
            </div>
          </div>

          {found && (
            <div className="gbc-mine-found" style={{ marginTop: '10px' }}>
              <strong>¡Bloque sellado!</strong> El Nonce {nonce.toLocaleString("es-ES")} es la solución al puzle matemático. Acabas de ganar la recompensa de bloque.
            </div>
          )}

          <div className="gbc-mine-actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              className={`gbc-mine-btn${mining ? " gbc-mine-btn--stop" : ""}`}
              onClick={autoMine}
            >
              {mining ? (
                <><RefreshCw size={16} className="spin-anim" /> Detener Minado</>
              ) : (
                <><Pickaxe size={16} /> Iniciar Auto-minar</>
              )}
            </button>
            <button className="gbc-mine-btn gbc-mine-btn--ghost" onClick={reset}>
              Reiniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
