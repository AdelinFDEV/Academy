"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Despliegas en NEAR un contrato que ocupa 300 kB. ¿Qué pasa con tu NEAR?",
    opts: [
      "Pagas 3 NEAR de comisión y los pierdes",
      "Quedan 3 NEAR bloqueados en tu cuenta mientras el contrato exista, y vuelven si lo borras",
      "No pasa nada: guardar datos en NEAR es gratis",
      "Pagas 3 NEAR al año, como un alquiler",
    ],
    ok: 1,
    exp: "El almacenamiento no se paga, se respalda: 1 NEAR por cada 100.000 bytes queda inmovilizado mientras los datos ocupen sitio. Al borrarlos, ese NEAR se libera.",
  },
  {
    q: "Le pides a un amigo que te envíe NEAR. ¿Qué le das?",
    opts: [
      "Tu frase semilla, para que lo deposite directamente",
      "Tu nombre de cuenta, como «lucia.near», o la dirección larga de 64 caracteres si tu cuenta es implícita",
      "Tu número de cuenta bancaria",
      "Tu clave privada de acceso limitado",
    ],
    ok: 1,
    exp: "Las dos formas de cuenta reciben igual: la de nombre legible y la implícita, que es una cadena hexadecimal. Lo que nunca se da a nadie son las claves ni la frase semilla.",
  },
  {
    q: "A noviembre de 2026, ¿qué parte de la comisión de una operación se lleva el desarrollador del contrato que usas?",
    opts: [
      "El 30 %, como siempre",
      "El 70 %",
      "Nada: desde la versión 2.14 de la red toda la comisión se quema",
      "Lo que decida cada desarrollador",
    ],
    ok: 2,
    exp: "El reparto del 30 % existió desde el principio, pero la gobernanza votó eliminarlo (HSP-027) y la versión 2.14, publicada el 26 de octubre de 2026, lo dejó a cero. Muchas guías aún dicen lo contrario.",
  },
  {
    q: "El staking de NEAR paga en torno a un 5 % al año y la red crea un 2,5 % de monedas nuevas. ¿Qué ganas de verdad haciendo staking?",
    opts: [
      "Un 7,5 %: se suman",
      "Un 5 %: la inflación no te afecta",
      "Cerca de un 2,5 % de peso en la red, y todo ello sujeto a lo que haga el precio",
      "Nada: la inflación se lo come entero",
    ],
    ok: 2,
    exp: "Las monedas nuevas diluyen a todos. Quien hace staking crece más deprisa que la oferta y gana algo de peso; quien no lo hace, lo pierde. Y nada de eso protege de una caída del precio.",
  },
  {
    q: "¿Para qué sirven las firmas en cadena (chain signatures) de NEAR?",
    opts: [
      "Para minar bitcoin con la red de NEAR",
      "Para que una cuenta de NEAR controle direcciones y firme operaciones en otras redes, como Bitcoin o Ethereum",
      "Para firmar contratos legales con validez notarial",
      "Para convertir NEAR en una moneda de privacidad",
    ],
    ok: 1,
    exp: "Un grupo de nodos firma a medias, sin que ninguno tenga la clave entera, en nombre de tu cuenta de NEAR. Es la base de lo que el proyecto llama abstracción de cadenas.",
  },
];

export default function GuideNearQuiz() {
  return <GuideQuizBase slug="near" badgeId="guide-near" badgeName="Nombre Propio" preguntas={PREGUNTAS} />;
}
