import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coingeckoIdExiste, errorIdDesconocido } from "@/lib/coingecko";
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

  const cgId = coingecko_id.toLowerCase().trim();
  if (!(await coingeckoIdExiste(cgId))) {
    return NextResponse.json({ error: errorIdDesconocido(cgId) }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ¿Ya hay posición de esta misma moneda? Entonces esto no es una posición
  // nueva, es UNA COMPRA MÁS de algo que ya se tiene: se fusiona con la que
  // hay en vez de abrir una línea suelta. Así la tabla enseña una fila por
  // moneda con lo invertido de verdad en ella, que es lo que se mira.
  //
  // Se busca por coingecko_id y no por el símbolo porque el id es el que
  // manda para los precios, y dos monedas distintas pueden compartir ticker.
  // Con limit(1) en vez de maybeSingle(): nada impide en la base de datos que
  // haya duplicados de antes, y maybeSingle() reventaría justo ahí.
  const { data: existentes } = await supabase
    .from("portfolio_positions")
    .select("*")
    .eq("coingecko_id", cgId)
    .order("buy_date", { ascending: true })
    .limit(1);

  const existente = existentes?.[0];

  if (existente) {
    const cantidadTotal = existente.quantity + qty;
    const invertidoTotal = existente.buy_price * existente.quantity + bp * qty;
    // Al fusionar se pierde el detalle de cada compra por separado, así que
    // por lo menos queda escrito en las notas.
    const apunte = `+${qty} @ $${bp} (${buy_date})${notes?.trim() ? ` — ${notes.trim()}` : ""}`;

    const { data, error } = await supabase
      .from("portfolio_positions")
      .update({
        quantity: cantidadTotal,
        // Media ponderada: lo que habría costado cada token si las dos
        // compras hubieran sido una sola. Es el precio con el que tiene
        // sentido calcular el P&L de la posición entera.
        buy_price: invertidoTotal / cantidadTotal,
        // La fecha se queda en la de la PRIMERA compra: dice desde cuándo se
        // tiene la posición, no cuándo fue el último añadido.
        buy_date: existente.buy_date < buy_date ? existente.buy_date : buy_date,
        notes: [existente.notes, apunte].filter(Boolean).join("\n"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existente.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("portfolio_positions")
    .insert({
      coin_symbol: coin_symbol.toUpperCase().trim(),
      coin_name: coin_name.trim(),
      coingecko_id: cgId,
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
