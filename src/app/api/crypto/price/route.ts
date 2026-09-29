import { NextResponse } from "next/server";
import { cgFetch } from "@/lib/coingecko";

// Caché en memoria acotada por combinación de `ids`. Sin esto, variando el
// parámetro `ids` se llamaba a CoinGecko en cada petición → riesgo de quemar la
// cuota gratuita. Se normaliza y limita el nº de ids para no montar URLs enormes.
const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 55_000;
const MAX_ENTRIES = 200;
const MAX_IDS = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  if (!raw) return NextResponse.json({});

  // Normaliza (orden estable para compartir caché) y acota el nº de ids.
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_IDS)
    .sort()
    .join(",");
  if (!ids) return NextResponse.json({});

  const now = Date.now();
  const hit = cache.get(ids);
  if (hit && now - hit.ts < TTL) {
    return NextResponse.json(hit.data, {
      headers: { "Cache-Control": "public, s-maxage=55" },
    });
  }

  try {
    const res = await cgFetch(
      `/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) {
      if (hit) return NextResponse.json(hit.data);
      return NextResponse.json({}, { status: 503 });
    }
    const data = await res.json();

    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(ids, { data, ts: now });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=55" },
    });
  } catch {
    if (hit) return NextResponse.json(hit.data);
    return NextResponse.json({}, { status: 503 });
  }
}
