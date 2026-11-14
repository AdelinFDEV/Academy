"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Un fondo de Uniswap tiene 100 ETH y 300.000 USDC. Alguien compra 10 ETH. ¿Qué le pasa al precio del ETH en ese fondo?",
    opts: [
      "Nada: el precio lo fija el mercado, no el fondo",
      "Sube, porque quedan menos ETH y más USDC en el fondo",
      "Baja, porque se han vendido ETH",
      "Lo decide la gobernanza de Uniswap en la siguiente votación",
    ],
    ok: 1,
    exp: "El precio sale de la proporción entre los dos montones. Al llevarse ETH y dejar USDC, el ETH escasea en el fondo y su precio sube. Lo devuelven a su sitio los arbitrajistas.",
  },
  {
    q: "Pones una tolerancia de deslizamiento del 0,5 % y, mientras tu operación espera, el precio se mueve un 1 % en tu contra. ¿Qué ocurre?",
    opts: [
      "Se ejecuta igual, al precio nuevo",
      "Se ejecuta a medias",
      "La operación falla y no se hace el cambio, aunque pagas la comisión de red",
      "Uniswap te devuelve la diferencia",
    ],
    ok: 2,
    exp: "La tolerancia es un límite: si el precio final empeora más de lo que aceptaste, el contrato rechaza el cambio. Pierdes el gas consumido, pero no el dinero del intercambio.",
  },
  {
    q: "Aportas liquidez a un fondo ETH/USDC de rango completo y el ETH duplica su precio. Sin contar comisiones, frente a haber guardado los dos tokens…",
    opts: [
      "Tienes lo mismo",
      "Tienes un 5,7 % menos, porque el fondo ha ido vendiendo ETH mientras subía",
      "Tienes el doble",
      "Lo has perdido todo",
    ],
    ok: 1,
    exp: "Es la pérdida impermanente: 2√2 / 3 − 1 ≈ −5,7 %. Sigues ganando dinero en euros, pero menos que quien se quedó quieto. Solo las comisiones pueden compensarlo.",
  },
  {
    q: "Desde diciembre de 2025 está activo el «fee switch». ¿Qué se hace con la parte de las comisiones que va al protocolo?",
    opts: [
      "Se reparte entre los que tienen UNI como un dividendo",
      "Se la queda Uniswap Labs",
      "Se acumula en un contrato y solo se puede retirar quemando UNI",
      "Se devuelve a quien hizo el intercambio",
    ],
    ok: 2,
    exp: "Las comisiones del protocolo van a un contrato del que solo se sacan quemando UNI en otro. UNI no paga dividendos: lo que hace el mecanismo es reducir la cantidad de UNI que existe.",
  },
  {
    q: "Declaras en España. Cambias en Uniswap 1 ETH que compraste por 2.000 € por USDC, cuando el ETH vale 3.000 €. ¿Qué dice Hacienda?",
    opts: [
      "Nada, porque no has pasado a euros",
      "Que es una permuta: tienes una ganancia de unos 1.000 € que va a la base del ahorro",
      "Que solo tributa si usas un exchange español",
      "Que tributa cuando retires los USDC al banco, nunca antes",
    ],
    ok: 1,
    exp: "Cambiar una criptomoneda por otra es una permuta: se calcula la ganancia en ese momento, con el valor de mercado en euros de la operación. Las comisiones de red pagadas cuentan en el cálculo.",
  },
];

export default function GuideUniswapQuiz() {
  return <GuideQuizBase slug="uniswap" badgeId="guide-uniswap" badgeName="Producto Constante" preguntas={PREGUNTAS} />;
}
