import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const post_id = searchParams.get("post_id");
  if (!post_id) return NextResponse.json({ count: 0, liked: false, shares: 0 });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ count: likesCount }, { data: postData }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post_id),
      supabase
        .from("posts")
        .select("base_likes, shares_count")
        .eq("id", post_id)
        .maybeSingle(),
    ]);

    let liked = false;
    if (user) {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user.id)
        .maybeSingle();
      liked = !!data;
    }

    const totalLikes = (postData?.base_likes ?? 0) + (likesCount ?? 0);
    return NextResponse.json({ count: totalLikes, liked, shares: postData?.shares_count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0, liked: false, shares: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { post_id } = await request.json();
    if (!post_id) return NextResponse.json({ error: "Missing post_id" }, { status: 400 });

    let nowLiked: boolean;

    // Try INSERT first — avoids needing a SELECT (which may be blocked by RLS)
    const { error: insertError } = await supabase
      .from("post_likes")
      .insert({ post_id, user_id: user.id });

    if (!insertError) {
      // Insert succeeded → user just liked the post
      nowLiked = true;
    } else if (insertError.code === "23505") {
      // Unique constraint violation → row already existed → user wants to unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", user.id);
      nowLiked = false;
    } else {
      // Unexpected error (e.g. RLS policy missing → code 42501)
      console.error("[likes] insert error:", insertError.code, insertError.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const [{ count: likesCount }, { data: postData }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post_id),
      supabase
        .from("posts")
        .select("base_likes")
        .eq("id", post_id)
        .maybeSingle(),
    ]);

    const totalLikes = (postData?.base_likes ?? 0) + (likesCount ?? 0);
    return NextResponse.json({ count: totalLikes, liked: nowLiked });
  } catch {
    // 500 → client reverts the optimistic update cleanly
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
