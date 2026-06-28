import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { coin_symbol, coin_name, coingecko_id, buy_price, quantity, buy_date, notes } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (coin_symbol) updates.coin_symbol = coin_symbol.toUpperCase().trim();
  if (coin_name) updates.coin_name = coin_name.trim();
  if (coingecko_id) updates.coingecko_id = coingecko_id.toLowerCase().trim();
  if (buy_price !== undefined) updates.buy_price = parseFloat(buy_price);
  if (quantity !== undefined) updates.quantity = parseFloat(quantity);
  if (buy_date) updates.buy_date = buy_date;
  if (notes !== undefined) updates.notes = notes?.trim() || null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portfolio_positions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portfolio_positions")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
