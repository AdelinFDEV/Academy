"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { DiaTrafico } from "@/lib/analitica";

/**
 * Visitantes únicos por día (barras) y su media de 7 días (línea), en un solo
 * eje. Al pasar el ratón o el dedo, el detalle del día en un globo de papel:
 * visitantes, páginas y registros.
 *
 * Colores del cuaderno, desde analitica.css: cada barra es una tecla naranja
 * con su canto, y la media va a boli azul.
 *
 * El dibujo se hace al ancho real de su caja (una unidad del SVG = un píxel):
 * con un `viewBox` fijo de 760, en un móvil todo se encogía a un tercio y las
 * fechas del eje quedaban en 4 px. Con el dedo, el globo sigue al dedo al
 * arrastrar y se cierra tocando fuera.
 */
const W_INICIAL = 760;
const IZQ = 34;
const ABAJO = 26;
const ARRIBA = 12;

function fechaLarga(dia: string) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
function fechaCorta(dia: string) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Tope del eje: un número redondo por encima del máximo. */
function tope(max: number) {
  if (max <= 4) return 4;
  const base = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * base >= max) return m * base;
  return 10 * base;
}

export default function GraficoVisitas({ serie }: { serie: DiaTrafico[] }) {
  const [sobre, setSobre] = useState<number | null>(null);
  const [W, setW] = useState(W_INICIAL);
  const caja = useRef<HTMLDivElement>(null);

  // El ancho real de la caja, y que se rehaga si cambia (girar el móvil).
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setW(Math.max(260, Math.round(el.clientWidth)));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Con el dedo no hay «salir con el ratón»: tocar fuera cierra el globo.
  useEffect(() => {
    if (sobre === null) return;
    const fuera = (e: globalThis.PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setSobre(null);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [sobre]);

  const estrecho = W < 520;
  const H = estrecho ? 210 : 250;
  const GLOBO = estrecho ? 172 : 190;

  const max = tope(Math.max(...serie.map((d) => d.visitantes)));
  const ancho = (W - IZQ) / serie.length;
  const y = (v: number) => H - ABAJO - (v / max) * (H - ABAJO - ARRIBA);
  const x = (i: number) => IZQ + ancho * i + ancho / 2;

  const media = serie.map((_, i) => {
    const ventana = serie.slice(Math.max(0, i - 6), i + 1);
    return ventana.reduce((a, d) => a + d.visitantes, 0) / ventana.length;
  });
  const linea = media.map((m, i) => `${x(i).toFixed(1)},${y(m).toFixed(1)}`).join(" ");
  const area = `${x(0).toFixed(1)},${y(0)} ${linea} ${x(serie.length - 1).toFixed(1)},${y(0)}`;

  const cuantas = estrecho ? 3 : 4;
  const marcas =
    serie.length <= (estrecho ? 5 : 8)
      ? serie.map((_, i) => i)
      : Array.from({ length: cuantas }, (_, k) => Math.round(((serie.length - 1) * k) / (cuantas - 1)));
  const d = sobre === null ? null : serie[sobre];

  /** El día bajo el puntero (ratón o dedo): toda la columna cuenta, no solo la barra. */
  function apuntar(e: PointerEvent<SVGSVGElement>) {
    const marco = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - marco.left) / marco.width) * W;
    const i = Math.floor((px - IZQ) / ancho);
    setSobre(i >= 0 && i < serie.length ? i : null);
  }

  // Dónde cabe el globo: a la derecha del día, a la izquierda o, si no cabe
  // a ningún lado (móvil), centrado sobre él sin salirse de la caja.
  let globo: { left: number; lado: "der" | "izq" | "centro" } | null = null;
  if (sobre !== null) {
    const p = x(sobre);
    if (p + 14 + GLOBO <= W) globo = { left: p, lado: "der" };
    else if (p - 14 - GLOBO >= 0) globo = { left: p, lado: "izq" };
    else globo = { left: Math.min(Math.max(p - GLOBO / 2, 0), W - GLOBO), lado: "centro" };
  }

  return (
    <div className="an-grafico-caja" ref={caja}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="an-grafico"
        role="img"
        aria-label="Visitantes únicos por día y media de 7 días"
        onPointerDown={apuntar}
        onPointerMove={apuntar}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setSobre(null); }}
      >
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={IZQ} x2={W} y1={y(max * f)} y2={y(max * f)} className="an-grafico-rejilla" />
            <text x={IZQ - 8} y={y(max * f) + 4} textAnchor="end" className="an-grafico-eje">{Math.round(max * f)}</text>
          </g>
        ))}

        <polygon points={area} className="an-grafico-area" />

        {serie.map((dia, i) => {
          const alto = y(0) - y(dia.visitantes);
          const a = Math.max(Math.min(ancho * 0.68, 26), 2);
          const h = Math.max(alto, dia.visitantes ? 2 : 0);
          const r = Math.min(5, a / 2, h / 2);
          return (
            <g key={dia.dia} className={`an-grafico-dia${sobre === null || sobre === i ? "" : " is-apagado"}`}>
              {/* El canto: la misma barra, un poco más abajo y en el tono lateral. */}
              {h > 0 && <rect x={x(i) - a / 2} y={y(dia.visitantes) + 3} width={a} height={h} rx={r} className="an-grafico-canto" />}
              <rect x={x(i) - a / 2} y={y(dia.visitantes)} width={a} height={h} rx={r} className="an-grafico-barra" />
            </g>
          );
        })}

        <polyline points={linea} className="an-grafico-media" />

        {sobre !== null && (
          <g>
            <line x1={x(sobre)} x2={x(sobre)} y1={ARRIBA} y2={y(0)} className="an-grafico-cursor" />
            <circle cx={x(sobre)} cy={y(media[sobre])} r={4.5} className="an-grafico-punto" />
          </g>
        )}

        {marcas.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === serie.length - 1 ? "end" : "middle"} className="an-grafico-eje">
            {fechaCorta(serie[i].dia)}
          </text>
        ))}
      </svg>

      {d && sobre !== null && globo && (
        <div className="an-globo" style={estrecho ? { left: globo.left, width: GLOBO } : { left: globo.left, minWidth: GLOBO }} data-lado={globo.lado}>
          <b>{fechaLarga(d.dia)}</b>
          <span><i className="an-leyenda-barra" /> Visitantes <strong>{d.visitantes}</strong></span>
          <span><i className="an-leyenda-linea" /> Media 7 días <strong>{media[sobre].toFixed(1).replace(".", ",")}</strong></span>
          <span>Páginas vistas <strong>{d.vistas}</strong></span>
          <span>Registros <strong>{d.registros}</strong></span>
        </div>
      )}
    </div>
  );
}
