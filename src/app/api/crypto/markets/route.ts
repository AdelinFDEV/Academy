import { NextResponse } from "next/server";

let cache: { data: unknown; ts: number } = { data: null, ts: 0 };
const TTL = 28_000; // 28s — slightly under the 30s poll interval

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=28" },
    });
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=7d",
      { headers: { Accept: "application/json" }, next: { revalidate: 28 } }
    );
    if (!res.ok) {
      if (cache.data) return NextResponse.json(cache.data);
      return NextResponse.json({ error: "API unavailable" }, { status: 503 });
    }
    const data = await res.json();
    cache = { data, ts: now };
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=28" },
    });
  } catch {
    if (cache.data) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "API error" }, { status: 503 });
  }
}
