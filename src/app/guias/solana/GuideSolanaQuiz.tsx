"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué resuelve el «reloj» de Solana, la prueba de historia?",
    opts: [
      "Decide quién se queda con las comisiones",
      "Deja sellado el orden de las operaciones, para que los ordenadores no pierdan tiempo discutiéndolo",
      "Impide que el precio de SOL caiga",
      "Hace que la red no necesite validadores",
    ],
    ok: 1,
    exp: "Es una cuenta que solo se puede hacer paso a paso: cada operación queda marcada con el momento en que entró. Con el orden ya resuelto, la red se ahorra ese acuerdo y va más deprisa.",
  },
  {
    q: "Recibes por primera vez una moneda nueva en tu cartera de Solana y ves que te han retenido unos 0,002 SOL. ¿Qué es?",
    opts: [
      "Una comisión que cobra el exchange",
      "Un impuesto de la red que no se devuelve",
      "Un depósito por la cuenta que guarda esa moneda, que recuperas si la cierras",
      "Un error: no debería retenerse nada",
    ],
    ok: 2,
    exp: "Cada moneda distinta necesita su pequeña cuenta, y Solana retiene una fianza por el espacio que ocupa. No es una comisión: se devuelve al cerrar la cuenta.",
  },
  {
    q: "¿Qué pasa con tu dinero cuando la red de Solana «se cae»?",
    opts: [
      "Se pierde y hay que reclamarlo",
      "No se pierde, pero nadie puede mover nada hasta que los validadores reinician la red",
      "Se convierte automáticamente a dólares",
      "Pasa a estar en la red de Ethereum",
    ],
    ok: 1,
    exp: "Una parada detiene la producción de bloques: los saldos siguen ahí, pero quedan inmovilizados durante horas. El riesgo no es perderlo, es no poder actuar justo cuando lo necesitas.",
  },
  {
    q: "El staking de SOL paga alrededor de un 5,3 % y la red crea cerca de un 3,7 % de SOL nuevo al año. ¿Cuánto ganas de verdad frente a no hacer nada?",
    opts: ["Un 9 %", "Un 5,3 %", "Alrededor de un 1,6 %", "Nada: se anulan exactamente"],
    ok: 2,
    exp: "La mayor parte de lo que paga el staking es SOL recién creado, que diluye a todos. La diferencia, en torno al 1,6 %, es lo que ganas en peso dentro de la red. Y todo ello en SOL, cuyo precio se mueve mucho más.",
  },
  {
    q: "¿Cuál es la crítica principal al diseño de Solana?",
    opts: [
      "Que sus comisiones son las más caras del mercado",
      "Que no permite crear aplicaciones",
      "Que validarla exige servidores caros, así que la mantiene menos gente",
      "Que tiene un máximo de monedas demasiado bajo",
    ],
    ok: 2,
    exp: "La velocidad se consigue exigiendo máquinas muy potentes. Cuanto más cuesta ser validador, menos participantes hay y más concentrada queda la red.",
  },
];

export default function GuideSolanaQuiz() {
  return <GuideQuizBase slug="solana" badgeId="guide-solana" badgeName="A Contrarreloj" preguntas={PREGUNTAS} />;
}
