export const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
export const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Los gráficos de Recharts pintan en SVG y necesitan el color literal. Son los
 * del estilo «Cuaderno de estudio» (globals.css): `--sube`, `--baja`,
 * `--tinta-3`, `--gris`, `--tinta-2`, el papel y el azul del Diario. Si cambia
 * uno allí, se cambia aquí.
 */
export const TJ_COLORS = {
  win: "#12a36b",
  loss: "#e5484d",
  be: "#a3a7c0",
  grid: "#e2e5f4",
  axis: "#5f5c7d",
  bg: "#ffffff",
  azul: "#4f5dff",
  azulSuave: "#e4e7ff",
} as const;

export type Tone = "win" | "loss" | "be";

export const toneOf = (n: number): Tone => (n > 0 ? "win" : n < 0 ? "loss" : "be");

const num = (n: number, decimals = 2) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Importe con signo: +12,50 $ */
export function pnlStr(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n))} $`;
}

/** Importe sin signo: 1.250,00 $ */
export function moneyStr(n: number): string {
  return `${n < 0 ? "−" : ""}${num(Math.abs(n))} $`;
}

export function pctStr(n: number, signed = true, decimals = 1): string {
  const sign = signed ? (n > 0 ? "+" : n < 0 ? "−" : "") : n < 0 ? "−" : "";
  return `${sign}${num(Math.abs(n), decimals)} %`;
}

export function rStr(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n), Math.abs(n) >= 10 ? 1 : 2)}R`;
}

export function ratioStr(n: number): string {
  return `1:${num(n, n % 1 === 0 ? 0 : 1)}`;
}

export function factorStr(n: number | null): string {
  if (n == null) return "—";
  return n === Infinity ? "∞" : num(n, 2);
}

export function dateShort(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export function dateLong(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}
