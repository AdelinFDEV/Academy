"use client";
import { useState } from "react";
import { Eye } from "lucide-react";

/**
 * Tarjeta con contenido borroso que se revela al hacer clic/tocar.
 * El título queda siempre visible; el cuerpo se desenfoca hasta interactuar.
 */
export default function GuideRevealCard({
  title,
  hint = "Toca para revelar",
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);

  const reveal = () => setRevealed(true);

  return (
    <div
      className={`gbc-card gbc-reveal${revealed ? " is-revealed" : ""}`}
      onClick={reveal}
      onKeyDown={(e) => {
        if (!revealed && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          reveal();
        }
      }}
      role={revealed ? undefined : "button"}
      tabIndex={revealed ? undefined : 0}
      aria-expanded={revealed}
    >
      <div className="gbc-card-title">{title}</div>
      <div className="gbc-card-text gbc-reveal-body" aria-hidden={!revealed}>
        {children}
      </div>
      <div className="gbc-reveal-overlay" aria-hidden={revealed}>
        <span className="gbc-reveal-eye"><Eye size={15} strokeWidth={2} aria-hidden="true" /></span>
        <span className="gbc-reveal-hint">{hint}</span>
      </div>
    </div>
  );
}
