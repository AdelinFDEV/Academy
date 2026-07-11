import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  // RLS de UPDATE en `profiles` sigue rota (ver AGENTS.md/memoria) — se usa
  // el cliente admin para limpiar el capital inicial.
  const admin = createAdminClient();
  const { error: capitalError } = await admin
    .from("profiles")
    .update({ trading_starting_capital: null })
    .eq("id", user.id);

  if (capitalError) return NextResponse.json({ error: capitalError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
