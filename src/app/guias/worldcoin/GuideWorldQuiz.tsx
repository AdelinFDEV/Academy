"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué parte del cuerpo escanea el Orb para verificar tu identidad?",
    opts: ["Huella dactilar", "El iris del ojo", "La cara completa", "La voz"],
    ok: 1,
    exp: "El Orb captura el patrón único del iris y lo convierte en un hash matemático — la compañía afirma que la imagen original se descarta tras procesarla.",
  },
  {
    q: "¿Quién es uno de los cofundadores de Worldcoin (hoy World)?",
    opts: ["Elon Musk", "Vitalik Buterin", "Sam Altman", "Changpeng Zhao"],
    ok: 2,
    exp: "Sam Altman, CEO de OpenAI, cofundó Worldcoin junto a Alex Blania a través de la empresa Tools for Humanity.",
  },
  {
    q: "¿Qué es una \"prueba de conocimiento cero\" (zero-knowledge proof) en World ID?",
    opts: [
      "Un examen que hay que aprobar",
      "Una forma de demostrar algo sin revelar los datos que lo prueban",
      "Un tipo de minería de tokens",
      "Una contraseña de un solo uso",
    ],
    ok: 1,
    exp: "Permite demostrar \"soy un humano único ya verificado\" sin revelar cuál humano eres ni tus datos biométricos.",
  },
  {
    q: "¿Sobre qué corre World Chain, la red donde se mueve WLD?",
    opts: [
      "Es su propia blockchain independiente desde cero",
      "Una Layer 2 de Ethereum construida sobre OP Stack",
      "Una sidechain de Bitcoin",
      "Un fork de Solana",
    ],
    ok: 1,
    exp: "World Chain es una Layer 2 de Ethereum basada en OP Stack (la tecnología de Optimism), dentro de la \"Superchain\".",
  },
  {
    q: "¿Por qué Worldcoin ha sido prohibido o restringido en varios países?",
    opts: [
      "Por evasión de impuestos",
      "Por preocupaciones sobre privacidad y recolección de datos biométricos",
      "Porque no tenía token propio",
      "Por ser una red demasiado lenta",
    ],
    ok: 1,
    exp: "Reguladores de Kenia, España, Hong Kong y otros países han suspendido o investigado Worldcoin por cómo recoge y gestiona datos biométricos sensibles.",
  },
];

export default function GuideWorldQuiz() {
  return <GuideQuizBase slug="worldcoin" badgeId="guide-worldcoin" badgeName="Prueba de Humanidad" preguntas={PREGUNTAS} />;
}
