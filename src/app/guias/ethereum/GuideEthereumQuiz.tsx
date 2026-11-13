"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Tienes 300 USDC en tu cartera, en la red de Ethereum, y 0 ETH. Quieres enviarlos a un exchange. ¿Qué pasa?",
    opts: [
      "Se envían, y la comisión se descuenta de los USDC",
      "No puedes enviarlos: la comisión se paga en ETH y no tienes",
      "Se envían gratis, porque los USDC son una stablecoin",
      "El exchange paga la comisión por ti al recibirlos",
    ],
    ok: 1,
    exp: "En Ethereum el gas se paga siempre en ETH, muevas lo que muevas. Sin ETH en la cartera, los USDC se quedan donde están. Por eso conviene dejar siempre un poco de ETH para la salida.",
  },
  {
    q: "Enviar ETH gasta 21.000 unidades de gas. Con el gas a 10 gwei, ¿cuánto cuesta la comisión?",
    opts: ["0,00021 ETH", "0,0021 ETH", "21 ETH", "0,000021 ETH"],
    ok: 0,
    exp: "21.000 × 10 gwei = 210.000 gwei. Un gwei es una milmillonésima de ether, así que son 0,00021 ETH. Con el gas a 1 gwei serían diez veces menos.",
  },
  {
    q: "¿Qué cambió en Ethereum el 15 de septiembre de 2022, con The Merge?",
    opts: [
      "Se fijó un máximo de 21 millones de ETH",
      "Las comisiones pasaron a ser siempre de un céntimo",
      "La red dejó la minería y pasó a validarse con ETH bloqueado como fianza",
      "Ethereum se dividió en varias capas 2",
    ],
    ok: 2,
    exp: "The Merge cambió la prueba de trabajo por la prueba de participación: ya no se valida gastando electricidad, sino arriesgando ETH. No tocó las comisiones ni puso un tope a la oferta.",
  },
  {
    q: "¿Qué hace una capa 2 como Arbitrum o Base?",
    opts: [
      "Sustituye a Ethereum con una moneda propia que no depende de él",
      "Procesa muchas operaciones fuera y apunta el resultado en Ethereum, por lo que operar cuesta mucho menos",
      "Guarda una copia de seguridad de tus claves",
      "Convierte tus ETH en bitcoin de forma automática",
    ],
    ok: 1,
    exp: "Una capa 2 agrupa miles de operaciones, las procesa aparte y deja en Ethereum solo el resumen. La seguridad de fondo la sigue poniendo Ethereum, y las comisiones bajan a céntimos.",
  },
  {
    q: "Declaras en España y cambias 1 ETH por USDC sin pasar por euros. ¿Tiene efecto fiscal?",
    opts: [
      "No: solo tributa cuando conviertes a euros",
      "No, si el cambio lo haces en un exchange descentralizado",
      "Sí: es una permuta, y calculas la ganancia o la pérdida en ese momento",
      "Solo si el importe supera los 6.000 euros",
    ],
    ok: 2,
    exp: "Cambiar una criptomoneda por otra es una permuta: Hacienda la trata como una venta, aunque no toques los euros. El detalle está en la guía de fiscalidad.",
  },
];

export default function GuideEthereumQuiz() {
  return <GuideQuizBase slug="ethereum" badgeId="guide-ethereum" badgeName="Ordenador Mundial" preguntas={PREGUNTAS} />;
}
