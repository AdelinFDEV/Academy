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
const SEARCH = "https://api.coingecko.com/api/v3/search";

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

interface SearchCoin {
  id: string;
  symbol: string;
  market_cap_rank: number | null;
}

/**
 * El id de la API no siempre es el slug que sale en la URL de coingecko.com:
 * BNB se ve en `/es/monedas/bnb` pero su id real es "binancecoin" (CoinGecko
 * renombró la moneda sin tocar el id interno). Para no mandar al admin a
 * adivinar, se busca por símbolo o nombre con el endpoint /search y se
 * sugiere el id del resultado con mejor market cap rank que coincida en
 * símbolo — que es casi siempre el que se quiere.
 */
export async function sugerirCoingeckoId(query: string): Promise<string | null> {
  try {
    const res = await fetch(`${SEARCH}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const coins: SearchCoin[] = data?.coins ?? [];
    if (!coins.length) return null;

    const q = query.trim().toLowerCase();
    const coincidenSimbolo = coins.filter((c) => c.symbol?.toLowerCase() === q);
    const candidatos = coincidenSimbolo.length ? coincidenSimbolo : coins;

    return candidatos.reduce((mejor, c) =>
      (c.market_cap_rank ?? Infinity) < (mejor.market_cap_rank ?? Infinity) ? c : mejor
    ).id;
  } catch {
    return null;
  }
}

/** El mensaje que se le enseña al admin cuando el id no cuela. Vive aquí para
 *  que POST y PATCH digan exactamente lo mismo. */
export function errorIdDesconocido(id: string, sugerencia?: string | null): string {
  if (sugerencia && sugerencia !== id) {
    return `CoinGecko no conoce el id "${id}". ¿Quizás quisiste decir "${sugerencia}"?`;
  }
  return (
    `CoinGecko no conoce el id "${id}". Ojo: no siempre coincide con el slug de la URL de ` +
    `coingecko.com (BNB, por ejemplo, es "binancecoin" en la URL "bnb") — prueba con el símbolo o nombre de la moneda.`
  );
}
