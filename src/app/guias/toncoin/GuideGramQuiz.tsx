"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Tenías 500 TON en tu cartera antes del 15 de junio de 2026. ¿Qué tienes que hacer para conservarlos ahora que la moneda se llama Gram?",
    opts: [
      "Canjearlos en la web oficial antes de que acabe el plazo",
      "Nada: siguen siendo 500, ahora con el nombre GRAM",
      "Enviarlos a un exchange para que los convierta",
      "Conectar la cartera a un bot de Telegram que los migra",
    ],
    ok: 1,
    exp: "El cambio fue solo de nombre, ticker y logotipo. No hubo canje, puente ni reclamación: cualquier web o bot que te pida «migrar» tus TON es una estafa.",
  },
  {
    q: "Desde la subida de velocidad de 2026, la red produce unas seis veces más bloques y cada bloque paga la misma recompensa que antes. ¿Qué le pasa a quien guarda sus Gram sin hacer staking?",
    opts: [
      "Nada: su parte de la red no cambia",
      "Gana lo mismo que quien hace staking",
      "Su parte de la oferta total encoge, porque cada año se emiten cerca de un 4 % más de monedas",
      "Pierde las monedas al cabo de un año",
    ],
    ok: 2,
    exp: "La recompensa del staking sale de monedas nuevas. Si no participas, sigues teniendo las mismas, pero sobre una oferta mayor: es dilución, no una ganancia gratis para los demás.",
  },
  {
    q: "¿Cuál es la diferencia práctica entre el antiguo Wallet de Telegram en modo custodio y la Gram Wallet que Telegram empezó a repartir en agosto de 2026?",
    opts: [
      "Ninguna: las dos guardan tus claves en los servidores de Telegram",
      "En la custodia, otro guarda las claves; en la Gram Wallet, la clave está en tu dispositivo y nadie puede recuperarla por ti",
      "La Gram Wallet solo sirve para pagar Stars",
      "La custodia es gratis y la Gram Wallet cobra comisión por cada envío",
    ],
    ok: 1,
    exp: "Una cartera sin custodia te da el control y también toda la responsabilidad: si pierdes la frase de recuperación, nadie puede devolverte el acceso.",
  },
  {
    q: "¿Por qué el 21 de febrero de 2027 es una fecha que conviene tener apuntada si sigues esta moneda?",
    opts: [
      "Es cuando Telegram cotiza en bolsa",
      "Se acaba el periodo de tres meses para usar el nombre «Gram (prev. Toncoin)»",
      "Termina la congelación de 171 carteras de los primeros mineros, con unos 1.081 millones de monedas",
      "Es la fecha de la siguiente votación del nombre",
    ],
    ok: 2,
    exp: "En 2023 los validadores congelaron durante cuatro años las carteras de mineros que nunca habían movido nada. Son cerca de una quinta parte de todas las monedas y, a partir de esa fecha, podrán moverse.",
  },
  {
    q: "Declaras en España. Recibiste recompensas de staking y además el nombre de tu moneda cambió de TON a GRAM. ¿Qué tiene consecuencias en tu declaración?",
    opts: [
      "Las dos cosas: el cambio de nombre cuenta como una permuta",
      "Ninguna, porque son monedas de una red extranjera",
      "Las recompensas de staking, valoradas en euros al recibirlas; el cambio de nombre no es una venta",
      "Solo el cambio de nombre, porque el staking está exento",
    ],
    ok: 2,
    exp: "Un cambio de nombre sin canje no transmite nada, así que tu precio y tu fecha de compra no cambian. Las recompensas, en cambio, son un rendimiento que se declara por su valor en euros cuando las recibes.",
  },
];

export default function GuideGramQuiz() {
  return <GuideQuizBase slug="toncoin" badgeId="guide-toncoin" badgeName="Vuelta al Gram" preguntas={PREGUNTAS} />;
}
