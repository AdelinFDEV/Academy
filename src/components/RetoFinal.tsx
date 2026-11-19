"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./reto-final.css";

/**
 * El «reto final» del camino de los cursos (CursosHome.tsx): la pegatina del
 * examen final, con capa y las manos en jarra. Easter egg pedido por el admin
 * el 18-11-2026: al pulsarlo suelta, en un bocadillo encima de él, una frase
 * corta de villano de dibujos, retadora y de broma. Nunca repite la anterior y
 * el bocadillo se va solo a los 2,6 s.
 *
 * Además, la primera vez que aparece en pantalla (al bajar por la página o, en
 * el móvil, al deslizar el camino) suelta una frase él solo, sin pulsarlo: es su
 * forma de presentarse. Primero solo en el móvil; desde el 18-11-2026, también
 * en el ordenador.
 * Solo una vez por visita.
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
  "¿Otra vez tú? Muajajá.",
  "Ni el halving te salva.",
  "Tu stop loss no me asusta.",
  "¿FOMO? Yo lo provoco.",
  "Aquí no valen atajos.",
  "Sin repasar, ni lo intentes.",
  "Hodlea esos nervios.",
  "¿Apalancado? Mal empiezas.",
  "Mis preguntas no son airdrops.",
  "Te veo muy confiado… jé.",
  "¿El temario? Ni lo abriste.",
  "A mí no me engañas con memes.",
  "Peor que un whitepaper.",
  "Cuidado, que muerdo… preguntas.",
  "Huelo a quien no estudió.",
  "Hoy no es tu día de suerte.",
  "¿Seguro? Piénsalo dos veces.",
  "Dificultad: modo bajista.",
  "El certificado se gana. ¡Ja!",
  "¿Vienes a por mí? Valiente.",
];

const DURA = 2600;

export default function RetoFinal() {
  const [frase, setFrase] = useState<number | null>(null);
  const ultima = useRef(-1);
  const espera = useRef(0);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => () => window.clearTimeout(espera.current), []);

  const hablar = () => {
    let n = Math.floor(Math.random() * FRASES.length);
    if (n === ultima.current) n = (n + 1) % FRASES.length;
    ultima.current = n;
    setFrase(n);
    window.clearTimeout(espera.current);
    espera.current = window.setTimeout(() => setFrase(null), DURA);
  };
  // Para el observador: siempre la última versión, sin volver a crearlo.
  const hablarRef = useRef(hablar);
  useEffect(() => {
    hablarRef.current = hablar;
  });

  // La primera vez que se ve casi entero (al deslizar la fila del
  // camino o al bajar por la página), habla solo. El observador tiene en
  // cuenta el recorte de la fila que se desliza: si está fuera, no cuenta.
  useEffect(() => {
    const el = boton.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.intersectionRatio >= 0.8)) {
          obs.disconnect();
          // Un respiro: que se le vea antes de que hable.
          window.setTimeout(() => hablarRef.current(), 350);
        }
      },
      { threshold: [0.8] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button ref={boton} type="button" className="ch-reto" onClick={hablar} aria-label="El examen final: púlsalo, si te atreves">
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
