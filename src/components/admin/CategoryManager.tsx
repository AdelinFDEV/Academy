"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string };

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

    const { error } = await supabase
      .from("categories")
      .insert({ name, slug: toSlug(name) });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setName("");
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar esta categoría?")) return;
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
            <div>
              <span className="category-name">{cat.name}</span>
              <span className="category-slug">/{cat.slug}</span>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="action-btn delete">
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
