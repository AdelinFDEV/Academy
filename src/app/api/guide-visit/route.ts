import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { guide_slug } = await request.json();
  if (!guide_slug) return NextResponse.json({ ok: false });

  await supabase.from("guide_visits").insert({ guide_slug, user_id: user?.id ?? null });

  return NextResponse.json({ ok: true });
}
