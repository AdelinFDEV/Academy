import type { SupabaseClient } from "@supabase/supabase-js";
import { formatoES } from "@/lib/formato";

/**
 * Los movimientos de la cartera spot de altcoins — SOLO esa cartera.
 *
 * La API de `/api/portfolio` los apunta sola al abrir, ampliar, reducir o
 * cerrar una posición, y `/portfolio` enseña los tres últimos arriba. El DCA
 * de Bitcoin no pasa por aquí. Tabla: `scripts/create-portfolio-movimientos.sql`.
 */

export type TipoMovimiento = "apertura" | "ampliacion" | "reduccion" | "cierre";

export interface Movimiento {
  id: string;
  created_at: string;
  tipo: TipoMovimiento;
  coin_symbol: string;
  coin_name: string;
  coingecko_id: string | null;
  precio: number | null;
  cantidad: number | null;
  nota: string | null;
}

export type NuevoMovimiento = Omit<Movimiento, "id" | "created_at">;

/**
 * Apunta un movimiento. Nunca lanza: si la tabla no existe o falla la
 * escritura, la operación sobre la cartera ya se ha hecho y no debe
 * devolverse como error por culpa del diario.
 */
export async function registrarMovimiento(admin: SupabaseClient, mov: NuevoMovimiento): Promise<void> {
  try {
    const { error } = await admin.from("portfolio_movimientos").insert(mov);
    if (error) console.error("[portfolio_movimientos]", error.message);
  } catch (err) {
    console.error("[portfolio_movimientos]", err instanceof Error ? err.message : err);
  }
}

/** Precio en dólares con los decimales que pide su tamaño. */
export function precioUSD(n: number): string {
  const dec = n >= 100 ? 2 : n >= 1 ? 3 : n >= 0.01 ? 4 : 8;
  return `${formatoES(n, { minimumFractionDigits: 2, maximumFractionDigits: dec })} $`;
}

/** El mensaje, en primera persona, tal como lo leería el alumno. */
export function textoMovimiento(m: Movimiento): string {
  const a = m.precio !== null ? ` a ${precioUSD(Number(m.precio))}` : "";
  switch (m.tipo) {
    case "apertura":
      return `Abro posición en ${m.coin_name} (${m.coin_symbol})${a}.`;
    case "ampliacion":
      return `Compro más ${m.coin_name} (${m.coin_symbol})${a}.`;
    case "reduccion":
      return `Vendo parte de mi posición en ${m.coin_name} (${m.coin_symbol})${a}.`;
    case "cierre":
      return `Cierro mi posición en ${m.coin_name} (${m.coin_symbol})${a}.`;
  }
}

export const ETIQUETA_TIPO: Record<TipoMovimiento, string> = {
  apertura: "Compra",
  ampliacion: "Compra",
  reduccion: "Venta",
  cierre: "Venta",
};
