import { NextResponse } from "next/server";

// Precios históricos diarios de varias monedas (para el gráfico de crecimiento
// del balance de Mi Portfolio). Server-side + caché de 1h para respetar los
// límites gratuitos de CoinGecko. Devuelve { [coin_id]: [[ts_ms, price], ...] }.

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? "90", 10) || 90, 1), 365);
  if (ids.length === 0) return NextResponse.json({});

  const entries = await Promise.all(
    ids.map(async (id): Promise<[string, number[][] | null]> => {
      try {
        const r = await fetch(
          `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`,
          { next: { revalidate: 3600 } }
        );
        if (!r.ok) return [id, null];
        const d = await r.json();
        const prices: number[][] = Array.isArray(d?.prices) ? d.prices : [];
        return [id, prices];
      } catch {
        return [id, null];
      }
    })
  );

  const out: Record<string, number[][]> = {};
  for (const [id, series] of entries) if (series && series.length) out[id] = series;
  return NextResponse.json(out);
}
