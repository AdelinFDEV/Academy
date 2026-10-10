"use client";

import { useEffect, useRef, useState } from "react";
import { formatoES } from "@/lib/objetivos";

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

/**
 * Marcas del eje Y para una serie de NIVEL (miembros, suscriptores) que vive
 * lejos de cero: si siempre empezaran en 0, 18 → 19 miembros o 17.200 → 17.250
 * suscriptores serían una línea plana. Cuando el mínimo pasa de la mitad del
 * máximo, el eje arranca en una marca redonda por debajo del mínimo.
 */
function marcasNivel(min: number, max: number, enteros: boolean): number[] {
  if (min <= 0 || min < max / 2) return marcasY(max);
  // Un margen mínimo (el 5 % del valor, o 4 unidades) para que un miembro de
  // más no parezca un salto enorme.
  const rango = Math.max(max - min, max * 0.05, 4);
  const paso0 = Math.pow(10, Math.floor(Math.log10(rango / 4)));
  const candidato = [1, 2, 2.5, 5, 10].map((m) => m * paso0).find((x) => rango / x <= 4) ?? paso0 * 10;
  // Contando personas no hay 18,5 miembros: con datos enteros, marcas enteras.
  const paso = enteros ? Math.max(1, Math.round(candidato)) : candidato;
  const bajo = Math.max(0, Math.floor(min / paso) * paso - (min % paso === 0 ? paso : 0));
  const alto = Math.ceil(max / paso) * paso + (max % paso === 0 ? paso : 0);
  const marcas: number[] = [];
  for (let v = bajo; v <= alto + 1e-9; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

function formatear(v: number, euros: boolean): string {
  const n = formatoES(v, { maximumFractionDigits: euros ? 0 : 1 });
  return euros ? `${n} €` : n;
}

/** El eje Y, en compacto si no cabe: 12.500 → 12,5 mil. */
function formatearEje(v: number, euros: boolean, estrecho: boolean): string {
  if (!estrecho || v < 10000) return formatear(v, euros);
  const n = formatoES((v / 1000), { maximumFractionDigits: 1 });
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
  const valores = puntos.map((p) => p.valor);
  const marcas = marcasNivel(Math.min(...valores), Math.max(...valores), valores.every(Number.isInteger));
  const minY = marcas[0];
  const maxY = marcas[marcas.length - 1] > minY ? marcas[marcas.length - 1] : minY + 1;
  const anchoUtil = ANCHO - IZQ - DCHA;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const x = (i: number) => IZQ + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) => ARRIBA + altoUtil - ((v - minY) / (maxY - minY)) * altoUtil;

  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${linea} L${x(puntos.length - 1).toFixed(1)},${y(minY)} L${x(0).toFixed(1)},${y(minY)} Z`;
  // En estrecho, solo principio y final: la del medio se pisaría.
  // Sin repetidos: con 2 o 3 puntos, «el del medio» coincide con un extremo.
  const etiquetasX = [...new Set(estrecho ? [0, puntos.length - 1] : [0, Math.floor((puntos.length - 1) / 2), puntos.length - 1])];
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
            <line x1={x(activo)} x2={x(activo)} y1={ARRIBA} y2={y(minY)} className="crec-guia" />
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

export type MesFinanzas = { etiqueta: string; ingresos: number; gastos: number };

/**
 * Ingresos frente a gastos, mes a mes: dos barras por mes (verde y roja) sobre
 * un solo eje en euros. Leyenda arriba; el detalle exacto, con el beneficio,
 * al pasar el ratón o tocar.
 */
export function GraficaIngresosGastos({ meses }: { meses: MesFinanzas[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const { caja, ancho: ANCHO } = useAncho();
  if (!meses.length || meses.every((m) => !m.ingresos && !m.gastos)) {
    return <p className="obj-vacio obj-vacio--grafica">📭 Aún no hay ingresos ni gastos apuntados.</p>;
  }

  const estrecho = ANCHO < 480;
  const IZQ = estrecho ? 46 : 54;
  const marcas = marcasY(Math.max(...meses.map((m) => Math.max(m.ingresos, m.gastos))));
  const maxY = marcas[marcas.length - 1] || 1;
  const anchoUtil = ANCHO - IZQ - DCHA;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const hueco = anchoUtil / meses.length;
  const barra = Math.max(3, Math.min(18, (hueco - 8) / 2));
  const y = (v: number) => ARRIBA + altoUtil - (v / maxY) * altoUtil;
  const cada = Math.max(1, Math.ceil(34 / hueco));
  const m = activo !== null ? meses[activo] : null;

  return (
    <div ref={caja} className="crec-grafica crec-grafica--dinero">
      <div className="fin-leyenda">
        <span><i className="fin-leyenda-ingresos" /> Ingresos</span>
        <span><i className="fin-leyenda-gastos" /> Gastos</span>
      </div>
      <svg
        width={ANCHO}
        height={ALTO}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="crec-svg"
        onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
        role="img"
        aria-label="Ingresos y gastos por mes"
      >
        {marcas.map((v) => (
          <g key={v}>
            <line x1={IZQ} x2={ANCHO - DCHA} y1={y(v)} y2={y(v)} className="crec-rejilla" />
            <text x={IZQ - 8} y={y(v) + 4} className="crec-eje" textAnchor="end">{formatearEje(v, true, estrecho)}</text>
          </g>
        ))}
        {meses.map((mes, i) => {
          const cx = IZQ + hueco * i + hueco / 2;
          return (
            <g key={`${mes.etiqueta}-${i}`} onPointerEnter={() => setActivo(i)} onPointerDown={() => setActivo(i)}>
              <rect x={IZQ + hueco * i} y={ARRIBA} width={hueco} height={altoUtil} fill="transparent" />
              <rect x={cx - barra - 1} y={y(mes.ingresos)} width={barra} height={Math.max(0, y(0) - y(mes.ingresos))} rx={3} className={`fin-barra fin-barra--ingresos${activo === i ? " fin-barra--activa" : ""}`} />
              <rect x={cx + 1} y={y(mes.gastos)} width={barra} height={Math.max(0, y(0) - y(mes.gastos))} rx={3} className={`fin-barra fin-barra--gastos${activo === i ? " fin-barra--activa" : ""}`} />
              {(i === meses.length - 1 || (meses.length - 1 - i) % cada === 0) && (
                <text x={cx} y={ALTO - 6} className="crec-eje" textAnchor="middle">{mes.etiqueta}</text>
              )}
            </g>
          );
        })}
      </svg>
      {m && activo !== null && (
        <div className="crec-tip fin-tip" style={posicionTip(IZQ + hueco * activo + hueco / 2, ANCHO)}>
          <span>{m.etiqueta}</span>
          <span>Ingresos <strong>{formatear(m.ingresos, true)}</strong></span>
          <span>Gastos <strong>{formatear(m.gastos, true)}</strong></span>
          <span>Beneficio <strong className={m.ingresos - m.gastos >= 0 ? "fin-pos" : "fin-neg"}>{formatear(m.ingresos - m.gastos, true)}</strong></span>
        </div>
      )}
    </div>
  );
}

/**
 * Beneficio neto de cada mes (ingresos − gastos): barras hacia arriba en
 * verde si ganas y hacia abajo en rojo si pierdes, desde una línea en cero.
 */
export function GraficaBeneficio({ meses }: { meses: { etiqueta: string; valor: number }[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const { caja, ancho: ANCHO } = useAncho();
  if (!meses.length || meses.every((m) => m.valor === 0)) {
    return <p className="obj-vacio obj-vacio--grafica">📭 Sin beneficios ni pérdidas que enseñar todavía.</p>;
  }

  const estrecho = ANCHO < 480;
  const IZQ = estrecho ? 52 : 60;
  // Cada lado de la escala solo existe si hay meses en ese lado: sin pérdidas
  // no hay parte negativa (marcasY(0) daría [0, 1] y pintaría un «-1 €»).
  const maxPos = Math.max(0, ...meses.map((m) => m.valor));
  const maxNeg = Math.max(0, ...meses.map((m) => -m.valor));
  const arriba = maxPos > 0 ? marcasY(maxPos) : [0];
  const abajo = maxNeg > 0 ? marcasY(maxNeg) : [0];
  const tope = arriba[arriba.length - 1];
  const fondo = abajo[abajo.length - 1];
  const rango = tope + fondo || 1;
  const anchoUtil = ANCHO - IZQ - DCHA;
  const altoUtil = ALTO - ABAJO - ARRIBA;
  const hueco = anchoUtil / meses.length;
  const barra = Math.max(4, Math.min(34, hueco - 8));
  const y = (v: number) => ARRIBA + ((tope - v) / rango) * altoUtil;
  const cada = Math.max(1, Math.ceil(34 / hueco));
  // Las marcas, sin ninguna pegada a otra: una etiqueta a menos de 14 px del cero se salta.
  const marcas = [...arriba.filter((v) => v > 0), 0, ...abajo.filter((v) => v > 0).map((v) => -v)].filter(
    (v) => v === 0 || Math.abs(y(v) - y(0)) >= 14
  );
  const m = activo !== null ? meses[activo] : null;

  return (
    <div ref={caja} className="crec-grafica crec-grafica--dinero">
      <svg
        width={ANCHO}
        height={ALTO}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="crec-svg"
        onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
        role="img"
        aria-label="Beneficio o pérdida de cada mes"
      >
        {marcas.map((v) => (
          <g key={v}>
            <line x1={IZQ} x2={ANCHO - DCHA} y1={y(v)} y2={y(v)} className={v === 0 ? "fin-cero" : "crec-rejilla"} />
            <text x={IZQ - 8} y={y(v) + 4} className="crec-eje" textAnchor="end">{formatearEje(v, true, estrecho)}</text>
          </g>
        ))}
        {meses.map((mes, i) => {
          const cx = IZQ + hueco * i + hueco / 2;
          const yv = y(mes.valor);
          const y0 = y(0);
          return (
            <g key={`${mes.etiqueta}-${i}`} onPointerEnter={() => setActivo(i)} onPointerDown={() => setActivo(i)}>
              <rect x={IZQ + hueco * i} y={ARRIBA} width={hueco} height={altoUtil} fill="transparent" />
              {mes.valor !== 0 && (
                <rect
                  x={cx - barra / 2}
                  y={Math.min(yv, y0)}
                  width={barra}
                  height={Math.max(2, Math.abs(y0 - yv))}
                  rx={3}
                  className={`fin-barra ${mes.valor > 0 ? "fin-barra--ingresos" : "fin-barra--gastos"}${activo === i ? " fin-barra--activa" : ""}`}
                />
              )}
              {(i === meses.length - 1 || (meses.length - 1 - i) % cada === 0) && (
                <text x={cx} y={ALTO - 6} className="crec-eje" textAnchor="middle">{mes.etiqueta}</text>
              )}
            </g>
          );
        })}
      </svg>
      {m && activo !== null && (
        <div className="crec-tip" style={posicionTip(IZQ + hueco * activo + hueco / 2, ANCHO)}>
          <strong className={m.valor >= 0 ? "fin-pos" : "fin-neg"}>{m.valor >= 0 ? "+" : ""}{formatear(m.valor, true)}</strong>
          <span>{m.etiqueta} · {m.valor >= 0 ? "beneficio" : "pérdida"}</span>
        </div>
      )}
    </div>
  );
}
