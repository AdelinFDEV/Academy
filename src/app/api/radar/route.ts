import { NextResponse } from "next/server";

// Radar Diario: agrega datos de mercado en vivo desde APIs gratuitas, en el
// servidor (evita CORS y cachea para respetar los límites de rate).
//   · CoinGecko  → precio BTC 24h (máx/mín), dominancia, cap. total, top movers
//   · alternative.me → Índice de Miedo y Codicia
// Se cachea 5 min; suficientemente fresco para un resumen diario y muy por
// debajo de los límites gratuitos.
//
// Las tres fuentes son INDEPENDIENTES y así se piden: que se caiga una no puede
// llevarse por delante a las otras dos. Ver `getJson`.

export const revalidate = 300;

/**
 * Pide un JSON y devuelve `null` si la fuente falla, en vez de lanzar.
 *
 * Esto era un fallo real: las tres fuentes iban en un `Promise.all` donde solo
 * la de Miedo y Codicia llevaba `.catch()`. Como `Promise.all` rechaza en
 * cuanto rechaza uno, un hipo de CoinGecko —una API gratuita, sin clave y con
 * límite por IP— tiraba la respuesta entera a 502 y apagaba TAMBIÉN la tarjeta
 * de sentimiento, que viene de otro proveedor y estaba perfectamente. El
 * visitante veía «Sin datos» en las dos.
 *
 * Ahora cada fuente cae sola y lo que sí ha llegado se pinta. Las tarjetas ya
 * sabían manejar un `null` suelto (`RadarWidgets.tsx`), así que no hay nada que
 * cambiar del otro lado.
 */
async function getJson(url: string) {
  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const [markets, global, fng] = await Promise.all([
    getJson(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h"
    ),
    getJson("https://api.coingecko.com/api/v3/global"),
    getJson("https://api.alternative.me/fng/?limit=1"),
  ]);

  // Si se han caído las TRES no hay nada que enseñar, y un 200 con todo a
  // `null` sería mentir: se devuelve 502 para que no se cachee como bueno.
  if (!markets && !global && !fng) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  try {
    const rows = Array.isArray(markets) ? markets : [];

    const btcRow = rows.find((c) => c.id === "bitcoin");
    const btc = btcRow
      ? {
          price: btcRow.current_price,
          change24h: btcRow.price_change_percentage_24h,
          high24h: btcRow.high_24h,
          low24h: btcRow.low_24h,
          marketCap: btcRow.market_cap,
          volume24h: btcRow.total_volume,
        }
      : null;

    const ranked = rows
      .filter((c) => typeof c.price_change_percentage_24h === "number")
      .map((c) => ({
        id: c.id,
        symbol: (c.symbol ?? "").toUpperCase(),
        name: c.name,
        price: c.current_price,
        change24h: c.price_change_percentage_24h,
        image: c.image,
      }));

    const gainers = [...ranked].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
    const losers = [...ranked].sort((a, b) => a.change24h - b.change24h).slice(0, 5);

    const g = global?.data;
    const globalOut = g
      ? {
          btcDominance: g.market_cap_percentage?.btc ?? null,
          totalMarketCap: g.total_market_cap?.usd ?? null,
          marketCapChange24h: g.market_cap_change_percentage_24h_usd ?? null,
        }
      : null;

    const fngRow = fng?.data?.[0];
    const fngOut = fngRow
      ? { value: Number(fngRow.value), classification: fngRow.value_classification as string }
      : null;

    return NextResponse.json({
      btc,
      global: globalOut,
      movers: { gainers, losers },
      fng: fngOut,
      updatedAt: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
