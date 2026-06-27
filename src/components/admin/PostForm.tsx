"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import SeoPanel from "@/components/admin/SeoPanel";

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
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
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
  const isEdit = !!post;

  // Content fields
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

  // SEO fields
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focus_keyword ?? "");

  // UI state
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    if (!isEdit) setSlug(toSlug(e.target.value));
  }

  function handleSeoField(field: "seoTitle" | "metaDescription" | "focusKeyword" | string, value: string) {
    if (field === "seoTitle") setSeoTitle(value);
    else if (field === "metaDescription") setMetaDescription(value);
    else if (field === "focusKeyword") setFocusKeyword(value);
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
      seo_title: seoTitle || null,
      meta_description: metaDescription || null,
      focus_keyword: focusKeyword || null,
    };

    const url = isEdit ? `/api/admin/posts/${post.id}` : "/api/admin/posts";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al guardar");
      setLoading(false);
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="post-form">
      {/* ── Tab switcher ── */}
      <div className="post-form-tabs">
        <button
          type="button"
          className={`post-form-tab ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          ✏️ Contenido
        </button>
        <button
          type="button"
          className={`post-form-tab ${activeTab === "seo" ? "active" : ""}`}
          onClick={() => setActiveTab("seo")}
        >
          🔍 SEO & Vista previa
        </button>
      </div>

      {/* ── Content Tab ── */}
      {activeTab === "content" && (
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
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Breve descripción para la portada"
            />
          </div>

          <div className="field">
            <label>Imagen de portada (URL)</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="field">
            <label>Vídeo de YouTube (URL)</label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
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
            <MarkdownEditor value={content} onChange={setContent} rows={22} />
          </div>
        </div>
      )}

      {/* ── SEO Tab ── */}
      {activeTab === "seo" && (
        <SeoPanel
          title={title}
          slug={slug}
          excerpt={excerpt}
          content={content}
          coverImage={coverImage}
          seoTitle={seoTitle}
          metaDescription={metaDescription}
          focusKeyword={focusKeyword}
          onChange={handleSeoField}
        />
      )}

      {/* ── Toggles ── */}
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
