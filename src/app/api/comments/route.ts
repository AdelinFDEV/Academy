import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const formData = await request.formData();
  const post_id = formData.get("post_id") as string;
  const content = formData.get("content") as string;

  if (!post_id || !content?.trim()) {
    return NextResponse.redirect(new URL("/blog", request.url));
  }

  await supabase.from("comments").insert({
    post_id,
    user_id: user.id,
    content: content.trim(),
    approved: false,
  });

  const { data: post } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", post_id)
    .single();

  return NextResponse.redirect(new URL(`/post/${post?.slug}`, request.url));
}
