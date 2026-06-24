import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeletePostButton from "@/components/admin/DeletePostButton";

export default async function AdminPostsPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, is_premium, is_featured, published, created_at, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Entradas</h1>
        <Link href="/admin/posts/new" className="btn-primary btn-small">
          + Nueva entrada
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {posts?.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">No hay entradas aún</td>
              </tr>
            )}
            {posts?.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{(post.categories as any)?.name ?? "—"}</td>
                <td>
                  <span className={`status-badge ${post.published ? "published" : "draft"}`}>
                    {post.published ? "Publicado" : "Borrador"}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${post.is_premium ? "premium" : "free"}`}>
                    {post.is_premium ? "Premium" : "Free"}
                  </span>
                </td>
                <td className="admin-actions">
                  <Link href={`/admin/posts/edit/${post.id}`} className="action-btn edit">
                    Editar
                  </Link>
                  <DeletePostButton id={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
