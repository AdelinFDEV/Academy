"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, X } from "lucide-react";
import Icon from "@/components/Icon";

type SavedPost = {
  id: string;
  slug: string;
  title: string;
  cover_image: string | null;
  is_premium: boolean;
  isRead: boolean;
  categoryName: string | null;
};

export default function DashboardSavedPosts({
  initialPosts,
  isPremium,
}: {
  initialPosts: SavedPost[];
  isPremium: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [removing, setRemoving] = useState<string | null>(null);

  async function unsave(e: React.MouseEvent, postId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;
    setRemoving(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await fetch("/api/user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, action: "toggle-saved" }),
    });
    setRemoving(null);
  }

  if (posts.length === 0) {
    return (
      <div className="dash-empty">
        <div className="dash-empty-icon"><Icon name="bookmark" size={22} /></div>
        <p>No tienes artículos guardados aún.</p>
        <Link href="/articulos" className="dash-link-orange">Explorar artículos →</Link>
      </div>
    );
  }

  return (
    <div className="dash-saved-list">
      {posts.map((post) => {
        const locked = post.is_premium && !isPremium;
        return (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className={`dash-saved-item${post.isRead ? " is-read" : ""}`}
          >
            <div
              className="dash-saved-thumb"
              style={post.cover_image ? { backgroundImage: `url(${post.cover_image})` } : undefined}
            >
              {!post.cover_image && <Icon name="chart" size={18} />}
            </div>
            <div className="dash-saved-body">
              {post.categoryName && (
                <span className="dash-saved-cat">{post.categoryName}</span>
              )}
              <h3 className="dash-saved-title">{post.title}</h3>
              <div className="dash-saved-tags">
                {post.isRead && <span className="dash-tag-read">✓ Leído</span>}
                {locked && <span className="dash-tag-premium">PREMIUM</span>}
              </div>
            </div>
            <button
              className="dash-unsave-btn"
              onClick={(e) => unsave(e, post.id)}
              disabled={removing === post.id}
              aria-label="Quitar de guardados"
              title="Quitar de guardados"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </Link>
        );
      })}
    </div>
  );
}
