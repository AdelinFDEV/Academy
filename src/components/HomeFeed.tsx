"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  is_premium: boolean;
  is_featured: boolean;
  created_at: string;
  categories: { name: string; slug: string } | null;
  likes: number;
  comments: number;
};

type Tab = "nuevo" | "destacados" | "premium";

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "hace un momento";
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  return `hace ${Math.floor(diff / 2592000)} meses`;
}

function ActionBar({ post, isLoggedIn }: { post: Post; isLoggedIn: boolean }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (loading) return;
    setLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((p) => wasLiked ? p - 1 : p + 1);
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.count);
      setLiked(data.liked);
    } else {
      setLiked(wasLiked);
      setLikes((p) => wasLiked ? p + 1 : p - 1);
    }
    setLoading(false);
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <div className="feed-action-bar" onClick={(e) => e.stopPropagation()}>
      <button className={`feed-action-btn like-btn ${liked ? "active" : ""}`} onClick={toggleLike} title="Me gusta">
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        <span>{likes}</span>
      </button>

      <Link href={`/post/${post.slug}#comentarios`} className="feed-action-btn comment-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>{post.comments}</span>
      </Link>

      <button className="feed-action-btn share-btn" onClick={handleShare} title="Compartir">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        {shared && <span>✓</span>}
      </button>
    </div>
  );
}

function FeedPost({ post, isLoggedIn }: { post: Post; isLoggedIn: boolean }) {
  return (
    <article className={`feed-post-row${post.is_featured ? " is-featured" : ""}`}>
      <div className="feed-post-body">
        <div className="feed-post-tags">
          {post.categories && (
            <Link href={`/categoria/${post.categories.slug}`} className="feed-flair" onClick={(e) => e.stopPropagation()}>
              {post.categories.name}
            </Link>
          )}
          {post.is_featured && <span className="feed-badge-featured">Destacado</span>}
          {post.is_premium
            ? <span className="feed-badge-premium">Premium</span>
            : <span className="feed-badge-free">Gratis</span>}
        </div>

        <Link href={`/post/${post.slug}`} className="feed-post-title">
          {post.title}
        </Link>

        {post.excerpt && (
          <p className="feed-post-excerpt">{post.excerpt}</p>
        )}

        <div className="feed-post-meta">
          <span>AdelinBTC</span>
          <span className="feed-meta-sep">·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        
        <ActionBar post={post} isLoggedIn={isLoggedIn} />
      </div>

      {post.cover_image && (
        <Link href={`/post/${post.slug}`} className="feed-post-thumb" tabIndex={-1} aria-hidden="true">
          <img src={post.cover_image} alt="" loading="lazy" />
        </Link>
      )}
    </article>
  );
}

function HeroPost({ post, isLoggedIn }: { post: Post; isLoggedIn: boolean }) {
  const imageUrl = post.cover_image || "/featured-demo.png";
  return (
    <article className="hero-post-card">
      <Link href={`/post/${post.slug}`} className="hero-post-image-wrap" tabIndex={-1} aria-hidden="true">
        <img src={imageUrl} alt="" className="hero-post-image" loading="lazy" />
        <div className="hero-post-image-overlay" />
      </Link>
      <div className="hero-post-content">
        <div className="feed-post-tags">
          {post.categories && (
            <Link href={`/categoria/${post.categories.slug}`} className="feed-flair" onClick={(e) => e.stopPropagation()}>
              {post.categories.name}
            </Link>
          )}
          <span className="feed-badge-featured">Post Principal</span>
          {post.is_premium
            ? <span className="feed-badge-premium">Premium</span>
            : <span className="feed-badge-free">Gratis</span>}
        </div>
        <Link href={`/post/${post.slug}`} className="hero-post-title">
          {post.title}
        </Link>
        {post.excerpt && (
          <p className="hero-post-excerpt">{post.excerpt}</p>
        )}
        <div className="feed-post-meta">
          <span>AdelinBTC</span>
          <span className="feed-meta-sep">·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        <ActionBar post={post} isLoggedIn={isLoggedIn} />
      </div>
    </article>
  );
}

export default function HomeFeed({ posts, isLoggedIn }: { posts: Post[]; isLoggedIn: boolean }) {
  const [tab, setTab] = useState<Tab>("nuevo");
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Find the first featured post to show as Hero
  const mainPost = posts.find(p => p.is_featured);
  
  // Remove the mainPost from the regular list to avoid duplication
  const regularPosts = mainPost ? posts.filter(p => p.id !== mainPost.id) : posts;

  const filtered = useMemo(() => {
    if (tab === "destacados") return regularPosts.filter((p) => p.is_featured);
    if (tab === "premium")    return regularPosts.filter((p) => p.is_premium);
    return regularPosts;
  }, [regularPosts, tab]);

  function switchTab(next: Tab) {
    setTab(next);
    requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  return (
    <div className="home-feed">
      {/* Hero Post */}
      {mainPost && (
        <HeroPost post={mainPost} isLoggedIn={isLoggedIn} />
      )}

      {/* Tabs */}
      <div className="feed-tabs" role="tablist" ref={tabsRef}>
        <button role="tab" aria-selected={tab === "nuevo"}      className={`feed-tab${tab === "nuevo"      ? " active" : ""}`} onClick={() => switchTab("nuevo")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Nuevo
        </button>
        <button role="tab" aria-selected={tab === "destacados"} className={`feed-tab${tab === "destacados" ? " active" : ""}`} onClick={() => switchTab("destacados")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><polygon points="7,1.5 8.5,5.5 13,5.5 9.5,8 10.5,12 7,9.5 3.5,12 4.5,8 1,5.5 5.5,5.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          Destacados
        </button>
        <button role="tab" aria-selected={tab === "premium"}    className={`feed-tab${tab === "premium"    ? " active" : ""}`} onClick={() => switchTab("premium")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Premium
        </button>
      </div>

      {/* Feed */}
      <div className="feed-list">
        {filtered.length === 0 ? (
          <div className="feed-empty">
            <p>No hay artículos en esta sección todavía.</p>
          </div>
        ) : (
          filtered.map((post) => (
            <FeedPost key={post.id} post={post} isLoggedIn={isLoggedIn} />
          ))
        )}
      </div>
    </div>
  );
}
