"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Creas una cartera de Stellar y un amigo te envía 0,3 XLM para probar. ¿Qué pasa?",
    opts: [
      "Llegan sin problema",
      "El envío falla: la cuenta no existe hasta que recibe al menos 1 XLM",
      "Llegan, pero tardan 24 horas",
      "Se convierten en dólares automáticamente",
    ],
    ok: 1,
    exp: "Una dirección vacía no es una cuenta en Stellar. Hay que activarla con 1 XLM como mínimo, que son dos reservas base de 0,5 y quedan retenidos.",
  },
  {
    q: "Tu cuenta tiene 3 líneas de confianza y nada más. ¿Cuánto XLM queda retenido?",
    opts: ["1 XLM", "1,5 XLM", "2,5 XLM", "3 XLM"],
    ok: 2,
    exp: "1 XLM por la cuenta más 0,5 por cada línea de confianza: 1 + 3 × 0,5 = 2,5 XLM. Ese saldo sigue siendo tuyo, pero no se puede gastar mientras las líneas sigan abiertas.",
  },
  {
    q: "Envías XLM a tu cuenta de un exchange y olvidas el memo. ¿Qué ocurre?",
    opts: [
      "La red rechaza la operación y te devuelve el dinero",
      "El dinero llega a la dirección del exchange, pero no a tu saldo",
      "Se cobra una comisión doble",
      "Nada: el memo es opcional en todos los casos",
    ],
    ok: 1,
    exp: "El exchange usa una sola dirección para todos sus clientes y distingue los ingresos por el memo. Sin él, la operación es válida y definitiva, y recuperarla depende de su soporte.",
  },
  {
    q: "¿Cuánto rinde tener XLM en tu propia cartera?",
    opts: [
      "Un 1 % anual, por la inflación de la red",
      "Un 4 % anual, por el staking",
      "Nada: Stellar no tiene staking ni paga por validar",
      "Depende del número de líneas de confianza",
    ],
    ok: 2,
    exp: "En Stellar nadie compite por validar y no hay recompensas. La inflación del 1 % se eliminó en 2019. Si alguien ofrece rendimiento por XLM, lo paga una empresa, con su riesgo.",
  },
  {
    q: "¿Qué hizo la fundación de Stellar con las monedas en noviembre de 2019?",
    opts: [
      "Creó 50.000 millones nuevos",
      "Las repartió todas entre los usuarios",
      "Destruyó unos 55.000 millones, más de la mitad de las que existían",
      "Las vendió a Ripple",
    ],
    ok: 2,
    exp: "La oferta total pasó de unos 105.000 millones a unos 50.000 millones, y no se crearán más. Cerca de un tercio de lo que queda sigue en manos de la fundación.",
  },
];

export default function GuideStellarQuiz() {
  return <GuideQuizBase slug="stellar" badgeId="guide-stellar" badgeName="Línea de Confianza" preguntas={PREGUNTAS} />;
}
