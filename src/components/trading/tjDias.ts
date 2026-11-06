import type { Trade } from "./tjStats";

/**
 * Lo que el usuario apunta de cada día, aparte de sus operaciones: cómo se
 * sintió y una nota corta. Tabla diario_dias (scripts/create-diario-dias.sql).
 *
 * Los emojis van aquí a propósito: el admin los pidió para el ánimo del
 * calendario (06-11-2026). El resto de la web sigue sin emojis.
 */

export type Animo = 1 | 2 | 3 | 4;

export interface DiaDiario {
  /** AAAA-MM-DD en el calendario del usuario. */
  fecha: string;
  animo: Animo | null;
  nota: string | null;
}

export const NOTA_MAX = 600;

export const ANIMOS: { value: Animo; emoji: string; label: string }[] = [
  { value: 4, emoji: "🤩", label: "Fantástico" },
  { value: 3, emoji: "🙂", label: "Bien" },
  { value: 2, emoji: "😕", label: "Mal" },
  { value: 1, emoji: "😣", label: "Muy mal" },
];

export const animoInfo = (a: Animo) => ANIMOS.find(x => x.value === a)!;

/** El ánimo más cercano a una media (3,4 → «Bien»). */
export const animoDeMedia = (media: number): Animo => Math.min(4, Math.max(1, Math.round(media))) as Animo;

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha local AAAA-MM-DD: la del reloj del usuario, nunca la de UTC. */
export const fechaKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** AAAA-MM-DD → Date a mediodía local (a mediodía ningún cambio de hora mueve el día). */
export const fechaDate = (f: string) => {
  const [y, m, d] = f.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};

export type DiasMap = Record<string, DiaDiario>;

export const toDiasMap = (rows: DiaDiario[]): DiasMap => Object.fromEntries(rows.map(r => [r.fecha, r]));

/** P&L, operaciones y ganadas de cada día con operaciones. */
export function pnlPorDia(trades: Trade[]): Map<string, { pnl: number; count: number; wins: number }> {
  const map = new Map<string, { pnl: number; count: number; wins: number }>();
  for (const t of trades) {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) continue;
    const k = fechaKey(d);
    const v = map.get(k) ?? { pnl: 0, count: 0, wins: 0 };
    v.pnl += t.pnl;
    v.count++;
    if (t.result === "win") v.wins++;
    map.set(k, v);
  }
  return map;
}

/**
 * Días seguidos con algo apuntado (ánimo o nota) hasta hoy. Si hoy aún no
 * hay nada, la racha cuenta hasta ayer: no se rompe por no haber llegado la noche.
 */
export function rachaDias(dias: DiasMap, now: Date): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!dias[fechaKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dias[fechaKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
