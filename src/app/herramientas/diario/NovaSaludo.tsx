"use client";

import { useState, useSyncExternalStore } from "react";
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
 * El objetivo de la semana de abajo es una maqueta: el de verdad lo pone Nova
 * cada lunes según lo que más flojo vaya (tjNova.ts).
 */
function saludoDeHora(h: number | null): string {
  if (h == null) return "Hola";
  if (h >= 6 && h < 14) return "Buenos días";
  if (h >= 14 && h < 21) return "Buenas tardes";
  return "Buenas noches";
}

const sinSuscripcion = () => () => {};

export default function NovaSaludo() {
  const theta = useMotionValue(0);
  // La hora del visitante: en el servidor (y al hidratar) no hay, y sale «Hola».
  const saludo = saludoDeHora(useSyncExternalStore(sinSuscripcion, () => new Date().getHours(), () => null));
  const [alegre, setAlegre] = useState(false);

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

      <div className="dj-saludo-objetivo" aria-hidden="true">
        <span className="dj-saludo-objetivo-cab">
          <small>Objetivo de la semana</small>
          <b>4<i>/5</i></b>
        </span>
        <span className="dj-saludo-objetivo-texto">
          <strong>Arriesga 2 % o menos en todas tus operaciones</strong>
          <i><b style={{ width: "80%" }} /></i>
          <small>Te falta 1 operación dentro del límite</small>
        </span>
      </div>
    </div>
  );
}
