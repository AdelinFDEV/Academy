"use client";

import { useEffect, useRef, useState } from "react";

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
const fromFrac = (frac: number) =>
  Math.exp(Math.log(P_MIN) + frac * (Math.log(P_MAX) - Math.log(P_MIN)));

const REF_LINES = [
  { price: 190, label: "$190K", sub: "objetivo" },
  { price: 125, label: "$125K", sub: "pico anterior" },
  { price: 45, label: "$45K", sub: "suelo" },
];

// El eje temporal va de abr 2024 (x=0) a 2029 (x=1)
const YEAR_START = 2024.29, YEAR_END = 2029;
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
function dateAt(x: number) {
  const v = YEAR_START + x * (YEAR_END - YEAR_START);
  const y = Math.floor(v);
  const m = Math.min(11, Math.floor((v - y) * 12));
  return `${MONTHS[m]} ${y}`;
}

// Catmull-Rom → cubic bezier: curva suave que pasa por todos los puntos
function smoothPath(pts: { px: number; py: number }[]) {
  let d = `M ${pts[0].px},${pts[0].py}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.px + (p2.px - p0.px) / 6;
    const c1y = p1.py + (p2.py - p0.py) / 6;
    const c2x = p2.px - (p3.px - p1.px) / 6;
    const c2y = p2.py - (p3.py - p1.py) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.px},${p2.py}`;
  }
  return d;
}

// Punto de la curva más cercano a una coordenada x (búsqueda binaria sobre la longitud del path)
function pointAtX(path: SVGPathElement, targetX: number) {
  const len = path.getTotalLength();
  let lo = 0, hi = len;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < targetX) lo = mid;
    else hi = mid;
  }
  return path.getPointAtLength((lo + hi) / 2);
}

type Hover = { px: number; py: number; price: number; date: string; band: typeof BANDS[0] } | null;

