"use client";

import { useEffect, useState } from "react";
import { useMotionValue } from "framer-motion";
import NovaHead from "@/components/trading/NovaHead";
import NovaRoom from "@/components/trading/NovaRoom";

/**
 * Nova en grande, en su habitación, saludando: la cabecera de la ficha del
 * Diario (08-11-2026). Es la misma Nova que vive dentro del diario (NovaHead y
 * NovaRoom), no un dibujo aparte.
 *
 * El saludo depende de la hora del visitante: en el servidor y en la
 * hidratación sale «Hola», y en el navegador el que toca (como TjWelcome).
 * Al pasar el ratón brinca de alegría, igual que en el diario.
 *
 * El pulso de abajo es una maqueta: el de verdad sale de las operaciones de
 * cada uno. Las cuatro partes sí son las reales (tjNova.ts).
 */
function saludoDeHora(h: number): string {
  if (h >= 6 && h < 14) return "Buenos días";
  if (h >= 14 && h < 21) return "Buenas tardes";
  return "Buenas noches";
}

const PARTES: [string, number][] = [
  ["Riesgo", 23],
  ["Resultados", 19],
  ["Emociones", 20],
  ["Constancia", 20],
];

export default function NovaSaludo() {
  const theta = useMotionValue(0);
  const [saludo, setSaludo] = useState("Hola");
  const [alegre, setAlegre] = useState(false);

  useEffect(() => {
    setSaludo(saludoDeHora(new Date().getHours()));
  }, []);

  return (
    <div className="dj-saludo">
      <div className="dj-saludo-sala" aria-hidden="true">
        <NovaRoom />
      </div>

      <div className="dj-saludo-bocadillo">
        <strong>{saludo}, soy Nova.</strong>
        <span>
          Vivo dentro de tu diario. Leo cada operación que apuntas y te cuento lo importante: tu riesgo, tus rachas
          y cómo te afecta el ánimo.
        </span>
      </div>

      <div
        className="dj-saludo-nova"
        onMouseEnter={() => setAlegre(true)}
        onMouseLeave={() => setAlegre(false)}
        aria-hidden="true"
      >
        <NovaHead theta={theta} face={alegre ? "joy" : "happy"} activity="none" flying={false} joy={alegre} talking={false} track />
      </div>

      <div className="dj-saludo-pulso" aria-hidden="true">
        <span className="dj-saludo-pulso-cab">
          <small>Tu pulso</small>
          <b>82<i>/100</i></b>
        </span>
        <span className="dj-saludo-partes">
          {PARTES.map(([nombre, v]) => (
            <span key={nombre}>
              <small>{nombre}</small>
              <i><b style={{ width: `${(v / 25) * 100}%` }} /></i>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
