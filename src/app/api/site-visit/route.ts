import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { path } = await request.json();
  if (!path || typeof path !== "string") return NextResponse.json({ ok: false });

  await supabase.from("site_visits").insert({ path, user_id: user?.id ?? null });

  return NextResponse.json({ ok: true });
}
