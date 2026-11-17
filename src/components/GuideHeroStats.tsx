"use client";
import { useEffect, useRef } from "react";

export interface GuideHeroStat {
  prefix: string;
  value: number;
  suffix: string;
  dec: number;
  label: string;
}

/** Cómo se escribe la cifra: miles con punto; si no, con sus decimales. */
function formato(s: GuideHeroStat, v: number): string {
  if (s.value >= 1000) return Math.round(v).toLocaleString("es-ES");
  return s.dec > 0 ? v.toFixed(s.dec) : String(parseFloat(v.toFixed(0)));
}

/**
 * Las cifras del hero de una guía: suben contando la primera vez que se ven.
 *
 * El HTML sale ya con las cifras finales (lo que leen Google, los lectores de
 * pantalla y quien no tiene JavaScript); la cuenta se escribe en el DOM, sin
 * estado de React, y no se hace con «reducir movimiento». CSS en guias.css.
 */
export default function GuideHeroStats({ stats }: { stats: GuideHeroStat[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cifras = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-cifra]"));
    const escribir = (k: number) => {
      cifras.forEach((c, i) => {
        c.textContent = formato(stats[i], stats[i].value * k);
      });
    };
    let frame = 0;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const inicio = performance.now();
        const paso = (t: number) => {
          const p = Math.min((t - inicio) / 1800, 1);
          escribir(1 - Math.pow(1 - p, 3));
          if (p < 1) frame = requestAnimationFrame(paso);
        };
        escribir(0);
        frame = requestAnimationFrame(paso);
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(frame);
      escribir(1);
    };
  }, [stats]);

  return (
    <div ref={ref} className="gbc-hero-stats">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="gbc-stat-n">
            {s.prefix}<span data-cifra>{formato(s, s.value)}</span>{s.suffix}
          </div>
          <div className="gbc-stat-l">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
