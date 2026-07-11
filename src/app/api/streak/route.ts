import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // La racha y `is_featured` se leen/escriben con el cliente admin (service_role):
  // `authenticated` ya NO tiene GRANT UPDATE sobre estas columnas (ver
  // scripts/lock-profiles-columns.sql) para que un usuario no pueda inflar su
  // racha ni auto-marcarse como destacado por escritura directa. La identidad ya
  // está verificada arriba con el cliente normal y todo se filtra por user.id.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("current_streak, max_streak, last_seen, is_featured")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const lastSeen = profile?.last_seen ?? null;

  if (lastSeen === today) {
    // Already updated today
    return NextResponse.json({
      current_streak: profile?.current_streak ?? 0,
      max_streak: profile?.max_streak ?? 0,
      is_featured: profile?.is_featured ?? false,
    });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = lastSeen === yesterdayStr
    ? (profile?.current_streak ?? 0) + 1
    : 1;

  const newMax = Math.max(newStreak, profile?.max_streak ?? 0);
  const isFeatured = newMax >= 30;

  const { error } = await admin
    .from("profiles")
    .update({
      current_streak: newStreak,
      max_streak: newMax,
      last_seen: today,
      is_featured: isFeatured,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[streak] update failed:", error.message);
    // No se pudo guardar — devolvemos los valores previos para no mentirle al cliente
    return NextResponse.json({
      current_streak: profile?.current_streak ?? 0,
      max_streak: profile?.max_streak ?? 0,
      is_featured: profile?.is_featured ?? false,
    });
  }

  return NextResponse.json({
    current_streak: newStreak,
    max_streak: newMax,
    is_featured: isFeatured,
  });
}
