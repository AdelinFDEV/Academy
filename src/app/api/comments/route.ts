import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const PENDING_MSG =
  "Ya tienes un comentario pendiente de aprobación. Podrás comentar de nuevo cuando lo revisemos.";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const formData = await request.formData();
  const post_id = formData.get("post_id") as string;
  const content = formData.get("content") as string;

  // Formulario incompleto: de vuelta al inicio. (Antes iba a /articulos, que
  // dejó de existir el 10-10-2026; y antes aún a /blog, que nunca existió.)
  if (!post_id || !content?.trim()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Anti-spam (global): un usuario solo puede tener UN comentario pendiente a la
  // vez. Se comprueba con el cliente admin porque la policy de lectura pública
  // de `comments` solo expone los aprobados — con el cliente normal no veríamos
  // los pendientes del propio usuario. La barrera real está en el trigger de la
  // BD (scripts/comments-one-pending.sql); esto solo da un mensaje amable.
  const admin = createAdminClient();
  const { count: pendingCount } = await admin
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("approved", false);

  if ((pendingCount ?? 0) > 0) {
    return NextResponse.json({ error: PENDING_MSG }, { status: 409 });
  }

  // Tope de longitud: evita abuso de almacenamiento con comentarios enormes.
  // Se recorta en vez de rechazar para no perder el comentario del usuario.
  const cleanContent = content.trim().slice(0, 2000);

  const { error: insertErr } = await supabase.from("comments").insert({
    post_id,
    user_id: user.id,
    content: cleanContent,
    approved: false,
  });

  // Red de seguridad ante una carrera (dos peticiones casi simultáneas): el
  // trigger de la BD rechaza la segunda con PENDING_COMMENT_EXISTS. Lo
  // traducimos al mismo mensaje amable en vez de un error genérico.
  if (insertErr) {
    if (/PENDING_COMMENT_EXISTS|pendiente de aprobaci/i.test(insertErr.message)) {
      return NextResponse.json({ error: PENDING_MSG }, { status: 409 });
    }
    console.error("[comments] insert failed:", insertErr.message);
    return NextResponse.json(
      { error: "No se pudo enviar el comentario. Inténtalo de nuevo." },
      { status: 500 }
    );
  }

  const { data: post } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", post_id)
    .single();

  return NextResponse.redirect(new URL(`/post/${post?.slug}`, request.url));
}
