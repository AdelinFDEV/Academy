"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

type Category = { id: string; name: string };
type Post = {
  id: string;
  title: string;
  slug: string;
  is_premium: boolean;
  is_featured: boolean;
  published: boolean;
  created_at: string;
  categories: { name: string } | null;
  reads: number;
};

function Toggle({
  value,
  postId,
  field,
  labelOn,
  labelOff,
  colorOn,
}: {
  value: boolean;
  postId: string;
  field: "published" | "is_featured";
  labelOn: string;
  labelOff: string;
  colorOn: string;
}) {
  const [active, setActive] = useState(value);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const next = !active;
    setActive(next);
    await supabase.from("posts").update({ [field]: next }).eq("id", postId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className={`post-inline-toggle${active ? " on" : ""}`}
      style={active ? { "--toggle-color": colorOn } as React.CSSProperties : undefined}
      onClick={toggle}
      disabled={loading}
      title={active ? labelOn : labelOff}
    >
      {loading ? "·" : active ? labelOn : labelOff}
    </button>
  );
}

function DeleteBtn({ id }: { id: string }) {
  const supabase = createClient();
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("¿Borrar esta entrada permanentemente?")) return;
    await supabase.from("posts").delete().eq("id", id);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="action-btn delete" title="Eliminar">
      <Icon name="x" size={13} />
    </button>
  );
}

export default function PostsTable({
  posts,
  categories,
}: {
  posts: Post[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = posts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "all" && p.categories?.name !== catFilter) return false;
    if (statusFilter === "published" && !p.published) return false;
    if (statusFilter === "draft" && p.published) return false;
    if (typeFilter === "premium" && !p.is_premium) return false;
    if (typeFilter === "free" && p.is_premium) return false;
    return true;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="admin-filter-bar">
        <div className="admin-filter-search">
          <Icon name="search" size={15} />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="filter-clear" onClick={() => setSearch("")}>
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="admin-filter-select">
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-filter-select">
          <option value="all">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-filter-select">
          <option value="all">Free y Premium</option>
          <option value="free">Solo Free</option>
          <option value="premium">Solo Premium</option>
        </select>

        <span className="admin-filter-count">{filtered.length} entrada{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Publicado</th>
              <th>Destacado</th>
              <th>Tipo</th>
              <th><Icon name="eye" size={13} /></th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty">No hay entradas con estos filtros</td>
              </tr>
            )}
            {filtered.map((post) => (
              <tr key={post.id}>
                <td className="posts-table-title">
                  <span>{post.title}</span>
                  <span className="posts-table-date">
                    {new Date(post.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </td>
                <td>
                  <span className="posts-cat-tag">{post.categories?.name ?? "—"}</span>
                </td>
                <td>
                  <Toggle
                    value={post.published}
                    postId={post.id}
                    field="published"
                    labelOn="Publicado"
                    labelOff="Borrador"
                    colorOn="#4ade80"
                  />
                </td>
                <td>
                  <Toggle
                    value={post.is_featured}
                    postId={post.id}
                    field="is_featured"
                    labelOn="Destacado"
                    labelOff="Normal"
                    colorOn="var(--premium-gold)"
                  />
                </td>
                <td>
                  <span className={`status-badge ${post.is_premium ? "premium" : "free"}`}>
                    {post.is_premium ? "Premium" : "Free"}
                  </span>
                </td>
                <td className="posts-reads-count">{post.reads > 0 ? post.reads : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td className="admin-actions">
                  <Link href={`/admin/posts/edit/${post.id}`} className="action-btn edit" title="Editar">
                    <Icon name="pen" size={13} />
                  </Link>
                  <DeleteBtn id={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
