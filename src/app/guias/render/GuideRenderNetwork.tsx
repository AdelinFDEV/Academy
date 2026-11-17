"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, RotateCcw, Cpu } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

// Simulador didáctico: una imagen 3D se divide en tiles y la red los reparte
// entre varias GPUs ociosas que renderizan en paralelo. Ilustra por qué el
// renderizado distribuido es mucho más rápido que una sola máquina.

const COLS = 8;
const ROWS = 6;
const TOTAL = COLS * ROWS;
const NODES = [
  { id: 1, color: "#2fbff5" },
  { id: 2, color: "#ff8a1f" },
  { id: 3, color: "#8f7cff" },
  { id: 4, color: "#2fc488" },
];

// Paleta de "profundidad" para simular una escena 3D renderizada: tonos del
// cielo del cuaderno, más claros en el centro de la escena.
function tileHue(i: number) {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  const d = Math.sqrt((x - COLS / 2) ** 2 + (y - ROWS / 2) ** 2) / (COLS / 1.4);
  const light = 52 + (1 - Math.min(d, 1)) * 32;
  return `hsl(198, 82%, ${light}%)`;
}

// Tile pendiente: el gris del cuaderno (--gris), en hex porque framer-motion
// interpola colores y no sabe interpolar var().
const PENDIENTE = "#e2e5f4";
const PENDIENTE_BORDE = "#c1c6dc";

export default function GuideRenderNetwork() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [rendered, setRendered] = useState<number[]>([]); // node id por tile, 0 = pendiente
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const quieto = useReducedMotion();

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
          // Fin del trabajo que lanzó la persona.
          sonar("avance");
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
        <div className="render-canvas" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
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
                  backgroundColor: filled ? tileHue(i) : PENDIENTE,
                  boxShadow: filled ? `inset 0 0 0 2.5px ${nodeColor}` : `inset 0 -2px 0 ${PENDIENTE_BORDE}`,
                  scale: filled ? 1 : 0.9,
                }}
                transition={quieto ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 18 }}
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
                <span className="render-node-dot" style={{ background: n.color, boxShadow: active ? `0 0 0 4px ${n.color}40` : "none" }} />
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
          <Tecla color="naranja" onClick={start}>
            <Play size={16} aria-hidden="true" />
            {done ? "Renderizar de nuevo" : "Lanzar el trabajo de render"}
          </Tecla>
        ) : (
          <Tecla color="naranja" disabled>
            Renderizando {doneCount}/{TOTAL} tiles…
          </Tecla>
        )}
        {(done || running) && (
          <Tecla color="blanca" tamano="peq" onClick={reset}>
            <RotateCcw size={14} aria-hidden="true" /> Reiniciar
          </Tecla>
        )}
      </div>
    </div>
  );
}
