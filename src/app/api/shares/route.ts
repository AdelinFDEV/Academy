import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { post_id } = await request.json();
    if (!post_id) return NextResponse.json({ shares: 0 });

    const { data: { user } } = await supabase.auth.getUser();

    // El contador de `posts` lo gestiona el backend (columna administrada), por
    // eso se lee/escribe con el cliente admin tras verificar la sesión.
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("posts")
      .select("shares_count")
      .eq("id", post_id)
      .maybeSingle();
    let count = post?.shares_count ?? 0;

    // Anti-spam: solo suma quien tiene sesión, y como MÁXIMO 1 por post
    // (unique user_id, post_id — ver scripts/shares-antispam.sql). Un anónimo
    // puede usar el botón de compartir, pero no incrementa el contador, así que
    // un bot sin cuenta no puede inflarlo.
    if (user) {
      const { error: insertErr } = await admin
        .from("post_shares")
        .insert({ post_id, user_id: user.id });

      if (!insertErr) {
        // Primer compartido de este usuario → suma 1.
        count += 1;
        await admin.from("posts").update({ shares_count: count }).eq("id", post_id);
      } else if (insertErr.code !== "23505") {
        // 23505 = ya había compartido → no suma. Otro error sí se registra.
        console.error("[shares] insert error:", insertErr.code, insertErr.message);
      }
    }

    return NextResponse.json({ shares: count });
  } catch {
    return NextResponse.json({ shares: 0 });
  }
}
