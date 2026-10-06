"use client";

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Marco, useEnVista, formatear, type Formato } from "./comun";

/**
 * Gráfico animado. Se pinta al entrar en pantalla —no antes—, así la
 * animación de Recharts la ve el alumno en vez de ocurrir fuera de su vista.
 *
 * datos: {
 *   tipo: "barras" | "linea" | "area",
 *   titulo, subtitulo?, nota?,
 *   formato?: "eur" | "pct" | "num",
 *   apilado?: boolean,               // solo barras y área
 *   datos: [{ etiqueta: "2024", ventas: 120, compras: 80 }, …],
 *   series: [{ clave: "ventas", nombre: "Ventas", color?: "#e6b455" }, …]
 * }
 */

export interface DatosGrafico {
  tipo: "barras" | "linea" | "area";
  titulo?: string;
  subtitulo?: string;
  nota?: string;
  formato?: Formato;
  apilado?: boolean;
  datos: Record<string, string | number>[];
  series: { clave: string; nombre: string; color?: string }[];
}

const PALETA = ["#e6b455", "#7ea6ff", "#4ade80", "#f472b6", "#c084fc", "#22d3ee"];

export function validarGrafico(d: unknown): d is DatosGrafico {
  const x = d as DatosGrafico;
  return !!x && ["barras", "linea", "area"].includes(x.tipo) && Array.isArray(x.datos) && Array.isArray(x.series) && x.series.length > 0;
}

export default function Grafico({ datos: g }: { datos: DatosGrafico }) {
  const { ref, visto } = useEnVista<HTMLDivElement>();
  const fmt = (v: number) => formatear(v, g.formato);
  const color = (i: number) => g.series[i].color ?? PALETA[i % PALETA.length];

  const comunes = {
    data: g.datos,
    margin: { top: 8, right: 12, left: 4, bottom: 0 },
  };
  const ejes = (
    <>
      <CartesianGrid stroke="rgba(240,244,255,0.07)" vertical={false} />
      <XAxis dataKey="etiqueta" tick={{ fill: "rgba(240,244,255,0.55)", fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis
        tickFormatter={fmt}
        tick={{ fill: "rgba(240,244,255,0.45)", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={72}
      />
      <Tooltip
        formatter={(v) => fmt(Number(v))}
        contentStyle={{ background: "#0d1322", border: "1px solid rgba(240,244,255,0.12)", borderRadius: 10, fontSize: 13 }}
        labelStyle={{ color: "rgba(240,244,255,0.7)" }}
        cursor={{ fill: "rgba(240,244,255,0.04)" }}
      />
      {g.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
    </>
  );

  return (
    <Marco clase="grafico" titulo={g.titulo} subtitulo={g.subtitulo}>
      <div ref={ref} className="aula-grafico">
        {visto && (
          <ResponsiveContainer width="100%" height={280}>
            {g.tipo === "barras" ? (
              <BarChart {...comunes}>
                {ejes}
                {g.series.map((s, i) => (
                  <Bar
                    key={s.clave}
                    dataKey={s.clave}
                    name={s.nombre}
                    fill={color(i)}
                    radius={[6, 6, 0, 0]}
                    stackId={g.apilado ? "a" : undefined}
                    animationDuration={1100}
                    animationBegin={i * 180}
                  />
                ))}
              </BarChart>
            ) : g.tipo === "linea" ? (
              <LineChart {...comunes}>
                {ejes}
                {g.series.map((s, i) => (
                  <Line
                    key={s.clave}
                    type="monotone"
                    dataKey={s.clave}
                    name={s.nombre}
                    stroke={color(i)}
                    strokeWidth={2.4}
                    dot={{ r: 3, fill: color(i) }}
                    animationDuration={1400}
                    animationBegin={i * 200}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart {...comunes}>
                {ejes}
                {g.series.map((s, i) => (
                  <Area
                    key={s.clave}
                    type="monotone"
                    dataKey={s.clave}
                    name={s.nombre}
                    stroke={color(i)}
                    fill={color(i)}
                    fillOpacity={0.18}
                    strokeWidth={2.2}
                    stackId={g.apilado ? "a" : undefined}
                    animationDuration={1400}
                    animationBegin={i * 200}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {g.nota && <p className="aula-bloque-nota">{g.nota}</p>}
    </Marco>
  );
}
