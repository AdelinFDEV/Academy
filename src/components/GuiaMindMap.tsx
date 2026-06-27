"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const STEPS = [
  {
    id: 1,
    label: "Regístrate",
    color: "#ff6b2b",
    title: "Crea tu cuenta gratis",
    desc: "El punto de partida. Tu perfil en la Academia, gratis y sin tarjeta, listo en menos de un minuto.",
    detail: [
      "Sin tarjeta de crédito",
      "Acceso inmediato al contenido gratuito",
      "Guarda tu progreso y rachas",
    ],
    cta: { label: "Crear cuenta gratis", href: "/register", external: false },
  },
  {
    id: 2,
    label: "Elige tu exchange",
    color: "#00c9a7",
    title: "Opera en un exchange de confianza",
    desc: "Necesitas un lugar seguro para comprar y operar. MEXC es de los más completos: cientos de pares y comisiones competitivas.",
    detail: [
      "Cientos de pares de trading",
      "Interfaz intuitiva para principiantes",
      "Nos apoya sin coste extra para ti",
    ],
    cta: {
      label: "Abrir cuenta en MEXC",
      href: "https://www.mexc.com/es/register?inviteCode=mexc-1xydM",
      external: true,
    },
  },
  {
    id: 3,
    label: "Sígueme",
    color: "#a78bfa",
    title: "Mantente conectado",
    desc: "Análisis, alertas y contenido educativo en tiempo real. No te pierdas ninguna oportunidad del mercado.",
    detail: [
      "Análisis de mercado semanales",
      "Alertas en movimientos importantes",
      "Contenido exclusivo para la comunidad",
    ],
    ctas: [
      { label: "YouTube @AdelinBTC", href: "https://www.youtube.com/@AdelinBTC" },
      { label: "Instagram @adelinbtc", href: "https://www.instagram.com/adelinbtc/" },
    ],
  },
  {
    id: 4,
    label: "Mantente al día",
    color: "#38bdf8",
    title: "Consume contenido con criterio",
    desc: "El mercado cambia constantemente. Las guías de la web y el canal de YouTube te enseñan a leerlo con disciplina.",
    detail: [
      "Artículos y guías publicados regularmente",
      "Videos en YouTube con análisis técnico",
      "Aprende a no dejarte llevar por el ruido",
    ],
    cta: { label: "Ver guías en la web", href: "/guias", external: false },
  },
];

export default function GuiaMindMap() {
  const [revealed, setRevealed] = useState(1);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  function advance(nextIndex: number) {
    setRevealed(nextIndex + 1);
  }

  useEffect(() => {
    if (revealed > 1) {
      const el = stepRefs.current[revealed - 1];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [revealed]);

  const total = STEPS.length;
  const progress = ((revealed - 1) / (total - 1)) * 100;

  return (
    <div className="cascade-root">
      {/* Progress rail */}
      <div className="cascade-rail" aria-hidden="true">
        <div className="cascade-rail-fill" style={{ height: `${progress}%` }} />
      </div>

      <div className="cascade-track">
        {STEPS.map((step, i) => {
          const isVisible = i < revealed;
          const isLast = step.id === total;
          const isComplete = i < revealed - 1;

          if (!isVisible) return null;

          return (
            <div
              key={step.id}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="cascade-step"
              style={{ "--step-color": step.color } as React.CSSProperties}
            >
              {/* Node */}
              <div className="cascade-node">
                <span className="cascade-node-ring" />
                {isComplete ? (
                  <svg className="cascade-node-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="cascade-node-num">{step.id}</span>
                )}
              </div>

              {/* Card */}
              <div className="cascade-card">
                <p className="cascade-card-step">Paso {step.id}</p>
                <h2 className="cascade-card-title">{step.title}</h2>
                <p className="cascade-card-desc">{step.desc}</p>

                <ul className="cascade-card-list">
                  {step.detail.map((d) => (
                    <li key={d} className="cascade-card-item">
                      <span className="cascade-card-dot" />
                      {d}
                    </li>
                  ))}
                </ul>

                <div className="cascade-card-actions">
                  {"ctas" in step && step.ctas ? (
                    step.ctas.map((c) => (
                      <a key={c.href} href={c.href} target="_blank" rel="noopener noreferrer" className="cascade-btn">
                        {c.label}
                      </a>
                    ))
                  ) : "cta" in step && step.cta ? (
                    step.cta.external ? (
                      <a href={step.cta.href} target="_blank" rel="noopener noreferrer" className="cascade-btn">
                        {step.cta.label}
                      </a>
                    ) : (
                      <Link href={step.cta.href} className="cascade-btn">
                        {step.cta.label}
                      </Link>
                    )
                  ) : null}
                </div>
              </div>

              {/* Advance trigger */}
              {!isLast && i === revealed - 1 && (
                <button className="cascade-advance" onClick={() => advance(i + 1)}>
                  <span>Siguiente paso</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}

              {isLast && (
                <div className="cascade-finish">
                  <span className="cascade-finish-icon">🚀</span>
                  <p>Ya tienes tu hoja de ruta. El resto depende de ti.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
