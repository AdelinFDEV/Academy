"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué problema resuelve principalmente la red Render?",
    opts: [
      "Almacenar archivos de forma descentralizada",
      "Conectar a quien necesita potencia de GPU con quien tiene GPUs ociosas",
      "Enviar mensajes cifrados entre usuarios",
      "Verificar la identidad de las personas",
    ],
    ok: 1,
    exp: "Render es un mercado descentralizado de potencia GPU: los artistas y estudios que necesitan renderizar pagan a los node operators que prestan la capacidad ociosa de sus tarjetas gráficas.",
  },
  {
    q: "¿Qué empresa y persona están detrás del origen de Render?",
    opts: [
      "Consensys y Joseph Lubin",
      "OTOY y Jules Urbach, creadores del motor OctaneRender",
      "OpenAI y Sam Altman",
      "Nvidia y Jensen Huang",
    ],
    ok: 1,
    exp: "Render nació de OTOY, la empresa fundada por Jules Urbach que desarrolla OctaneRender, uno de los motores de renderizado por GPU más usados de la industria.",
  },
  {
    q: "En 2023, ¿qué cambio importante hizo la red Render?",
    opts: [
      "Cerró y devolvió los fondos a los inversores",
      "Migró de Ethereum a Solana y cambió su ticker de RNDR a RENDER",
      "Se fusionó con Bitcoin",
      "Abandonó el token y pasó a cobrar en dólares",
    ],
    ok: 1,
    exp: "A finales de 2023 la red migró de Ethereum a Solana buscando comisiones más bajas y mayor velocidad, y aprovechó para renombrar el token de RNDR a RENDER.",
  },
  {
    q: "¿Qué es el \"Burn-and-Mint Equilibrium\" (BME) en Render?",
    opts: [
      "Un torneo entre mineros de GPU",
      "Un modelo donde se queman los tokens que pagan los usuarios y se emiten nuevos para recompensar a los nodos",
      "Un sistema de préstamos con intereses",
      "Un tipo de wallet oficial",
    ],
    ok: 1,
    exp: "En el BME, cuando un artista paga un trabajo se queman (burn) tokens RENDER, y a la vez se emiten (mint) nuevos para pagar a los node operators. El balance entre ambos determina si la oferta sube o baja.",
  },
  {
    q: "¿Por qué se asocia tanto a Render con la narrativa DePIN e IA?",
    opts: [
      "Porque es una red social para artistas",
      "Porque coordina hardware físico real (GPUs) mediante un token, y esas mismas GPUs sirven también para computación de IA",
      "Porque solo funciona con inteligencia artificial",
      "Porque no usa hardware, solo software en la nube",
    ],
    ok: 1,
    exp: "DePIN significa \"redes de infraestructura física descentralizada\": Render coordina GPUs reales del mundo con incentivos en token. Como esas GPUs también entrenan y ejecutan modelos de IA, encaja de lleno en la narrativa IA + DePIN.",
  },
];

export default function GuideRenderQuiz() {
  return <GuideQuizBase slug="render" badgeId="guide-render" badgeName="Nodo Verificado" preguntas={PREGUNTAS} />;
}
