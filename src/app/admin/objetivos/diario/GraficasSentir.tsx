"use client";

import { useEffect, useRef, useState } from "react";
import { ANIMOS, ANIMO_EMOJI } from "@/lib/objetivos";
import { cifra } from "../editor";

/**
 * Las gráficas de «Cómo me siento», pensadas para años de datos:
 * - GraficaAnimo: tu ánimo medio por semana o por mes, con la tendencia.
 * - MapaFactores: qué te afecta o te motiva en cada tramo, como mapa de calor.
 *
 * Se dibujan al ancho real de su caja: el texto mide lo mismo en el móvil.
 */

export type PuntoAnimo = { etiqueta: string; valor: number | null; notas: number };

const ALTO = 220;
const IZQ = 34;
const DCHA = 10;
const ARRIBA = 14;
const ABAJO = 26;

function useAncho() {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setAncho(Math.max(260, Math.round(el.clientWidth)));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { caja, ancho };
}

function nivel(v: number): number {
  return Math.min(5, Math.max(1, Math.round(v)));
}

/** Media móvil de 3 tramos con datos: la tendencia, sin los picos sueltos. */
function tendencia(puntos: PuntoAnimo[]): (number | null)[] {
  return puntos.map((_, i) => {
    const ventana = puntos.slice(Math.max(0, i - 2), i + 1).filter((p) => p.valor !== null).map((p) => p.valor as number);
    return puntos[i].valor === null || ventana.length < 2 ? null : ventana.reduce((a, b) => a + b, 0) / ventana.length;
  });
}

export function GraficaAnimo({ puntos }: { puntos: PuntoAnimo[] }) {
  const { caja, ancho } = useAncho();
  const [activo, setActivo] = useState<number | null>(null);
  const conDato = puntos.filter((p) => p.valor !== null).length;

  const util = ancho - IZQ - DCHA;
  const alto = ALTO - ARRIBA - ABAJO;
  const paso = puntos.length > 1 ? util / (puntos.length - 1) : 0;
  const x = (i: number) => IZQ + (puntos.length > 1 ? i * paso : util / 2);
  const y = (v: number) => ARRIBA + alto - ((v - 1) / 4) * alto;

  const linea = (valores: (number | null)[]) =>
    valores
      .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .filter(Boolean)
      .map((p, i) => `${i ? "L" : "M"}${p}`)
      .join(" ");
  const media = linea(puntos.map((p) => p.valor));
  const suave = linea(tendencia(puntos));
  // Etiquetas del eje X: las que quepan (~56 px cada una), siempre la última.
  const cada = Math.max(1, Math.ceil(56 / Math.max(paso, 1)));
  const p = activo !== null ? puntos[activo] : null;

  function mover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - r.left - IZQ) / Math.max(paso, 1));
    setActivo(Math.min(puntos.length - 1, Math.max(0, i)));
  }

  return (
    <div ref={caja} className="sen-grafica">
      {conDato === 0 ? (
        <p className="sen-vacio">Sin notas con ánimo en este periodo.</p>
      ) : (
        <>
          <svg
            width={ancho}
            height={ALTO}
            viewBox={`0 0 ${ancho} ${ALTO}`}
            className="sen-svg"
            onPointerMove={mover}
            onPointerDown={mover}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
            role="img"
            aria-label="Evolución de tu ánimo medio"
          >
            {/* Bandas: abajo rojo, arriba verde, muy suaves */}
            <rect x={IZQ} y={y(5)} width={util} height={y(3.5) - y(5)} className="sen-banda sen-banda--bien" />
            <rect x={IZQ} y={y(2.5)} width={util} height={y(1) - y(2.5)} className="sen-banda sen-banda--mal" />
            {[1, 2, 3, 4, 5].map((v) => (
              <g key={v}>
                <line x1={IZQ} x2={ancho - DCHA} y1={y(v)} y2={y(v)} className="sen-rejilla" />
                <text x={IZQ - 8} y={y(v) + 5} className="sen-eje-emoji" textAnchor="end">{ANIMO_EMOJI[v - 1]}</text>
              </g>
            ))}
            {puntos.map((pt, i) =>
              i === puntos.length - 1 || (puntos.length - 1 - i) % cada === 0 ? (
                <text key={i} x={x(i)} y={ALTO - 6} className="sen-eje" textAnchor={i === 0 ? "start" : i === puntos.length - 1 ? "end" : "middle"}>
                  {pt.etiqueta}
                </text>
              ) : null
            )}
            {suave && <path d={suave} className="sen-tendencia" />}
            <path d={media} className="sen-linea" />
            {puntos.map((pt, i) =>
              pt.valor === null ? null : (
                <circle key={i} cx={x(i)} cy={y(pt.valor)} r={activo === i ? 6 : 4} className={`sen-punto sen-punto--${nivel(pt.valor)}`} />
              )
            )}
            {activo !== null && <line x1={x(activo)} x2={x(activo)} y1={ARRIBA} y2={ARRIBA + alto} className="sen-guia" />}
          </svg>
          {p && activo !== null && (
            <div
              className="sen-tip"
              style={{
                left: `${(x(activo) / ancho) * 100}%`,
                transform: `translate(${x(activo) / ancho < 0.18 ? "0%" : x(activo) / ancho > 0.82 ? "-100%" : "-50%"}, -100%)`,
              }}
            >
              <span>{p.etiqueta}</span>
              <strong>{p.valor === null ? "Sin notas con ánimo" : `${ANIMO_EMOJI[nivel(p.valor) - 1]} ${ANIMOS[nivel(p.valor) - 1]} · ${cifra(p.valor)}/5`}</strong>
              <span>{p.notas} nota{p.notas === 1 ? "" : "s"}</span>
            </div>
          )}
          <div className="sen-leyenda">
            <span><i className="sen-leyenda-linea" /> Ánimo medio</span>
            <span><i className="sen-leyenda-linea sen-leyenda-linea--tendencia" /> Tendencia</span>
          </div>
        </>
      )}
    </div>
  );
}

