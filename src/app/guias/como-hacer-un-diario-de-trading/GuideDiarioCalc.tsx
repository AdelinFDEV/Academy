"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Scale, Target } from "lucide-react";

/**
 * Los dos cálculos que un diario de trading tiene que poder hacer, para
 * probarlos con números propios (guía «Cómo hacer un diario de trading»).
 *
 * 1. Una operación apuntada: con la entrada, el stop, la salida y el tamaño,
 *    sale el riesgo en euros y en % del capital, el resultado y el resultado en
 *    múltiplos de R.
 * 2. Tu método: con el win rate y la relación entre ganancia y pérdida medias,
 *    sale la esperanza por operación (en R) y el acierto mínimo para no perder.
 *
 * Todo se calcula en el navegador y no se guarda nada.
 */

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const num = (n: number, d = 2) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: d }).format(n);

function Campo({
  label, value, onChange, sufijo, paso = "any",
}: { label: string; value: string; onChange: (v: string) => void; sufijo?: string; paso?: string }) {
  return (
    <label className="dtg-campo">
      <span>{label}</span>
      <span className="dtg-campo-caja">
        <input
          type="number"
          inputMode="decimal"
          step={paso}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {sufijo && <i>{sufijo}</i>}
      </span>
    </label>
  );
}

export default function GuideDiarioCalc() {
  const [dir, setDir] = useState<"long" | "short">("long");
  const [capital, setCapital] = useState("2000");
  const [entrada, setEntrada] = useState("60000");
  const [stop, setStop] = useState("58800");
  const [salida, setSalida] = useState("63000");
  const [posicion, setPosicion] = useState("1000");

  const [winRate, setWinRate] = useState(40);
  const [ratio, setRatio] = useState(2);

  const c = parseFloat(capital);
  const e = parseFloat(entrada);
  const s = parseFloat(stop);
  const x = parseFloat(salida);
  const p = parseFloat(posicion);
  const signo = dir === "long" ? 1 : -1;

  const valido = [c, e, s, x, p].every((n) => Number.isFinite(n) && n > 0);
  const stopBienPuesto = valido && (dir === "long" ? s < e : s > e);
  const unidades = valido ? p / e : 0;
  const riesgo = stopBienPuesto ? unidades * Math.abs(e - s) : 0;
  const riesgoPct = stopBienPuesto ? (riesgo / c) * 100 : 0;
  const resultado = valido ? unidades * (x - e) * signo : 0;
  const r = stopBienPuesto && riesgo > 0 ? resultado / riesgo : 0;

  const wr = winRate / 100;
  const esperanza = wr * ratio - (1 - wr);
  const minimo = (1 / (1 + ratio)) * 100;

  return (
    <div className="dtg-calc">
      {/* ── 1 · La operación ── */}
      <div className="dtg-calc-bloque">
        <div className="dtg-calc-cab">
          <span className="dtg-calc-ey"><Target size={14} aria-hidden="true" /> Apunta una operación</span>
          <div className="dtg-dir" role="group" aria-label="Dirección de la operación">
            <button type="button" className={dir === "long" ? "is-activo" : ""} onClick={() => setDir("long")}>
              <ArrowUpRight size={14} aria-hidden="true" /> Long
            </button>
            <button type="button" className={dir === "short" ? "is-activo" : ""} onClick={() => setDir("short")}>
              <ArrowDownRight size={14} aria-hidden="true" /> Short
            </button>
          </div>
        </div>

        <div className="dtg-campos">
          <Campo label="Capital de la cuenta" value={capital} onChange={setCapital} sufijo="€" />
          <Campo label="Tamaño de la posición" value={posicion} onChange={setPosicion} sufijo="€" />
          <Campo label="Precio de entrada" value={entrada} onChange={setEntrada} />
          <Campo label="Stop-loss" value={stop} onChange={setStop} />
          <Campo label="Precio de salida" value={salida} onChange={setSalida} />
        </div>

        {!valido ? (
          <p className="dtg-aviso">Rellena todos los campos con números mayores que cero.</p>
        ) : !stopBienPuesto ? (
          <p className="dtg-aviso">
            En un {dir === "long" ? "long el stop va por debajo" : "short el stop va por encima"} de la entrada.
            Sin un stop bien puesto no hay riesgo que medir.
          </p>
        ) : (
          <div className="dtg-resultados">
            <div>
              <small>Riesgo de la operación</small>
              <b>{eur.format(riesgo)}</b>
              <span className={riesgoPct > 2 ? "es-mal" : "es-bien"}>{num(riesgoPct)} % del capital</span>
            </div>
            <div>
              <small>Resultado</small>
              <b className={resultado >= 0 ? "es-bien" : "es-mal"}>{resultado >= 0 ? "+" : ""}{eur.format(resultado)}</b>
              <span>{num((resultado / c) * 100)} % del capital</span>
            </div>
            <div className="dtg-resultado-r">
              <small>En múltiplos de R</small>
              <b className={r >= 0 ? "es-bien" : "es-mal"}>{r >= 0 ? "+" : ""}{num(r)} R</b>
              <span>Lo que ganaste por cada euro que arriesgabas</span>
            </div>
          </div>
        )}
        {stopBienPuesto && riesgoPct > 2 && (
          <p className="dtg-nota">
            Arriesgar más del 2 % por operación hace que una racha normal de pérdidas se coma una parte grande de la
            cuenta. Es lo primero que enseña un diario cuando se mira el riesgo.
          </p>
        )}
      </div>

      {/* ── 2 · El método ── */}
      <div className="dtg-calc-bloque">
        <div className="dtg-calc-cab">
          <span className="dtg-calc-ey"><Scale size={14} aria-hidden="true" /> ¿Tu método gana dinero?</span>
        </div>

        <label className="dtg-slider">
          <span>Win rate <b>{winRate} %</b></span>
          <input type="range" min={10} max={90} step={1} value={winRate} onChange={(ev) => setWinRate(Number(ev.target.value))} />
        </label>
        <label className="dtg-slider">
          <span>La ganadora media es <b>{num(ratio, 1)} veces</b> la perdedora media</span>
          <input type="range" min={0.3} max={5} step={0.1} value={ratio} onChange={(ev) => setRatio(Number(ev.target.value))} />
        </label>

        <div className="dtg-resultados dtg-resultados--dos">
          <div>
            <small>Esperanza por operación</small>
            <b className={esperanza >= 0 ? "es-bien" : "es-mal"}>{esperanza >= 0 ? "+" : ""}{num(esperanza)} R</b>
            <span>{esperanza >= 0 ? "Gana a la larga" : "Pierde a la larga, por mucho que operes"}</span>
          </div>
          <div>
            <small>Acierto mínimo para no perder</small>
            <b>{num(minimo, 1)} %</b>
            <span>Con esa relación entre ganancia y pérdida</span>
          </div>
        </div>
      </div>

      <p className="dtg-pie">Cálculo orientativo, sin comisiones ni deslizamiento. No se guarda nada.</p>
    </div>
  );
}
