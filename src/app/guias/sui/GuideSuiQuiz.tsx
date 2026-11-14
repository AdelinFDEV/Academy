"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Ana le envía 20 SUI a Luis desde su cartera. ¿Por qué esa operación no tiene que esperar turno en el consenso?",
    opts: [
      "Porque las operaciones pequeñas no pagan comisión",
      "Porque solo toca objetos de Ana, y nadie más puede gastarlos",
      "Porque Luis la confirma desde su propia cartera",
      "Porque la Sui Foundation la valida por adelantado",
    ],
    ok: 1,
    exp: "No hay nada que disputar: la moneda es un objeto propio de Ana. El consenso hace falta cuando varias personas tocan el mismo objeto compartido, como el fondo de un DEX.",
  },
  {
    q: "Creas un objeto en Sui y, meses después, lo borras. ¿Qué pasa con lo que pagaste por guardarlo?",
    opts: [
      "Nada: las comisiones nunca se devuelven",
      "Se te desbloquea, porque siempre fue tuyo",
      "Te devuelven el 99,99 % desde el fondo de almacenamiento",
      "Se quema para reducir la oferta",
    ],
    ok: 2,
    exp: "Lo pagado por almacenamiento va al fondo común y vuelve casi entero al borrar el objeto. No es un bloqueo como en NEAR: es un pago con devolución.",
  },
  {
    q: "Entras en una aplicación de Sui con zkLogin y tu cuenta de Google. Alguien te roba la contraseña de Google. ¿Puede vaciarte la cartera solo con eso?",
    opts: [
      "Sí, Google guarda tus fondos",
      "No: para firmar hace falta también la sal, que separa tu cuenta de tu dirección",
      "Sí, porque zkLogin no usa criptografía",
      "No, porque zkLogin no permite enviar fondos",
    ],
    ok: 1,
    exp: "zkLogin funciona como un sistema de dos factores: el justificante de Google y la sal. El riesgo real es el contrario: perder la sal es perder la dirección.",
  },
  {
    q: "¿Qué demostró el caso Cetus de mayo de 2025 sobre Sui?",
    opts: [
      "Que la red Sui se puede hackear y se paró varios días",
      "Que Move impide cualquier fallo en los contratos",
      "Que sus validadores, coordinados, pueden congelar direcciones y mover fondos sin su firma",
      "Que la Sui Foundation decide sola qué operaciones se aceptan",
    ],
    ok: 2,
    exp: "El fallo estaba en Cetus, no en la red. Lo llamativo fue la respuesta: los validadores bloquearon al atacante y una votación permitió mover los fondos. Sirvió contra un ladrón, pero la herramienta existe.",
  },
  {
    q: "El staking de SUI rinde en torno a un 1,35 % al año y la oferta circulante crecerá cerca de un 5 % en el mismo plazo. ¿Qué significa?",
    opts: [
      "Que el staking te protege de los desbloqueos",
      "Que el precio de SUI subirá un 5 %",
      "Que el staking no compensa la llegada de monedas nuevas al mercado",
      "Que conviene no hacer staking",
    ],
    ok: 2,
    exp: "Los desbloqueos meten en circulación monedas que no salen del staking. El staking reparte la subvención, pero no frena los cerca de 20 millones de SUI que se liberan cada mes.",
  },
];

export default function GuideSuiQuiz() {
  return <GuideQuizBase slug="sui" badgeId="guide-sui" badgeName="Objeto Propio" preguntas={PREGUNTAS} />;
}