export type FilaMapa = { clave: string; emoji: string; texto: string; celdas: (number | null)[] };

/**
 * Factores × tramos. Cada celda: en qué parte de tus notas de ese tramo
 * aparece el factor (0-100 %). Sin notas ese tramo, la celda va vacía.
 */
export function MapaFactores({ columnas, filas, tono }: { columnas: string[]; filas: FilaMapa[]; tono: "mal" | "bien" }) {
  if (!filas.length) return <p className="sen-vacio">Aún nada marcado en este periodo.</p>;
  const cada = Math.max(1, Math.ceil(columnas.length / 12));
  return (
    <div className={`sen-mapa sen-mapa--${tono}`}>
      <div className="sen-mapa-rejilla" style={{ gridTemplateColumns: `minmax(120px, 170px) repeat(${columnas.length}, minmax(18px, 1fr))` }}>
        {filas.map((f) => (
          <div key={f.clave} className="sen-mapa-fila">
            <span className="sen-mapa-nombre" title={f.texto}><span aria-hidden="true">{f.emoji}</span> {f.texto}</span>
            {f.celdas.map((c, i) => (
              <span
                key={i}
                className={`sen-mapa-celda${c === null ? " sen-mapa-celda--nada" : ""}`}
                style={c === null ? undefined : ({ "--p": Math.max(0.08, c) } as React.CSSProperties)}
                title={`${f.texto} · ${columnas[i]}: ${c === null ? "sin notas" : `${Math.round(c * 100)} % de tus notas`}`}
              />
            ))}
          </div>
        ))}
        <div className="sen-mapa-fila sen-mapa-fila--eje">
          <span />
          {columnas.map((c, i) => (
            <span key={i} className="sen-mapa-col">{i === columnas.length - 1 || (columnas.length - 1 - i) % cada === 0 ? c : ""}</span>
          ))}
        </div>
      </div>
      <div className="sen-mapa-leyenda">
        <span>Poco</span>
        <i /><i /><i /><i />
        <span>En casi todas tus notas</span>
      </div>
    </div>
  );
}
