import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  if (!query || query.length < 2) return NextResponse.json({ coins: [] });

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return NextResponse.json({ coins: [] }, { status: 503 });
    const data = await res.json();
    return NextResponse.json({ coins: (data.coins ?? []).slice(0, 8) });
  } catch {
    return NextResponse.json({ coins: [] }, { status: 503 });
  }
}
