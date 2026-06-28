import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guide_slug = searchParams.get("guide_slug");
  if (!guide_slug) return NextResponse.json({ count: 0, liked: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ count }, userRow] = await Promise.all([
    supabase.from("guide_likes").select("id", { count: "exact", head: true }).eq("guide_slug", guide_slug),
    user
      ? supabase.from("guide_likes").select("id").eq("guide_slug", guide_slug).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({ count: count ?? 0, liked: !!(userRow as any).data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guide_slug } = await request.json();
  if (!guide_slug) return NextResponse.json({ error: "Missing guide_slug" }, { status: 400 });

  let liked: boolean;
  const { error: insertErr } = await supabase.from("guide_likes").insert({ guide_slug, user_id: user.id });

  if (!insertErr) {
    liked = true;
  } else if (insertErr.code === "23505") {
    await supabase.from("guide_likes").delete().eq("guide_slug", guide_slug).eq("user_id", user.id);
    liked = false;
  } else {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { count } = await supabase.from("guide_likes").select("id", { count: "exact", head: true }).eq("guide_slug", guide_slug);
  return NextResponse.json({ count: count ?? 0, liked });
}
