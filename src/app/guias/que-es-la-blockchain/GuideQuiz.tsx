"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué característica hace que la blockchain sea resistente a la manipulación?",
    opts: [
      "Está almacenada en un servidor central muy seguro",
      "Cada bloque contiene el hash del bloque anterior, haciendo que cualquier alteración sea detectable",
      "Usa contraseñas muy largas para proteger los datos",
      "Solo los administradores pueden leer los datos",
    ],
    ok: 1,
    exp: "El encadenamiento criptográfico es clave: modificar un bloque cambia su hash, rompiendo la cadena entera.",
  },
  {
    q: "¿Cuál es la diferencia entre Proof of Work y Proof of Stake?",
    opts: [
      "PoW usa mineros con hardware; PoS usa validadores que bloquean tokens como garantía",
      "Son exactamente lo mismo, solo cambia el nombre",
      "PoS requiere más energía que PoW",
      "PoW es más reciente que PoS",
    ],
    ok: 0,
    exp: "PoW (Bitcoin) gasta energía computacional; PoS (Ethereum post-Merge) requiere depositar tokens como colateral.",
  },
  {
    q: "Un smart contract es...",
    opts: [
      "Un contrato PDF firmado digitalmente",
      "Un acuerdo legal entre dos partes revisado por abogados",
      "Código auto-ejecutable en la blockchain que opera sin intermediarios",
      "Una app móvil para gestionar contratos",
    ],
    ok: 2,
    exp: "Los smart contracts son programas inmutables en blockchain que se ejecutan automáticamente cuando se cumplen las condiciones.",
  },
  {
    q: "¿Cuánto vale aproximadamente la capitalización total del mercado crypto en junio de 2026?",
    opts: [
      "$450 millones",
      "$21 billones",
      "$2.17 billones",
      "$780 mil millones",
    ],
    ok: 2,
    exp: "En junio de 2026 la capitalización global crypto rondaba los $2.17 billones (trillion en inglés).",
  },
  {
    q: "¿Qué amenaza representa la computación cuántica para la blockchain?",
    opts: [
      "Ninguna, la blockchain es inherentemente cuántica",
      "Podría romper las claves criptográficas actuales (ECDSA), haciendo wallets vulnerables",
      "Solo afecta a Bitcoin, no a otras blockchains",
      "La computación cuántica haría las transacciones más lentas",
    ],
    ok: 1,
    exp: "Algoritmos cuánticos como Shor podrían resolver la criptografía de curva elíptica. La respuesta es migrar a criptografía post-cuántica (PQC).",
  },
];

/**
 * El quiz de la primera guía. Desde el 17-11-2026 usa el motor común
 * (GuideQuizBase) con el estilo «Cuaderno de estudio»; conserva sus textos.
 */
export default function GuideQuiz() {
  return (
    <GuideQuizBase
      slug="que-es-la-blockchain"
      badgeId="guide-blockchain"
      badgeName="Arquitecto de Cadenas"
      preguntas={PREGUNTAS}
      textos={{
        acierto: "Correcto",
        fallo: "Incorrecto",
        perfecto: (badge, total) =>
          `Has conseguido el badge "${badge}" con ${total}/${total} respuestas correctas. Aparece ya en tu panel de Logros.`,
        incompleto: (score, total) =>
          `Obtuviste ${score}/${total}. Necesitas las ${total} respuestas correctas para desbloquear el badge. ¡Inténtalo de nuevo!`,
      }}
    />
  );
}
