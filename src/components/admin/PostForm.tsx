"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };
type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  youtube_url: string | null;
  category_id: string | null;
  is_premium: boolean;
  is_featured: boolean;
  published: boolean;
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function PostForm({ categories, post }: { categories: Category[]; post?: Post }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(post?.youtube_url ?? "");
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [isPremium, setIsPremium] = useState(post?.is_premium ?? false);
  const [isFeatured, setIsFeatured] = useState(post?.is_featured ?? false);
  const [published, setPublished] = useState(post?.published ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    if (!isEdit) setSlug(toSlug(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      cover_image: coverImage || null,
      youtube_url: youtubeUrl || null,
      category_id: categoryId || null,
      is_premium: isPremium,
      is_featured: isFeatured,
      published,
    };

    const { error } = isEdit
      ? await supabase.from("posts").update(payload).eq("id", post.id)
      : await supabase.from("posts").insert(payload);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <div className="form-grid">
        <div className="field">
          <label>Título</label>
          <input type="text" value={title} onChange={handleTitleChange} required />
        </div>

        <div className="field">
          <label>Slug (URL)</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>

        <div className="field field-full">
          <label>Extracto (resumen corto)</label>
          <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Breve descripción para la portada" />
        </div>

        <div className="field">
          <label>Imagen de portada (URL)</label>
          <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label>Vídeo de YouTube (URL)</label>
          <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div className="field">
          <label>Categoría</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="field field-full">
          <label>Contenido</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            required
            placeholder="Escribe el contenido de la entrada..."
          />
        </div>
      </div>

      <div className="form-toggles">
        <label className="toggle-label">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          Solo Premium
        </label>
        <label className="toggle-label">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Entrada destacada
        </label>
        <label className="toggle-label">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publicar
        </label>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={() => router.back()} className="btn-outline">
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear entrada"}
        </button>
      </div>
    </form>
  );
}
