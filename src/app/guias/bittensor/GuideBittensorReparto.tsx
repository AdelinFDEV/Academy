"use client";

import { useState } from "react";

/**
 * Cómo se reparte un día de emisión de Bittensor dentro de una subred.
 *
 * Las cuentas son las del texto: un bloque cada 12 segundos (7.200 al día),
 * la emisión por bloque de cada época (1 TAO antes del primer halving, 0,5
 * desde diciembre de 2025, 0,25 tras el segundo) y el reparto por defecto de
 * la documentación oficial: 18 % al propietario de la subred, 41 % a los
 * mineros y 41 % a los validadores y quienes delegan en ellos.
 *
 * Simplifica a propósito: la subred cobra en su token alfa, y aquí se expresa
 * en su equivalente en TAO. El reparto entre mineros no es a partes iguales:
 * la media que se enseña es solo una referencia. Al revisar la guía, se
 * comprueban la emisión y el reparto en la documentación de Bittensor.
 */
const BLOQUES_DIA = 7_200;
const REPARTO = { propietario: 0.18, mineros: 0.41, validadores: 0.41 };

const EPOCAS = [
  { id: "antes", nombre: "Hasta dic. 2025", porBloque: 1 },
  { id: "ahora", nombre: "Ahora", porBloque: 0.5 },
  { id: "despues", nombre: "Tras el 2.º halving", porBloque: 0.25 },
] as const;
type IdEpoca = (typeof EPOCAS)[number]["id"];

const num = (n: number, dec = 0) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function leer(texto: string, min: number, max: number) {
  const n = Number(texto.replace(",", "."));
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default function GuideBittensorReparto() {
  const [epoca, setEpoca] = useState<IdEpoca>("ahora");
  const [cuota, setCuota] = useState(2);
  const [precio, setPrecio] = useState("176");
  const [mineros, setMineros] = useState(100);

  const porBloque = EPOCAS.find((e) => e.id === epoca)?.porBloque ?? 0.5;
  const redDia = porBloque * BLOQUES_DIA;
  const subredDia = redDia * (cuota / 100);
  const eur = leer(precio, 0, 1_000_000);

  const partes = [
    { clave: "propietario", nombre: "Propietario de la subred", tao: subredDia * REPARTO.propietario },
    { clave: "mineros", nombre: "Mineros, todos juntos", tao: subredDia * REPARTO.mineros },
    { clave: "validadores", nombre: "Validadores y quienes delegan", tao: subredDia * REPARTO.validadores },
  ];
  const porMinero = (subredDia * REPARTO.mineros) / mineros;

  return (
    <div className="tao-reparto">
      <p className="tao-reparto-titulo">Calculadora del reparto de un día</p>

      <div className="tao-epocas" role="group" aria-label="Emisión por bloque">
        {EPOCAS.map((e) => (
          <button
            key={e.id}
            type="button"
            aria-pressed={epoca === e.id}
            className={epoca === e.id ? "is-activa" : ""}
            onClick={() => setEpoca(e.id)}
          >
            <span>{e.nombre}</span>
            <small>{num(e.porBloque, 2)} TAO por bloque</small>
          </button>
        ))}
      </div>

      <div className="tao-reparto-campos">
        <label htmlFor="tao-cuota" className="tao-campo">
          <span>Parte de la emisión que se lleva la subred: <strong>{num(cuota, 1)} %</strong></span>
          <input id="tao-cuota" type="range" min={0.1} max={10} step={0.1} value={cuota} onChange={(e) => setCuota(Number(e.target.value))} />
        </label>
        <label htmlFor="tao-mineros" className="tao-campo">
          <span>Mineros activos en la subred: <strong>{mineros}</strong></span>
          <input id="tao-mineros" type="range" min={1} max={256} step={1} value={mineros} onChange={(e) => setMineros(Number(e.target.value))} />
        </label>
        <label htmlFor="tao-precio" className="tao-campo">
          <span>Precio de 1 TAO, en euros</span>
          <input id="tao-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="tao-reparto-total" aria-live="polite">
        <span>Emite toda la red al día</span>
        <strong>{num(redDia)} TAO</strong>
        <small>De eso, a esta subred: {num(subredDia, 1)} TAO · {num(subredDia * eur)} €</small>
      </div>

      <ul className="tao-reparto-partes" aria-live="polite">
        {partes.map((p) => (
          <li key={p.clave} className={`tao-parte tao-parte--${p.clave}`}>
            <span>{p.nombre}</span>
            <strong>{num(p.tao, 1)} TAO</strong>
            <small>{num(p.tao * eur)} € al día</small>
          </li>
        ))}
      </ul>

      <p className="tao-reparto-nota">
        La subred cobra en su token alfa; aquí se expresa en su equivalente en TAO. Un minero medio se llevaría <strong>{num(porMinero, 2)} TAO al día</strong> (unos {num(porMinero * eur)} €).
        En la práctica casi nunca hay un minero medio: los validadores puntúan a cada uno, y unos pocos se llevan
        casi todo. Antes de ese ingreso van los costes: servidores, tarjetas gráficas y la inscripción en la subred.
      </p>
    </div>
  );
}
