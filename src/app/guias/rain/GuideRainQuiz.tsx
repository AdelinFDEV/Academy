"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Lees que «Rain ha sufrido un robo de 1,1 millones». ¿Qué compruebas antes de vender tus RAIN?",
    opts: [
      "Nada: si dice Rain, es el token RAIN",
      "De qué Rain habla: hay varias empresas con ese nombre y el robo de agosto de 2026 fue a una de tarjetas, no al protocolo",
      "Solo si la noticia sale en español",
      "Que el precio haya bajado ese día",
    ],
    ok: 1,
    exp: "En el sector hay al menos tres empresas llamadas Rain. El robo de agosto de 2026 afectó a un contrato antiguo de tarjetas en Solana, sin relación con el token de Arbitrum.",
  },
  {
    q: "En un mercado de Rain, la acción del «Sí» cotiza a 0,30 dólares. ¿Qué te está diciendo ese precio?",
    opts: [
      "Que el mercado da a ese resultado un 30 % de probabilidades",
      "Que ganarás un 30 %",
      "Que Rain cobra un 30 % de comisión",
      "Que solo quedan un 30 % de acciones",
    ],
    ok: 0,
    exp: "Cada acción paga 1 dólar si su resultado ocurre y 0 si no. Por eso su precio funciona como una probabilidad: a 0,30, el mercado lo ve posible pero improbable.",
  },
  {
    q: "Según el libro blanco que Rain notificó en la UE, ¿qué derechos te da hoy tener RAIN?",
    opts: [
      "Una parte de las comisiones del protocolo",
      "La propiedad de una parte de la fundación",
      "Ningún derecho económico: está pensado para votar en una gobernanza que aún se está activando",
      "Derecho a que te recompren el token a precio fijo",
    ],
    ok: 2,
    exp: "El documento dice expresamente que RAIN no da propiedad, ni beneficios, ni derecho a reembolso. Lo que hace subir o bajar su precio es la demanda, no un flujo de dinero hacia ti.",
  },
  {
    q: "Rain capitaliza unos 2.640 millones de dólares y su TVL es de unos 6,6 millones. ¿Qué indica esa proporción?",
    opts: [
      "Que el protocolo es muy rentable",
      "Que el precio del token descuenta un crecimiento enorme que el uso actual todavía no muestra",
      "Que el TVL está mal medido y no hay que mirarlo",
      "Que el token está barato",
    ],
    ok: 1,
    exp: "El token vale unas 400 veces lo depositado en el protocolo. No dice que vaya a caer, pero sí que casi todo su valor es expectativa.",
  },
  {
    q: "Vives en España. ¿Qué diferencia hay entre comprar RAIN y apostar en los mercados de Rain?",
    opts: [
      "Ninguna: las dos cosas son juego",
      "Comprar el token es invertir en un criptoactivo; apostar en sus mercados es una actividad que la DGOJ trata como juego que exige licencia",
      "Las dos están prohibidas por MiCA",
      "Apostar es legal y comprar el token no",
    ],
    ok: 1,
    exp: "El token tributa como cualquier criptomoneda. Los mercados de predicción, según la DGOJ en mayo de 2026, son juego, y operar sin licencia española no está autorizado.",
  },
];

export default function GuideRainQuiz() {
  return <GuideQuizBase slug="rain" badgeId="guide-rain" badgeName="Paraguas Abierto" preguntas={PREGUNTAS} />;
}
