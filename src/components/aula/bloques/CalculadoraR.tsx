"use client";

import { useState } from "react";
import { Marco, formatear } from "./comun";

/**
 * Calculadora del tamaño de posición: con el capital, el % que se quiere
 * arriesgar, la entrada y el stop, cuánto comprar para que tocar el stop
 * cueste exactamente 1R. Con un objetivo, cuántas R vale la operación.
 *
 * datos: { titulo, capital: 5000, riesgo: 1, entrada: 60000, stop: 58500, objetivo?: 64500, nota? }
 */

export interface DatosCalculadoraR {
  titulo: string;
  capital: number;
  riesgo: number;
  entrada: number;
  stop: number;
  objetivo?: number;
  nota?: string;
}

export function validarCalculadoraR(d: unknown): d is DatosCalculadoraR {
  const x = d as DatosCalculadoraR;
  return !!x && typeof x.titulo === "string"
    && [x.capital, x.riesgo, x.entrada, x.stop].every((n) => typeof n === "number" && n > 0)
    && x.entrada !== x.stop && (x.objetivo === undefined || typeof x.objetivo === "number");
}

const num = (v: string) => Math.max(0, Number(v.replace(",", ".")) || 0);

export default function CalculadoraR({ datos }: { datos: DatosCalculadoraR }) {
  const [capital, setCapital] = useState(datos.capital);
  const [riesgo, setRiesgo] = useState(datos.riesgo);
  const [entrada, setEntrada] = useState(datos.entrada);
  const [stop, setStop] = useState(datos.stop);
  const [objetivo, setObjetivo] = useState(datos.objetivo ?? 0);

  const unR = (capital * riesgo) / 100;
  const distancia = Math.abs(entrada - stop);
  const unidades = distancia > 0 ? unR / distancia : 0;
  const posicion = unidades * entrada;
  const veces = capital > 0 ? posicion / capital : 0;
  const multiplo = objetivo > 0 && distancia > 0 ? Math.abs(objetivo - entrada) / distancia : null;

  const campo = (etiqueta: string, valor: number, set: (n: number) => void, paso = 1) => (
    <label className="aula-calc-campo">
      <span>{etiqueta}</span>
      <input type="number" inputMode="decimal" min={0} step={paso} value={valor} onChange={(e) => set(num(e.target.value))} />
    </label>
  );

  return (
    <Marco clase="calculadora" titulo={datos.titulo} subtitulo="Primero decides cuánto puedes perder. El tamaño sale solo.">
      <div className="aula-fifo-campos">
        {campo("Capital de la cuenta (€)", capital, setCapital, 100)}
        {campo("Riesgo por operación (%)", riesgo, setRiesgo, 0.25)}
        {campo("Precio de entrada", entrada, setEntrada)}
        {campo("Stop-loss", stop, setStop)}
        {datos.objetivo !== undefined && campo("Objetivo (take-profit)", objetivo, setObjetivo)}
      </div>

      <div className="aula-calc-total aula-calc-total--3">
        <div className="is-perdida"><span>1R: lo que pierdes si salta el stop</span><strong>{formatear(Math.round(unR * 100) / 100, "eur")}</strong></div>
        <div><span>Tamaño de la posición</span><strong>{formatear(Math.round(unidades * 1e6) / 1e6)} uds.</strong></div>
        <div><span>Valor de la posición</span><strong>{formatear(Math.round(posicion), "eur")}</strong></div>
      </div>
      <p className="aula-bloque-nota">
        {veces > 1
          ? `La posición vale ${formatear(Math.round(veces * 10) / 10)} veces tu cuenta: para abrirla haría falta apalancamiento, y aun así solo arriesgas ${formatear(riesgo, "pct")} si respetas el stop.`
          : `La posición usa el ${formatear(Math.round(veces * 1000) / 10, "pct")} de tu cuenta, pero lo que arriesgas es el ${formatear(riesgo, "pct")}: el tamaño lo decide la distancia al stop, no el saldo.`}
        {multiplo !== null && ` Si llega al objetivo, la operación vale ${formatear(Math.round(multiplo * 100) / 100)} R.`}
        {riesgo > 2 && " Arriesgar más del 2 % por operación es lo que el Diario marca como agresivo."}
      </p>
      {datos.nota && <p className="aula-bloque-nota">{datos.nota}</p>}
    </Marco>
  );
}
