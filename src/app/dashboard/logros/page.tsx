import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Badges from "@/components/Badges";
import { logrosDeCursos } from "@/lib/cursos";
import "./logros.css";

export const metadata: Metadata = {
  title: "Logros",
};

export default async function LogrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: userBadges }, cursos] = await Promise.all([
    supabase
      .from("profiles")
      .select("current_streak, max_streak, is_featured, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", user.id),
    // Un logro por curso publicado. Se gana con el certificado, no con una
    // fila de `user_badges`: esa tabla deja insertar a cualquiera desde el
    // navegador, y un logro de curso tiene que costar aprobar el examen.
    logrosDeCursos(user.id),
  ]);

  return (
    <main className="dashboard-main">
      <Badges
        initialStreak={profile?.current_streak ?? 0}
        initialMax={profile?.max_streak ?? 0}
        initialFeatured={profile?.is_featured ?? false}
        initialEarned={userBadges ?? []}
        showDiario={profile?.role === "premium" || profile?.role === "admin"}
        cursos={cursos}
      />
    </main>
  );
}
