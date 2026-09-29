import { NextResponse } from "next/server";
import { cgFetch } from "@/lib/coingecko";

// Caché en memoria acotada por término de búsqueda. Evita que se pegue a
// CoinGecko en cada tecleo y que un flood de búsquedas repetidas queme la
// cuota de la API gratuita. Los términos nuevos sí llaman al upstream, pero el
// rate-limit por IP del Firewall de Vercel corta el abuso volumétrico.
const cache = new Map<string, { coins: unknown[]; ts: number }>();
const TTL = 300_000; // 5 min — los resultados de búsqueda cambian poco
const MAX_ENTRIES = 300; // cota dura para que el Map no crezca sin límite

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim().toLowerCase();
  // Longitud acotada: mínimo 2 (búsqueda útil), máximo 50 (evita payloads raros).
  if (query.length < 2 || query.length > 50) return NextResponse.json({ coins: [] });

  const now = Date.now();
  const hit = cache.get(query);
  if (hit && now - hit.ts < TTL) {
    return NextResponse.json(
      { coins: hit.coins },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }

  try {
    const res = await cgFetch(`/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) {
      if (hit) return NextResponse.json({ coins: hit.coins });
      return NextResponse.json({ coins: [] }, { status: 503 });
    }
    const data = await res.json();
    const coins = (data.coins ?? []).slice(0, 8);

    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(query, { coins, ts: now });

    return NextResponse.json(
      { coins },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch {
    if (hit) return NextResponse.json({ coins: hit.coins });
    return NextResponse.json({ coins: [] }, { status: 503 });
  }
}
