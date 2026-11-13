"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Por qué un contrato inteligente no puede consultar por sí mismo el precio del ether en internet?",
    opts: [
      "Porque consultar internet cuesta demasiado gas",
      "Porque todos los ordenadores de la red deben llegar al mismo resultado, y eso es imposible si cada uno consulta fuera por su cuenta",
      "Porque los precios de las criptomonedas son secretos",
      "Sí puede: Chainlink solo lo hace más rápido",
    ],
    ok: 1,
    exp: "Una blockchain solo conoce lo que está escrito en ella. Si cada nodo consultara una web, podrían obtener respuestas distintas y la red no se pondría de acuerdo. Por eso hace falta un oráculo.",
  },
  {
    q: "Siete nodos dan el precio. Seis dicen unos 3.000 $ y uno, que miente, dice 9.000 $. ¿Qué precio se apunta si se usa la mediana?",
    opts: ["Unos 3.850 $, la media de todos", "9.000 $, el más alto", "Unos 3.000 $", "Ninguno: la ronda se anula"],
    ok: 2,
    exp: "La mediana es el valor del medio una vez ordenados. El mentiroso queda en un extremo y no cuenta. Con la media, en cambio, habría desviado el precio a unos 3.850 $.",
  },
  {
    q: "¿Cuál de estas frases describe bien a Chainlink?",
    opts: [
      "Una blockchain rival de Ethereum",
      "Un exchange donde se compran criptomonedas",
      "Una red de operadores que lleva datos de fuera a los contratos de otras blockchains",
      "Una stablecoin respaldada por dólares",
    ],
    ok: 2,
    exp: "Chainlink no tiene un registro propio en el que guardes monedas: es un servicio que trabaja para las blockchains, llevándoles los datos que ellas no pueden ver.",
  },
  {
    q: "¿Qué pasó con el precio de LUNA que daba Chainlink en mayo de 2022?",
    opts: [
      "Chainlink fue hackeado y dio un precio inventado",
      "El precio tenía un mínimo configurado en 0,10 $ y dejó de bajar aunque LUNA valía mucho menos",
      "Los nodos se desconectaron durante una semana",
      "Chainlink se negó a dar el precio de LUNA desde el principio",
    ],
    ok: 1,
    exp: "El dato dejó de actualizarse por debajo de su suelo de seguridad. Aplicaciones que se fiaban de él valoraron LUNA a 0,10 $ cuando valía cien veces menos, y alguien lo aprovechó.",
  },
  {
    q: "Compras LINK pensando en ponerlo a rendir con el staking. ¿Qué deberías saber antes?",
    opts: [
      "Que el staking está garantizado al 10 % anual",
      "Que la parte abierta al público está llena y el staking cubre hoy un solo servicio",
      "Que el staking crea LINK nuevo sin límite",
      "Que retirar es inmediato",
    ],
    ok: 1,
    exp: "El staking actual es una primera versión con cupo: caben 45 millones de LINK y la parte pública está llena. Además, solo respalda el precio de ETH en dólares, y retirar lleva semanas.",
  },
];

export default function GuideChainlinkQuiz() {
  return <GuideQuizBase slug="chainlink" badgeId="guide-chainlink" badgeName="Mensajero Fiable" preguntas={PREGUNTAS} />;
}
