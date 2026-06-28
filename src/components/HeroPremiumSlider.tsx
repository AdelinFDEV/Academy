"use client";

import { useEffect, useRef, useState } from "react";
import { Medal, Crosshair, NotebookPen, ScanEye, Wallet, Unlock } from "lucide-react";

const SLIDES = [
  {
    icon: <NotebookPen size={22} aria-hidden="true" />,
    label: "Diario de Trading",
    description: "Registra cada operación. Encuentra tus patrones. Mejora con datos reales.",
    color: "#4f9dff",
  },
  {
    icon: <Unlock size={22} aria-hidden="true" />,
    label: "Liberaciones de Tokens",
    description: "Anticipa la presión vendedora con el calendario de vesting del mercado.",
    color: "#34d399",
  },
  {
    icon: <Wallet size={22} aria-hidden="true" />,
    label: "Portfolio Spot",
    description: "Sigue en tiempo real las compras SPOT de AdelinBTC con precios y contexto.",
    color: "#fb923c",
  },
  {
    icon: <ScanEye size={22} aria-hidden="true" />,
    label: "Watchlist",
    description: "Monitoriza el precio de tus coins favoritas desde un solo lugar.",
    color: "#a78bfa",
  },
  {
    icon: <Crosshair size={22} aria-hidden="true" />,
    label: "Predicción de Precio",
    description: "Calcula qué Market Cap necesita tu token para alcanzar tu objetivo.",
    color: "#22d3ee",
  },
  {
    icon: <Medal size={22} aria-hidden="true" />,
    label: "Logros",
    description: "Gana insignias, mantén rachas y sube en el ranking de la academia.",
    color: "#fbbf24",
  },
];

const INTERVAL = 3400;

export default function HeroPremiumSlider() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % SLIDES.length);
        setAnimating(false);
      }, 240);
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goTo = (idx: number) => {
    if (idx === active || animating) return;
    setAnimating(true);
    setTimeout(() => { setActive(idx); setAnimating(false); }, 240);
    startTimer();
  };

  const slide = SLIDES[active];

  return (
    <div className="hps-wrap hero-anim hero-anim-4">

      {/* Ambient glow behind card — changes colour with each slide */}
      <div
        className="hps-glow-bg"
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 80%, ${slide.color}22 0%, transparent 70%)` }}
      />

      <div className={`hps-card${animating ? " hps-card--out" : " hps-card--in"}`}
        style={{ borderColor: `${slide.color}20` }}
      >
        {/* Left accent */}
        <div className="hps-card-accent" style={{ background: `linear-gradient(to bottom, transparent, ${slide.color}, transparent)` }} />

        {/* Icon */}
        <div className="hps-icon" style={{ color: slide.color, background: `${slide.color}12`, boxShadow: `0 0 0 6px ${slide.color}0d, 0 0 24px ${slide.color}28` }}>
          {slide.icon}
        </div>

        {/* Text */}
        <div className="hps-text">
          <span className="hps-label" style={{ color: slide.color }}>{slide.label}</span>
          <span className="hps-desc">{slide.description}</span>
        </div>

        {/* Counter */}
        <div className="hps-counter" aria-hidden="true">
          <span className="hps-counter-n" style={{ color: slide.color }}>{String(active + 1).padStart(2, "0")}</span>
          <span className="hps-counter-sep"> / {String(SLIDES.length).padStart(2, "0")}</span>
        </div>

        {/* Progress bar */}
        <div className="hps-progress-track">
          <div className="hps-progress-fill" key={`p-${active}`} style={{ animationDuration: `${INTERVAL}ms`, background: slide.color }} />
        </div>
      </div>

      {/* Dots */}
      <div className="hps-dots" role="tablist" aria-label="Herramientas">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            aria-label={s.label}
            className={`hps-dot${i === active ? " hps-dot--active" : ""}`}
            style={i === active ? { background: slide.color, boxShadow: `0 0 10px ${slide.color}90` } : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
