import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ count: postsCount }, { count: commentsCount }, { count: usersCount }, { count: premiumCount }] =
    await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }).eq("approved", false),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "premium"),
    ]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Panel de administración</h1>
        <Link href="/admin/posts/new" className="btn-primary btn-small">
          + Nueva entrada
        </Link>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat-value">{postsCount ?? 0}</span>
          <span className="admin-stat-label">Entradas publicadas</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{commentsCount ?? 0}</span>
          <span className="admin-stat-label">Comentarios pendientes</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{usersCount ?? 0}</span>
          <span className="admin-stat-label">Usuarios registrados</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value" style={{ color: "var(--accent-orange)" }}>{premiumCount ?? 0}</span>
          <span className="admin-stat-label">Usuarios premium activos</span>
        </div>
      </div>

      <div className="admin-quick-links">
        <h2>Accesos rápidos</h2>
        <div className="quick-links-grid">
          <Link href="/admin/posts/new" className="quick-link-card">
            <span className="quick-link-icon"><Icon name="pen" size={22} /></span>
            <span>Nueva entrada</span>
          </Link>
          <Link href="/admin/categories" className="quick-link-card">
            <span className="quick-link-icon"><Icon name="folder" size={22} /></span>
            <span>Categorías</span>
          </Link>
          <Link href="/admin/comments" className="quick-link-card">
            <span className="quick-link-icon"><Icon name="chat" size={22} /></span>
            <span>Aprobar comentarios</span>
          </Link>
          <Link href="/admin/posts" className="quick-link-card">
            <span className="quick-link-icon"><Icon name="list" size={22} /></span>
            <span>Todas las entradas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
