"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  is_premium: boolean;
  created_at: string;
  categories: { name: string; slug: string } | null;
}

interface Category {
  name: string;
  slug: string;
}

interface Props {
  posts: Post[];
  categories: Category[];
}

export default function ArticulosClient({ posts, categories }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory
        ? (p.categories as any)?.slug === activeCategory
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [posts, search, activeCategory]);

  return (
    <div className="articulos-inner">
      {/* Sidebar */}
      <aside className="articulos-sidebar">
        <div className="articulos-search-wrap">
          <Icon name="search" size={15} />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="articulos-search"
          />
          {search && (
            <button className="articulos-search-clear" onClick={() => setSearch("")} aria-label="Limpiar">
              ×
            </button>
          )}
        </div>

        <div className="articulos-categories">
          <span className="articulos-categories-label">Categorías</span>
          <button
            className={`articulos-cat-btn${activeCategory === null ? " active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            Todas
            <span className="articulos-cat-count">{posts.length}</span>
          </button>
          {categories.map((cat) => {
            const count = posts.filter((p) => (p.categories as any)?.slug === cat.slug).length;
            return (
              <button
                key={cat.slug}
                className={`articulos-cat-btn${activeCategory === cat.slug ? " active" : ""}`}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
              >
                {cat.name}
                <span className="articulos-cat-count">{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Grid */}
      <div className="articulos-grid-wrap">
        {filtered.length === 0 ? (
          <div className="articulos-empty">
            <Icon name="book" size={32} />
            <p>No se encontraron artículos{search ? ` para "${search}"` : ""}.</p>
          </div>
        ) : (
          <>
            <p className="articulos-count">{filtered.length} artículo{filtered.length !== 1 ? "s" : ""}</p>
            <div className="articulos-grid">
              {filtered.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className={`post-card${post.is_premium ? " is-premium" : ""}`}
                >
                  <div
                    className="post-card-image"
                    style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}
                  >
                    {!post.cover_image && (
                      <span className="post-card-image-placeholder">
                        <Icon name="chart" size={40} />
                      </span>
                    )}
                    {post.is_premium ? (
                      <div className="post-premium-badge"><Icon name="lock" size={11} /> Premium</div>
                    ) : (
                      <div className="post-free-badge">Gratis</div>
                    )}
                  </div>
                  <div className="post-card-body">
                    <div className="post-card-meta">
                      {(post.categories as any)?.name && (
                        <span className="post-category">{(post.categories as any).name}</span>
                      )}
                      <span className="post-date">{formatDate(post.created_at)}</span>
                    </div>
                    <div className="post-author-row">
                      <span className="post-author">AdelinBTC</span>
                    </div>
                    <h3 className="post-card-title">{post.title}</h3>
                    {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
                    {post.is_premium ? (
                      <span className="post-read-more is-premium"><Icon name="lock" size={14} /> Desbloquear</span>
                    ) : (
                      <span className="post-read-more">Leer más <Icon name="arrow-right" size={15} /></span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
