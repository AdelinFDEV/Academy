"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué es lo que más se olvida apuntar en un diario de trading, y más información da?",
    opts: [
      "El precio de entrada",
      "Por qué entraste y cómo te sentías al hacerlo",
      "La hora exacta al segundo",
      "El nombre del exchange",
    ],
    ok: 1,
    exp: "El resultado dice qué pasó, pero no por qué. Sin el motivo de la entrada no puedes saber si seguiste tu plan o improvisaste y tuviste suerte, y sin el ánimo no ves si operas peor eufórico, cansado o con ganas de revancha.",
  },
  {
    q: "Arriesgas 50 € en una operación (la distancia hasta tu stop) y la cierras ganando 125 €. ¿Cuánto es en múltiplos de R?",
    opts: ["+1,25 R", "+2,5 R", "+125 R", "No se puede saber sin el win rate"],
    ok: 1,
    exp: "R es lo que arriesgabas: 50 €. Ganar 125 € es ganar 2,5 veces lo arriesgado, +2,5 R. Medir en R permite comparar operaciones de tamaños distintos y saber si las ganadoras compensan a las perdedoras.",
  },
  {
    q: "Tu win rate es del 70 %, pero tu ganancia media es de 20 € y tu pérdida media de 80 €. ¿Qué te dice el diario?",
    opts: [
      "Que el método es bueno, porque aciertas casi siempre",
      "Que pierdes dinero: de cada 10 operaciones ganas 140 € y pierdes 240 €",
      "Que estás en tablas",
      "Nada, el win rate es lo único que importa",
    ],
    ok: 1,
    exp: "7 × 20 € = 140 € ganados y 3 × 80 € = 240 € perdidos: −100 € cada diez operaciones. Un win rate alto con pérdidas grandes es el patrón típico de quien cierra pronto las ganadoras y aguanta las perdedoras.",
  },
  {
    q: "¿A partir de cuántas operaciones apuntadas empiezan a significar algo las estadísticas del diario?",
    opts: ["Con 5 basta", "Unas 30, como referencia mínima", "Hacen falta 1.000", "Desde la primera"],
    ok: 1,
    exp: "Por debajo de treinta casi nada es concluyente: con diez operaciones, un 70 % de acierto puede ser pura suerte. A partir de ahí las medias y las rachas empiezan a describir tu forma de operar, y cuantas más, mejor.",
  },
  {
    q: "Llevas tres pérdidas seguidas. ¿Qué es lo más útil que puedes hacer con el diario?",
    opts: [
      "Dejar de apuntar hasta que vuelvan las ganancias",
      "Seguir apuntando y revisar si las pérdidas respetaron tu plan y tu riesgo",
      "Borrar las pérdidas para que no estropeen las estadísticas",
      "Doblar el tamaño para recuperar rápido",
    ],
    ok: 1,
    exp: "Una mala racha es cuando más información da el diario: te dice si son pérdidas normales de un método que funciona o si te has saltado el plan. Dejar de apuntar o borrar las malas falsea los números, y doblar el tamaño es revenge trading.",
  },
];

export default function GuideDiarioQuiz() {
  return <GuideQuizBase slug="como-hacer-un-diario-de-trading" badgeId="guide-diario-trading" badgeName="Bitácora al Día" preguntas={PREGUNTAS} />;
}
