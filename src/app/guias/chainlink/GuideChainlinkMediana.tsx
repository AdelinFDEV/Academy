"use client";

import { useState } from "react";

/**
 * «Intenta engañar a la red»: siete nodos dan el precio del ether y el lector
 * hace mentir a los que quiera. Enseña por qué Chainlink usa la mediana (el
 * valor del medio) y no la media: con uno, dos o tres mentirosos la mediana no
 * se mueve; con cuatro de siete, cae.
 *
 * Los precios son inventados para el ejemplo: aquí no se consulta nada.
 */
const HONESTOS = [2998, 3001, 2999, 3003, 3000, 2997, 3002];
const MENTIRA = 9000;
const num = (n: number) => Math.round(n).toLocaleString("es-ES");

export default function GuideChainlinkMediana() {
  const [mienten, setMienten] = useState<boolean[]>(HONESTOS.map(() => false));

  const valores = HONESTOS.map((v, i) => (mienten[i] ? MENTIRA : v));
  const ordenados = [...valores].sort((a, b) => a - b);
  const mediana = ordenados[3];
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const cuantos = mienten.filter(Boolean).length;
  const falseado = mediana === MENTIRA;

  const alternar = (i: number) => setMienten((m) => m.map((x, j) => (j === i ? !x : x)));

  return (
    <div className="link-sim">
      <p className="link-sim-titulo">Intenta engañar a la red</p>
      <p className="link-sim-ayuda">Pulsa un nodo para que mienta y diga que el ether vale {num(MENTIRA)} $. El precio real ronda los 3.000 $.</p>

      <div className="link-sim-nodos">
        {valores.map((v, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={mienten[i]}
            className={`link-nodo${mienten[i] ? " is-miente" : ""}`}
            onClick={() => alternar(i)}
          >
            <span>Nodo {i + 1}</span>
            <strong>{num(v)} $</strong>
            <small>{mienten[i] ? "miente" : "honesto"}</small>
          </button>
        ))}
      </div>

      <div className="link-sim-resultado" aria-live="polite">
        <div>
          <span>Si se usara la media</span>
          <strong>{num(media)} $</strong>
          <small>{cuantos === 0 ? "correcta" : "ya está falseada"}</small>
        </div>
        <div className={falseado ? "es-roto" : "es-bien"}>
          <span>Con la mediana, como hace Chainlink</span>
          <strong>{num(mediana)} $</strong>
          <small>{falseado ? "falseada: mienten 4 o más de 7" : "correcta"}</small>
        </div>
      </div>

      <p className="link-sim-nota">
        {cuantos === 0 && "Con todos honestos, las dos cuentas dan lo mismo. Haz mentir a uno."}
        {cuantos > 0 && cuantos < 4 && `Con ${cuantos} ${cuantos === 1 ? "mentiroso" : "mentirosos"}, la media ya engañaría al préstamo. La mediana ni se inmuta: quien miente queda en un extremo de la lista.`}
        {cuantos >= 4 && "Ahora sí. Para falsear el precio hace falta controlar a más de la mitad de los nodos a la vez. Ese es el coste de atacar la red, y por eso importa quiénes son los operadores."}
      </p>

      {cuantos > 0 && (
        <button type="button" className="link-sim-reiniciar" onClick={() => setMienten(HONESTOS.map(() => false))}>
          Volver a empezar
        </button>
      )}
    </div>
  );
}
