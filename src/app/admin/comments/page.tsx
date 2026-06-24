import { createClient } from "@/lib/supabase/server";
import CommentManager from "@/components/admin/CommentManager";

export default async function CommentsPage() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, approved, created_at, profiles(full_name), posts(title)")
    .order("created_at", { ascending: false });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Comentarios</h1>
      </div>
      <CommentManager comments={(comments as any) ?? []} />
    </div>
  );
}
