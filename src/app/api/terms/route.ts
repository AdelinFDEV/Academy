import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ saved: [] });

    const { data } = await supabase
      .from("saved_terms")
      .select("term")
      .eq("user_id", user.id);

    return NextResponse.json({ saved: (data ?? []).map((r) => r.term) });
  } catch {
    return NextResponse.json({ saved: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { term, definition, category } = await request.json();
    if (!term) return NextResponse.json({ error: "Missing term" }, { status: 400 });

    const { data: existing } = await supabase
      .from("saved_terms")
      .select("id")
      .eq("user_id", user.id)
      .eq("term", term)
      .maybeSingle();

    if (existing) {
      await supabase.from("saved_terms").delete().eq("id", existing.id);
      return NextResponse.json({ saved: false });
    }

    await supabase.from("saved_terms").insert({
      user_id: user.id,
      term,
      definition,
      category,
    });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
