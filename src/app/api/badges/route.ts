import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Computes which badges the user has earned based on current stats
function computeEarned(stats: {
  readCount: number;
  savedCount: number;
  categoriesRead: number;
  maxStreak: number;
}): string[] {
  const earned: string[] = [];
  if (stats.readCount >= 1)        earned.push("first-read");
  if (stats.readCount >= 5)        earned.push("reader");
  if (stats.readCount >= 10)       earned.push("scholar");
  if (stats.maxStreak >= 3)        earned.push("streak3");
  if (stats.maxStreak >= 7)        earned.push("streak7");
  if (stats.maxStreak >= 30)       earned.push("streak30");
  if (stats.savedCount >= 5)       earned.push("collector");
  if (stats.categoriesRead >= 3)   earned.push("explorer");
  return earned;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all needed data in parallel
  const [
    { data: profile },
    { data: userPostsData },
    { data: postsData },
    { data: existingBadges },
  ] = await Promise.all([
    supabase.from("profiles").select("max_streak").eq("id", user.id).single(),
    supabase.from("user_posts").select("post_id, saved, read_at").eq("user_id", user.id),
    supabase.from("posts").select("id, categories(slug)").eq("published", true),
    supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
  ]);

  const userPosts  = userPostsData ?? [];
  const allPosts   = postsData ?? [];
  const savedBadgeIds = new Set((existingBadges ?? []).map((b) => b.badge_id));

  // Compute stats
  const readIds      = new Set(userPosts.filter((up) => up.read_at).map((up) => up.post_id));
  const readCount    = readIds.size;
  const savedCount   = userPosts.filter((up) => up.saved).length;
  const readPosts    = allPosts.filter((p) => readIds.has(p.id));
  const categoriesRead = new Set(readPosts.map((p) => (p.categories as any)?.slug).filter(Boolean)).size;
  const maxStreak    = profile?.max_streak ?? 0;

  const earnedNow = computeEarned({ readCount, savedCount, categoriesRead, maxStreak });

  // Find newly unlocked badges (earned now but not yet in DB)
  const newlyUnlocked = earnedNow.filter((id) => !savedBadgeIds.has(id));

  // Persist newly unlocked badges
  if (newlyUnlocked.length > 0) {
    await supabase.from("user_badges").insert(
      newlyUnlocked.map((badge_id) => ({ user_id: user.id, badge_id }))
    );
  }

  // Union computed badges with manually-granted ones already in DB (e.g. guide badges)
  const allEarned = [...new Set([...earnedNow, ...Array.from(savedBadgeIds)])];

  return NextResponse.json({
    earned: allEarned,
    newlyUnlocked,
    stats: { readCount, savedCount, categoriesRead, maxStreak },
  });
}
