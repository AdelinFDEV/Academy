"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Medal, Crosshair, NotebookPen, ScanEye, Wallet, Unlock, ArrowRight, Gem } from "lucide-react";

/* Mini-visuales decorativos por herramienta (SVG abstracto, color de la slide) */
function VisualSparkline({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 84" fill="none" aria-hidden="true">
      <path d="M6 66 L28 52 L46 58 L68 32 L92 40 L114 14 V78 H6 Z" fill={c} opacity="0.1" />
      <path d="M6 66 L28 52 L46 58 L68 32 L92 40 L114 14" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {[[28, 52], [68, 32], [114, 14]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3.4" fill="#081026" stroke={c} strokeWidth="2" />
      ))}
      <line x1="6" y1="78" x2="114" y2="78" stroke={c} strokeWidth="1" opacity="0.25" />
    </svg>
  );
}

function VisualBars({ c }: { c: string }) {
  const bars = [26, 38, 20, 52, 34, 62];
  return (
    <svg viewBox="0 0 120 84" fill="none" aria-hidden="true">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={10 + i * 18}
          y={74 - h}
          width="11"
          height={h}
          rx="3"
          fill={c}
          opacity={i === 3 ? 0.95 : 0.3}
        />
      ))}
      <line x1="6" y1="74" x2="114" y2="74" stroke={c} strokeWidth="1" opacity="0.25" />
      <line x1="64.5" y1="10" x2="64.5" y2="20" stroke={c} strokeWidth="1.6" strokeDasharray="2 3" opacity="0.8" />
    </svg>
  );
}

