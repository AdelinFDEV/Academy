import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isPremium: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  return { user, isPremium: role === "premium" || role === "admin" };
}

async function getAdminUser() {
  const { user, isPremium } = await getAuthenticatedUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? user : null;
}

export async function GET() {
  const { user, isPremium } = await getAuthenticatedUser();
  if (!user || !isPremium) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_positions")
    .select("*")
    .order("buy_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json();
  const { coin_symbol, coin_name, coingecko_id, buy_price, quantity, buy_date, notes } = body;

  if (!coin_symbol || !coin_name || !coingecko_id || !buy_price || !quantity || !buy_date) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const bp = parseFloat(buy_price);
  const qty = parseFloat(quantity);

  if (isNaN(bp) || bp <= 0 || isNaN(qty) || qty <= 0) {
    return NextResponse.json({ error: "Precio y cantidad deben ser positivos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portfolio_positions")
    .insert({
      coin_symbol: coin_symbol.toUpperCase().trim(),
      coin_name: coin_name.trim(),
      coingecko_id: coingecko_id.toLowerCase().trim(),
      buy_price: bp,
      quantity: qty,
      buy_date,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
