"use client";
import { useEffect, useRef, useState } from "react";

const ALLOCATION = [
  { label: "Comunidad (grants humanos)", v: 75, color: "#2fbff5" },
  { label: "Tools for Humanity (equipo)", v: 13.5, color: "#ff8a1f" },
  { label: "Inversores", v: 9.8, color: "#8f7cff" },
  { label: "Worldcoin Foundation", v: 1.7, color: "#ffd23f" },
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
      <div className="wld-tok">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Distribución del suministro de WLD">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#e2e5f4" strokeWidth="18" />
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
              className="wld-tok-arco"
              style={{ transitionDelay: `${i * 150}ms` }}
            />
          ))}
          <text x="80" y="78" textAnchor="middle" className="wld-tok-cifra">10B</text>
          <text x="80" y="96" textAnchor="middle" className="wld-tok-unidad">WLD tope máximo</text>
        </svg>
        <div className="wld-tok-leyenda">
          {ALLOCATION.map((a) => (
            <div key={a.label} className="wld-tok-fila">
              <span className="wld-tok-punto" style={{ background: a.color }} aria-hidden="true" />
              <span className="wld-tok-nombre">{a.label}</span>
              <span className="wld-tok-valor">{a.v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="gbc-chart-src">Fuente: Worldcoin Foundation — distribución planificada a ~15 años</div>
    </div>
  );
}
