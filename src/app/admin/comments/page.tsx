import { createClient } from "@/lib/supabase/server";
import CommentManager from "@/components/admin/CommentManager";

export default async function CommentsPage() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, approved, created_at, profiles(full_name), posts(title, slug)")
    .order("created_at", { ascending: false });

  const pending  = (comments ?? []).filter((c: any) => !c.approved).length;
  const approved = (comments ?? []).filter((c: any) =>  c.approved).length;

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
      <CommentManager comments={(comments as any) ?? []} />
    </div>
  );
}
