"use client";

// Curva ilustrativa del ciclo 2024–2029 (forma del patrón, no cotizaciones reales).
// price está en miles de USD — solo para dar escala visual a la curva y a los ejes.
const CURVE: { x: number; price: number; lbl?: string; sub?: string; now?: boolean; dir?: "up" | "down" }[] = [
  { x: 0.00, price: 63, lbl: "Abr '24", sub: "Halving", dir: "down" },
  { x: 0.12, price: 82 },
  { x: 0.24, price: 105 },
  { x: 0.38, price: 126, lbl: "Pico del ciclo", sub: "finales 2025", dir: "up" },
  { x: 0.47, price: 96 },
  { x: 0.55, price: 76, lbl: "Ahora", sub: "mediados 2026", now: true, dir: "up" },
  { x: 0.65, price: 46, lbl: "Suelo estimado", sub: "$40K – $50K", dir: "down" },
  { x: 0.74, price: 62 },
  { x: 0.83, price: 88 },
  { x: 0.90, price: 112, lbl: "Halving '28", sub: "estimado", dir: "up" },
  { x: 1.00, price: 190, lbl: "Objetivo ciclo", sub: "$180K – $200K", dir: "up" },
];

const BANDS = [
  { from: 0.00, to: 0.38, label: "Alcista", tone: "gold" },
  { from: 0.38, to: 0.65, label: "Bajista · aquí", tone: "orange" },
  { from: 0.65, to: 0.83, label: "Recuperación", tone: "slate" },
  { from: 0.83, to: 0.90, label: "Pre-halving", tone: "amber" },
  { from: 0.90, to: 1.00, label: "Alcista", tone: "gold" },
];

const TONE_BG: Record<string, string> = {
  gold: "rgba(230,180,85,0.16)",
  orange: "rgba(255,107,43,0.18)",
  slate: "rgba(255,255,255,0.05)",
  amber: "rgba(255,133,82,0.14)",
};
const TONE_TEXT: Record<string, string> = {
  gold: "#e6b455",
  orange: "#ff8552",
  slate: "#8fa3b8",
  amber: "#ffab7a",
};
const LEGEND = [
  { label: "Alcista", tone: "gold" },
  { label: "Bajista", tone: "orange" },
  { label: "Recuperación", tone: "slate" },
  { label: "Pre-halving", tone: "amber" },
];

// Escala logarítmica: comprime los precios altos y da más lectura a la zona baja del ciclo.
const P_MIN = 30, P_MAX = 210;
const toFrac = (price: number) =>
  (Math.log(price) - Math.log(P_MIN)) / (Math.log(P_MAX) - Math.log(P_MIN));

const REF_LINES = [
  { price: 190, label: "$190K", sub: "objetivo" },
  { price: 125, label: "$125K", sub: "pico anterior" },
  { price: 45, label: "$45K", sub: "suelo" },
];

export default function GuideCycleChart() {
  const W = 720, H = 320;
  const pad = { l: 54, r: 14, t: 46, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const toXY = (x: number, price: number) => ({
    px: pad.l + x * innerW,
    py: pad.t + innerH - toFrac(price) * innerH,
  });

  const pathPts = CURVE.map((p) => ({ ...p, ...toXY(p.x, p.price) }));
  const line = pathPts.map((p) => `${p.px},${p.py}`).join(" ");
  const area =
    `M ${pathPts[0].px},${pathPts[0].py} ` +
    pathPts.map((p) => `L ${p.px},${p.py}`).join(" ") +
    ` L ${pad.l + innerW},${pad.t + innerH} L ${pad.l},${pad.t + innerH} Z`;

  const nowPt = pathPts.find((p) => p.now)!;

  return (
    <div className="gbc-chart-wrap gbc-cycle-wrap">
      <div className="gbc-chart-lbl">Modelo ilustrativo del ciclo del halving — no es una predicción exacta de precio</div>

      {/* Franja de fases — HTML, no SVG, para que nunca se corte el texto */}
      <div className="gbc-cycle-bands">
        {BANDS.map((b, i) => (
          <div
            key={i}
            className="gbc-cycle-band"
            style={{
              flexBasis: `${(b.to - b.from) * 100}%`,
              background: TONE_BG[b.tone],
              color: TONE_TEXT[b.tone],
            }}
          >
            {b.label}
          </div>
        ))}
      </div>

      <div className="gbc-cycle-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Gráfica ilustrativa del ciclo de Bitcoin 2024-2029">
          <defs>
            <linearGradient id="cycleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6b455" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#e6b455" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b2b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff6b2b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Líneas de referencia de precio */}
          {REF_LINES.map((r, i) => {
            const y = pad.t + innerH - toFrac(r.price) * innerH;
            return (
              <g key={i}>
                <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
                <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize={10} fontWeight={700} fill="#7f93a8">{r.label}</text>
              </g>
            );
          })}

          {/* Resaltado vertical "ahora" */}
          <rect x={nowPt.px - 14} y={pad.t} width={28} height={innerH} fill="url(#nowGrad)" />
          <line x1={nowPt.px} y1={pad.t} x2={nowPt.px} y2={pad.t + innerH} stroke="#ff6b2b" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* Curva */}
          <path d={area} fill="url(#cycleGrad)" />
          <polyline points={line} fill="none" stroke="#e6b455" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

          {/* Puntos + etiquetas, alternando arriba/abajo para no chocar */}
          {pathPts.filter((p) => p.lbl).map((p, i) => {
            const above = p.dir !== "down";
            const ly1 = above ? p.py - 14 : p.py + 20;
            const ly2 = above ? p.py - 4 : p.py + 30;
            const anchor = p.x < 0.06 ? "start" : p.x > 0.94 ? "end" : "middle";
            return (
              <g key={i}>
                <line x1={p.px} y1={p.py} x2={p.px} y2={above ? p.py - 10 : p.py + 10} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
                <circle cx={p.px} cy={p.py} r={p.now ? 5 : 4} fill={p.now ? "#ff6b2b" : "#fff"} stroke={p.now ? "#060f1f" : "#e6b455"} strokeWidth={1.6} />
                <text x={p.px} y={ly1} textAnchor={anchor} fontSize={11} fontWeight={700} fill={p.now ? "#ff8552" : "#fff"}>{p.lbl}</text>
                {p.sub && <text x={p.px} y={ly2} textAnchor={anchor} fontSize={9.5} fill="#8fa3b8">{p.sub}</text>}
              </g>
            );
          })}

          {/* Eje de años */}
          {["2024", "2025", "2026", "2027", "2028", "2029"].map((yr, i) => {
            const x = pad.l + (i / 5) * innerW;
            return (
              <text key={yr} x={x} y={H - 12} textAnchor="middle" fontSize={10} fill="#5c7185">{yr}</text>
            );
          })}
        </svg>
      </div>

      {/* Leyenda de fases */}
      <div className="gbc-cycle-legend">
        {LEGEND.map((l) => (
          <div key={l.label} className="gbc-cycle-legend-item">
            <span className="gbc-cycle-legend-dot" style={{ background: TONE_TEXT[l.tone] }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="gbc-chart-src">Esquema propio inspirado en el patrón histórico de ciclos del halving. Fechas y precios son estimaciones, no garantías.</div>
    </div>
  );
}
