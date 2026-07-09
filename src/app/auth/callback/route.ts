import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  // Solo rutas propias, relativas (evita open-redirect vía "next").
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${destination}`);
}
