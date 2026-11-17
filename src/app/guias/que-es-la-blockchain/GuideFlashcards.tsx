"use client";
import { useGiro } from "@/components/cuaderno/useGiro";

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

/**
 * Una ficha: un botón conmutador que se da la vuelta. El giro, su sonido y su
 * vibración son los de todas las tarjetas de la web (useGiro.ts y giro.css).
 */
function Ficha({ term, def }: { term: string; def: string }) {
  const { girada, alternar, claseGiro } = useGiro();

  return (
    <div className="gbc-fc-outer">
      <button
        type="button"
        className={`gbc-fc giro-zona ${claseGiro}`}
        aria-pressed={girada}
        onClick={alternar}
        aria-label={girada ? `Definición de ${term}: ${def}` : `Término: ${term}. Toca para ver la definición`}
      >
        <div className="gbc-fc-front">
          <span className="gbc-fc-term">{term}</span>
          <span className="gbc-fc-hint">Toca para ver la definición</span>
        </div>
        <div className="gbc-fc-back">
          <span className="gbc-fc-def">{def}</span>
          <span className="gbc-fc-hint">Toca para volver</span>
        </div>
      </button>
    </div>
  );
}

export default function GuideFlashcards() {
  return (
    <div className="gbc-fc-grid">
      {CARDS.map((c) => (
        <Ficha key={c.term} term={c.term} def={c.def} />
      ))}
    </div>
  );
}
