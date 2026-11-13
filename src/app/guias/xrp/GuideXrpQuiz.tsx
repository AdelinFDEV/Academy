"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Cuál es la diferencia correcta entre Ripple, XRP y el XRP Ledger?",
    opts: [
      "Son tres nombres para exactamente lo mismo",
      "Ripple es la empresa, XRP es el activo digital y el XRP Ledger (XRPL) es la blockchain donde vive XRP",
      "Ripple es la blockchain y XRP es la empresa que la controla",
      "XRP es una empresa y Ripple es su token",
    ],
    ok: 1,
    exp: "Es una distinción clave: Ripple (antes Ripple Labs) es la empresa que impulsa el ecosistema; XRP es el activo digital nativo; y el XRP Ledger es la blockchain descentralizada, abierta, donde XRP funciona. La red existiría aunque Ripple desapareciera.",
  },
  {
    q: "¿Cómo consigue el XRP Ledger validar transacciones sin minería?",
    opts: [
      "Con prueba de trabajo, igual que Bitcoin",
      "Con un algoritmo de consenso (RPCA) en el que validadores de confianza acuerdan el estado; cada nodo confía en una lista de validadores (UNL)",
      "Un único servidor de Ripple decide todo",
      "Los usuarios votan con su saldo de XRP",
    ],
    ok: 1,
    exp: "El XRPL no usa prueba de trabajo ni minería. Emplea el Ripple Protocol Consensus Algorithm: los validadores proponen y, cuando una supermayoría (en torno al 80%) de los validadores en los que cada nodo confía —su Unique Node List— coincide, el ledger se cierra. Por eso es rápido y consume poca energía.",
  },
  {
    q: "¿Qué papel juega XRP como \"moneda puente\" (bridge currency)?",
    opts: [
      "Sirve solo para pagar comisiones dentro de Ripple",
      "Actúa como activo intermedio para convertir entre dos monedas (p. ej. dólar → XRP → euro) de forma rápida y barata, sin cuentas prefinanciadas",
      "Es una stablecoin anclada al dólar",
      "Es un token de gobernanza para votar en Ripple",
    ],
    ok: 1,
    exp: "La idea del On-Demand Liquidity (ODL) es usar XRP como puente: en lugar de que los bancos mantengan dinero inmovilizado en cuentas por todo el mundo (nostro/vostro), convierten a XRP, lo mueven en segundos y lo cambian a la moneda destino.",
  },
  {
    q: "¿Qué decidió, en esencia, el fallo de la jueza Torres (2023) en el caso SEC contra Ripple?",
    opts: [
      "Que XRP es siempre un valor (security) en cualquier venta",
      "Que las ventas programáticas de XRP en exchanges no constituyeron una oferta de valores, aunque ciertas ventas institucionales sí",
      "Que Ripple debía cerrar y devolver todo el XRP",
      "Que XRP quedaba prohibido en todo el mundo",
    ],
    ok: 1,
    exp: "El fallo fue matizado: la venta programática de XRP en el mercado abierto a compradores anónimos no se consideró oferta de valores, mientras que ciertas ventas directas a inversores institucionales sí encajaban en esa definición. Fue visto como una victoria parcial clave para Ripple.",
  },
  {
    q: "¿Cuál es una de las principales críticas de centralización al XRP Ledger y XRP?",
    opts: [
      "Que cualquiera puede imprimir XRP nuevo cuando quiera",
      "Que Ripple posee una gran parte del suministro (bloqueado en escrow y liberado por tramos) y ha tenido mucha influencia sobre la lista de validadores recomendada",
      "Que el XRPL no permite hacer transacciones",
      "Que XRP no tiene ningún límite de suministro",
    ],
    ok: 1,
    exp: "Aunque el consenso lo ejecutan validadores independientes, se critica que Ripple mantiene una porción muy grande del XRP (liberado mensualmente desde un escrow) y que durante años tuvo mucho peso en la lista de validadores por defecto. Ese control concentrado choca con el ideal de descentralización.",
  },
];

export default function GuideXrpQuiz() {
  return <GuideQuizBase slug="xrp" badgeId="guide-xrp" badgeName="Validador de Confianza" preguntas={PREGUNTAS} />;
}
