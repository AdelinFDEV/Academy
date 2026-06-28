"use client";
import { useEffect, useRef, useState } from "react";

const DEFI = [
  { label: "Lending", v: 28.4 },
  { label: "DEX", v: 19.1 },
  { label: "Liquid Staking", v: 12.3 },
  { label: "RWA", v: 8.8 },
  { label: "Otros", v: 3.2 },
];

const COLORS = ["#e6b455", "#ff6b2b", "#3a6090", "#2a4870", "#1e3558"];

export default function GuideDefiChart() {
  const max = Math.max(...DEFI.map((d) => d.v));
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTriggered(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="gbc-chart-wrap">
      <div className="gbc-chart-lbl">TVL por categoría DeFi — Miles de millones USD (Jun 2026)</div>
      <svg viewBox="0 0 480 140" style={{ width: "100%", display: "block" }} aria-label="Gráfica TVL DeFi por categoría">
        {DEFI.map((d, i) => {
          const fullW = (d.v / max) * 340;
          const barW = triggered ? fullW : 0;
          const y = 14 + i * 24;
          return (
            <g key={i}>
              <text x={0} y={y + 11} fontSize={11} fill="#8fa3b8">{d.label}</text>
              <rect
                x={96} y={y} width={barW} height={15} rx={4}
                fill={COLORS[i]} opacity={0.9}
                style={{ transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 120}ms` }}
              />
              <text
                x={96 + (triggered ? fullW : 0) + 6} y={y + 11}
                fontSize={10} fill={COLORS[i]} fontWeight="700"
                style={{ transition: `x 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 120}ms` }}
              >
                ${d.v}B
              </text>
            </g>
          );
        })}
      </svg>
      <div className="gbc-chart-src">Fuente: DeFiLlama, Junio 2026 — TVL total: $71.77B</div>
    </div>
  );
}
