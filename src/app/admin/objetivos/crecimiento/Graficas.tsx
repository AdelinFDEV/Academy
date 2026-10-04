"use client";

import { useState } from "react";

/**
 * Las dos gráficas de la pestaña Crecimiento. SVG a mano y sin librería: son
 * una línea y unas barras, y así siguen la misma paleta y tipografía que el
 * resto del panel.
 *
 * Una sola serie por gráfica (sin leyenda: el título la nombra), un solo eje,
 * y el dato exacto al pasar el ratón, que nunca va solo en el color.
 */

type Punto = { etiqueta: string; valor: number };

/** El color de cada bloque: azul Telegram, rojo YouTube, verde dinero. */
export type Tono = "telegram" | "youtube" | "dinero";

const ANCHO = 640;
const ALTO = 200;
const IZQ = 44;
const ABAJO = 24;
const ARRIBA = 10;

/** Marcas del eje Y redondas (0, 5, 10… / 0, 50, 100…). */
function marcasY(max: number): number[] {
  if (max <= 0) return [0, 1];
  const paso = Math.pow(10, Math.floor(Math.log10(max)));
  const opciones = [1, 2, 2.5, 5, 10].map((m) => m * paso);
  const elegido = opciones.find((p) => max / p <= 4) ?? paso * 10;
  const tope = Math.ceil(max / elegido) * elegido;
  const marcas: number[] = [];
  for (let v = 0; v <= tope + 1e-9; v += elegido) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

function formatear(v: number, euros: boolean): string {
  const n = v.toLocaleString("es-ES", { maximumFractionDigits: euros ? 0 : 1 });
  return euros ? `${n} €` : n;
}

export function GraficaLinea({ puntos, euros = false, vacio, tono = "telegram" }: { puntos: Punto[]; euros?: boolean; vacio: string; tono?: Tono }) {
  const [activo, setActivo] = useState<number | null>(null);
  if (puntos.length < 2) return <p className="obj-vacio obj-vacio--grafica">📭 {vacio}</p>;

  const marcas = marcasY(Math.max(...puntos.map((p) => p.valor)));
  const maxY = marcas[marcas.length - 1] || 1;
  const anchoUtil = ANCHO - IZQ - 8;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const x = (i: number) => IZQ + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) => ARRIBA + altoUtil - (v / maxY) * altoUtil;

  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${linea} L${x(puntos.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const etiquetasX = [0, Math.floor((puntos.length - 1) / 2), puntos.length - 1];
  const p = activo !== null ? puntos[activo] : null;

  function mover(e: React.MouseEvent<SVGSVGElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const xSvg = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const i = Math.round(((xSvg - IZQ) / anchoUtil) * (puntos.length - 1));
    setActivo(Math.min(puntos.length - 1, Math.max(0, i)));
  }

  return (
    <div className={`crec-grafica crec-grafica--${tono}`}>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="crec-svg"
        onMouseMove={mover}
        onMouseLeave={() => setActivo(null)}
        role="img"
        aria-label={`De ${formatear(puntos[0].valor, euros)} a ${formatear(puntos[puntos.length - 1].valor, euros)}`}
      >
        {marcas.map((m) => (
          <g key={m}>
            <line x1={IZQ} x2={ANCHO - 8} y1={y(m)} y2={y(m)} className="crec-rejilla" />
            <text x={IZQ - 8} y={y(m) + 4} className="crec-eje" textAnchor="end">{formatear(m, euros)}</text>
          </g>
        ))}
        {etiquetasX.map((i) => (
          <text key={i} x={x(i)} y={ALTO - 6} className="crec-eje" textAnchor={i === 0 ? "start" : i === puntos.length - 1 ? "end" : "middle"}>
            {puntos[i].etiqueta}
          </text>
        ))}
        <path d={area} className="crec-area" />
        <path d={linea} className="crec-linea" />
        {/* El último valor, marcado y con su cifra: es el que más se mira */}
        <circle cx={x(puntos.length - 1)} cy={y(puntos[puntos.length - 1].valor)} r={4.5} className="crec-punto" />
        {activo !== null && p && (
          <g>
            <line x1={x(activo)} x2={x(activo)} y1={ARRIBA} y2={y(0)} className="crec-guia" />
            <circle cx={x(activo)} cy={y(p.valor)} r={5} className="crec-punto crec-punto--activo" />
          </g>
        )}
      </svg>
      {p && activo !== null && (
        <div className="crec-tip" style={{ left: `${(x(activo) / ANCHO) * 100}%` }}>
          <strong>{formatear(p.valor, euros)}</strong>
          <span>{p.etiqueta}</span>
        </div>
      )}
    </div>
  );
}

export function GraficaBarras({ puntos, euros = false, vacio, tono = "dinero" }: { puntos: Punto[]; euros?: boolean; vacio: string; tono?: Tono }) {
  const [activo, setActivo] = useState<number | null>(null);
  if (!puntos.length || puntos.every((p) => p.valor === 0)) return <p className="obj-vacio obj-vacio--grafica">📭 {vacio}</p>;

  const marcas = marcasY(Math.max(...puntos.map((p) => p.valor)));
  const maxY = marcas[marcas.length - 1] || 1;
  const anchoUtil = ANCHO - IZQ - 8;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const hueco = anchoUtil / puntos.length;
  const ancho = Math.max(4, Math.min(42, hueco - 6));
  const y = (v: number) => ARRIBA + altoUtil - (v / maxY) * altoUtil;

  return (
    <div className={`crec-grafica crec-grafica--${tono}`}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="crec-svg" onMouseLeave={() => setActivo(null)} role="img" aria-label="Ingresos por mes">
        {marcas.map((m) => (
          <g key={m}>
            <line x1={IZQ} x2={ANCHO - 8} y1={y(m)} y2={y(m)} className="crec-rejilla" />
            <text x={IZQ - 8} y={y(m) + 4} className="crec-eje" textAnchor="end">{formatear(m, euros)}</text>
          </g>
        ))}
        {puntos.map((p, i) => {
          const cx = IZQ + hueco * i + hueco / 2;
          const alto = y(0) - y(p.valor);
          return (
            <g key={p.etiqueta} onMouseEnter={() => setActivo(i)}>
              {/* Zona de ratón más grande que la barra */}
              <rect x={IZQ + hueco * i} y={ARRIBA} width={hueco} height={altoUtil} fill="transparent" />
              <rect
                x={cx - ancho / 2}
                y={y(p.valor)}
                width={ancho}
                height={Math.max(0, alto)}
                rx={4}
                className={`crec-barra${activo === i ? " crec-barra--activa" : ""}`}
              />
              {(puntos.length <= 12 || i % 2 === 0 || i === puntos.length - 1) && (
                <text x={cx} y={ALTO - 6} className="crec-eje" textAnchor="middle">{p.etiqueta}</text>
              )}
            </g>
          );
        })}
      </svg>
      {activo !== null && (
        <div className="crec-tip" style={{ left: `${((IZQ + hueco * activo + hueco / 2) / ANCHO) * 100}%` }}>
          <strong>{formatear(puntos[activo].valor, euros)}</strong>
          <span>{puntos[activo].etiqueta}</span>
        </div>
      )}
    </div>
  );
}
