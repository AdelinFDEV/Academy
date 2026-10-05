"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Las dos gráficas de la pestaña Crecimiento. SVG a mano y sin librería: son
 * una línea y unas barras, y así siguen la misma paleta y tipografía que el
 * resto del panel.
 *
 * Una sola serie por gráfica (sin leyenda: el título la nombra), un solo eje,
 * y el dato exacto al pasar el ratón o tocar, que nunca va solo en el color.
 *
 * El SVG se dibuja al ancho REAL de su caja (no se escala): así el texto de
 * los ejes mide lo mismo en el móvil que en el escritorio, en vez de quedarse
 * en 6 px al encoger un dibujo de 640.
 */

type Punto = { etiqueta: string; valor: number };

/** El color de cada bloque: azul Telegram, rojo YouTube, verde dinero. */
export type Tono = "telegram" | "youtube" | "dinero";

const ALTO = 200;
const ABAJO = 24;
const ARRIBA = 10;
const DCHA = 8;

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

/** El eje Y, en compacto si no cabe: 12.500 → 12,5 mil. */
function formatearEje(v: number, euros: boolean, estrecho: boolean): string {
  if (!estrecho || v < 10000) return formatear(v, euros);
  const n = (v / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 });
  return `${n} mil${euros ? " €" : ""}`;
}

/** Ancho real del contenedor, vigilado por si cambia (girar el móvil, abrir un panel). */
function useAncho() {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setAncho(Math.max(240, Math.round(el.clientWidth)));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { caja, ancho };
}

/** Coloca el recuadro del dato sin que se salga por los lados. */
function posicionTip(x: number, ancho: number): React.CSSProperties {
  const pct = (x / ancho) * 100;
  const desplazar = pct < 18 ? "0%" : pct > 82 ? "-100%" : "-50%";
  return { left: `${pct}%`, transform: `translate(${desplazar}, -100%)` };
}

export function GraficaLinea({ puntos, euros = false, vacio, tono = "telegram" }: { puntos: Punto[]; euros?: boolean; vacio: string; tono?: Tono }) {
  const [activo, setActivo] = useState<number | null>(null);
  const { caja, ancho: ANCHO } = useAncho();
  if (puntos.length < 2) return <p className="obj-vacio obj-vacio--grafica">📭 {vacio}</p>;

  const estrecho = ANCHO < 480;
  const IZQ = estrecho ? 46 : 54;
  const marcas = marcasY(Math.max(...puntos.map((p) => p.valor)));
  const maxY = marcas[marcas.length - 1] || 1;
  const anchoUtil = ANCHO - IZQ - DCHA;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const x = (i: number) => IZQ + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) => ARRIBA + altoUtil - (v / maxY) * altoUtil;

  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${linea} L${x(puntos.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  // En estrecho, solo principio y final: la del medio se pisaría.
  const etiquetasX = estrecho ? [0, puntos.length - 1] : [0, Math.floor((puntos.length - 1) / 2), puntos.length - 1];
  const p = activo !== null ? puntos[activo] : null;

  function mover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - IZQ) / anchoUtil) * (puntos.length - 1));
    setActivo(Math.min(puntos.length - 1, Math.max(0, i)));
  }

  return (
    <div ref={caja} className={`crec-grafica crec-grafica--${tono}`}>
      <svg
        width={ANCHO}
        height={ALTO}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="crec-svg"
        onPointerMove={mover}
        onPointerDown={mover}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
        role="img"
        aria-label={`De ${formatear(puntos[0].valor, euros)} a ${formatear(puntos[puntos.length - 1].valor, euros)}`}
      >
        {marcas.map((m) => (
          <g key={m}>
            <line x1={IZQ} x2={ANCHO - DCHA} y1={y(m)} y2={y(m)} className="crec-rejilla" />
            <text x={IZQ - 8} y={y(m) + 4} className="crec-eje" textAnchor="end">{formatearEje(m, euros, estrecho)}</text>
          </g>
        ))}
        {etiquetasX.map((i) => (
          <text key={i} x={x(i)} y={ALTO - 6} className="crec-eje" textAnchor={i === 0 ? "start" : i === puntos.length - 1 ? "end" : "middle"}>
            {puntos[i].etiqueta}
          </text>
        ))}
        <path d={area} className="crec-area" />
        <path d={linea} className="crec-linea" />
        {/* El último valor, marcado: es el que más se mira */}
        <circle cx={x(puntos.length - 1)} cy={y(puntos[puntos.length - 1].valor)} r={4.5} className="crec-punto" />
        {activo !== null && p && (
          <g>
            <line x1={x(activo)} x2={x(activo)} y1={ARRIBA} y2={y(0)} className="crec-guia" />
            <circle cx={x(activo)} cy={y(p.valor)} r={5} className="crec-punto crec-punto--activo" />
          </g>
        )}
      </svg>
      {p && activo !== null && (
        <div className="crec-tip" style={posicionTip(x(activo), ANCHO)}>
          <strong>{formatear(p.valor, euros)}</strong>
          <span>{p.etiqueta}</span>
        </div>
      )}
    </div>
  );
}

