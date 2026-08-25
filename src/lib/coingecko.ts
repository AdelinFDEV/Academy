/**
 * El id de CoinGecko de una moneda no siempre es lo que uno esperaría: Render
 * se llama "render-token" y no "render", Polygon es "matic-network"… y un id
 * mal escrito NO da ningún error al guardar la posición. Entra en la tabla y
 * la fila se queda para siempre con "—" en precio, valor, P&L y 24h, porque
 * `/api/portfolio/prices` pregunta por ese id y CoinGecko sencillamente no
 * devuelve esa clave. Ya pasó con RENDER.
 *
 * Por eso se comprueba al guardar: es el único momento en el que se puede
 * decir dónde está el fallo en vez de dejar una fila muda.
 */

const SIMPLE_PRICE = "https://api.coingecko.com/api/v3/simple/price";

/**
 * ¿Conoce CoinGecko este id?
 *
 * Falla ABIERTO a propósito: si CoinGecko no contesta (rate limit, caída,
 * timeout) devuelve `true` y se deja guardar. Bloquear el alta de una posición
 * porque un tercero está caído es peor que arriesgarse a un id malo — que,
 * además, se nota al momento en la tabla.
 */
export async function coingeckoIdExiste(id: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${SIMPLE_PRICE}?ids=${encodeURIComponent(id)}&vs_currencies=usd`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) return true;
    const data = await res.json();
    // CoinGecko devuelve 200 con `{}` cuando el id no existe, no un 404.
    return Object.prototype.hasOwnProperty.call(data, id);
  } catch {
    return true;
  }
}

/** El mensaje que se le enseña al admin cuando el id no cuela. Vive aquí para
 *  que POST y PATCH digan exactamente lo mismo. */
export function errorIdDesconocido(id: string): string {
  return (
    `CoinGecko no conoce el id "${id}". Cópialo del final de la URL de la ` +
    `moneda en coingecko.com — por ejemplo "render-token", no "render".`
  );
}
