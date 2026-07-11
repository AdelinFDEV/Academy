import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GUIDES } from "@/lib/guides";

const VALID_GUIDES = new Set(GUIDES.map((g) => g.slug));

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { guide_slug } = await request.json();
  // Whitelist: solo slugs de guías reales, para que nadie inyecte filas de
  // analítica con slugs arbitrarios.
  if (!VALID_GUIDES.has(guide_slug)) return NextResponse.json({ ok: false });

  const { error } = await supabase.from("guide_visits").insert({ guide_slug, user_id: user?.id ?? null });
  if (error) console.error("[guide-visit] insert failed:", error.message);

  return NextResponse.json({ ok: !error });
}
