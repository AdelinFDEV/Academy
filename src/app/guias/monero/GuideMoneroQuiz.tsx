"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué tres datos de una operación oculta Monero y Bitcoin enseña?",
    opts: [
      "La fecha, la comisión y el número de bloque",
      "Quién envía, quién recibe y cuánto",
      "El país, el idioma y el dispositivo",
      "El nombre, el DNI y el banco",
    ],
    ok: 1,
    exp: "Monero usa una técnica para cada dato: firmas en anillo para el emisor, direcciones de un solo uso para el receptor y cantidades cifradas. La fecha y la comisión sí se ven.",
  },
  {
    q: "Vives en España y tienes XMR en tu propia cartera. ¿Estás incumpliendo alguna ley?",
    opts: [
      "Sí: Monero está prohibida en la Unión Europea",
      "Sí, desde que Kraken la retiró en 2024",
      "No: tenerla es legal; las restricciones afectan a las empresas que la ofrecen",
      "Solo si tienes más de 1.000 euros",
    ],
    ok: 2,
    exp: "Ninguna norma prohíbe a un particular tener Monero. La regulación europea obliga a exchanges y custodios, que es lo que complica comprarla y venderla.",
  },
  {
    q: "¿Qué cambia el 10 de julio de 2027 con el reglamento europeo contra el blanqueo?",
    opts: [
      "Se confiscan las monedas de privacidad",
      "Los exchanges y custodios de la UE no podrán operar con monedas de anonimato reforzado",
      "Monero pasa a ser pública por ley",
      "Nada: es una recomendación",
    ],
    ok: 1,
    exp: "El artículo 79 del Reglamento (UE) 2024/1624 prohíbe a los proveedores de servicios mantener cuentas con estas monedas. No afecta a tu cartera propia, pero cierra la vía regulada.",
  },
  {
    q: "¿Cuántas monedas de Monero llegará a haber?",
    opts: [
      "21 millones, como Bitcoin",
      "18,4 millones, ya están todas",
      "No hay tope: se crean 0,6 XMR por bloque para siempre",
      "Las que decida su fundación cada año",
    ],
    ok: 2,
    exp: "Desde junio de 2022 la emisión es fija y perpetua: 0,6 XMR por bloque. Es una inflación pequeña, pensada para que los mineros cobren siempre.",
  },
  {
    q: "Compras Monero, sube y la vendes con ganancia. ¿Qué dice Hacienda?",
    opts: [
      "Nada, porque las operaciones no se ven",
      "Que tributa igual que con cualquier otra criptomoneda, y que el registro lo tienes que guardar tú",
      "Que está exenta por ser una moneda de privacidad",
      "Que solo tributa si la cambias en un exchange español",
    ],
    ok: 1,
    exp: "La obligación de declarar no depende de que la cadena sea pública. Con Monero, además, no puedes reconstruir tu historial desde la cadena: o lo guardaste, o no lo tienes.",
  },
];

export default function GuideMoneroQuiz() {
  return <GuideQuizBase slug="monero" badgeId="guide-monero" badgeName="Sobre Cerrado" preguntas={PREGUNTAS} />;
}
