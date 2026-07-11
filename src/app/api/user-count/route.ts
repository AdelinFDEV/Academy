import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Base de marketing con la que arrancó el contador antes de tener usuarios
// reales que mostrar — se suma al conteo real para no "resetear" la cifra
// que ya se venía mostrando en la web.
const BASE_OFFSET = 100;

let cache: { count: number; ts: number } = { count: 0, ts: 0 };
const TTL = 60_000;

export async function GET() {
  const now = Date.now();
  if (cache.ts && now - cache.ts < TTL) {
    return NextResponse.json({ count: cache.count });
  }

  try {
    const admin = createAdminClient();
    const { count, error } = await admin.from("profiles").select("id", { count: "exact", head: true });
    if (error) throw error;

    const total = BASE_OFFSET + (count ?? 0);
    cache = { count: total, ts: now };
    return NextResponse.json({ count: total });
  } catch (err) {
    console.error("[user-count] failed:", err);
    // Si falla, devolvemos el último valor cacheado en vez de romper la UI
    return NextResponse.json({ count: cache.count || BASE_OFFSET });
  }
}
