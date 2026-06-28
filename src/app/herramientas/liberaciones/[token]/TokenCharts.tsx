"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Token } from "../tokenData";

interface Allocation {
  name: string;
  pct: number;
  tokens: number;
  color: string;
  schedule: string;
  isActive?: boolean;
}

interface Props {
  allocations: Allocation[];
  chartData: Record<string, string | number>[];
  categories: string[];
  categoryColors: Record<string, string>;
  tokenColor: string;
  tokenSymbol: string;
}

function fmtTokens(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("es-ES");
}

export default function TokenCharts({ allocations, chartData, categories, categoryColors, tokenColor, tokenSymbol }: Props) {
  return (
    <>
      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={allocations}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            dataKey="pct"
            nameKey="name"
            paddingAngle={2}
          >
            {allocations.map((a, i) => (
              <Cell key={i} fill={a.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Porcentaje"]}
            contentStyle={{ background: "#0f2040", border: "1px solid rgba(240,244,255,0.1)", borderRadius: 8, color: "#dce8f8", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="lib-alloc-legend">
        {allocations.map((a, i) => (
          <div key={i} className="lib-alloc-item">
            <div className="lib-alloc-dot" style={{ background: a.color }} />
            <div className="lib-alloc-info">
              <span className="lib-alloc-name">{a.name}</span>
              <span className="lib-alloc-tokens">{a.pct}% · {fmtTokens(a.tokens)}</span>
              <span className="lib-alloc-schedule">{a.schedule}</span>
            </div>
            {a.isActive && <span className="lib-alloc-active">activo</span>}
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 ? (
        <div style={{ marginTop: "2rem" }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,244,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#b0c4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#b0c4d8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}B` : `${v}M`} />
              <Tooltip
                formatter={(value, name) => [`${Number(value).toFixed(1)}M ${tokenSymbol}`, String(name)]}
                contentStyle={{ background: "#0f2040", border: "1px solid rgba(240,244,255,0.1)", borderRadius: 8, color: "#dce8f8", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#b0c4d8" }} />
              {categories.map(cat => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColors[cat] ?? tokenColor} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="lib-empty-chart" style={{ marginTop: "2rem" }}>El vesting de este token ha finalizado</div>
      )}
    </>
  );
}
