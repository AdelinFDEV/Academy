"use client";

import { useState } from "react";
import { Hand } from "lucide-react";

interface GuideFlipCardProps {
  title: string;
  frontText: string;
  backText1: string;
  backText2: string;
  delay?: number;
}

function FlipCard({ title, frontText, backText1, backText2, delay = 0 }: GuideFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="flip-card-container fade-in-up" 
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`flip-card-inner ${isFlipped ? "is-flipped" : ""}`}>
        {/* FRONT */}
        <div className="flip-card-front gbc-card">
          <div className="gbc-card-title">{title}</div>
          <div className="flip-card-front-content">
            <p className="flip-card-teaser">{frontText}</p>
            <div className="flip-card-hint">
              <Hand size={14} className="flip-card-hand" /> Haz clic para girar
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-card-back gbc-card">
          <div className="gbc-card-title">{title}</div>
          <div className="gbc-card-text">
            <p>{backText1}</p>
            <p>{backText2}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuideFlipCards({ cards }: { cards: Omit<GuideFlipCardProps, "delay">[] }) {
  return (
    <div className="gbc-flip-cards-grid" style={{ marginTop: 28 }}>
      {cards.map((c, i) => (
        <FlipCard key={i} {...c} delay={i * 100} />
      ))}
    </div>
  );
}
