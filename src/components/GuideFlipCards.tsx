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

const CARDS = [
  {
    title: "1. La transacción",
    frontText: "Alice quiere enviar 0.5 BTC a Bob. Firma la transacción con su clave privada...",
    backText1: "Es una prueba matemática de que ella autoriza el movimiento sin revelar la clave.",
    backText2: "La transacción se emite a la red de miles de nodos que la validan: ¿Tiene Alice saldo suficiente? ¿La firma es válida?",
  },
  {
    title: "2. El bloque",
    frontText: "Las transacciones válidas se agrupan en un bloque...",
    backText1: "El bloque incluye: versión, hash del bloque anterior, árbol Merkle, marca de tiempo y nonce.",
    backText2: "El hash del bloque es la huella digital. Si cambias una coma, el hash cambia por completo.",
  },
  {
    title: "3. El consenso",
    frontText: "La red debe ponerse de acuerdo sobre cuál es el siguiente bloque verdadero...",
    backText1: "Proof of Work (Bitcoin): Los mineros compiten resolviendo un puzzle matemático. El primero lo añade.",
    backText2: "Proof of Stake (Ethereum): Validadores depositan ETH como garantía. Seleccionados aleatoriamente.",
  },
  {
    title: "4. La inmutabilidad",
    frontText: "Una vez en la cadena, ¿se puede alterar el registro?",
    backText1: "Si un atacante quisiera alterar el bloque 700.000, tendría que recalcular ese y todos los posteriores.",
    backText2: "En Bitcoin, eso requiere más del 51% del hashrate global. Coste: miles de millones de dólares en hardware y luz.",
  }
];

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

export default function GuideFlipCards() {
  return (
    <div className="gbc-flip-cards-grid" style={{ marginTop: 28 }}>
      {CARDS.map((c, i) => (
        <FlipCard key={i} {...c} delay={i * 100} />
      ))}
    </div>
  );
}
