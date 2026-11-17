"use client";

import { useState } from "react";
import { Hand } from "lucide-react";
import { sonar } from "@/lib/sonidos";

interface GuideFlipCardProps {
  title: string;
  frontText: string;
  backText1: string;
  backText2: string;
  delay?: number;
}

/**
 * La tarjeta de estudio de las guías (estilo «Cuaderno de estudio»,
 * disenos/sistema.html → «Tarjetas que giran»): papel por delante, cielo por
 * detrás. Es un botón: se gira al pulsarla (también con el teclado) y, en
 * escritorio, al pasar el ratón. Suena a papel al girar.
 *
 * Las dos caras están en el HTML desde el principio: Google y los lectores de
 * pantalla las leen aunque nadie la gire. Las dos ocupan la misma celda de la
 * rejilla, así que la tarjeta mide lo que la cara más larga. CSS en guias.css.
 */
function FlipCard({ title, frontText, backText1, backText2, delay = 0 }: GuideFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`gfc${isFlipped ? " is-girada" : ""}`}
      aria-pressed={isFlipped}
      onClick={() => {
        setIsFlipped((f) => !f);
        sonar("girar");
      }}
      style={{ "--retraso": `${delay}ms` } as React.CSSProperties}
    >
      <span className="gfc-giro">
        {/* FRONT */}
        <span className="gfc-cara gfc-frente">
          <span className="gfc-titulo">{title}</span>
          <span className="gfc-teaser">{frontText}</span>
          <span className="gfc-pista">
            <Hand size={16} className="gfc-mano" aria-hidden="true" /> Haz clic para girar
          </span>
        </span>

        {/* BACK */}
        <span className="gfc-cara gfc-dorso">
          <span className="gfc-titulo">{title}</span>
          <span className="gfc-texto">
            <span>{backText1}</span>
            <span>{backText2}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

export default function GuideFlipCards({ cards }: { cards: Omit<GuideFlipCardProps, "delay">[] }) {
  return (
    <div className="gfc-mesa">
      {cards.map((c, i) => (
        <FlipCard key={i} {...c} delay={i * 80} />
      ))}
    </div>
  );
}
