import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_GUIDES = new Set(["que-es-la-blockchain", "ciclos-de-bitcoin"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guide_slug, score, total } = await request.json();

  if (!VALID_GUIDES.has(guide_slug)) {
    return NextResponse.json({ error: "Invalid guide" }, { status: 400 });
  }
  if (typeof score !== "number" || typeof total !== "number" || score < 0 || score > total) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  await supabase.from("guide_quiz_completions").insert({
    guide_slug,
    user_id: user.id,
    score,
    total,
  });

  return NextResponse.json({ ok: true });
}
