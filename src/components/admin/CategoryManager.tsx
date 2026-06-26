"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

type Category = { id: string; name: string; slug: string; postCount: number };

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.from("categories").insert({ name, slug: toSlug(name) });
    if (error) { setError(error.message); setLoading(false); return; }
    setName("");
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string, postCount: number) {
    const msg = postCount > 0
      ? `Esta categoría tiene ${postCount} artículos. ¿Borrarla de todos modos?`
      : "¿Borrar esta categoría?";
    if (!confirm(msg)) return;
    await supabase.from("categories").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="category-manager">
      <form onSubmit={handleAdd} className="category-form">
        <div className="field">
          <label>Nueva categoría</label>
          <div className="category-input-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bitcoin, Trading, DeFi..."
              required
            />
            <button type="submit" className="btn-primary btn-small" disabled={loading}>
              {loading ? "..." : "Añadir"}
            </button>
          </div>
        </div>
        {error && <p className="auth-error">{error}</p>}
      </form>

      <div className="category-list">
        {categories.length === 0 && (
          <p className="admin-empty">No hay categorías aún</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="category-item">
            <div className="category-item-left">
              <div className="category-icon-wrap">
                <Icon name="folder" size={15} />
              </div>
              <div>
                <span className="category-name">{cat.name}</span>
                <span className="category-slug">/{cat.slug}</span>
              </div>
            </div>
            <div className="category-item-right">
              <span className="category-post-count">
                {cat.postCount} {cat.postCount === 1 ? "artículo" : "artículos"}
              </span>
              <button onClick={() => handleDelete(cat.id, cat.postCount)} className="action-btn delete" title="Borrar categoría">
                <Icon name="x" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
