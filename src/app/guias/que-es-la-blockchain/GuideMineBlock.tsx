"use client";
import { useCallback, useEffect, useRef, useState } from "react";

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
    const BATCH = difficulty >= 3 ? 100 : 30;
    while (!stopRef.current) {
      const promises = Array.from({ length: BATCH }, (_, i) =>
        sha256hex(blockStr(n + i)).then((h) => ({ n: n + i, h }))
      );
      const results = await Promise.all(promises);
      att += BATCH;
      const hit = results.find((r) => r.h.startsWith(prefix));
      if (hit) {
        setNonce(hit.n);
        setNonceInput(String(hit.n));
        setHash(hit.h);
        setAttempts(att);
        setFound(true);
        setMining(false);
        return;
      }
      n += BATCH;
      setNonce(results[BATCH - 1].n);
      setNonceInput(String(results[BATCH - 1].n));
      setHash(results[BATCH - 1].h);
      setAttempts(att);
      await new Promise((r) => setTimeout(r, 0));
    }
    setMining(false);
  }, [mining, prefix, difficulty]);

  const reset = () => {
    stopRef.current = true;
    setTimeout(() => {
      setMining(false);
      setNonce(0);
      setNonceInput("0");
      setFound(false);
      setAttempts(0);
    }, 60);
  };

  const zeros = hash.slice(0, difficulty);
  const rest = hash.slice(difficulty);

  return (
    <div className="gbc-mine-wrap">
      {/* Header */}
      <div className="gbc-mine-header">
        <div>
          <div className="gbc-mine-title">Simulador: mina un bloque</div>
          <div className="gbc-mine-sub">
            El minero prueba nonces hasta que el hash empieza por{" "}
            <code className="gbc-mine-code">{prefix}...</code>
          </div>
        </div>
        <div className="gbc-mine-diff">
          <span className="gbc-mine-diff-lbl">Dificultad</span>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              className={`gbc-diff-btn${difficulty === d ? " active" : ""}`}
              onClick={() => { setDifficulty(d); reset(); }}
            >
              {"0".repeat(d)}…
            </button>
          ))}
        </div>
      </div>

      <div className="gbc-mine-body">
        {/* Block card */}
        <div className="gbc-mine-block">
          <div className="gbc-mine-block-hd">Bloque #842.001</div>
          <div className="gbc-mine-row">
            <span className="gbc-mine-k">Bloque anterior</span>
            <code className="gbc-mine-v gbc-mine-v--hash">{PREV}</code>
          </div>
          <div className="gbc-mine-row gbc-mine-row--txs">
            <span className="gbc-mine-k">Transacciones</span>
            <div className="gbc-mine-txs">
              {TXNS.map((t, i) => (
                <div key={i} className="gbc-mine-tx">{t}</div>
              ))}
            </div>
          </div>
          <div className="gbc-mine-row gbc-mine-row--nonce">
            <span className="gbc-mine-k">Nonce</span>
            <input
              className="gbc-mine-nonce-inp"
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
          <div className="gbc-mine-hash-lbl">SHA-256 del bloque</div>
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
          <div className={`gbc-mine-status${valid ? " ok" : " ko"}`}>
            {valid
              ? `✓ HASH VÁLIDO — empieza por ${prefix}`
              : `✗ No válido — necesita empezar por ${prefix}`}
          </div>

          {attempts > 0 && (
            <div className="gbc-mine-att">
              {attempts.toLocaleString("es-ES")} intentos
            </div>
          )}

          {found && (
            <div className="gbc-mine-found">
              Nonce <strong>{nonce.toLocaleString("es-ES")}</strong> produce un hash válido.
              Así es exactamente como funciona la minería de Bitcoin.
            </div>
          )}

          <div className="gbc-mine-actions">
            <button
              className={`gbc-mine-btn${mining ? " gbc-mine-btn--stop" : ""}`}
              onClick={autoMine}
            >
              {mining ? "⏹ Detener" : "⛏ Auto-minar"}
            </button>
            <button className="gbc-mine-btn gbc-mine-btn--ghost" onClick={reset}>
              Reiniciar
            </button>
          </div>

          <div className="gbc-mine-legend">
            <span className="gbc-mine-leg-z">■</span> ceros requeridos
            <span className="gbc-mine-leg-r">■</span> resto del hash
          </div>
        </div>
      </div>
    </div>
  );
}
