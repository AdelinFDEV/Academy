import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAuthenticatedPremiumUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.role === "premium" || profile?.role === "admin";
  return { user: isPremium ? user : null, supabase };
}

export async function GET() {
  const { user, supabase } = await getAuthenticatedPremiumUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { user, supabase } = await getAuthenticatedPremiumUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, pair, direction, entry_price, exit_price, size, strategy, notes } = body;

  if (!date || !pair || !direction || !entry_price || !exit_price || !size) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const ep = parseFloat(entry_price);
  const xp = parseFloat(exit_price);
  const sz = parseFloat(size);

  if (isNaN(ep) || isNaN(xp) || isNaN(sz) || sz <= 0) {
    return NextResponse.json({ error: "Valores numéricos inválidos" }, { status: 400 });
  }

  const pnl = direction === "long" ? (xp - ep) * sz : (ep - xp) * sz;
  const result = pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";

  const { data, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      date,
      pair: pair.toUpperCase(),
      direction,
      entry_price: ep,
      exit_price: xp,
      size: sz,
      pnl,
      result,
      strategy: strategy?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { user, supabase } = await getAuthenticatedPremiumUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
