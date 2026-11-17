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

// Los colores del sistema (ESTILO.md), en el orden en que se reparten las series.
const PALETA = ["#8f7cff", "#ff8a1f", "#2fbff5", "#2fc488", "#ff6b81", "#4f5dff"];
// Tinta, gris y papel del cuaderno, para ejes, rejilla y la ficha flotante.
const TINTA = "#1d1b33";
const TINTA_2 = "#5f5c7d";
const GRIS = "#e2e5f4";
const GRIS_O = "#c1c6dc";

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
      <CartesianGrid stroke={GRIS} strokeDasharray="4 6" vertical={false} />
      <XAxis dataKey="etiqueta" tick={{ fill: TINTA_2, fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
      <YAxis
        tickFormatter={fmt}
        tick={{ fill: TINTA_2, fontSize: 11, fontWeight: 700 }}
        axisLine={false}
        tickLine={false}
        width={72}
      />
      <Tooltip
        formatter={(v) => fmt(Number(v))}
        contentStyle={{ background: "#fff", border: 0, borderRadius: 14, fontSize: 13, fontWeight: 700, color: TINTA, boxShadow: `0 4px 0 ${GRIS_O}` }}
        labelStyle={{ color: TINTA_2, fontWeight: 900 }}
        cursor={{ fill: "rgba(143,124,255,0.08)" }}
      />
      {g.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800, paddingTop: 8, color: TINTA_2 }} />}
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
                    radius={[8, 8, 0, 0]}
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
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fff", stroke: color(i), strokeWidth: 2.5 }}
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
                    fillOpacity={0.22}
                    strokeWidth={3}
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
