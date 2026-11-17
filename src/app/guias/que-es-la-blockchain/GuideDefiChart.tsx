"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const DEFI = [
  { label: "Lending", v: 28.4 },
  { label: "DEX", v: 19.1 },
  { label: "Liquid Staking", v: 12.3 },
  { label: "RWA", v: 8.8 },
  { label: "Otros", v: 3.2 },
];

// Paleta del cuaderno (ESTILO.md): la base para la barra y su tono oscuro para la cifra.
const COLORS = ["#2fbff5", "#ff8a1f", "#8f7cff", "#2fc488", "#ffd23f"];
const COLORS_TEXTO = ["#0e709b", "#a65000", "#6450e0", "#137a52", "#866500"];

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

  // Barras en HTML, no en un SVG: así la etiqueta y la cifra conservan su
  // tamaño en el móvil en vez de encoger con el dibujo. El relleno crece con
  // transform (scaleX), que no obliga a recalcular la página.
  return (
    <div ref={ref} className="gbc-chart-wrap">
      <div className="gbc-chart-lbl">TVL por categoría DeFi — Miles de millones USD (Jun 2026)</div>
      <div className={`bc-defi${triggered ? " is-visible" : ""}`} role="img" aria-label="Gráfica TVL DeFi por categoría">
        {DEFI.map((d, i) => (
          <div key={d.label} className="bc-defi-fila" style={{ "--retraso": `${i * 120}ms` } as CSSProperties}>
            <span className="bc-defi-nombre">{d.label}</span>
            <span className="bc-defi-pista">
              <span
                className="bc-defi-barra"
                style={{ width: `${(d.v / max) * 100}%`, background: COLORS[i] }}
              />
            </span>
            <span className="bc-defi-valor" style={{ color: COLORS_TEXTO[i] }}>${d.v}B</span>
          </div>
        ))}
      </div>
      <div className="gbc-chart-src">Fuente: DeFiLlama, Junio 2026 — TVL total: $71.77B</div>
    </div>
  );
}
