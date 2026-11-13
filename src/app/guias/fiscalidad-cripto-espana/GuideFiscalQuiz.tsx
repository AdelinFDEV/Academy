"use client";

import GuideQuizBase, { type PreguntaQuiz } from "@/components/GuideQuizBase";

const PREGUNTAS: PreguntaQuiz[] = [
  {
    q: "Cambias 1 BTC por ETH directamente en un exchange, sin pasar en ningún momento por euros. ¿Tributa esa operación?",
    opts: [
      "No, porque no has retirado dinero a tu cuenta bancaria",
      "Sí: la permuta entre criptomonedas genera ganancia o pérdida patrimonial",
      "Solo si el ETH sube de precio después",
      "Solo si el exchange está fuera de España",
    ],
    ok: 1,
    exp: "Es el error más caro y más frecuente. El intercambio de una criptomoneda por otra es una permuta (art. 37.1.h de la Ley del IRPF): se considera que has transmitido el BTC a su valor de mercado en ese momento, y ahí aflora la ganancia o la pérdida. No hace falta tocar un euro para que Hacienda considere que has realizado el beneficio.",
  },
  {
    q: "Has comprado BTC en cinco momentos distintos y a precios distintos. Vendes una parte. ¿Qué precio de compra usas para calcular la ganancia?",
    opts: [
      "El que más te convenga fiscalmente",
      "El precio medio de todas tus compras",
      "El de las primeras monedas que compraste — método FIFO",
      "El de la compra más cara, para pagar menos",
    ],
    ok: 2,
    exp: "En España el método FIFO (First In, First Out) es obligatorio, no opcional: se entiende que vendes primero las monedas que compraste antes. No puedes elegir el lote que más te interese ni usar el precio medio. Esto importa mucho porque, en una cartera con años de compras, los lotes antiguos suelen ser los más baratos — y por tanto los que más ganancia generan.",
  },
  {
    q: "Recibes recompensas por hacer staking. ¿Cómo tributan?",
    opts: [
      "Como ganancia patrimonial, solo cuando vendas esas monedas",
      "No tributan hasta que las conviertas a euros",
      "Como rendimiento del capital mobiliario, en la base del ahorro, al recibirlas",
      "Como rendimiento del trabajo, junto a tu nómina",
    ],
    ok: 2,
    exp: "La Dirección General de Tributos (consulta V1766-22) considera el staking un rendimiento del capital mobiliario por cesión de capitales a terceros. Tributa en la base del ahorro y se valora en euros al valor de mercado del día en que recibes la recompensa — aunque no vendas nada. Ese valor pasa además a ser tu precio de adquisición para cuando vendas esas monedas.",
  },
  {
    q: "Tienes 80.000 € en cripto: 60.000 € en un exchange extranjero y 20.000 € en una hardware wallet cuyas claves privadas controlas tú. ¿Qué declaras en el modelo 721?",
    opts: [
      "Los 80.000 €, porque se supera el umbral de 50.000 €",
      "Solo los 60.000 € del exchange: la wallet autocustodiada no entra",
      "Nada, porque parte está en autocustodia",
      "Solo los 20.000 € de la hardware wallet",
    ],
    ok: 1,
    exp: "Este matiz se falla constantemente. La Agencia Tributaria ha aclarado que las criptomonedas en monederos donde el contribuyente mantiene el control de las claves privadas, sin un tercero que las custodie, NO son objeto del modelo 721. La obligación alcanza a lo que está bajo custodia de terceros — exchanges y plataformas. Ojo: que no se declaren en el 721 no significa que estén exentas de tributar cuando vendas.",
  },
  {
    q: "Vendes con pérdidas para aflorarlas, y tres meses después recompras esa misma criptomoneda. ¿Puedes computar la pérdida en esa declaración?",
    opts: [
      "Sí, siempre que hayan pasado más de dos meses",
      "Sí, sin ninguna limitación",
      "No: si recompras el mismo activo dentro del año siguiente, la pérdida no se computa todavía",
      "No, y además pierdes la pérdida para siempre",
    ],
    ok: 2,
    exp: "Aquí circula mucha información equivocada. La regla de los dos meses es para valores admitidos a negociación, y las criptomonedas no lo son. A ellas les aplica la norma general del art. 33.5.e) de la Ley del IRPF: si recompras el mismo elemento patrimonial dentro del año siguiente a la venta, la pérdida no se computa en ese ejercicio. Importante: la pérdida no se pierde, queda diferida — la podrás computar cuando transmitas definitivamente esas monedas.",
  },
];

export default function GuideFiscalQuiz() {
  return <GuideQuizBase slug="fiscalidad-cripto-espana" badgeId="guide-fiscalidad-cripto" badgeName="Cuentas Claras" preguntas={PREGUNTAS} />;
}
