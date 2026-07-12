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

  // Anti-spam: solo cuenta quien tiene sesión, y como MÁXIMO 1 por guía
  // (unique user_id, guide_slug — ver scripts/shares-antispam.sql). Los
  // anónimos pueden compartir pero no suman, así que un bot sin cuenta no
  // puede inflar el número. El contador = usuarios distintos que compartieron.
  if (user) {
    const { error: insertErr } = await supabase
      .from("guide_shares")
      .insert({ guide_slug, user_id: user.id });
    // 23505 = ya lo había compartido → no suma. Otro error sí se registra.
    if (insertErr && insertErr.code !== "23505") {
      console.error("[guide-shares] insert failed:", insertErr.message);
    }
  }

  const { count } = await supabase
    .from("guide_shares")
    .select("id", { count: "exact", head: true })
    .eq("guide_slug", guide_slug);

  return NextResponse.json({ count: count ?? 0 });
}
