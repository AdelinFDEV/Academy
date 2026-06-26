import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { post_id } = await request.json();
    if (!post_id) return NextResponse.json({ shares: 0 });

    const { data: { user } } = await supabase.auth.getUser();

    // Record individual share for time-series analytics
    await supabase.from("post_shares").insert({
      post_id,
      user_id: user?.id ?? null,
    });

    // Increment counter on the post
    const { data: post } = await supabase
      .from("posts")
      .select("shares_count")
      .eq("id", post_id)
      .single();

    const newCount = (post?.shares_count ?? 0) + 1;
    await supabase.from("posts").update({ shares_count: newCount }).eq("id", post_id);

    return NextResponse.json({ shares: newCount });
  } catch {
    return NextResponse.json({ shares: 0 });
  }
}
