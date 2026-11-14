"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Dejas 2 ETH como colateral cuando ETH vale 3.000 € y pides 3.000 € en USDC. El umbral de liquidación es del 80 %. ¿Cuál es tu factor de salud?",
    opts: ["0,5", "1,6", "2", "0,8"],
    ok: 1,
    exp: "Colateral de 6.000 € por el umbral del 80 % son 4.800 €. Divididos entre los 3.000 € de deuda dan 1,6. Por debajo de 1, te pueden liquidar.",
  },
  {
    q: "Con esa misma posición, ¿a qué precio de ETH te liquidarían?",
    opts: [
      "A 3.000 €, el precio al que pediste",
      "A 2.400 €, el 80 % del precio",
      "A 1.875 €: 3.000 € de deuda entre 2 ETH y entre 0,8",
      "Nunca, porque la deuda está en una stablecoin",
    ],
    ok: 2,
    exp: "El precio de liquidación es la deuda dividida entre la cantidad de colateral y el umbral. Es una caída del 37,5 % desde 3.000 €, y sube un poco cada día por los intereses.",
  },
  {
    q: "En un mercado de Aave, casi todo el USDC depositado está prestado. ¿Qué pasa con los tipos de interés?",
    opts: [
      "Nada: los fija la gobernanza una vez al año",
      "Bajan, para atraer a más prestatarios",
      "Suben con fuerza, para que unos devuelvan y otros depositen",
      "Se congelan hasta que alguien deposite",
    ],
    ok: 2,
    exp: "El tipo depende de la utilización. Pasado el punto óptimo, la curva se empina mucho: pedir prestado sale caro y depositar paga más, y así vuelve a haber liquidez para retirar.",
  },
  {
    q: "¿Por qué un préstamo flash no necesita colateral?",
    opts: [
      "Porque Aave conoce la identidad de quien lo pide",
      "Porque si no se devuelve en la misma transacción, la transacción entera se anula",
      "Porque lo cubre Umbrella si sale mal",
      "Porque solo se presta a contratos auditados",
    ],
    ok: 1,
    exp: "Pedir, usar y devolver ocurre en una sola transacción. Si al final no está el dinero más la comisión, nada de lo anterior llega a ocurrir. Por eso Aave no corre riesgo.",
  },
  {
    q: "Vives en España y depositas USDC en Aave para cobrar intereses. ¿Cómo los califica Hacienda según la consulta V0648-24?",
    opts: [
      "No tributan hasta que retires el dinero a tu banco",
      "Como rendimiento del capital mobiliario, en la base del ahorro",
      "Como rendimiento del trabajo",
      "Están exentos por ser una stablecoin",
    ],
    ok: 1,
    exp: "La Dirección General de Tributos calificó así los rendimientos de prestar criptoactivos. Se valoran en euros y van a la base del ahorro. Lo que no aclaró es cómo tratar la entrada y salida del depósito.",
  },
];

export default function GuideAaveQuiz() {
  return <GuideQuizBase slug="aave" badgeId="guide-aave" badgeName="Lejos del Uno" preguntas={PREGUNTAS} />;
}
