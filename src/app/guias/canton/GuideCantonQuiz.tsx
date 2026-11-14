"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Un banco presta a una gestora en Canton Network. ¿Quién ve los detalles de esa operación?",
    opts: [
      "Todos los nodos de la red, como en Ethereum",
      "Las partes del contrato y quien ellas autoricen; el sincronizador ordena los mensajes sin leerlos",
      "Solo Digital Asset, que custodia los datos",
      "Nadie, ni siquiera el banco y la gestora",
    ],
    ok: 1,
    exp: "Cada nodo guarda solo los contratos de las partes que aloja. El Global Synchronizer ordena y confirma mensajes cifrados, pero no ve su contenido.",
  },
  {
    q: "¿Qué pasa con las transferencias de Canton Coin en esa misma red?",
    opts: [
      "Son privadas, como todo lo demás",
      "Son públicas: posiciones y transferencias de CC se ven, a diferencia de los activos de los bancos",
      "No existen: CC solo se negocia en exchanges",
      "Solo las ve la Canton Foundation",
    ],
    ok: 1,
    exp: "El libro blanco de Canton Coin lo dice expresamente: sus posiciones y transferencias son visibles, para que se pueda medir el uso de la red. Lo privado son los contratos de las instituciones.",
  },
  {
    q: "¿Cómo llega Canton Coin a manos de alguien la primera vez?",
    opts: [
      "Por una preventa a fondos de capital riesgo en 2023",
      "Acuñándola a cambio de prestar un servicio a la red: infraestructura o aplicaciones",
      "Minándola con tarjetas gráficas",
      "La reparte Digital Asset cada año a sus accionistas",
    ],
    ok: 1,
    exp: "No hubo preventa ni reserva para fundadores. Se acuña por ronda, en proporción al trabajo aportado a la red, y se quema al pagar el tráfico.",
  },
  {
    q: "JPMorgan lleva su token de depósito a Canton. ¿Significa que necesitará comprar mucha Canton Coin?",
    opts: [
      "Sí: cada operación en la red exige tener CC",
      "No necesariamente: el tráfico puede pagarse mediante un tercero, y CC es un token opcional",
      "Sí, por ley estadounidense",
      "No, porque JPMorgan no paga comisiones",
    ],
    ok: 1,
    exp: "El propio diseño hace CC opcional para los usuarios. Por eso el uso institucional de la red no se traduce de forma automática en demanda de la moneda.",
  },
  {
    q: "Vives en España, compras CC y un año después la cambias por USDC con ganancia. ¿Qué ocurre con Hacienda?",
    opts: [
      "Nada, porque no has pasado a euros",
      "Es una permuta: tributa como ganancia patrimonial en la base del ahorro, aunque no hayas tocado euros",
      "Solo tributa si superas 50.000 euros",
      "Tributa en el país de la Canton Foundation",
    ],
    ok: 1,
    exp: "Cambiar una criptomoneda por otra es una transmisión. La ganancia se calcula en euros y se declara en la renta del año, igual que si hubieras vendido.",
  },
];

export default function GuideCantonQuiz() {
  return <GuideQuizBase slug="canton" badgeId="guide-canton" badgeName="Vista Reservada" preguntas={PREGUNTAS} />;
}
