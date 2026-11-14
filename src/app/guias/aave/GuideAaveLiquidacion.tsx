"use client";

import { useState } from "react";

/**
 * A qué precio te liquidan en Aave. Un solo activo como colateral y una deuda en
 * stablecoin, que no cambia de valor. Las cuentas son las del texto de la guía:
 *
 *   factor de salud     = colateral en euros × umbral de liquidación / deuda
 *   precio de liquidación = deuda / (cantidad de colateral × umbral)
 *   deuda máxima para un factor de 2 = colateral × umbral / 2
 *
 * Y lo que cuesta una liquidación parcial: el liquidador devuelve la mitad de la
 * deuda (lo máximo con un factor de salud entre 0,95 y 1, en Aave v3) y se lleva
 * colateral por ese valor más el bono. El bono lo pone el lector: lo fija la
 * gobernanza para cada activo.
 *
 * No consulta ningún precio ni ningún parámetro real.
 */
const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const leer = (txt: string, max: number) =>
  Math.min(Math.max(Number(txt.replace(/\./g, "").replace(",", ".")) || 0, 0), max);

const leerDecimal = (txt: string, max: number) =>
  Math.min(Math.max(Number(txt.replace(",", ".")) || 0, 0), max);

export default function GuideAaveLiquidacion() {
  const [cantidad, setCantidad] = useState("2");
  const [precio, setPrecio] = useState("3000");
  const [deuda, setDeuda] = useState("3000");
  const [umbral, setUmbral] = useState(80);
  const [bono, setBono] = useState("5");

  const q = leerDecimal(cantidad, 1_000_000);
  const p = leer(precio, 10_000_000);
  const d = leer(deuda, 1_000_000_000);
  const u = umbral / 100;
  const b = leerDecimal(bono, 20) / 100;

  const colateral = q * p;
  const hayDatos = q > 0 && p > 0 && d > 0;
  const salud = hayDatos ? (colateral * u) / d : 0;
  const precioLiq = hayDatos ? d / (q * u) : 0;
  const caida = hayDatos ? (1 - precioLiq / p) * 100 : 0;
  const deudaParaDos = (colateral * u) / 2;
  const penalizacion = (d / 2) * b;

  const estado = !hayDatos ? "" : salud < 1 ? "es-rojo" : salud < 1.5 ? "es-ambar" : "es-verde";
  const lectura = !hayDatos
    ? "Rellena la cantidad, el precio y la deuda para ver el resultado."
    : salud < 1
      ? "Con estos números la posición ya se puede liquidar: el factor de salud está por debajo de 1."
      : `El precio puede caer un ${num(caida, 1)} % antes de que te liquiden. ${salud < 1.5 ? "Es poco margen para un activo que se mueve un 10 % en un día." : "Aun así, una caída así ha ocurrido varias veces en la historia de las criptomonedas."}`;

  return (
    <div className="aave-calc">
      <p className="aave-calc-titulo">Calculadora del precio de liquidación</p>

      <div className="aave-calc-campos">
        <label htmlFor="aave-cantidad">
          <span>Cantidad que dejas como colateral</span>
          <input id="aave-cantidad" inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </label>
        <label htmlFor="aave-precio">
          <span>Precio de hoy de esa moneda, en euros</span>
          <input id="aave-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
        <label htmlFor="aave-deuda">
          <span>Lo que pides prestado en stablecoin, en euros</span>
          <input id="aave-deuda" inputMode="decimal" value={deuda} onChange={(e) => setDeuda(e.target.value)} />
        </label>
        <label htmlFor="aave-bono">
          <span>Bono de liquidación del activo, en %</span>
          <input id="aave-bono" inputMode="decimal" value={bono} onChange={(e) => setBono(e.target.value)} />
        </label>
        <label htmlFor="aave-umbral" className="aave-calc-rango">
          <span>
            Umbral de liquidación del activo <strong>{umbral} %</strong>
          </span>
          <input id="aave-umbral" type="range" min={50} max={95} step={1} value={umbral} onChange={(e) => setUmbral(Number(e.target.value))} />
        </label>
      </div>

      <div className="aave-calc-resultados" aria-live="polite">
        <div className={`es-principal ${estado}`}>
          <span>Factor de salud</span>
          <strong>{hayDatos ? num(salud, 2) : "—"}</strong>
          <small>Colateral de {num(colateral, 0)} €</small>
        </div>
        <div>
          <span>Te liquidan si el precio baja a</span>
          <strong>{hayDatos ? `${num(precioLiq, precioLiq < 10 ? 2 : 0)} €` : "—"}</strong>
          <small>{!hayDatos ? "" : salud >= 1 ? `Una caída del ${num(caida, 1)} %` : "Ya estás por debajo"}</small>
        </div>
        <div>
          <span>Deuda máxima para un factor de 2</span>
          <strong>{hayDatos ? `${num(deudaParaDos, 0)} €` : "—"}</strong>
          <small>{!hayDatos ? "" : d > deudaParaDos ? `Devuelve ${num(d - deudaParaDos, 0)} € para llegar` : "Ya estás por encima de 2"}</small>
        </div>
        <div>
          <span>Coste de una liquidación parcial</span>
          <strong>{hayDatos ? `${num(penalizacion, 0)} €` : "—"}</strong>
          <small>Sobre la mitad de tu deuda</small>
        </div>
      </div>
      <p className="aave-calc-lectura">{lectura}</p>
      <p className="aave-calc-nota">
        Calcula con una deuda en stablecoin y un único colateral. Si mezclas varios, Aave usa la media ponderada de
        sus umbrales. Si el factor de salud llega a 0,95, o tu garantía o tu deuda valen menos de 2.000 dólares,
        el liquidador puede devolver la deuda entera, no la mitad, y el coste se dobla. Los intereses hacen crecer la deuda poco a poco, así que el precio de liquidación sube con el
        tiempo aunque no toques nada.
      </p>
    </div>
  );
}
