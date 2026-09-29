import { NextResponse } from "next/server";
import { cgFetch } from "@/lib/coingecko";

const MAX_IDS = 100;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids");

  if (!raw) return NextResponse.json({});

  // Acota el nº de ids (evita URLs gigantes al upstream). `next.revalidate`
  // hace que Next cachee por URL idéntica; el orden estable ayuda a compartir
  // esa caché entre peticiones equivalentes.
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_IDS)
    .sort()
    .join(",");
  if (!ids) return NextResponse.json({});

  try {
    const res = await cgFetch(
      `/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd,eur&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return NextResponse.json({}, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
