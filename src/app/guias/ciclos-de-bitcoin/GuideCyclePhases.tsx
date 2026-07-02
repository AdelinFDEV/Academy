"use client";
import { useState } from "react";
import { Rocket, TrendingDown, Sprout, Zap, Pickaxe, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PHASES: {
  id: string;
  label: string;
  Icon: LucideIcon;
  color: string;
  desc: string;
  here?: boolean;
}[] = [
  {
    id: "bull",
    label: "Alcista",
    Icon: Rocket,
    color: "#e6b455",
    desc: "Los precios suben con fuerza durante meses tras el halving. Es la fase más visible — la que sale en titulares — pero también la más tardía para entrar con ventaja.",
  },
  {
    id: "bear",
    label: "Bajista",
    Icon: TrendingDown,
    color: "#ff8552",
    desc: "Corrección tras el pico. Los precios caen 40-60% desde máximos, el sentimiento es pesimista y la mayoría de gente vende o abandona. Estimamos que esta fase está terminando alrededor de octubre de 2026.",
    here: true,
  },
  {
    id: "recover",
    label: "Recuperación",
    Icon: Sprout,
    color: "#34d399",
    desc: "El precio deja de caer y empieza a construir una base lateral. Poco volumen, poco ruido mediático — es también, históricamente, la zona de mejor relación riesgo/recompensa para acumular.",
  },
  {
    id: "pre-halving",
    label: "Pre-halving",
    Icon: Zap,
    color: "#ffab7a",
    desc: "Los meses previos al siguiente halving. Históricamente, las altcoins empiezan a moverse con fuerza aquí, antes de que Bitcoin lo haga — por eso conviene estar posicionado con antelación, no cuando ya subió.",
  },
  {
    id: "halving",
    label: "Halving",
    Icon: Pickaxe,
    color: "#4f9dff",
    desc: "La recompensa por bloque de Bitcoin se reduce a la mitad, cortando la nueva oferta que entra al mercado. El próximo halving se estima para principios de 2028. Marca el inicio simbólico del siguiente ciclo alcista.",
  },
];

export default function GuideCyclePhases() {
  const [active, setActive] = useState("bear");
  const idx = Math.max(0, PHASES.findIndex((p) => p.id === active));
  const current = PHASES[idx];
  const { Icon } = current;

  return (
    <div className="gbc-tl" style={{ marginTop: 28 }}>
      {/* Timeline de nodos */}
      <div className="gbc-tl-track" role="tablist" aria-label="Fases del ciclo">
        <div className="gbc-tl-line" aria-hidden="true" />
        <div
          className="gbc-tl-line gbc-tl-line--fill"
          aria-hidden="true"
          style={{ width: `calc(${(idx / (PHASES.length - 1)) * 100}% - ${(idx / (PHASES.length - 1)) * 32}px + 16px)` }}
        />
        {PHASES.map((p, i) => {
          const PIcon = p.Icon;
          const isActive = p.id === active;
          const isPast = i < idx;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={isActive}
              className={`gbc-tl-node${isActive ? " active" : ""}${isPast ? " past" : ""}`}
              style={{ "--ph": p.color } as React.CSSProperties}
              onClick={() => setActive(p.id)}
            >
              <span className="gbc-tl-dot"><PIcon size={15} strokeWidth={2.2} aria-hidden="true" /></span>
              <span className="gbc-tl-lbl">{p.label}</span>
              {p.here && (
                <span className="gbc-tl-here"><MapPin size={10} aria-hidden="true" /> Estás aquí</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tarjeta de detalle */}
      <div
        key={current.id}
        className="gbc-tl-card"
        style={{ "--ph": current.color } as React.CSSProperties}
        role="tabpanel"
      >
        <div className="gbc-tl-card-head">
          <span className="gbc-tl-card-icon"><Icon size={18} strokeWidth={2.2} aria-hidden="true" /></span>
          <div className="gbc-tl-card-titles">
            <span className="gbc-tl-card-step">Fase {idx + 1} de {PHASES.length}</span>
            <span className="gbc-tl-card-name">{current.label}{current.here ? " — donde estamos" : ""}</span>
          </div>
        </div>
        <p className="gbc-tl-card-desc">{current.desc}</p>
      </div>
    </div>
  );
}
