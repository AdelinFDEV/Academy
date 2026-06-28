import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guide_slug = searchParams.get("guide_slug");
  if (!guide_slug) return NextResponse.json({ saved: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: false });

  const { data } = await supabase
    .from("guide_saves")
    .select("id")
    .eq("guide_slug", guide_slug)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ saved: !!data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guide_slug } = await request.json();
  if (!guide_slug) return NextResponse.json({ error: "Missing guide_slug" }, { status: 400 });

  const { error: insertErr } = await supabase.from("guide_saves").insert({ guide_slug, user_id: user.id });

  if (!insertErr) {
    return NextResponse.json({ saved: true });
  } else if (insertErr.code === "23505") {
    await supabase.from("guide_saves").delete().eq("guide_slug", guide_slug).eq("user_id", user.id);
    return NextResponse.json({ saved: false });
  } else {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
