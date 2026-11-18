"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * El «reto final» del camino de los cursos (CursosHome.tsx): la pegatina del
 * examen final, con capa y las manos en jarra. Easter egg pedido por el admin
 * el 18-11-2026: al pulsarlo suelta, en un bocadillo encima de él, una frase
 * corta de villano de dibujos, retadora y de broma. Nunca repite la anterior y
 * el bocadillo se va solo a los 2,6 s.
 */
const FRASES = [
  "¿Tú? ¿Aprobarme a mí? ¡Ja!",
  "Muajajá… te espero al final.",
  "Nadie me supera a la primera.",
  "Estudia bien, que no perdono.",
  "¿Los módulos? Se nota que no.",
  "Jejeje… el FIFO te va a pillar.",
  "Trae café. Lo vas a necesitar.",
  "Mi capa es más rápida que tú.",
  "¡Ni con DCA me ganas!",
  "Aquí te espero. Muajajá.",
];

const DURA = 2600;

export default function RetoFinal() {
  const [frase, setFrase] = useState<number | null>(null);
  const ultima = useRef(-1);
  const espera = useRef(0);

  useEffect(() => () => window.clearTimeout(espera.current), []);

  const hablar = () => {
    let n = Math.floor(Math.random() * FRASES.length);
    if (n === ultima.current) n = (n + 1) % FRASES.length;
    ultima.current = n;
    setFrase(n);
    window.clearTimeout(espera.current);
    espera.current = window.setTimeout(() => setFrase(null), DURA);
  };

  return (
    <button type="button" className="ch-reto" onClick={hablar} aria-label="El examen final: púlsalo, si te atreves">
      <Image
        src="/cuaderno/reto-final-pegatina.webp"
        alt=""
        width={300}
        height={298}
        className="ch-reto-img"
        draggable={false}
      />
      {frase !== null && (
        // `key`: cada frase nueva vuelve a hacer el saltito del bocadillo.
        <span key={frase} className="ch-reto-bocadillo" role="status">
          {FRASES[frase]}
        </span>
      )}
    </button>
  );
}
