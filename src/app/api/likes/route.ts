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
        .single(),
    ]);

    let liked = false;
    if (user) {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user.id)
        .single();
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

    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("post_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("post_likes").insert({ post_id, user_id: user.id });
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
        .single(),
    ]);

    const totalLikes = (postData?.base_likes ?? 0) + (likesCount ?? 0);
    return NextResponse.json({ count: totalLikes, liked: !existing });
  } catch {
    return NextResponse.json({ count: 0, liked: false });
  }
}
