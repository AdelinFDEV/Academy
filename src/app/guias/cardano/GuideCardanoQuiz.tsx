"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Delegas tus ADA en un pool desde tu propia cartera. ¿Dónde están tus monedas mientras tanto?",
    opts: [
      "En la cartera del operador del pool",
      "Bloqueadas en un contrato durante 21 días",
      "En tu cartera: delegas el derecho a validar, no las monedas",
      "En el exchange donde las compraste",
    ],
    ok: 2,
    exp: "En Cardano el staking no mueve las monedas: siguen en tu cartera y puedes gastarlas o venderlas cuando quieras. El pool no puede tocarlas.",
  },
  {
    q: "Tu pool deja de funcionar durante dos semanas. ¿Qué te pasa a ti?",
    opts: [
      "Pierdes una parte de tus ADA como castigo",
      "Dejas de cobrar esas épocas, pero no pierdes monedas",
      "Tus ADA quedan bloqueados hasta que vuelva",
      "La red te cambia de pool automáticamente",
    ],
    ok: 1,
    exp: "Cardano no castiga a quien delega: si el pool falla, simplemente no hay recompensa esos días. Lo que toca es cambiar de pool, que se hace desde la cartera.",
  },
  {
    q: "Tienes 10.000 ADA delegados con un rendimiento del 2,5 % anual. ¿Cuánto cobras, más o menos, al cabo de un año?",
    opts: ["25 ADA", "250 ADA", "2.500 ADA", "250 euros, sea cual sea el precio"],
    ok: 1,
    exp: "10.000 × 2,5 % = 250 ADA. Se cobra en ADA, repartido en épocas de cinco días: lo que eso valga en euros depende del precio de ADA ese día.",
  },
  {
    q: "¿Por qué los contratos inteligentes tardaron cuatro años en llegar a Cardano?",
    opts: [
      "Porque la red estuvo parada casi todo ese tiempo",
      "Porque el proyecto publica y somete a revisión cada pieza antes de construirla",
      "Porque Cardano no permite aplicaciones",
      "Porque dependía de una actualización de Ethereum",
    ],
    ok: 1,
    exp: "Es su método: primero el estudio revisado por otros investigadores, después el código. Da solidez, y cuesta tiempo: es a la vez su argumento y su crítica más repetida.",
  },
  {
    q: "Un exchange te ofrece «staking de ADA al 4 %» con un botón. ¿Qué pierdes frente a hacerlo desde tu cartera?",
    opts: [
      "Nada: es exactamente lo mismo",
      "El derecho a cobrar en ADA",
      "La custodia: las monedas las tiene el exchange, con el riesgo de que bloquee retiradas o quiebre",
      "La posibilidad de vender tus ADA en el futuro",
    ],
    ok: 2,
    exp: "La ventaja de Cardano es que tus monedas no salen de tu cartera. En un exchange eso desaparece: dependes de que el exchange siga funcionando y te deje retirar.",
  },
];

export default function GuideCardanoQuiz() {
  return <GuideQuizBase slug="cardano" badgeId="guide-cardano" badgeName="Delegador Paciente" preguntas={PREGUNTAS} />;
}
