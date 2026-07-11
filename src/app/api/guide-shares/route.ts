import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GUIDES } from "@/lib/guides";

const VALID_GUIDES = new Set(GUIDES.map((g) => g.slug));

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { guide_slug } = await request.json();
  // Whitelist: solo slugs de guías reales (evita contaminar el contador con
  // slugs arbitrarios).
  if (!VALID_GUIDES.has(guide_slug)) {
    return NextResponse.json({ error: "Invalid guide" }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from("guide_shares").insert({ guide_slug, user_id: user?.id ?? null });
  if (insertErr) console.error("[guide-shares] insert failed:", insertErr.message);

  const { count } = await supabase
    .from("guide_shares")
    .select("id", { count: "exact", head: true })
    .eq("guide_slug", guide_slug);

  return NextResponse.json({ count: count ?? 0 });
}
