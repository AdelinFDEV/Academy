"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  content: string;
  approved: boolean;
  created_at: string;
  profiles: { full_name: string | null } | null;
  posts: { title: string } | null;
};

export default function CommentManager({ comments }: { comments: Comment[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleApprove(id: string) {
    await supabase.from("comments").update({ approved: true }).eq("id", id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este comentario?")) return;
    await supabase.from("comments").delete().eq("id", id);
    router.refresh();
  }

  const pending = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) => c.approved);

  return (
    <div className="comment-manager">
      <h2 className="section-title">Pendientes de aprobación ({pending.length})</h2>
      {pending.length === 0 && <p className="admin-empty">No hay comentarios pendientes</p>}
      {pending.map((c) => (
        <div key={c.id} className="comment-card pending">
          <div className="comment-meta">
            <span>{c.profiles?.full_name ?? "Usuario"}</span>
            <span className="comment-post">en: {c.posts?.title ?? "—"}</span>
            <span className="comment-date">{new Date(c.created_at).toLocaleDateString("es-ES")}</span>
          </div>
          <p className="comment-content">{c.content}</p>
          <div className="comment-actions">
            <button onClick={() => handleApprove(c.id)} className="action-btn approve">
              Aprobar
            </button>
            <button onClick={() => handleDelete(c.id)} className="action-btn delete">
              Borrar
            </button>
          </div>
        </div>
      ))}

      <h2 className="section-title" style={{ marginTop: "2rem" }}>Aprobados ({approved.length})</h2>
      {approved.length === 0 && <p className="admin-empty">No hay comentarios aprobados</p>}
      {approved.map((c) => (
        <div key={c.id} className="comment-card">
          <div className="comment-meta">
            <span>{c.profiles?.full_name ?? "Usuario"}</span>
            <span className="comment-post">en: {c.posts?.title ?? "—"}</span>
            <span className="comment-date">{new Date(c.created_at).toLocaleDateString("es-ES")}</span>
          </div>
          <p className="comment-content">{c.content}</p>
          <div className="comment-actions">
            <button onClick={() => handleDelete(c.id)} className="action-btn delete">
              Borrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
