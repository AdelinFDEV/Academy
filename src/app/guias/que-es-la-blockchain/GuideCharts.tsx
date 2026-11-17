"use client";

const ADOPTION = [
  { yr: "2016", v: 0.8 },
  { yr: "2017", v: 6.2 },
  { yr: "2018", v: 8.1 },
  { yr: "2019", v: 11 },
  { yr: "2020", v: 18 },
  { yr: "2021", v: 42 },
  { yr: "2022", v: 55 },
  { yr: "2023", v: 88 },
  { yr: "2024", v: 150 },
  { yr: "2025", v: 240 },
  { yr: "2026", v: 350 },
];

const MARKET = [
  { label: "Bitcoin", pct: 52, color: "#ff8a1f" },
  { label: "Ethereum", pct: 18, color: "#8f7cff" },
  { label: "Stablecoins", pct: 10, color: "#2fc488" },
  { label: "Altcoins", pct: 20, color: "#2fbff5" },
];

// (El array DEFI vivía aquí, sin usarse: su copia real y en uso está en
//  GuideDefiChart.tsx, que es quien pinta ese gráfico.)

function AdoptionChart() {
  const max = Math.max(...ADOPTION.map((d) => d.v));
  // Letra de 12 en un lienzo de 520: en el móvil el dibujo mide al menos
  // 500 px (se desliza dentro de su caja) y los ejes siguen leyéndose.
  const W = 520, H = 180, pad = { l: 36, r: 12, t: 12, b: 30 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const pts = ADOPTION.map((d, i) => {
    const x = pad.l + (i / (ADOPTION.length - 1)) * innerW;
    const y = pad.t + innerH - (d.v / max) * innerH;
    return `${x},${y}`;
  }).join(" ");
  const area = `M ${pts.split(" ")[0]} L ${pts.split(" ").join(" L ")} L ${pad.l + innerW},${pad.t + innerH} L ${pad.l},${pad.t + innerH} Z`;

  return (
    <div className="gbc-chart-wrap">
      <div className="gbc-chart-lbl">Usuarios activos en blockchain (millones estimados)</div>
      <div className="bc-svg-scroll">
      <svg className="bc-svg bc-svg--ancha" role="img" viewBox={`0 0 ${W} ${H}`} aria-label="Gráfica de adopción blockchain 2016-2026">
        <path d={area} fill="#d9f3fd" />
        <polyline points={pts} fill="none" stroke="#2fbff5" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        {ADOPTION.map((d, i) => {
          const x = pad.l + (i / (ADOPTION.length - 1)) * innerW;
          const y = pad.t + innerH - (d.v / max) * innerH;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill="#ffffff" stroke="#0e709b" strokeWidth={2.5} />
              {i % 2 === 0 && (
                <text x={x} y={H - 6} textAnchor="middle" fontSize={12} fill="#5f5c7d">{d.yr}</text>
              )}
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH - t * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e2e5f4" strokeWidth={1.5} />
              <text x={pad.l - 5} y={y + 4} textAnchor="end" fontSize={12} fill="#5f5c7d">{Math.round(t * max)}</text>
            </g>
          );
        })}
      </svg>
      </div>
      <div className="gbc-chart-src">Fuentes: Chainalysis, Triple-A, CryptoSlate 2026</div>
    </div>
  );
}

function MarketChart() {
  const R = 88, cx = 200, cy = 108;
  const START = -Math.PI / 2; // arriba del todo (12 en punto)

  // El ángulo de inicio de cada porción se calcula sumando las anteriores, en
  // lugar de acumular sobre una variable externa dentro del .map(). Mutar una
  // variable del cuerpo del componente desde un callback impide que el React
  // Compiler memoice el resultado con seguridad, y es lo que hace saltar la
  // regla "Cannot reassign variable after render completes".
  const slices = MARKET.map((m, i) => {
    const start = START + MARKET.slice(0, i).reduce((acc, prev) => acc + (prev.pct / 100) * 2 * Math.PI, 0);
    const sweep = (m.pct / 100) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(start + sweep), y2 = cy + R * Math.sin(start + sweep);
    return { ...m, x1, y1, x2, y2, large: sweep > Math.PI ? 1 : 0 };
  });

  return (
    <div className="gbc-chart-wrap">
      <div className="gbc-chart-lbl">Distribución capitalización de mercado — Junio 2026</div>
      {/* Solo el donut va en el dibujo; la leyenda es HTML, para que en el móvil
          no encoja con él hasta los 8 px. */}
      <svg
        className="bc-svg bc-donut"
        role="img"
        viewBox="104 12 192 192"
        aria-label="Gráfica de distribución de mercado crypto"
      >
        {/* Donut slices */}
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${R},${R} 0 ${s.large},1 ${s.x2},${s.y2} Z`}
            fill={s.color}
            stroke="#ffffff"
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ))}
        {/* Inner hole */}
        <circle cx={cx} cy={cy} r={R * 0.53} fill="#ffffff" />
        {/* Center labels */}
        <text className="bc-svg-cifra" x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fill="#1d1b33" fontWeight="800">$2.17T</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9.5} fill="#5f5c7d">market cap global</text>
      </svg>
      <ul className="bc-leyenda">
        {MARKET.map((m) => (
          <li key={m.label} className="bc-leyenda-item">
            <span className="bc-leyenda-muestra" style={{ background: m.color }} aria-hidden="true" />
            <span className="bc-leyenda-nombre">{m.label}</span>
            <span className="bc-leyenda-pct">{m.pct}%</span>
          </li>
        ))}
      </ul>
      <div className="gbc-chart-src">Fuente: CoinMarketCap, Junio 2026</div>
    </div>
  );
}


export default function GuideCharts({ chart }: { chart: "adoption" | "market" }) {
  if (chart === "adoption") return <AdoptionChart />;
  return <MarketChart />;
}
