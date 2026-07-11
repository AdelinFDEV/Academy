import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GUIDES } from "@/lib/guides";

const VALID_GUIDES = new Set(GUIDES.map((g) => g.slug));

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

  const { error } = await supabase.from("guide_quiz_completions").insert({
    guide_slug,
    user_id: user.id,
    score,
    total,
  });

  if (error) {
    console.error("[guide-quiz-completion] insert failed:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
