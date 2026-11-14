"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "¿Qué discutían en realidad los dos bandos que partieron Bitcoin en agosto de 2017?",
    opts: [
      "Si había que quitar el tope de 21 millones de monedas",
      "Cómo hacer que cupieran más operaciones: bloques más grandes o una capa encima",
      "Si había que pasar de prueba de trabajo a prueba de participación",
      "Quién era de verdad Satoshi Nakamoto",
    ],
    ok: 1,
    exp: "Los dos bandos querían más capacidad. Unos, subiendo el tamaño del bloque; otros, con SegWit y pagos fuera de la cadena, como Lightning. Bitcoin Cash es la rama de los bloques grandes.",
  },
  {
    q: "Tenías 2 BTC en tu propia cartera el 1 de agosto de 2017 y no los moviste. ¿Qué pasó?",
    opts: [
      "Perdiste la mitad, que pasó a ser Bitcoin Cash",
      "Nada: solo recibieron BCH quienes lo compraron después",
      "Seguías teniendo 2 BTC y, además, 2 BCH controlados por las mismas claves",
      "Tus 2 BTC se convirtieron en 2 BCH",
    ],
    ok: 2,
    exp: "Una división copia el historial hasta ese bloque. Tus monedas existían en las dos cadenas, una por una, y las mismas claves privadas daban acceso a ambas.",
  },
  {
    q: "Los bloques de Bitcoin Cash admiten 32 MB o más. ¿Qué dicen los datos de noviembre de 2026?",
    opts: [
      "Van llenos y las comisiones se han disparado",
      "Se usan en torno al 0,3 % del espacio: la capacidad sobra porque la demanda es baja",
      "Están al 50 %, justo lo previsto en 2017",
      "No se pueden medir",
    ],
    ok: 1,
    exp: "Los últimos cien bloques medían unos 104 KB de media. Eso explica las comisiones mínimas, y también que la apuesta por los bloques grandes no ha atraído el uso que prometía.",
  },
  {
    q: "¿Por qué el hash rate de Bitcoin Cash es un riesgo que no tiene Bitcoin?",
    opts: [
      "Porque usa un algoritmo distinto que nadie mina",
      "Porque es menos del 0,5 % del de Bitcoin, y las mismas máquinas pueden pasarse de una red a otra",
      "Porque sus bloques son más grandes",
      "No es un riesgo: cuanto menos hash rate, más seguridad",
    ],
    ok: 1,
    exp: "Las dos redes usan SHA-256. Una fracción pequeña de la potencia de Bitcoin bastaría para superar a toda la de Bitcoin Cash, y es lo que hace posible un ataque del 51 %.",
  },
  {
    q: "Recibiste BCH en la división de 2017 y lo vendes ahora con beneficio. ¿Qué es lo honesto decir sobre Hacienda?",
    opts: [
      "No tributa nada, porque fue un regalo",
      "Tributa al vender, pero no hay una consulta de la DGT sobre las divisiones: el valor de compra que uses hay que justificarlo y conviene consultarlo",
      "Tributa al 50 % por ser una moneda dividida",
      "Solo tributa si lo cambiaste en un exchange español",
    ],
    ok: 1,
    exp: "Vender BCH con ganancia tributa en la base del ahorro. Lo dudoso es el valor de adquisición: no hay un criterio publicado de la DGT para las divisiones, y circulan varias lecturas.",
  },
];

export default function GuideBitcoinCashQuiz() {
  return <GuideQuizBase slug="bitcoin-cash" badgeId="guide-bitcoin-cash" badgeName="Rama Partida" preguntas={PREGUNTAS} />;
}
