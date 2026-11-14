"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "En una subred de Bittensor, ¿qué decide cuánto TAO cobra cada minero?",
    opts: [
      "La potencia de cálculo que demuestra, como en Bitcoin",
      "La nota que le ponen los validadores al trabajo que entrega, combinada por Yuma",
      "La cantidad de TAO que tiene en staking",
      "El orden de llegada: el primero que se inscribe cobra más",
    ],
    ok: 1,
    exp: "Los validadores prueban a los mineros y les ponen nota. Yuma junta esas notas, pesando más las de los validadores con más stake, y de ahí sale el reparto. No se paga por gastar energía, sino por lo que el validador considera útil.",
  },
  {
    q: "Tienes TAO y lo pones en staking en la subred 64. ¿Qué ocurre en el momento de hacerlo?",
    opts: [
      "Nada: tu TAO queda bloqueado y lo recuperas igual",
      "Tu TAO se cambia por el token alfa de esa subred, al precio de su fondo de liquidez",
      "Compras una parte de la empresa que gestiona la subred",
      "Se quema y a cambio recibes intereses fijos",
    ],
    ok: 1,
    exp: "Desde dTAO, hacer staking en una subred es un cambio de TAO por su token alfa. Al salir, el cambio es al revés y al precio de ese momento: puedes recuperar más TAO o bastante menos.",
  },
  {
    q: "¿Qué cambió con el primer halving de Bittensor, en diciembre de 2025?",
    opts: [
      "El tope pasó de 21 a 10,5 millones de TAO",
      "La red emite 0,5 TAO por bloque en vez de 1, unos 3.600 al día",
      "El precio de TAO se duplicó por diseño",
      "Los validadores dejaron de cobrar",
    ],
    ok: 1,
    exp: "El halving reduce a la mitad la emisión nueva. Se activa al alcanzar una cantidad emitida (10,5 millones), no en una fecha. El precio no lo fija el protocolo: el día del halving TAO cayó un 8 %.",
  },
  {
    q: "En julio de 2024 se robaron unos 32.000 TAO. ¿Qué falló?",
    opts: [
      "Alguien rompió la criptografía de la blockchain de Bittensor",
      "Un validador malicioso reescribió bloques",
      "Una versión falsa de la librería de Bittensor, subida a un repositorio público, robaba las claves de quien la instalaba",
      "Un exchange perdió los fondos de sus clientes",
    ],
    ok: 2,
    exp: "La cadena no se rompió. El fallo estuvo en el software que usaba la gente: la versión 6.12.2 del paquete de Python traía código que enviaba las claves privadas al atacante. La red se puso en modo seguro para cortar los robos.",
  },
  {
    q: "Vives en España. Pasas 10 TAO del root a una subred cuando TAO vale más de lo que pagaste. ¿Qué es eso para Hacienda, con el criterio más prudente?",
    opts: [
      "Nada, porque no has pasado a euros",
      "Una permuta: cambias TAO por otro criptoactivo y declaras la ganancia de ese momento",
      "Un rendimiento del trabajo",
      "Una donación a la subred",
    ],
    ok: 1,
    exp: "Cambiar una criptomoneda por otra es una permuta (art. 37.1.h de la Ley del IRPF), y el token alfa es otro criptoactivo. Lo que recibes después como recompensa se declara aparte, como rendimiento del capital mobiliario.",
  },
];

export default function GuideBittensorQuiz() {
  return <GuideQuizBase slug="bittensor" badgeId="guide-bittensor" badgeName="Mente Distribuida" preguntas={PREGUNTAS} />;
}
