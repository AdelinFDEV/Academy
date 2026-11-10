import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Reiniciar el diario: se borra TODO lo que es del diario, para empezar de cero.
 *   · las operaciones y el capital inicial;
 *   · las emociones y notas de cada día (diario_dias);
 *   · los hitos del diario ganados (user_badges «diario-%»), que vuelven a
 *     bloqueados. El resto de logros (guías, cursos…) no se tocan.
 * Nova no guarda nada propio en el servidor: lo calcula todo de estos datos,
 * así que al borrarlos empieza también de cero (el navegador olvida lo suyo).
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.role === "premium" || profile?.role === "admin";
  if (!isPremium) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error: tradesError } = await supabase
    .from("trades")
    .delete()
    .eq("user_id", user.id);

  if (tradesError) return NextResponse.json({ error: tradesError.message }, { status: 500 });

  // Emociones y notas: la policy de diario_dias deja a cada uno borrar las suyas.
  const { error: diasError } = await supabase
    .from("diario_dias")
    .delete()
    .eq("user_id", user.id);

  if (diasError) return NextResponse.json({ error: diasError.message }, { status: 500 });

  // RLS de UPDATE en `profiles` sigue rota (ver AGENTS.md/memoria) — se usa
  // el cliente admin para limpiar el capital inicial.
  const admin = createAdminClient();
  const { error: capitalError } = await admin
    .from("profiles")
    .update({ trading_starting_capital: null })
    .eq("id", user.id);

  if (capitalError) return NextResponse.json({ error: capitalError.message }, { status: 500 });

  // Hitos del diario: user_badges solo admite insertar con la sesión, así que se
  // borran con el cliente admin, y SOLO los del diario de este usuario.
  const { error: hitosError } = await admin
    .from("user_badges")
    .delete()
    .eq("user_id", user.id)
    .like("badge_id", "diario-%");

  if (hitosError) return NextResponse.json({ error: hitosError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
