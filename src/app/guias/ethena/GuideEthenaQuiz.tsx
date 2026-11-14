"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Ethena tiene 1.000 $ en ETH y una posición corta de 1.000 $ en un perpetuo de ETH. ETH cae un 40 %. ¿Cuánto vale el conjunto?",
    opts: [
      "600 $, porque ETH ha caído",
      "Unos 1.000 $: la posición corta gana lo que pierde el ETH",
      "1.400 $, porque la posición corta multiplica la ganancia",
      "0 $: la posición corta se liquida",
    ],
    ok: 1,
    exp: "El ETH pasa a valer 600 $ y la posición corta gana 400 $. Una pata compensa a la otra, y eso es lo que mantiene el valor de USDe cerca de 1 dólar.",
  },
  {
    q: "Durante un mes, el funding de los perpetuos es negativo. ¿Qué le pasa a Ethena?",
    opts: [
      "Nada: el funding solo afecta a quien opera con apalancamiento",
      "Cobra más, porque las posiciones cortas cobran siempre",
      "Su posición corta paga en vez de cobrar, y la pérdida se cubre con otros ingresos o con el fondo de reserva",
      "USDe deja de poder canjearse",
    ],
    ok: 2,
    exp: "Con funding negativo los cortos pagan a los largos. Ethena es una posición corta enorme, así que paga. Lo absorben primero el resto de ingresos y, si no basta, el fondo de reserva, que no es ilimitado.",
  },
  {
    q: "¿Cuál es la diferencia entre USDe y sUSDe?",
    opts: [
      "Ninguna: son dos nombres del mismo token",
      "sUSDe es USDe depositado en el contrato de Ethena, que acumula el rendimiento en su valor",
      "sUSDe es la versión regulada de USDe para Europa",
      "sUSDe es el token de gobernanza del protocolo",
    ],
    ok: 1,
    exp: "USDe no paga nada por tenerlo. Al depositarlo recibes sUSDe, cuyo valor en USDe sube a medida que entra el rendimiento. Según la documentación de Ethena, sUSDe no se ofrece a residentes en la Unión Europea.",
  },
  {
    q: "En octubre de 2025, USDe cotizó a 0,65 $ en Binance. ¿Qué dice eso de sus riesgos?",
    opts: [
      "Que el respaldo había perdido un tercio de su valor",
      "Nada: fue un error de pantalla",
      "Que el precio en un mercado concreto puede hundirse aunque el respaldo esté intacto, y que quien lo usaba como garantía pudo ser liquidado",
      "Que Ethena congeló los canjes",
    ],
    ok: 2,
    exp: "El respaldo siguió por encima de lo emitido y los canjes funcionaron. El problema fue el libro de órdenes de Binance, que se quedó sin compradores, y las garantías valoradas con ese precio.",
  },
  {
    q: "¿Qué hace el «fee switch» aprobado por la gobernanza de Ethena en 2026?",
    opts: [
      "Reparte ya el 95 % de los ingresos entre quienes tienen ENA",
      "Dedica hasta el 95 % de ciertos ingresos netos a recomprar ENA, pero solo cuando USDe supere un tamaño mínimo que hoy no alcanza",
      "Cobra una comisión a quien tiene USDe",
      "Quema todos los ENA de los inversores",
    ],
    ok: 1,
    exp: "Está aprobado y dormido: se activa cuando la oferta de USDe llegue al primer umbral, fijado inicialmente en 7.500 millones de dólares. En noviembre de 2026 rondaba los 4.900 millones.",
  },
];

export default function GuideEthenaQuiz() {
  return <GuideQuizBase slug="ethena" badgeId="guide-ethena" badgeName="Delta Cero" preguntas={PREGUNTAS} />;
}