export function GraficaBarras({ puntos, euros = false, vacio, tono = "dinero", destacar }: { puntos: Punto[]; euros?: boolean; vacio: string; tono?: Tono; destacar?: number }) {
  const [activo, setActivo] = useState<number | null>(null);
  const { caja, ancho: ANCHO } = useAncho();
  if (!puntos.length || puntos.every((p) => p.valor === 0)) return <p className="obj-vacio obj-vacio--grafica">📭 {vacio}</p>;

  const estrecho = ANCHO < 480;
  const IZQ = estrecho ? 46 : 54;
  const marcas = marcasY(Math.max(...puntos.map((p) => p.valor)));
  const maxY = marcas[marcas.length - 1] || 1;
  const anchoUtil = ANCHO - IZQ - DCHA;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const hueco = anchoUtil / puntos.length;
  const ancho = Math.max(4, Math.min(42, hueco - (estrecho ? 4 : 6)));
  const y = (v: number) => ARRIBA + altoUtil - (v / maxY) * altoUtil;
  // Una etiqueta cada tantas barras como haga falta para que quepan (~34 px cada una).
  const cada = Math.max(1, Math.ceil(34 / hueco));
  const conEtiqueta = (i: number) => i === puntos.length - 1 || (puntos.length - 1 - i) % cada === 0;

  return (
    <div ref={caja} className={`crec-grafica crec-grafica--${tono}`}>
      <svg
        width={ANCHO}
        height={ALTO}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="crec-svg"
        onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
        role="img"
        aria-label="Ingresos por mes"
      >
        {marcas.map((m) => (
          <g key={m}>
            <line x1={IZQ} x2={ANCHO - DCHA} y1={y(m)} y2={y(m)} className="crec-rejilla" />
            <text x={IZQ - 8} y={y(m) + 4} className="crec-eje" textAnchor="end">{formatearEje(m, euros, estrecho)}</text>
          </g>
        ))}
        {puntos.map((p, i) => {
          const cx = IZQ + hueco * i + hueco / 2;
          const alto = y(0) - y(p.valor);
          return (
            <g key={`${p.etiqueta}-${i}`} onPointerEnter={() => setActivo(i)} onPointerDown={() => setActivo(i)}>
              {/* Zona de toque más grande que la barra */}
              <rect x={IZQ + hueco * i} y={ARRIBA} width={hueco} height={altoUtil} fill="transparent" />
              <rect
                x={cx - ancho / 2}
                y={y(p.valor)}
                width={ancho}
                height={Math.max(0, alto)}
                rx={4}
                className={`crec-barra${activo === i ? " crec-barra--activa" : ""}${destacar === i && p.valor > 0 ? " crec-barra--record" : ""}`}
              />
              {conEtiqueta(i) && (
                <text x={cx} y={ALTO - 6} className="crec-eje" textAnchor="middle">{p.etiqueta}</text>
              )}
            </g>
          );
        })}
      </svg>
      {activo !== null && (
        <div className="crec-tip" style={posicionTip(IZQ + hueco * activo + hueco / 2, ANCHO)}>
          <strong>{formatear(puntos[activo].valor, euros)}</strong>
          <span>{puntos[activo].etiqueta}</span>
        </div>
      )}
    </div>
  );
}
