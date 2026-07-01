"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { prefix: "", value: 4, suffix: "", dec: 0, label: "Halvings de Bitcoin\nhasta hoy" },
  { prefix: "", value: 4, suffix: " años", dec: 0, label: "Duración media\ndel ciclo" },
  { prefix: "$", value: 45, suffix: "K", dec: 0, label: "Suelo estimado\nde este ciclo" },
  { prefix: "$", value: 190, suffix: "K", dec: 0, label: "Objetivo estimado\npróximo ciclo" },
  { prefix: "", value: 2028, suffix: "", dec: 0, label: "Próximo halving\nestimado" },
];

function useCountUp(target: number, dec: number, active: boolean, duration = 1600) {
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
    ? Math.round(val).toLocaleString("es-ES", { useGrouping: false })
    : s.dec > 0 ? val.toFixed(s.dec) : Math.round(val);
  return (
    <div>
      <div className="gbc-stat-n">{s.prefix}{fmt}{s.suffix}</div>
      <div className="gbc-stat-l">{s.label}</div>
    </div>
  );
}

export default function GuideCycleHeroStats() {
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
