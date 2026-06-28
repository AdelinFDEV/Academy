"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { prefix: "$", value: 2.17, suffix: "T", dec: 2, label: "Capitalización\ncrypto global" },
  { prefix: "", value: 350, suffix: "M+", dec: 0, label: "Usuarios activos\nestimados 2026" },
  { prefix: "$", value: 71.77, suffix: "B", dec: 2, label: "Total Value Locked\nen DeFi" },
  { prefix: "$", value: 32, suffix: "B+", dec: 0, label: "Activos reales\ntokenizados (RWA)" },
  { prefix: "", value: 15000, suffix: "+", dec: 0, label: "Proyectos activos\nen blockchain" },
];

function useCountUp(target: number, dec: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((ease * target).toFixed(dec)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, dec, duration]);
  return val;
}

function StatItem({ s, active }: { s: typeof STATS[0]; active: boolean }) {
  const val = useCountUp(s.value, s.dec, active);
  const fmt = s.value >= 1000
    ? Math.round(val).toLocaleString("es-ES")
    : s.dec > 0 ? val.toFixed(s.dec) : String(val);
  return (
    <div>
      <div className="gbc-stat-n">{s.prefix}{fmt}{s.suffix}</div>
      <div className="gbc-stat-l">{s.label}</div>
    </div>
  );
}

export default function GuideHeroStats() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="gbc-hero-stats">
      {STATS.map((s) => <StatItem key={s.label} s={s} active={active} />)}
    </div>
  );
}
