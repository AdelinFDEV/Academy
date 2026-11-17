"use client";

import { useEffect, useRef } from "react";

interface GuideAnimatedStatProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  label: string;
  source?: string;
}

/**
 * Una cifra de una sección de guía que sube contando la primera vez que entra
 * en pantalla.
 *
 * El HTML sale ya con la cifra final: es lo que leen Google, los lectores de
 * pantalla y quien no tiene JavaScript. La cuenta se escribe directamente en el
 * DOM (sin estado de React) y solo si la persona no pidió reducir el
 * movimiento. CSS en src/app/guias/guias.css («Cifras dentro de una sección»).
 */
export default function GuideAnimatedStat({
  end,
  prefix = "",
  suffix = "",
  duration = 2000,
  decimals = 0,
  label,
  source,
}: GuideAnimatedStatProps) {
  const caja = useRef<HTMLDivElement>(null);
  const cifra = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = caja.current;
    const num = cifra.current;
    if (!el || !num) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const escribir = (v: number) => {
      num.textContent = v.toFixed(decimals);
    };
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const inicio = performance.now();
        const paso = (t: number) => {
          const k = Math.min((t - inicio) / duration, 1);
          escribir(end * (1 - Math.pow(1 - k, 4)));
          if (k < 1) frame = requestAnimationFrame(paso);
        };
        escribir(0);
        frame = requestAnimationFrame(paso);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      escribir(end);
    };
  }, [end, duration, decimals]);

  return (
    <div className="gbc-stat-c" ref={caja}>
      <div className="gbc-stat-num">
        {prefix}<span ref={cifra}>{end.toFixed(decimals)}</span>{suffix}
      </div>
      <div className="gbc-stat-lbl">{label}</div>
      {source && <div className="gbc-stat-src">{source}</div>}
    </div>
  );
}
