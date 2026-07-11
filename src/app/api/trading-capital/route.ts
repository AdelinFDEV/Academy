import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
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

  const { capital } = await req.json();
  const value = parseFloat(capital);

  if (isNaN(value) || value < 0) {
    return NextResponse.json({ error: "Capital inválido" }, { status: 400 });
  }

  // RLS de UPDATE en `profiles` sigue rota (ver AGENTS.md/memoria) — se usa
  // el cliente admin (service role) para este update puntual, tras verificar
  // arriba con el cliente normal que el usuario está autenticado y es premium.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ trading_starting_capital: value })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, capital: value });
}
