import { createClient } from "@/lib/supabase/server";
import CommentManager from "@/components/admin/CommentManager";
import type { AdminComment } from "@/lib/types";

export default async function CommentsPage() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, approved, created_at, profiles(full_name), posts(title, slug)")
    .order("created_at", { ascending: false });

  // Supabase no infiere la forma de los joins anidados sin tipos generados,
  // asi que se afirma aqui una sola vez y el resto del archivo queda tipado.
  const rows = (comments ?? []) as unknown as AdminComment[];

  const pending  = rows.filter((c) => !c.approved).length;
  const approved = rows.filter((c) =>  c.approved).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Comentarios</h1>
          <p className="admin-page-subtitle">
            {pending > 0
              ? `${pending} pendiente${pending !== 1 ? "s" : ""} · ${approved} aprobado${approved !== 1 ? "s" : ""}`
              : `${approved} aprobado${approved !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
      <CommentManager comments={rows} />
    </div>
  );
}
