import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { guide_slug } = await request.json();
  if (!guide_slug) return NextResponse.json({ error: "Missing guide_slug" }, { status: 400 });

  await supabase.from("guide_shares").insert({ guide_slug, user_id: user?.id ?? null });

  const { count } = await supabase
    .from("guide_shares")
    .select("id", { count: "exact", head: true })
    .eq("guide_slug", guide_slug);

  return NextResponse.json({ count: count ?? 0 });
}