function VisualDonut({ c }: { c: string }) {
  const R = 26, C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 120 84" fill="none" aria-hidden="true">
      <circle cx="60" cy="42" r={R} stroke={c} strokeWidth="9" opacity="0.15" />
      <circle cx="60" cy="42" r={R} stroke={c} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${C * 0.45} ${C}`} transform="rotate(-90 60 42)" />
      <circle cx="60" cy="42" r={R} stroke={c} strokeWidth="9" strokeLinecap="round" opacity="0.5"
        strokeDasharray={`${C * 0.2} ${C}`} transform="rotate(90 60 42)" />
      <circle cx="60" cy="42" r="7" fill={c} opacity="0.35" />
    </svg>
  );
}

function VisualRows({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 84" fill="none" aria-hidden="true">
      {[16, 38, 60].map((y, i) => (
        <g key={y} opacity={i === 1 ? 1 : 0.45}>
          <circle cx="14" cy={y + 6} r="5" fill={c} opacity="0.5" />
          <rect x="26" y={y + 2} width="52" height="8" rx="4" fill={c} opacity="0.3" />
          <path
            d={i === 2 ? `M104 ${y + 10} l6 -8 l6 8 Z` : `M104 ${y + 2} l6 8 l6 -8 Z`}
            fill={c}
            transform={i === 2 ? "" : `rotate(180 110 ${y + 6})`}
          />
        </g>
      ))}
    </svg>
  );
}

function VisualTarget({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 84" fill="none" aria-hidden="true">
      <circle cx="60" cy="42" r="30" stroke={c} strokeWidth="1.6" opacity="0.25" />
      <circle cx="60" cy="42" r="19" stroke={c} strokeWidth="1.6" opacity="0.45" />
      <circle cx="60" cy="42" r="8" stroke={c} strokeWidth="2" />
      <circle cx="60" cy="42" r="3" fill={c} />
      <path d="M96 10 L70 34" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M96 10 l-9 2 M96 10 l-2 9" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function VisualMedal({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 84" fill="none" aria-hidden="true">
      <path d="M48 8 L60 30 L72 8" stroke={c} strokeWidth="7" strokeLinecap="round" opacity="0.4" />
      <circle cx="60" cy="50" r="22" stroke={c} strokeWidth="2.4" fill={`${c}18`} />
      <path d="M60 38 l4.2 8.4 9.3 1.3 -6.7 6.6 1.6 9.2 -8.4 -4.4 -8.4 4.4 1.6 -9.2 -6.7 -6.6 9.3 -1.3 Z" fill={c} />
      {[[22, 28], [98, 28], [16, 58], [104, 58]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={c} opacity="0.5" />
      ))}
    </svg>
  );
}

const SLIDES = [
  {
    icon: <NotebookPen size={24} aria-hidden="true" />,
    label: "Diario de Trading",
    description: "Registra cada operación. Encuentra tus patrones. Mejora con datos reales.",
    color: "#4f9dff",
    tag: "Premium",
    Visual: VisualSparkline,
  },
  {
    icon: <Unlock size={24} aria-hidden="true" />,
    label: "Liberaciones de Tokens",
    description: "Anticipa la presión vendedora con el calendario de vesting del mercado.",
    color: "#34d399",
    tag: "Premium",
    Visual: VisualBars,
  },
  {
    icon: <Wallet size={24} aria-hidden="true" />,
    label: "Portfolio Spot",
    description: "Sigue en tiempo real las compras SPOT de AdelinBTC con precios y contexto.",
    color: "#fb923c",
    tag: "Premium",
    Visual: VisualDonut,
  },
  {
    icon: <ScanEye size={24} aria-hidden="true" />,
    label: "Watchlist",
    description: "Monitoriza el precio de tus coins favoritas desde un solo lugar.",
    color: "#a78bfa",
    tag: "Gratis",
    Visual: VisualRows,
  },
  {
    icon: <Crosshair size={24} aria-hidden="true" />,
    label: "Predicción de Precio",
    description: "Calcula qué Market Cap necesita tu token para alcanzar tu objetivo.",
    color: "#22d3ee",
    tag: "Gratis",
    Visual: VisualTarget,
  },
  {
    icon: <Medal size={24} aria-hidden="true" />,
    label: "Logros",
    description: "Gana insignias, mantén rachas y sube en el ranking de la academia.",
    color: "#fbbf24",
    tag: "Gratis",
    Visual: VisualMedal,
  },
];

const INTERVAL = 3800;

export default function HeroPremiumSlider({
  isLoggedIn = false,
  isPremium = false,
}: {
  isLoggedIn?: boolean;
  isPremium?: boolean;
}) {
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
  const { Visual } = slide;

  return (
    <div className="hps-wrap hps-v2 hps-v3 hero-anim hero-anim-4">

      {/* Marco fijo: solo el contenido de la herramienta rota */}
      <div className="hps-card hps-card--frame" style={{ borderColor: `${slide.color}2e` }}>

        {/* Left accent */}
        <div className="hps-card-accent" style={{ background: `linear-gradient(to bottom, transparent, ${slide.color}, transparent)` }} />

        {/* Counter (fijo, cambia el color) */}
        <div className="hps-counter" aria-hidden="true">
          <span className="hps-counter-n" style={{ color: slide.color }}>{String(active + 1).padStart(2, "0")}</span>
          <span className="hps-counter-sep"> / {String(SLIDES.length).padStart(2, "0")}</span>
        </div>

        {/* Zona rotatoria: icono + texto + visual */}
        <div className={`hps-rotor${animating ? " hps-rotor--out" : " hps-rotor--in"}`}>
          <div className="hps-icon" style={{ color: slide.color, background: `${slide.color}12`, boxShadow: `0 0 0 6px ${slide.color}0d, 0 0 28px ${slide.color}30` }}>
            {slide.icon}
          </div>

          <div className="hps-text">
            <span className="hps-label-row">
              <span className="hps-label" style={{ color: slide.color }}>{slide.label}</span>
              <span className={`hps-tag${slide.tag === "Gratis" ? " hps-tag--free" : ""}`}>{slide.tag}</span>
            </span>
            <span className="hps-desc">{slide.description}</span>
          </div>

          <div className="hps-visual" aria-hidden="true">
            <Visual c={slide.color} />
          </div>
        </div>

        {/* CTA fijos dentro del marco */}
        <div className="hps-cta-row">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="hero-cta-main hps-cta-main">
                <span className="hero-cta-main-label">
                  Ir a mi Academia <ArrowRight className="hero-cta-arrow" size={18} strokeWidth={2.6} aria-hidden="true" />
                </span>
                <span className="hero-cta-main-sub">Continúa donde lo dejaste</span>
              </Link>
              {isPremium ? (
                <Link href="#guias-premium" className="hero-cta-secondary hps-cta-secondary">
                  <span className="hero-cta-secondary-label">
                    <Gem size={14} strokeWidth={1.75} aria-hidden="true" /> Guías Premium
                  </span>
                  <span className="hero-cta-secondary-sub">Contenido exclusivo</span>
                </Link>
              ) : (
                <Link href="/premium" className="hero-cta-secondary hps-cta-secondary">
                  <span className="hero-cta-secondary-label">
                    <Gem size={14} strokeWidth={1.75} aria-hidden="true" /> Ver Premium
                  </span>
                  <span className="hero-cta-secondary-sub">
                    <s className="hero-cta-oldprice">49,99€</s> <strong>19,99€</strong>/mes
                  </span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/register" className="hero-cta-main hps-cta-main">
                <span className="hero-cta-main-label">
                  Empieza Gratis Ahora <ArrowRight className="hero-cta-arrow" size={18} strokeWidth={2.6} aria-hidden="true" />
                </span>
                <span className="hero-cta-main-sub">Sin tarjeta · Acceso en 1 minuto</span>
              </Link>
              <Link href="/premium" className="hero-cta-secondary hps-cta-secondary">
                <span className="hero-cta-secondary-label">
                  <Gem size={14} strokeWidth={1.75} aria-hidden="true" /> Ver Premium
                </span>
                <span className="hero-cta-secondary-sub">
                  <s className="hero-cta-oldprice">49,99€</s> <strong>19,99€</strong>/mes
                </span>
              </Link>
            </>
          )}
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
