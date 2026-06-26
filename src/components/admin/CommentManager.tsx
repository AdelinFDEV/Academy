"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";

type Comment = {
  id: string;
  content: string;
  approved: boolean;
  created_at: string;
  profiles: { full_name: string | null } | null;
  posts: { title: string; slug: string } | null;
};

type Tab = "pending" | "approved" | "all";

export default function CommentManager({ comments }: { comments: Comment[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("pending");

  const pending  = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) =>  c.approved);
  const visible  = tab === "pending" ? pending : tab === "approved" ? approved : comments;

  async function handleApprove(id: string) {
    await supabase.from("comments").update({ approved: true }).eq("id", id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este comentario?")) return;
    await supabase.from("comments").delete().eq("id", id);
    router.refresh();
  }

  async function approveAll() {
    if (!confirm(`¿Aprobar todos los ${pending.length} comentarios pendientes?`)) return;
    await supabase.from("comments").update({ approved: true }).eq("approved", false);
    router.refresh();
  }

  return (
    <div>
      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab${tab === "pending" ? " active" : ""}`} onClick={() => setTab("pending")}>
          Pendientes
          {pending.length > 0 && <span className="admin-tab-badge">{pending.length}</span>}
        </button>
        <button className={`admin-tab${tab === "approved" ? " active" : ""}`} onClick={() => setTab("approved")}>
          Aprobados
          <span className="admin-tab-count">{approved.length}</span>
        </button>
        <button className={`admin-tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>
          Todos
          <span className="admin-tab-count">{comments.length}</span>
        </button>

        {tab === "pending" && pending.length > 1 && (
          <button className="admin-approve-all" onClick={approveAll}>
            <Icon name="check-circle" size={14} />
            Aprobar todos
          </button>
        )}
      </div>

      {/* List */}
      <div className="comment-manager">
        {visible.length === 0 && (
          <div className="admin-empty-state">
            <Icon name="check-circle" size={28} />
            <p>{tab === "pending" ? "No hay comentarios pendientes" : "No hay comentarios aquí"}</p>
          </div>
        )}

        {visible.map((c) => (
          <div key={c.id} className={`comment-card${!c.approved ? " pending" : ""}`}>
            <div className="comment-meta">
              <span className="comment-author-name">{c.profiles?.full_name ?? "Usuario"}</span>
              {c.posts && (
                <Link href={`/post/${c.posts.slug}`} target="_blank" className="comment-post-link">
                  <Icon name="arrow-right" size={11} />
                  {c.posts.title}
                </Link>
              )}
              {!c.approved && <span className="comment-pending-badge">Pendiente</span>}
              <span className="comment-date">{new Date(c.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <p className="comment-content">{c.content}</p>
            <div className="comment-actions">
              {!c.approved && (
                <button onClick={() => handleApprove(c.id)} className="action-btn approve">
                  <Icon name="check" size={13} />
                  Aprobar
                </button>
              )}
              <button onClick={() => handleDelete(c.id)} className="action-btn delete">
                <Icon name="x" size={13} />
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