export default function GuideCycleChart() {
  const W = 720, H = 320;
  const pad = { l: 54, r: 14, t: 46, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [hoverBand, setHoverBand] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  const toXY = (x: number, price: number) => ({
    px: pad.l + x * innerW,
    py: pad.t + innerH - toFrac(price) * innerH,
  });

  const pathPts = CURVE.map((p) => ({ ...p, ...toXY(p.x, p.price) }));
  const lineD = smoothPath(pathPts);
  const areaD = `${lineD} L ${pad.l + innerW},${pad.t + innerH} L ${pad.l},${pad.t + innerH} Z`;
  const nowPt = pathPts.find((p) => p.now)!;

  // Animación de dibujado al entrar en pantalla
  useEffect(() => {
    const path = lineRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const len = path.getTotalLength();
    if (!reduced) {
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        if (!reduced) {
          path.style.transition = "stroke-dashoffset 2.4s cubic-bezier(0.45, 0, 0.2, 1)";
          // forzar reflow para que la transición arranque
          path.getBoundingClientRect();
          path.style.strokeDashoffset = "0";
        }
        setDrawn(true);
      },
      { threshold: 0.35 }
    );
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current, path = lineRef.current;
    if (!svg || !path) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const cx = Math.min(pad.l + innerW, Math.max(pad.l, sx));
    const pt = pointAtX(path, cx);
    const frac = (pad.t + innerH - pt.y) / innerH;
    const dataX = (cx - pad.l) / innerW;
    const band = BANDS.find((b) => dataX >= b.from && dataX <= b.to) ?? BANDS[BANDS.length - 1];
    setHover({ px: pt.x, py: pt.y, price: fromFrac(frac), date: dateAt(dataX), band });
  };

  const tooltipFlip = hover ? hover.px > W - 150 : false;

  return (
    <div className="gbc-chart-wrap gbc-cycle-wrap" ref={wrapRef}>
      <div className="gbc-chart-lbl">Modelo ilustrativo del ciclo del halving — no es una predicción exacta de precio</div>

      {/* Franja de fases — HTML, no SVG, para que nunca se corte el texto */}
      <div className="gbc-cycle-bands">
        {BANDS.map((b, i) => (
          <div
            key={i}
            className={`gbc-cycle-band${hoverBand === i ? " is-hot" : ""}`}
            style={{
              flexBasis: `${(b.to - b.from) * 100}%`,
              background: TONE_BG[b.tone],
              color: TONE_TEXT[b.tone],
            }}
            onMouseEnter={() => setHoverBand(i)}
            onMouseLeave={() => setHoverBand(null)}
          >
            {b.label}
          </div>
        ))}
      </div>

      <div className="gbc-cycle-svg-wrap" style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", display: "block", touchAction: "pan-y" }}
          aria-label="Gráfica ilustrativa del ciclo de Bitcoin 2024-2029. Desliza sobre ella para explorar precio y fase en cada momento."
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="cycleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6b455" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#e6b455" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b2b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff6b2b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e6b455" />
              <stop offset="52%" stopColor="#ff8552" />
              <stop offset="72%" stopColor="#e6b455" />
              <stop offset="100%" stopColor="#ffd47e" />
            </linearGradient>
            <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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

          {/* Región resaltada al pasar por una banda de fase */}
          {hoverBand !== null && (
            <rect
              x={pad.l + BANDS[hoverBand].from * innerW}
              y={pad.t}
              width={(BANDS[hoverBand].to - BANDS[hoverBand].from) * innerW}
              height={innerH}
              fill={TONE_BG[BANDS[hoverBand].tone]}
              opacity={0.9}
            />
          )}

          {/* Resaltado vertical "ahora" */}
          <rect x={nowPt.px - 14} y={pad.t} width={28} height={innerH} fill="url(#nowGrad)" />
          <line x1={nowPt.px} y1={pad.t} x2={nowPt.px} y2={pad.t + innerH} stroke="#ff6b2b" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* Curva */}
          <path d={areaD} fill="url(#cycleGrad)" style={{ opacity: drawn ? 1 : 0, transition: "opacity 1.4s ease 0.9s" }} />
          <path
            ref={lineRef}
            d={lineD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#lineGlow)"
          />

          {/* Puntos + etiquetas, alternando arriba/abajo para no chocar */}
          <g style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.9s ease 1.1s" }}>
            {pathPts.filter((p) => p.lbl).map((p, i) => {
              const above = p.dir !== "down";
              const ly1 = above ? p.py - 14 : p.py + 20;
              const ly2 = above ? p.py - 4 : p.py + 30;
              const anchor = p.x < 0.06 ? "start" : p.x > 0.94 ? "end" : "middle";
              return (
                <g key={i}>
                  <line x1={p.px} y1={p.py} x2={p.px} y2={above ? p.py - 10 : p.py + 10} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
                  {p.now && (
                    <circle cx={p.px} cy={p.py} r={5} fill="none" stroke="#ff6b2b" strokeWidth={1.4} opacity={0.6}>
                      <animate attributeName="r" values="5;13" dur="1.9s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0" dur="1.9s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={p.px} cy={p.py} r={p.now ? 5 : 4} fill={p.now ? "#ff6b2b" : "#fff"} stroke={p.now ? "#060f1f" : "#e6b455"} strokeWidth={1.6} />
                  <text x={p.px} y={ly1} textAnchor={anchor} fontSize={11} fontWeight={700} fill={p.now ? "#ff8552" : "#fff"}>{p.lbl}</text>
                  {p.sub && <text x={p.px} y={ly2} textAnchor={anchor} fontSize={9.5} fill="#8fa3b8">{p.sub}</text>}
                </g>
              );
            })}
          </g>

          {/* Crosshair interactivo */}
          {hover && (
            <g pointerEvents="none">
              <line x1={hover.px} y1={pad.t} x2={hover.px} y2={pad.t + innerH} stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="2 3" />
              <line x1={pad.l} y1={hover.py} x2={pad.l + innerW} y2={hover.py} stroke="rgba(255,255,255,0.14)" strokeWidth={1} strokeDasharray="2 3" />
              <circle cx={hover.px} cy={hover.py} r={8} fill={TONE_TEXT[hover.band.tone]} opacity={0.22} />
              <circle cx={hover.px} cy={hover.py} r={4.5} fill="#0a1628" stroke={TONE_TEXT[hover.band.tone]} strokeWidth={2} />
            </g>
          )}

          {/* Eje de años */}
          {["2024", "2025", "2026", "2027", "2028", "2029"].map((yr, i) => {
            const x = pad.l + (i / 5) * innerW;
            return (
              <text key={yr} x={x} y={H - 12} textAnchor="middle" fontSize={10} fill="#5c7185">{yr}</text>
            );
          })}
        </svg>

        {/* Tooltip flotante */}
        {hover && (
          <div
            className="gbc-chart-tip"
            style={{
              left: `${(hover.px / W) * 100}%`,
              top: `${(hover.py / H) * 100}%`,
              transform: tooltipFlip ? "translate(-104%, -120%)" : "translate(12px, -120%)",
              borderColor: `${TONE_TEXT[hover.band.tone]}55`,
            }}
          >
            <span className="gbc-chart-tip-price">≈ ${Math.round(hover.price)}K</span>
            <span className="gbc-chart-tip-date">{hover.date}</span>
            <span className="gbc-chart-tip-phase" style={{ color: TONE_TEXT[hover.band.tone] }}>
              Fase {hover.band.label.replace(" · aquí", "")}
            </span>
          </div>
        )}
      </div>

      <div className="gbc-chart-hint" aria-hidden="true">Desliza sobre la gráfica para explorar la curva</div>

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
