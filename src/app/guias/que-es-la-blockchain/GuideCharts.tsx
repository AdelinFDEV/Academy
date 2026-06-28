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
  { label: "Bitcoin", pct: 52, color: "#e6b455" },
  { label: "Ethereum", pct: 18, color: "#ff6b2b" },
  { label: "Stablecoins", pct: 10, color: "#4a6080" },
  { label: "Altcoins", pct: 20, color: "#2a4060" },
];

const DEFI = [
  { label: "Lending", v: 28.4 },
  { label: "DEX", v: 19.1 },
  { label: "Liquid Staking", v: 12.3 },
  { label: "RWA", v: 8.8 },
  { label: "Otros", v: 3.2 },
];

function AdoptionChart() {
  const max = Math.max(...ADOPTION.map((d) => d.v));
  const W = 560, H = 160, pad = { l: 36, r: 10, t: 10, b: 30 };
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
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Gráfica de adopción blockchain 2016-2026">
        <defs>
          <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6b455" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e6b455" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#aGrad)" />
        <polyline points={pts} fill="none" stroke="#e6b455" strokeWidth="2" strokeLinejoin="round" />
        {ADOPTION.map((d, i) => {
          const x = pad.l + (i / (ADOPTION.length - 1)) * innerW;
          const y = pad.t + innerH - (d.v / max) * innerH;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={3} fill="#e6b455" />
              {i % 2 === 0 && (
                <text x={x} y={H - 6} textAnchor="middle" fontSize={9} fill="#4a6080">{d.yr}</text>
              )}
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH - t * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(255,255,255,0.04)" />
              <text x={pad.l - 3} y={y + 3} textAnchor="end" fontSize={9} fill="#4a6080">{Math.round(t * max)}</text>
            </g>
          );
        })}
      </svg>
      <div className="gbc-chart-src">Fuentes: Chainalysis, Triple-A, CryptoSlate 2026</div>
    </div>
  );
}

function MarketChart() {
  const R = 88, cx = 200, cy = 108;
  let angle = -Math.PI / 2;
  const slices = MARKET.map((m) => {
    const start = angle;
    const sweep = (m.pct / 100) * 2 * Math.PI;
    angle += sweep;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(start + sweep), y2 = cy + R * Math.sin(start + sweep);
    return { ...m, x1, y1, x2, y2, large: sweep > Math.PI ? 1 : 0 };
  });

  // Legend: 2 columns of 2 items
  const LEG_Y = 220, COL_W = 180, PAD_X = 20;

  return (
    <div className="gbc-chart-wrap" style={{ textAlign: "center" }}>
      <div className="gbc-chart-lbl">Distribución capitalización de mercado — Junio 2026</div>
      <svg
        viewBox="0 0 400 270"
        style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }}
        aria-label="Gráfica de distribución de mercado crypto"
      >
        {/* Donut slices */}
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${R},${R} 0 ${s.large},1 ${s.x2},${s.y2} Z`}
            fill={s.color}
            stroke="#060f1f"
            strokeWidth={3}
          />
        ))}
        {/* Inner hole */}
        <circle cx={cx} cy={cy} r={R * 0.53} fill="#060f1f" />
        {/* Center labels */}
        <text x={cx} y={cy - 9} textAnchor="middle" fontSize={16} fill="#e6b455" fontWeight="800">$2.17T</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="#8fa3b8">market cap global</text>

        {/* Divider */}
        <line x1={PAD_X} y1={LEG_Y - 12} x2={400 - PAD_X} y2={LEG_Y - 12} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

        {/* Legend 2x2 */}
        {MARKET.map((m, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const lx = PAD_X + col * COL_W;
          const ly = LEG_Y + row * 24;
          return (
            <g key={i}>
              <rect x={lx} y={ly - 9} width={11} height={11} rx={3} fill={m.color} />
              <text x={lx + 16} y={ly} fontSize={11} fill="#dce8f8">{m.label}</text>
              <text x={lx + 16 + 80} y={ly} fontSize={11} fill={m.color} fontWeight="700">{m.pct}%</text>
            </g>
          );
        })}
      </svg>
      <div className="gbc-chart-src">Fuente: CoinMarketCap, Junio 2026</div>
    </div>
  );
}


export default function GuideCharts({ chart }: { chart: "adoption" | "market" }) {
  if (chart === "adoption") return <AdoptionChart />;
  return <MarketChart />;
}
