"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Alguien te pide que le envíes USDT «por TRC-20». ¿Qué te está pidiendo?",
    opts: [
      "Que uses un exchange llamado TRC",
      "Que envíes el USDT por la red de TRON",
      "Que conviertas el USDT en TRX antes de enviarlo",
      "Que pagues una comisión del 20 %",
    ],
    ok: 1,
    exp: "TRC-20 es el nombre del formato de las monedas que viven en TRON. El USDT existe en varias redes; TRC-20 es su versión en esta.",
  },
  {
    q: "Recibes 300 USDT en una cartera de TRON recién creada, con 0 TRX. ¿Puedes enviarlos a otra dirección?",
    opts: [
      "Sí, la comisión se descuenta de los USDT",
      "Sí, los primeros envíos son gratis",
      "No: la comisión se paga en TRX, y no tienes",
      "No, hay que esperar 14 días",
    ],
    ok: 2,
    exp: "Enviar USDT consume energía, y sin energía la red quema TRX. Con cero TRX los USDT se quedan bloqueados hasta que alguien te envíe unos pocos.",
  },
  {
    q: "Enviar 5 USDT por TRON cuesta unos 6,9 TRX. ¿Cuánto cuesta enviar 50.000 USDT a esa misma dirección?",
    opts: ["Diez mil veces más", "Un porcentaje de lo enviado", "Lo mismo: unos 6,9 TRX", "Nada: los envíos grandes no pagan"],
    ok: 2,
    exp: "El coste depende de lo que la operación le exige a la red, no de la cantidad que mueves. Por eso un envío de prueba pequeño sale igual de barato que el definitivo.",
  },
  {
    q: "¿Cuántos participantes producen los bloques de TRON?",
    opts: ["Cientos de miles, como en Ethereum", "27 superrepresentantes, elegidos por votación", "Uno solo: la Fundación TRON", "Los mineros, como en Bitcoin"],
    ok: 1,
    exp: "Son 27, elegidos con los votos de quienes tienen TRX bloqueados. Pocos productores hacen la red rápida y fácil de cambiar, y también más concentrada.",
  },
  {
    q: "¿Qué puede hacer Tether, la empresa que emite el USDT, con el saldo de una dirección de TRON?",
    opts: [
      "Nada: una vez en tu cartera, nadie puede tocarlo",
      "Congelarlo, de modo que no se pueda mover",
      "Convertirlo en TRX sin avisar",
      "Cobrarte una comisión mensual",
    ],
    ok: 1,
    exp: "El contrato del USDT permite congelar el saldo de cualquier dirección. Tether lo hace con fondos ligados a delitos, y puede alcanzar a quien los recibió después.",
  },
];

export default function GuideTronQuiz() {
  return <GuideQuizBase slug="tron" badgeId="guide-tron" badgeName="Peaje Pagado" preguntas={PREGUNTAS} />;
}
