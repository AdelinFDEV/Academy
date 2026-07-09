"use client";
import { useEffect, useRef, useState } from "react";

const ALLOCATION = [
  { label: "Comunidad (grants humanos)", v: 75, color: "#e6b455" },
  { label: "Tools for Humanity (equipo)", v: 13.5, color: "#ff6b2b" },
  { label: "Inversores", v: 9.8, color: "#3a6090" },
  { label: "Worldcoin Foundation", v: 1.7, color: "#2a4870" },
];

export default function GuideWorldTokenomics() {
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const r = 60;
  const circ = 2 * Math.PI * r;

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

  const { segments } = ALLOCATION.reduce<{ total: number; segments: Array<typeof ALLOCATION[number] & { dash: number; offset: number }> }>(
    (state, a) => {
      const dash = (a.v / 100) * circ;
      const offset = circ - (state.total / 100) * circ;
      return {
        total: state.total + a.v,
        segments: [...state.segments, { ...a, dash, offset }],
      };
    },
    { total: 0, segments: [] }
  );

  return (
    <div ref={ref} className="gbc-chart-wrap">
      <div className="gbc-chart-lbl">Distribución del suministro de WLD — 10.000 millones de tokens (tope máximo)</div>
      <div className="tokenomics-donut-wrap">
        <svg width="160" height="160" viewBox="0 0 160 160" aria-label="Distribución del suministro de WLD">
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(240,244,255,0.06)" strokeWidth="18" />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="80" cy="80" r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${triggered ? s.dash : 0} ${circ}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "80px 80px",
                transition: `stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1) ${i * 150}ms`,
              }}
            />
          ))}
          <text x="80" y="76" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">10B</text>
          <text x="80" y="94" textAnchor="middle" fontSize="10" fill="#8fa3b8">WLD tope máximo</text>
        </svg>
        <div className="tokenomics-legend">
          {ALLOCATION.map((a) => (
            <div key={a.label} className="tokenomics-legend-row">
              <span className="tokenomics-legend-dot" style={{ background: a.color }} />
              <span className="tokenomics-legend-label">{a.label}</span>
              <span className="tokenomics-legend-val">{a.v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="gbc-chart-src">Fuente: Worldcoin Foundation — distribución planificada a ~15 años</div>
    </div>
  );
}
