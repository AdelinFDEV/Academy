import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Badges from "@/components/Badges";

export const metadata: Metadata = {
  title: "Logros | AdelinBTC Academy",
};

export default async function LogrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: userBadges }] = await Promise.all([
    supabase
      .from("profiles")
      .select("current_streak, max_streak, is_featured")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id),
  ]);

  const earnedIds = (userBadges ?? []).map((b) => b.badge_id);

  return (
    <main className="dashboard-main">
      <div className="dashboard-header">
        <h1>Logros</h1>
        <p>Tu progreso y rachas en la academia</p>
      </div>

      <Badges
        initialStreak={profile?.current_streak ?? 0}
        initialMax={profile?.max_streak ?? 0}
        initialFeatured={profile?.is_featured ?? false}
        initialEarned={earnedIds}
      />
    </main>
  );
}
