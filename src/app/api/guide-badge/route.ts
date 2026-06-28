import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_GUIDE_BADGES = new Set(["guide-blockchain"]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { badge_id } = await req.json();
  if (!VALID_GUIDE_BADGES.has(badge_id)) {
    return NextResponse.json({ error: "Invalid badge" }, { status: 400 });
  }

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", user.id)
    .eq("badge_id", badge_id)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, alreadyHad: true });
  }

  await supabase.from("user_badges").insert({ user_id: user.id, badge_id });

  return NextResponse.json({ success: true, alreadyHad: false });
}
