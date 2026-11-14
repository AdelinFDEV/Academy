"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Un amigo te dice que Quant es «una blockchain como Ethereum, pero para bancos». ¿Qué le corriges?",
    opts: [
      "Nada: Quant tiene su propia cadena con validadores abiertos",
      "Que Quant es sobre todo una empresa que vende software para conectar redes y sistemas, y QNT es un token que vive en Ethereum",
      "Que Quant es una stablecoin respaldada por libras",
      "Que Quant es un exchange británico",
    ],
    ok: 1,
    exp: "Overledger es software de una empresa, Quant Network, que conecta blockchains entre sí y con los sistemas de los bancos. QNT es un token ERC-20 sobre Ethereum.",
  },
  {
    q: "La Clearing House elige a Quant para su red de depósitos tokenizados. ¿Qué se deduce sobre el token?",
    opts: [
      "Que los bancos estadounidenses tendrán que comprar QNT",
      "Que QNT pasa a ser una moneda regulada en EE. UU.",
      "Nada directo: el acuerdo es con la empresa, y ningún comunicado dice que los bancos usen QNT",
      "Que se quemarán QNT con cada pago",
    ],
    ok: 2,
    exp: "Ni la Clearing House ni Quant han dicho que esa red use QNT. Un contrato de la empresa es ingreso para la empresa; que mueva el token es otra cuestión.",
  },
  {
    q: "Las licencias de Overledger se cobran en dinero y se convierten a QNT. Si el precio de QNT se duplica, ¿qué pasa con los QNT que retiene una misma licencia?",
    opts: [
      "Se duplican",
      "Se quedan igual",
      "Se reducen a la mitad, porque la cuota está fijada en dinero",
      "Desaparecen",
    ],
    ok: 2,
    exp: "La cuota se pacta en euros, libras o dólares. A más precio, menos tokens hacen falta para cubrirla. La demanda de QNT por licencias es una cantidad de dinero, no de tokens.",
  },
  {
    q: "¿Por qué se dice que el software de Quant es «cerrado»?",
    opts: [
      "Porque solo funciona de noche",
      "Porque el núcleo de Overledger no es público y está protegido con patentes; lo abierto son sobre todo herramientas para conectarse",
      "Porque QNT no se puede vender",
      "Porque la empresa no tiene web",
    ],
    ok: 1,
    exp: "En redes como Bitcoin o Ethereum cualquiera puede leer y auditar el código. En Quant, lo central es propiedad de la empresa, que tiene patentes concedidas en Estados Unidos y Japón.",
  },
  {
    q: "Vives en España, compraste QNT a 100 € y lo cambias por ETH cuando vale 150 €. ¿Qué pasa con Hacienda?",
    opts: [
      "Nada, porque no has pasado a euros",
      "Has tenido una ganancia de 50 € por cada QNT, que tributa en la base del ahorro",
      "Solo tributa si usas un exchange español",
      "Tributan los 150 € enteros como rendimiento del trabajo",
    ],
    ok: 1,
    exp: "Cambiar una criptomoneda por otra es una permuta: Hacienda la trata como una venta. La ganancia es la diferencia entre el valor de salida y lo que te costó.",
  },
];

export default function GuideQuantQuiz() {
  return <GuideQuizBase slug="quant" badgeId="guide-quant" badgeName="Licencia en Regla" preguntas={PREGUNTAS} />;
}
