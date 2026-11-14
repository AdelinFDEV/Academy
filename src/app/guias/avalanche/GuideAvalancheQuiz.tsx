"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Tu cartera de MetaMask funciona en Avalanche sin instalar nada nuevo. ¿Por qué?",
    opts: [
      "Porque Avalanche es una capa 2 de Ethereum",
      "Porque la C-Chain ejecuta la misma máquina virtual que Ethereum, con direcciones del mismo formato",
      "Porque AVAX y ETH son la misma moneda en redes distintas",
      "Porque la X-Chain traduce las operaciones de Ethereum",
    ],
    ok: 1,
    exp: "La C-Chain es una implementación de la máquina virtual de Ethereum. Por eso aceptan sus contratos, sus carteras y sus direcciones 0x. Pero es una red aparte: no comparte seguridad ni saldos con Ethereum.",
  },
  {
    q: "Un exchange te deja retirar AVAX por la X-Chain o por la C-Chain, y quieres usarlo en una aplicación de finanzas descentralizadas. ¿Qué eliges?",
    opts: [
      "La X-Chain, porque es la más barata",
      "Da igual: las tres cadenas comparten saldo",
      "La C-Chain, que es donde viven los contratos y las aplicaciones",
      "La P-Chain, que es la principal",
    ],
    ok: 2,
    exp: "Cada cadena tiene su propio saldo y su propio formato de dirección. Las aplicaciones están en la C-Chain. Lo que llega a la X-Chain hay que pasarlo después, con una operación de traspaso entre cadenas.",
  },
  {
    q: "¿Cómo decide un nodo de Avalanche qué bloque acepta?",
    opts: [
      "Espera a que lo confirmen seis bloques posteriores, como en Bitcoin",
      "Pregunta una y otra vez a 20 validadores elegidos al azar, hasta que la mayoría le contesta lo mismo 20 veces seguidas",
      "Lo decide la fundación Avalanche cada pocos segundos",
      "Gana quien resuelve antes un cálculo, como en la minería",
    ],
    ok: 1,
    exp: "Es el consenso por muestreo: muestras de 20 validadores, ponderadas por lo que tienen en staking. Con 15 respuestas iguales cuenta como éxito, y con 20 éxitos seguidos la decisión es definitiva.",
  },
  {
    q: "Delegas 1.000 AVAX durante un año y tu validador pasa caído un tercio del tiempo. ¿Qué ocurre?",
    opts: [
      "Pierdes parte de tus AVAX como castigo",
      "Cobras dos tercios de la recompensa",
      "Recuperas tus 1.000 AVAX, pero no cobras ninguna recompensa",
      "Puedes retirar tus AVAX en cuanto lo notas",
    ],
    ok: 2,
    exp: "En Avalanche no hay castigo sobre lo depositado, pero la recompensa es de todo o nada: sin el 90 % de tiempo activo, cero. Y lo bloqueado no se puede sacar antes de que termine el plazo.",
  },
  {
    q: "Las comisiones de Avalanche se queman todas. ¿Por qué sigue creciendo el número de AVAX?",
    opts: [
      "Porque la fundación vende AVAX cada mes",
      "Porque las recompensas del staking crean AVAX nuevos, muchos más de los que se queman",
      "Porque la quema solo es una forma de hablar",
      "No crece: está fija en 720 millones",
    ],
    ok: 1,
    exp: "En el tercer trimestre de 2026 se crearon unos 2,62 millones de AVAX en recompensas y se quemaron 59.126, unas 44 veces menos. El límite real es el tope de 720 millones, no la quema.",
  },
];

export default function GuideAvalancheQuiz() {
  return <GuideQuizBase slug="avalanche" badgeId="guide-avalanche" badgeName="Veinte al Azar" preguntas={PREGUNTAS} />;
}
