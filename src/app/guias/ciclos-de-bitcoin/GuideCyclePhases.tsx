"use client";
import { useState } from "react";

const PHASES = [
  {
    id: "bull",
    label: "Alcista",
    icon: "🚀",
    desc: "Los precios suben con fuerza durante meses tras el halving. Es la fase más visible — la que sale en titulares — pero también la más tardía para entrar con ventaja.",
  },
  {
    id: "bear",
    label: "Bajista (aquí)",
    icon: "📉",
    desc: "Corrección tras el pico. Los precios caen 40-60% desde máximos, el sentimiento es pesimista y la mayoría de gente vende o abandona. Estimamos que esta fase está terminando alrededor de octubre de 2026.",
    active: true,
  },
  {
    id: "recover",
    label: "Recuperación",
    icon: "🌱",
    desc: "El precio deja de caer y empieza a construir una base lateral. Poco volumen, poco ruido mediático — es también, históricamente, la zona de mejor relación riesgo/recompensa para acumular.",
  },
  {
    id: "pre-halving",
    label: "Pre-halving",
    icon: "⚡",
    desc: "Los meses previos al siguiente halving. Históricamente, las altcoins empiezan a moverse con fuerza aquí, antes de que Bitcoin lo haga — por eso conviene estar posicionado con antelación, no cuando ya subió.",
  },
  {
    id: "halving",
    label: "Halving",
    icon: "⛏️",
    desc: "La recompensa por bloque de Bitcoin se reduce a la mitad, cortando la nueva oferta que entra al mercado. El próximo halving se estima para principios de 2028. Marca el inicio simbólico del siguiente ciclo alcista.",
  },
];

export default function GuideCyclePhases() {
  const [active, setActive] = useState("bear");
  const current = PHASES.find((p) => p.id === active) ?? PHASES[1];

  return (
    <div style={{ marginTop: 28 }}>
      <div className="gbc-phase-tabs">
        {PHASES.map((p) => (
          <button
            key={p.id}
            className={`gbc-phase-tab${p.id === active ? " active" : ""}`}
            onClick={() => setActive(p.id)}
          >
            <span aria-hidden="true">{p.icon}</span> {p.label}
          </button>
        ))}
      </div>
      <div className="gbc-box gbc-box--gold" style={{ marginTop: 0 }}>
        <div className="gbc-box-title">{current.icon} Fase: {current.label}</div>
        <div className="gbc-box-body">{current.desc}</div>
      </div>
    </div>
  );
}
