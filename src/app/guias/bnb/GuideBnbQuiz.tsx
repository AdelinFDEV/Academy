"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Cuál de estas cosas puedes hacer con BNB sin tener cuenta en Binance?",
    opts: [
      "Conseguir descuento en las comisiones del exchange",
      "Pagar el gas de una operación en BNB Chain desde tu propia cartera",
      "Entrar en los repartos de monedas nuevas de Binance",
      "Ninguna: BNB solo funciona dentro de Binance",
    ],
    ok: 1,
    exp: "BNB tiene dos vidas. Los descuentos y los repartos dependen del exchange. Pagar el gas, validar y votar se hace en BNB Chain, desde una cartera propia y sin cuenta en ningún sitio.",
  },
  {
    q: "¿Qué pasa con los BNB en una quema trimestral?",
    opts: [
      "Se reparten entre quienes tienen BNB",
      "Binance los vende en el mercado",
      "Se envían a una dirección de la que nadie puede sacarlos",
      "Se guardan en una reserva para emergencias",
    ],
    ok: 2,
    exp: "Quemar es destruir: las monedas van a una dirección sin dueño y dejan de contar. Nadie recibe nada. Solo baja el total que existe.",
  },
  {
    q: "Tienes 800 dólares en una stablecoin en BNB Chain y 0 BNB. Quieres enviarlos. ¿Qué pasa?",
    opts: [
      "Se envían: la comisión se descuenta de la stablecoin",
      "No puedes: el gas se paga siempre en BNB",
      "La red te presta el gas y lo cobra después",
      "Se envían gratis por ser una stablecoin",
    ],
    ok: 1,
    exp: "En BNB Chain toda operación se paga en BNB, muevas lo que muevas. Sin unos céntimos de BNB, el resto de tus monedas se queda donde está.",
  },
  {
    q: "¿Por qué BNB Chain es mucho más barata que Ethereum?",
    opts: [
      "Porque Binance paga las comisiones de todos",
      "Porque usa una tecnología que Ethereum no puede copiar",
      "Porque la mantienen unas pocas decenas de validadores, y ponerse de acuerdo entre pocos es rápido y barato",
      "Porque no registra las operaciones en una blockchain",
    ],
    ok: 2,
    exp: "Es un intercambio: comisiones casi nulas a cambio de concentrar el control en pocos validadores. Eso la hace más rápida y también menos resistente.",
  },
  {
    q: "Binance no tiene licencia europea desde julio de 2026. ¿Qué significa para quien tiene BNB en una cartera propia?",
    opts: [
      "Que sus BNB han dejado de existir",
      "Que tiene que enviarlos a Binance antes de fin de año",
      "Nada en cuanto a tenerlos: BNB Chain no es una empresa ni necesita licencia",
      "Que Hacienda los considera ilegales",
    ],
    ok: 2,
    exp: "La norma afecta a las empresas que dan servicio, no a la red ni a quien guarda sus monedas. Lo que se pierde en España son las ventajas dentro del exchange.",
  },
];

export default function GuideBnbQuiz() {
  return <GuideQuizBase slug="bnb" badgeId="guide-bnb" badgeName="Combustible de la Casa" preguntas={PREGUNTAS} />;
}
