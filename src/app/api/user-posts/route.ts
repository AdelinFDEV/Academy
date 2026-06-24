import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/user-posts — upsert saved/read state for a post
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { post_id, action } = await request.json();
  if (!post_id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Get existing row
  const { data: existing } = await supabase
    .from("user_posts")
    .select("id, saved, read_at")
    .eq("user_id", user.id)
    .eq("post_id", post_id)
    .single();

  if (action === "toggle-saved") {
    const newSaved = !existing?.saved;
    await supabase.from("user_posts").upsert(
      { user_id: user.id, post_id, saved: newSaved, read_at: existing?.read_at ?? null },
      { onConflict: "user_id,post_id" }
    );
    return NextResponse.json({ saved: newSaved });
  }

  if (action === "mark-read") {
    if (existing?.read_at) return NextResponse.json({ read: true }); // already read
    await supabase.from("user_posts").upsert(
      { user_id: user.id, post_id, saved: existing?.saved ?? false, read_at: new Date().toISOString() },
      { onConflict: "user_id,post_id" }
    );
    return NextResponse.json({ read: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
