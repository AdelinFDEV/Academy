"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Cpu } from "lucide-react";

// Simulador didáctico: una imagen 3D se divide en tiles y la red los reparte
// entre varias GPUs ociosas que renderizan en paralelo. Ilustra por qué el
// renderizado distribuido es mucho más rápido que una sola máquina.

const COLS = 8;
const ROWS = 6;
const TOTAL = COLS * ROWS;
const NODES = [
  { id: 1, color: "#e6b455" },
  { id: 2, color: "#ff6b2b" },
  { id: 3, color: "#4ade80" },
  { id: 4, color: "#5aa9ff" },
];

// Paleta de "profundidad" para simular una escena 3D renderizada.
function tileHue(i: number) {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  const d = Math.sqrt((x - COLS / 2) ** 2 + (y - ROWS / 2) ** 2) / (COLS / 1.4);
  const light = 22 + (1 - Math.min(d, 1)) * 30;
  return `hsl(214, 45%, ${light}%)`;
}

export default function GuideRenderNetwork() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [rendered, setRendered] = useState<number[]>([]); // node id por tile, 0 = pendiente
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Asignación de cada tile a una GPU (round-robin barajado para que "salpique").
  const assignment = useMemo(() => {
    const order = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor((Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const map: Record<number, number> = {};
    order.forEach((tile, k) => { map[tile] = NODES[k % NODES.length].id; });
    return map;
  }, []);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const start = () => {
    clearTimers();
    setRunning(true);
    setDone(false);
    setRendered(Array(TOTAL).fill(0));
    setElapsed(0);

    const order = Array.from({ length: TOTAL }, (_, i) => i)
      .sort((a, b) => (Math.sin(a * 78.233) - Math.sin(b * 78.233)));

    order.forEach((tile, k) => {
      const t = setTimeout(() => {
        setRendered((prev) => {
          const next = [...prev];
          next[tile] = assignment[tile];
          return next;
        });
        setElapsed((k + 1) / TOTAL);
        if (k === order.length - 1) {
          setRunning(false);
          setDone(true);
        }
      }, 120 + k * 45);
      timers.current.push(t);
    });
  };

  const reset = () => {
    clearTimers();
    setRunning(false);
    setDone(false);
    setRendered([]);
    setElapsed(0);
  };

  useEffect(() => () => clearTimers(), []);

  const doneCount = rendered.filter((n) => n > 0).length;
  const nodeLoad = NODES.map((n) => rendered.filter((r) => r === n.id).length);

  return (
    <div className="render-sim">
      <div className="render-sim-head">
        <span className="render-sim-eyebrow">
          <Cpu size={13} aria-hidden="true" /> Simulador · renderizado distribuido
        </span>
        <span className="render-sim-progress">
          {done ? "Render completo" : running ? `Renderizando… ${Math.round(elapsed * 100)}%` : `${TOTAL} tiles pendientes`}
        </span>
      </div>

      <div className="render-sim-body">
        {/* Lienzo de tiles */}
        <div className="render-canvas" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: TOTAL }).map((_, i) => {
            const node = rendered[i] ?? 0;
            const nodeColor = NODES.find((n) => n.id === node)?.color;
            const filled = node > 0;
            return (
              <motion.div
                key={i}
                className="render-tile"
                initial={false}
                animate={{
                  backgroundColor: filled ? tileHue(i) : "rgba(255,255,255,0.03)",
                  boxShadow: filled ? `inset 0 0 0 1.5px ${nodeColor}` : "inset 0 0 0 1px rgba(255,255,255,0.05)",
                  scale: filled ? 1 : 0.9,
                }}
                transition={{ duration: 0.25 }}
              />
            );
          })}
        </div>

        {/* GPUs de la red */}
        <div className="render-nodes">
          <div className="render-nodes-title">GPUs ociosas en la red</div>
          {NODES.map((n, idx) => {
            const load = nodeLoad[idx];
            const active = running && load > 0 && !done;
            return (
              <div key={n.id} className={`render-node${active ? " is-active" : ""}`}>
                <span className="render-node-dot" style={{ background: n.color, boxShadow: active ? `0 0 10px ${n.color}` : "none" }} />
                <span className="render-node-name">GPU #{n.id}</span>
                <span className="render-node-load">{load} tiles</span>
              </div>
            );
          })}
          <div className="render-nodes-foot">
            Cada GPU renderiza su parte <strong>en paralelo</strong> — por eso la red termina en una fracción del tiempo que tardaría una sola máquina.
          </div>
        </div>
      </div>

      <div className="render-sim-actions">
        {!running ? (
          <button className="gbc-quiz-btn" onClick={start}>
            <Play size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            {done ? "Renderizar de nuevo" : "Lanzar el trabajo de render"}
          </button>
        ) : (
          <button className="gbc-quiz-btn" disabled>
            Renderizando {doneCount}/{TOTAL} tiles…
          </button>
        )}
        {(done || running) && (
          <button className="render-sim-reset" onClick={reset}>
            <RotateCcw size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}
