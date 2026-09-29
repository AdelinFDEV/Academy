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

const API = "https://api.coingecko.com/api/v3";

/**
 * TODA llamada del servidor a CoinGecko pasa por aquí, para que lleve la clave.
 *
 * Sin clave, la API pública limita y bloquea por IP, y un servidor de Vercel
 * sale por IPs compartidas con miles de proyectos. En septiembre de 2026
 * empezó a devolver 403 «Request blocked» desde producción mientras en local
 * iba bien: se quedaron sin datos el Bitcoin 24h de la home, el Portfolio
 * Adelin y los mercados, sin ningún error visible. Con la clave Demo el límite
 * va por clave y no por IP.
 *
 * `COINGECKO_API_KEY` NO lleva `NEXT_PUBLIC_`: en el navegador vale
 * `undefined` y la petición sale sin clave, que es justo lo que se quiere —
 * la clave nunca llega al cliente. Sin la variable (en local, por ejemplo) se
 * pide igual, sin clave.
 *
 * `path` va con su barra y su query: `cgFetch("/global")`.
 */
export function cgFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const key = process.env.COINGECKO_API_KEY;
  if (key) headers.set("x-cg-demo-api-key", key);
  return fetch(`${API}${path}`, { ...init, headers });
}

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
    const res = await cgFetch(
      `/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`,
      { cache: "no-store" }
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
    const res = await cgFetch(`/search?query=${encodeURIComponent(query)}`, {
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
