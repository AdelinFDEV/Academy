"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Recibes 3 ZEC en una dirección transparente desde un exchange. ¿Qué puede ver cualquiera en el explorador?",
    opts: [
      "Nada: en Zcash todo es privado por defecto",
      "Solo que hubo una operación, sin cantidad",
      "Tu dirección, la del exchange y los 3 ZEC, igual que en Bitcoin",
      "Solo la comisión, porque la cantidad va cifrada",
    ],
    ok: 2,
    exp: "La privacidad de Zcash es opcional. Una operación entre direcciones transparentes se ve entera. Solo las blindadas ocultan emisor, receptor y cantidad.",
  },
  {
    q: "Blindas 2,5 ZEC a las 10:00 y a las 10:05 desblindas 2,5 ZEC hacia otra dirección transparente. ¿Qué ha pasado con tu privacidad?",
    opts: [
      "Nada: lo que pasa dentro del fondo blindado no deja rastro",
      "Probablemente se pueda enlazar: la misma cantidad entra y sale en minutos",
      "Las dos operaciones quedan cifradas para siempre",
      "Se ha perdido el dinero, porque no se puede desblindar",
    ],
    ok: 1,
    exp: "Al blindar y al desblindar la cantidad es visible. Si coinciden la cifra y el momento, un observador puede suponer que son la misma persona. La privacidad sale de mover el dinero dentro del fondo blindado.",
  },
  {
    q: "¿Por qué fue tan importante que Orchard, en 2022, usara Halo 2?",
    opts: [
      "Porque hacía las operaciones gratuitas",
      "Porque dejó de hacer falta una ceremonia de configuración de confianza",
      "Porque permitió minar con un ordenador normal",
      "Porque eliminó las direcciones transparentes",
    ],
    ok: 1,
    exp: "Los primeros fondos dependían de unos parámetros creados en una ceremonia cuyas claves había que destruir. Con Halo 2 ese paso desaparece: ya no hay que confiar en que nadie guardó una copia.",
  },
  {
    q: "En 2026 se encontró un fallo en Orchard que habría permitido crear ZEC falsos. ¿Cómo se protegió el resto de la moneda?",
    opts: [
      "Se borraron todos los ZEC de Orchard",
      "Se pasó a privacidad obligatoria, como Monero",
      "Se selló Orchard y solo se puede salir hacia Ironwood por un torniquete que no deja sacar más de lo que entró",
      "No se hizo nada, porque el fallo no era grave",
    ],
    ok: 2,
    exp: "El torniquete limita lo que sale de Orchard a lo que se depositó de forma verificable. Si alguien hubiera fabricado monedas falsas, se quedarían atrapadas dentro.",
  },
  {
    q: "¿Qué parte de cada bloque nuevo se llevan hoy los mineros de Zcash?",
    opts: [
      "El 100 %, como en Bitcoin",
      "El 80 %; el resto va a becas de desarrollo y a un fondo que votan los poseedores",
      "El 50 %; el otro 50 % se quema",
      "Nada: Zcash ya no se mina",
    ],
    ok: 1,
    exp: "Desde noviembre de 2024, el 8 % del bloque va a Zcash Community Grants y el 12 % a un fondo que, desde noviembre de 2025, reparten en votación los poseedores de ZEC. El minero se queda con el 80 %.",
  },
];

export default function GuideZcashQuiz() {
  return <GuideQuizBase slug="zcash" badgeId="guide-zcash" badgeName="Prueba Silenciosa" preguntas={PREGUNTAS} />;
}
