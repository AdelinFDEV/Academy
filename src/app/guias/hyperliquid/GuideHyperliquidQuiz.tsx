"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué es Hyperliquid, en esencia?",
    opts: [
      "Una wallet para guardar criptomonedas",
      "Un exchange de perpetuos que corre sobre su propia blockchain con un libro de órdenes 100% on-chain",
      "Una stablecoin respaldada por dólares",
      "Una red social para traders",
    ],
    ok: 1,
    exp: "Hyperliquid es un DEX de derivados (perpetuos) construido sobre su propia L1. A diferencia de otros DEX, su libro de órdenes vive entero on-chain, buscando la velocidad de un exchange centralizado sin renunciar a la autocustodia.",
  },
  {
    q: "¿Qué diferencia a Hyperliquid de la mayoría de DEX como Uniswap?",
    opts: [
      "Usa un creador de mercado automático (AMM) con pools de liquidez",
      "Usa un libro de órdenes (order book) donde se cruzan órdenes reales de compra y venta",
      "No permite operar, solo consultar precios",
      "Funciona únicamente sobre Ethereum",
    ],
    ok: 1,
    exp: "La mayoría de DEX usan un AMM (pools y una fórmula matemática). Hyperliquid replica el modelo de los exchanges profesionales: un libro de órdenes con límite central (CLOB) donde compradores y vendedores se cruzan a precios concretos.",
  },
  {
    q: "¿Qué es el vault HLP (Hyperliquidity Provider)?",
    opts: [
      "El equipo fundador de Hyperliquid",
      "Un fondo comunitario que hace de creador de mercado y liquidador, y en el que los usuarios pueden depositar para compartir sus ganancias (y pérdidas)",
      "Una comisión que se paga por cada operación",
      "El nombre de la blockchain de Hyperliquid",
    ],
    ok: 1,
    exp: "HLP es un vault en el que cualquiera puede depositar. Actúa como market maker y liquidador del protocolo, y reparte entre los depositantes las ganancias o pérdidas de esa actividad. Es una forma de participar en el 'lado de la casa'.",
  },
  {
    q: "¿Qué tuvo de especial el airdrop del token HYPE en noviembre de 2024?",
    opts: [
      "Que solo lo recibieron fondos de inversión",
      "Que repartió una gran parte del suministro entre los usuarios reales, sin haber vendido tokens a inversores de capital riesgo (VCs)",
      "Que fue gratuito para cualquier persona del mundo sin haber usado el producto",
      "Que se canceló antes de repartirse",
    ],
    ok: 1,
    exp: "HYPE destacó por repartir una porción muy grande del suministro directamente entre quienes habían usado el protocolo, sin rondas de financiación con VCs. El proyecto se autofinanció, algo poco común en cripto.",
  },
  {
    q: "¿Cuál es uno de los principales riesgos que se le señalan a Hyperliquid?",
    opts: [
      "Que no tiene ningún producto funcionando",
      "La centralización: pocos validadores y decisiones del equipo, como se vio en el incidente del token JELLY, cuestionan hasta qué punto es descentralizado",
      "Que es imposible retirar fondos",
      "Que no cobra comisiones y por eso no es sostenible",
    ],
    ok: 1,
    exp: "Pese a ser on-chain, Hyperliquid ha operado con un conjunto reducido de validadores y decisiones muy ligadas al equipo. El incidente de marzo de 2025 con el token JELLY —donde se intervino para proteger al HLP— reavivó el debate sobre su grado real de descentralización.",
  },
];

export default function GuideHyperliquidQuiz() {
  return <GuideQuizBase slug="hyperliquid" badgeId="guide-hyperliquid" badgeName="Maestro del Libro de Órdenes" preguntas={PREGUNTAS} />;
}
