"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "El precio del HBAR se duplica. ¿Qué pasa con lo que pagas por enviar HBAR en Hedera?",
    opts: [
      "Se duplica, porque la comisión está fijada en HBAR",
      "Sigue costando lo mismo en dólares, y pagas la mitad de HBAR",
      "Desaparece: con el precio alto la red no cobra",
      "Lo decide cada nodo en ese momento",
    ],
    ok: 1,
    exp: "Las tarifas de Hedera se fijan en dólares y se cobran en HBAR al cambio del momento. Si el HBAR vale el doble, hacen falta la mitad de HBAR para pagar lo mismo.",
  },
  {
    q: "¿Qué significa que Hedera use «votación virtual»?",
    opts: [
      "Que los usuarios votan por internet las mejoras de la red",
      "Que cada nodo calcula lo que votarían los demás a partir del historial compartido, sin enviar votos",
      "Que los votos se hacen con una inteligencia artificial",
      "Que solo vota el nodo que más HBAR tiene",
    ],
    ok: 1,
    exp: "Como todos los nodos acaban con el mismo grafo de quién contó qué a quién, cada uno puede deducir el voto de los demás. No hace falta mandar mensajes de votación.",
  },
  {
    q: "Pones tus HBAR en staking el lunes y el miércoles necesitas venderlos. ¿Qué ocurre?",
    opts: [
      "No puedes: quedan bloqueados 21 días",
      "Puedes venderlos cuando quieras; solo dejas de ganar la recompensa de lo que ya no tienes",
      "Pierdes una parte como castigo por retirarlos antes",
      "Tienes que pedir permiso al nodo",
    ],
    ok: 1,
    exp: "En Hedera el staking no bloquea nada ni tiene castigos. Los HBAR siguen en tu cuenta y puedes moverlos en cualquier momento.",
  },
  {
    q: "A noviembre de 2026, ¿quién puede tener un nodo de consenso en la red principal de Hedera?",
    opts: [
      "Cualquiera que deposite 32 HBAR",
      "Solo los miembros del consejo",
      "Quien tenga más ordenadores",
      "Cualquiera que descargue el código de Hiero",
    ],
    ok: 1,
    exp: "Los 30 nodos de la red principal son de organizaciones del consejo. El código es abierto, pero conectar un nodo a la red principal no lo es.",
  },
  {
    q: "Recibes 40 HBAR de recompensas de staking. ¿Cómo lo trata Hacienda en España?",
    opts: [
      "No tributa hasta que vendas",
      "Como rendimiento del capital mobiliario, valorado en euros el día que llega a tu cuenta",
      "Como un premio de lotería",
      "Está exento por ser una cantidad pequeña",
    ],
    ok: 1,
    exp: "La Dirección General de Tributos trata las recompensas de staking como rendimiento del capital mobiliario. En Hedera llegan de golpe cuando tu cuenta se mueve, así que apunta esa fecha.",
  },
];

export default function GuideHederaQuiz() {
  return <GuideQuizBase slug="hedera" badgeId="guide-hedera" badgeName="Rumor Ordenado" preguntas={PREGUNTAS} />;
}
