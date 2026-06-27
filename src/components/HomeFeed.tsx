"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Flame, Pin, Gem, Heart, MessageSquare, Send, Check, ArrowRight } from "lucide-react";
import YouTubeLatest from "@/components/YouTubeLatest";
import type { YouTubeVideo } from "@/lib/youtube";

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
        <Heart size={18} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{likes}</span>
      </button>

      <Link href={`/post/${post.slug}#comentarios`} className="feed-action-btn comment-btn">
        <MessageSquare size={18} aria-hidden="true" />
        <span>{post.comments}</span>
      </Link>

      <button className="feed-action-btn share-btn" onClick={handleShare} title="Compartir">
        {shared ? <Check size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
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

export default function HomeFeed({ posts, isLoggedIn, youtubeVideos = [] }: { posts: Post[]; isLoggedIn: boolean; youtubeVideos?: YouTubeVideo[] }) {
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

  // Home only shows the 4 most recent — the rest live in /articulos
  const MAX_VISIBLE = 4;
  const visible = filtered.slice(0, MAX_VISIBLE);
  const hasMore = filtered.length > MAX_VISIBLE;

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
          <Flame size={14} aria-hidden="true" />
          Nuevo
        </button>
        <button role="tab" aria-selected={tab === "destacados"} className={`feed-tab${tab === "destacados" ? " active" : ""}`} onClick={() => switchTab("destacados")}>
          <Pin size={14} aria-hidden="true" />
          Destacados
        </button>
        <button role="tab" aria-selected={tab === "premium"}    className={`feed-tab${tab === "premium"    ? " active" : ""}`} onClick={() => switchTab("premium")}>
          <Gem size={14} aria-hidden="true" />
          Premium
        </button>
      </div>

      {/* Feed */}
      <div className="feed-list">
        {visible.length === 0 ? (
          <div className="feed-empty">
            <p>No hay artículos en esta sección todavía.</p>
          </div>
        ) : (
          visible.map((post) => (
            <FeedPost key={post.id} post={post} isLoggedIn={isLoggedIn} />
          ))
        )}
      </div>

      {hasMore && (
        <Link href="/articulos" className="feed-seeall">
          Ver todas las entradas
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      )}

      {/* Último contenido en YouTube */}
      <YouTubeLatest videos={youtubeVideos} />
    </div>
  );
}
