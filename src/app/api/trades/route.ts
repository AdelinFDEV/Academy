import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const RESULTS = ["win", "loss", "breakeven"] as const;
const NOTES_MAX = 150;

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

interface TradeValues {
  date: string;
  pair: string;
  direction: string;
  risk_amount: number;
  expected_gain: number;
  pnl: number;
  result: string;
  strategy: string | null;
  notes: string | null;
}

type ParsedTrade =
  | { ok: false; error: string }
  | { ok: true; values: TradeValues };

type TradeResult = (typeof RESULTS)[number];

/** Estrecha un string cualquiera a uno de los tres resultados validos. */
function isTradeResult(v: string): v is TradeResult {
  return (RESULTS as readonly string[]).includes(v);
}

/** Cuerpo crudo del POST/PUT, antes de validar. Todo opcional: lo comprueba parseTradeBody. */
interface TradeBody {
  date?: string;
  pair?: string;
  direction?: string;
  risk_amount?: string;
  expected_gain?: string;
  result?: string;
  strategy?: string | null;
  notes?: string | null;
}

function parseTradeBody(body: TradeBody): ParsedTrade {
  const { date, pair, direction, risk_amount, expected_gain, result, strategy, notes } = body;

  if (!date || !pair || !direction || !risk_amount || !expected_gain || !result) {
    return { ok: false, error: "Faltan campos obligatorios" };
  }

  const risk = parseFloat(risk_amount);
  const gain = parseFloat(expected_gain);

  if (isNaN(risk) || risk < 0 || isNaN(gain) || gain < 0) {
    return { ok: false, error: "Riesgo asumido o ganancia esperada inválidos" };
  }

  if (!isTradeResult(result)) {
    return { ok: false, error: "Resultado inválido" };
  }

  if (typeof notes === "string" && notes.length > NOTES_MAX) {
    return { ok: false, error: `Las notas no pueden superar ${NOTES_MAX} caracteres` };
  }

  const pnl = result === "win" ? gain : result === "loss" ? -risk : 0;

  return {
    ok: true,
    values: {
      date,
      pair: String(pair).toUpperCase(),
      direction,
      risk_amount: risk,
      expected_gain: gain,
      pnl,
      result,
      strategy: strategy?.trim() || null,
      notes: notes?.trim() || null,
    },
  };
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
  const parsed = parseTradeBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await supabase
    .from("trades")
    .insert({ user_id: user.id, ...parsed.values })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { user, supabase } = await getAuthenticatedPremiumUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const parsed = parseTradeBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const values = parsed.values;

  const { data, error } = await supabase
    .from("trades")
    .update(values)
    .eq("id", id)
    .eq("user_id", user.id)
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
