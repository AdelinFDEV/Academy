"use client";

import { useState } from "react";
import type { DiaTrafico } from "@/lib/analitica";

/**
 * Visitantes únicos por día (barras) y su media de 7 días (línea), en un solo
 * eje. Al pasar el ratón o el dedo, el detalle del día: visitantes, páginas y
 * registros.
 */
const W = 760;
const H = 250;
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

  const marcas = serie.length <= 8 ? serie.map((_, i) => i) : [0, Math.round((serie.length - 1) / 3), Math.round(((serie.length - 1) * 2) / 3), serie.length - 1];
  const d = sobre === null ? null : serie[sobre];

  return (
    <div className="an-grafico-caja" onMouseLeave={() => setSobre(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="an-grafico" role="img" aria-label="Visitantes únicos por día y media de 7 días">
        <defs>
          <linearGradient id="an-barra" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8642b" />
            <stop offset="100%" stopColor="#e8642b" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="an-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a9ed3" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2a9ed3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={IZQ} x2={W} y1={y(max * f)} y2={y(max * f)} className="an-grafico-rejilla" />
            <text x={IZQ - 8} y={y(max * f) + 4} textAnchor="end" className="an-grafico-eje">{Math.round(max * f)}</text>
          </g>
        ))}

        <polygon points={area} fill="url(#an-area)" />

        {serie.map((dia, i) => {
          const alto = y(0) - y(dia.visitantes);
          const a = Math.max(Math.min(ancho * 0.68, 26), 2);
          return (
            <rect
              key={dia.dia}
              x={x(i) - a / 2}
              y={y(dia.visitantes)}
              width={a}
              height={Math.max(alto, dia.visitantes ? 2 : 0)}
              rx={Math.min(4, a / 2)}
              fill="url(#an-barra)"
              opacity={sobre === null || sobre === i ? 1 : 0.45}
            />
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

        {/* Zonas de contacto: toda la columna de cada día, no solo la barra. */}
        {serie.map((dia, i) => (
          <rect
            key={dia.dia}
            x={IZQ + ancho * i}
            y={0}
            width={ancho}
            height={H - ABAJO}
            fill="transparent"
            onMouseEnter={() => setSobre(i)}
            onTouchStart={() => setSobre(i)}
          />
        ))}
      </svg>

      {d && sobre !== null && (
        <div className="an-globo" style={{ left: `${(x(sobre) / W) * 100}%` }} data-lado={sobre > serie.length / 2 ? "izq" : "der"}>
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
