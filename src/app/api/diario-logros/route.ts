import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { syncDiarioLogros } from "@/lib/diarioLogros";

/**
 * El diario la llama al abrirse y tras cada cambio (operación, capital). Guarda
 * como logro los niveles de hito alcanzados y dice cuáles son nuevos.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await syncDiarioLogros(supabase, user.id));
}
