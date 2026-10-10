import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { syncDiarioLogros } from "@/lib/diarioLogros";
import { BADGE_DEFS, type BadgeStats } from "@/lib/logros";

/**
 * Los logros de actividad que se cumplen con estos contadores. Los umbrales
 * viven en BADGE_DEFS (`progress`): la página de logros enseña el avance con
 * los mismos números, y no hay una segunda lista que se desincronice.
 */
function computeEarned(stats: BadgeStats): string[] {
  return BADGE_DEFS.filter((b) => b.progress && stats[b.progress.stat] >= b.progress.target).map((b) => b.id);
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all needed data in parallel
  const [{ data: profile }, { data: existingBadges }] = await Promise.all([
    supabase.from("profiles").select("max_streak").eq("id", user.id).single(),
    supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
  ]);

  const savedBadgeIds = new Set((existingBadges ?? []).map((b) => b.badge_id));
  const maxStreak = profile?.max_streak ?? 0;

  const earnedNow = computeEarned({ maxStreak });

  // Find newly unlocked badges (earned now but not yet in DB)
  const newlyUnlocked = earnedNow.filter((id) => !savedBadgeIds.has(id));

  // Persist newly unlocked badges
  if (newlyUnlocked.length > 0) {
    await supabase.from("user_badges").insert(
      newlyUnlocked.map((badge_id) => ({ user_id: user.id, badge_id }))
    );
  }

  // Los hitos del diario también son logros. Se sincronizan aquí para que la
  // página de logros salga bien aunque no se haya abierto el diario, pero no se
  // anuncian: ese aviso lo da el propio diario al conseguirlos.
  const diario = await syncDiarioLogros(supabase, user.id);

  // Union computed badges with manually-granted ones already in DB (e.g. guide badges)
  const allEarned = [...new Set([...earnedNow, ...Array.from(savedBadgeIds), ...diario.stored.map((b) => b.badge_id)])];

  return NextResponse.json({
    earned: allEarned,
    newlyUnlocked,
    stats: { maxStreak },
  });
}
