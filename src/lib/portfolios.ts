/**
 * Las carteras de Portfolio Adelin — fuente única.
 *
 * Hasta el 07-09-2026 había una sola, así que su nombre estaba escrito a mano
 * donde hiciera falta. Al entrar el DCA de Bitcoin pasan a ser dos, y esto
 * existe para que la pestaña, el título de la página y la ficha pública digan
 * lo mismo sin que nadie tenga que acordarse — el mismo patrón que
 * `herramientas.ts`, y por el mismo motivo.
 *
 * Las dos carteras **no comparten tabla**, y es a propósito: el spot guarda una
 * fila por moneda con su precio medio, y el DCA una fila por compra porque ahí
 * el histórico es el contenido. Ver `scripts/create-dca-compras.sql`.
 */

export type PortfolioId = "spot" | "dca";

export interface Portfolio {
  id: PortfolioId;
  /** Nombre corto, el de la pestaña. */
  label: string;
  /** Qué es, en una línea. Se usa bajo el título. */
  desc: string;
  /** Color de acento de la cartera. */
  color: string;
}

export const PORTFOLIOS: Portfolio[] = [
  {
    id: "spot",
    label: "Spot",
    desc: "Mis compras de altcoins en spot, con el precio de entrada y la rentabilidad de cada una.",
    color: "#4f9dff",
  },
  {
    id: "dca",
    label: "DCA Bitcoin",
    desc: "Compras periódicas de Bitcoin, pase lo que pase en el mercado. Todas las aportaciones, con la fecha y el precio de aquel día.",
    color: "#f7931a",
  },
];

export function portfolio(id: PortfolioId): Portfolio {
  const p = PORTFOLIOS.find((x) => x.id === id);
  if (!p) throw new Error(`Cartera desconocida: ${id}`);
  return p;
}
