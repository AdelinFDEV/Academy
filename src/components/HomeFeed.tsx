"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Send, Check, ArrowRight, Bookmark, Clock } from "lucide-react";
import type { ReactNode } from "react";

/** Fecha completa para el `title` de la marca de tiempo. Se formatea desde el
 *  Date original: releerla desde su propio texto la desplazaria de zona. */
function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
}

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  youtube_url: string | null;
  is_premium: boolean;
  is_featured: boolean;
  created_at: string;
  categories: { name: string; slug: string } | null;
  likes: number;
  saves: number;
  /** Minutos de lectura estimados en el servidor. Null si la entrada no
   *  tiene cuerpo todavia. */
  minutos?: number | null;
  comments: number;
  initialLiked: boolean;
  initialSaved: boolean;
};

function getYoutubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}

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
  const [liked, setLiked] = useState(post.initialLiked);
  const [saves, setSaves] = useState(post.saves);
  const [saved, setSaved] = useState(post.initialSaved);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [shared, setShared] = useState(false);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (loadingLike) return;
    setLoadingLike(true);
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
    setLoadingLike(false);
  }

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (loadingSave) return;
    setLoadingSave(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    setSaves((p) => wasSaved ? p - 1 : p + 1);
    const res = await fetch("/api/user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, action: "toggle-saved" }),
    });
    if (res.ok) {
      const data = await res.json();
      setSaved(data.saved);
      setSaves(data.count);
    } else {
      setSaved(wasSaved);
      setSaves((p) => wasSaved ? p + 1 : p - 1);
    }
    setLoadingSave(false);
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <div className="feed-action-bar" onClick={(e) => e.stopPropagation()}>
      <button className={`feed-action-btn like-btn${liked ? " active" : ""}`} onClick={toggleLike} title="Me gusta">
        <Heart size={18} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{likes}</span>
      </button>

      <Link href={`/post/${post.slug}#comentarios`} className="feed-action-btn comment-btn">
        <MessageSquare size={18} aria-hidden="true" />
        <span>{post.comments}</span>
      </Link>

      <button
        className={`feed-action-btn save-btn${saved ? " active" : ""}`}
        onClick={toggleSave}
        disabled={loadingSave}
        title={saved ? "Quitar de guardados" : "Guardar"}
      >
        <Bookmark size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        <span>{saves}</span>
      </button>

      <button className="feed-action-btn share-btn" onClick={handleShare} title="Compartir">
        {shared ? <Check size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
      </button>

      {/* El titular tambien enlaza a la entrada, pero un enlace de texto no
          pide que lo pulses. Este si, y ademas llena el hueco que dejaban los
          contadores a la izquierda. */}
      <Link href={`/post/${post.slug}`} className="feed-post-cta">
        {post.is_premium ? "Desbloquear" : "Leer artículo"}
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </div>
  );
}

function FeedPost({ post, isLoggedIn }: { post: Post; isLoggedIn: boolean }) {
  const ytId = post.youtube_url ? getYoutubeId(post.youtube_url) : null;
  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  const displayImage = thumbUrl || post.cover_image;

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
          <span className="feed-post-autor">AdelinBTC</span>
          <span className="feed-meta-sep">·</span>
          {/* El «hace 21h» se lee de un vistazo, pero no dice de cuando es.
              La fecha exacta viaja en el `datetime` y sale al pasar el raton. */}
          <time dateTime={post.created_at} title={fechaLarga(post.created_at)}>
            {timeAgo(post.created_at)}
          </time>
          {post.minutos && (
            <>
              <span className="feed-meta-sep">·</span>
              <span className="feed-post-lectura">
                <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
                {post.minutos} min de lectura
              </span>
            </>
          )}
        </div>

        <ActionBar post={post} isLoggedIn={isLoggedIn} />
      </div>

      {displayImage && (
        <Link href={`/post/${post.slug}`} className="feed-post-thumb" tabIndex={-1} aria-hidden="true">
          <img src={displayImage} alt="" loading="lazy" />
          {ytId && <span className="feed-thumb-play" aria-hidden="true">▶</span>}
        </Link>
      )}
    </article>
  );
}

export function HeroPost({ post, isLoggedIn }: { post: Post; isLoggedIn: boolean }) {
  const ytId = post.youtube_url ? getYoutubeId(post.youtube_url) : null;
  const imageUrl = post.cover_image || "/featured-demo.png";

  return (
    <article className="hero-post-card">
      {ytId ? (
        <div className="hero-post-video-wrap">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            title={post.title}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <Link href={`/post/${post.slug}`} className="hero-post-image-wrap" tabIndex={-1} aria-hidden="true">
          <img src={imageUrl} alt="" className="hero-post-image" loading="lazy" />
          <div className="hero-post-image-overlay" />
        </Link>
      )}
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
          <span className="feed-post-autor">AdelinBTC</span>
          <span className="feed-meta-sep">·</span>
          {/* El «hace 21h» se lee de un vistazo, pero no dice de cuando es.
              La fecha exacta viaja en el `datetime` y sale al pasar el raton. */}
          <time dateTime={post.created_at} title={fechaLarga(post.created_at)}>
            {timeAgo(post.created_at)}
          </time>
          {post.minutos && (
            <>
              <span className="feed-meta-sep">·</span>
              <span className="feed-post-lectura">
                <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
                {post.minutos} min de lectura
              </span>
            </>
          )}
        </div>
        <ActionBar post={post} isLoggedIn={isLoggedIn} />
      </div>
    </article>
  );
}

export default function HomeFeed({ posts, isLoggedIn, youtubeSection, showHero = true, totalPosts }: { posts: Post[]; isLoggedIn: boolean; youtubeSection?: ReactNode; showHero?: boolean; totalPosts?: number }) {
  // Find the first featured post to show as Hero
  const mainPost = posts.find(p => p.is_featured);

  // Remove the mainPost from the regular list to avoid duplication
  const regularPosts = mainPost ? posts.filter(p => p.id !== mainPost.id) : posts;

  // La portada enseña tres entradas y punto: la destacada y la guía ya ocupan
  // la fila de arriba, y a partir de la tercera el visitante deja de leer y
  // empieza a hacer scroll. El resto está a un clic en «Ver todas».
  // Antes eran 5 en escritorio y 2 en móvil, ocultando las demás con CSS.
  const MAX_VISIBLE = 3;
  const visible = regularPosts.slice(0, MAX_VISIBLE);

  return (
    <div className="home-feed">
      {/* Hero Post */}
      {showHero && mainPost && (
        <HeroPost post={mainPost} isLoggedIn={isLoggedIn} />
      )}

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

      {/* El paso al archivo. Era un boton gris centrado que decia «Ver todas
          las entradas»: cerraba el feed en vez de invitar a seguir. Ahora dice
          cuantas entradas hay esperando, que es el argumento de verdad. */}
      {regularPosts.length > 0 && (
        <Link href="/articulos" className="feed-seeall">
          <span className="feed-seeall-texto">
            <span className="feed-seeall-titulo">
              {totalPosts && totalPosts > 3
                ? `Hay ${totalPosts - 3} artículos más`
                : "Sigue leyendo"}
            </span>
            <span className="feed-seeall-sub">
              Actualizaciones de red, movimientos de mercado y fiscalidad cripto en España
            </span>
          </span>
          <span className="feed-seeall-flecha" aria-hidden="true">
            <ArrowRight size={18} strokeWidth={2.5} />
          </span>
        </Link>
      )}

      {/* Último contenido en YouTube — se resuelve en un Suspense aparte */}
      {youtubeSection}
    </div>
  );
}
