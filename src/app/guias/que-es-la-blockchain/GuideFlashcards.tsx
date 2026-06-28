"use client";
import { useState } from "react";

const CARDS = [
  { term: "Blockchain", def: "Registro distribuido de transacciones agrupadas en bloques encadenados criptográficamente. Ninguna entidad central lo controla." },
  { term: "Hash", def: "Función matemática que convierte cualquier dato en una cadena de longitud fija. Cambiar un solo byte produce un hash completamente diferente." },
  { term: "Nodo", def: "Participante de la red que almacena una copia completa de la blockchain y valida las transacciones." },
  { term: "Consenso", def: "Mecanismo por el que los nodos de la red se ponen de acuerdo sobre el estado válido del registro sin necesidad de un árbitro central." },
  { term: "Proof of Work", def: "Mecanismo de consenso que requiere resolver un puzzle computacional costoso para añadir un bloque. Lo usa Bitcoin." },
  { term: "Smart Contract", def: "Programa auto-ejecutable desplegado en la blockchain cuyas condiciones están escritas en código y no pueden ser alteradas." },
  { term: "Wallet", def: "Software que gestiona tus claves privadas y te permite firmar transacciones. No almacena monedas, solo claves." },
  { term: "DeFi", def: "Finanzas Descentralizadas. Ecosistema de protocolos financieros (préstamos, DEX, staking) que operan sin intermediarios bancarios." },
];

export default function GuideFlashcards() {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const toggle = (i: number) =>
    setFlipped((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="gbc-fc-grid">
      {CARDS.map((c, i) => (
        <div key={i} className="gbc-fc-outer">
          <button
            className={`gbc-fc${flipped[i] ? " flipped" : ""}`}
            onClick={() => toggle(i)}
            aria-label={flipped[i] ? `Definición de ${c.term}: ${c.def}` : `Término: ${c.term}. Click para ver definición`}
          >
            <div className="gbc-fc-front">
              <span className="gbc-fc-term">{c.term}</span>
              <span className="gbc-fc-hint">Click para ver definición</span>
            </div>
            <div className="gbc-fc-back">
              <span className="gbc-fc-def">{c.def}</span>
              <span className="gbc-fc-hint">Click para volver</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
