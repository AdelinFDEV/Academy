import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Estado de vinculación del usuario autenticado. Lo consulta el cliente
 *  mientras espera a que confirme /start en Telegram. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("telegram_username, telegram_linked_at")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    linked: !!profile?.telegram_linked_at,
    username: profile?.telegram_username ?? null,
  });
}
