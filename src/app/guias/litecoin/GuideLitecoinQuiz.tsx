"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Litecoin tiene bloques cuatro veces más frecuentes y cuatro veces más monedas que Bitcoin. ¿Qué consigue con eso?",
    opts: [
      "Que haya más monedas en circulación cada año que en Bitcoin, sin límite",
      "El mismo ritmo de emisión en el tiempo, repartido en unidades más pequeñas y con pagos más ágiles",
      "Que sea cuatro veces más segura que Bitcoin",
      "Que sus mineros cobren cuatro veces más",
    ],
    ok: 1,
    exp: "Con un bloque cada 2,5 minutos y un tope de 84 millones, el calendario de emisión es el de Bitcoin multiplicado por cuatro en unidades. Lo que gana es rapidez para confirmar, no seguridad.",
  },
  {
    q: "Una tienda te pide 6 confirmaciones para dar por bueno tu pago en LTC. ¿Qué es lo más realista?",
    opts: [
      "Exactamente 2,5 minutos, lo que tarda un bloque",
      "Unos 15 minutos de media, y en 9 de cada 10 casos menos de unos 23",
      "Exactamente 15 minutos, porque los bloques llegan como un reloj",
      "Una hora, igual que en Bitcoin",
    ],
    ok: 1,
    exp: "Seis bloques de 2,5 minutos dan 15 de media, pero los bloques llegan al azar. Por eso hay que contar con un margen: en 9 de cada 10 pagos, unos 23 minutos como mucho.",
  },
  {
    q: "Un exchange te pide más confirmaciones para un depósito de LTC que para uno de BTC. ¿Por qué?",
    opts: [
      "Porque Litecoin tiene más monedas",
      "Porque la red de Litecoin tiene mucha menos potencia de minado y deshacer bloques es más barato",
      "Porque Litecoin no usa prueba de trabajo",
      "Porque así cobra más comisión",
    ],
    ok: 1,
    exp: "Una confirmación vale lo que cuesta reescribirla. Con menos potencia de cálculo detrás, cada bloque de Litecoin protege menos que uno de Bitcoin, y se compensa pidiendo más.",
  },
  {
    q: "¿Por qué los grandes exchanges de Corea del Sur retiraron Litecoin en junio de 2022?",
    opts: [
      "Por el halving de 2023",
      "Porque Charlie Lee vendió sus monedas",
      "Porque la actualización MWEB permite ocultar cantidades y direcciones, y su ley prohíbe las operaciones anónimas",
      "Porque la red dejó de funcionar varios días",
    ],
    ok: 2,
    exp: "MWEB añadió privacidad opcional en mayo de 2022. Aunque sea voluntaria, los exchanges coreanos no podían garantizar que sus clientes no la usaran, y su ley contra el blanqueo no admite operaciones anónimas.",
  },
  {
    q: "Vives en España y pagas un café con LTC que compraste más barato. ¿Qué dice Hacienda?",
    opts: [
      "Nada: los pagos pequeños no cuentan",
      "Que es una venta, y la ganancia frente a lo que te costó ese LTC tributa en la base del ahorro",
      "Que tributa la cafetería, no tú",
      "Que solo cuenta si compraste el LTC en un exchange español",
    ],
    ok: 1,
    exp: "Gastar una criptomoneda es transmitirla. La diferencia entre lo que valía al pagar y lo que te costó es ganancia o pérdida patrimonial, aunque el importe sea pequeño.",
  },
];

export default function GuideLitecoinQuiz() {
  return <GuideQuizBase slug="litecoin" badgeId="guide-litecoin" badgeName="Plata Digital" preguntas={PREGUNTAS} />;
}
