"use client";

import { useState, useEffect } from "react";
import { Heart, MessageSquare, Bookmark, Share2, Check } from "lucide-react";

interface Props {
  postId: string;
  postSlug: string;
  commentsCount: number;
  initialLikes?: number;
  initialLiked?: boolean;
  initialShares?: number;
  initialSaved?: boolean;
  initialRead?: boolean;
  isLoggedIn?: boolean;
  variant?: "card" | "post";
}

export default function PostInteractions({
  postId,
  postSlug,
  commentsCount,
  initialLikes,
  initialLiked = false,
  initialShares,
  initialSaved = false,
  initialRead = false,
  isLoggedIn = false,
  variant = "card",
}: Props) {
  const [likes, setLikes]       = useState(initialLikes ?? 0);
  const [liked, setLiked]       = useState(initialLiked);
  const [shares, setShares]     = useState(initialShares ?? 0);
  const [saved, setSaved]       = useState(initialSaved);
  const [copied, setCopied]     = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  // Only call the GET endpoint when no server-side initial data was provided
  // (e.g. when used in card/list context without pre-fetched counts)
  useEffect(() => {
    if (initialLikes != null) return;
    fetch(`/api/likes?post_id=${postId}`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.count  === "number") setLikes(data.count);
        if (typeof data.liked  === "boolean") setLiked(data.liked);
        if (typeof data.shares === "number") setShares(data.shares);
      })
      .catch(() => {});
  }, [postId, initialLikes]);

  // Mark as read + check badges when opening a post (logged-in users only)
  useEffect(() => {
    if (variant !== "post" || initialRead || !isLoggedIn) return;
    fetch("/api/user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, action: "mark-read" }),
    })
      .then((r) => {
        if (!r.ok) return;
        return fetch("/api/badges", { method: "POST" })
          .then((b) => b.json())
          .then((data) => {
            if (data?.newlyUnlocked?.length > 0) {
              window.dispatchEvent(
                new CustomEvent("badge-unlocked", { detail: { ids: data.newlyUnlocked } })
              );
            }
          });
      })
      .catch(() => {});
  }, [postId, variant, initialRead, isLoggedIn]);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (loadingLike) return;

    setLoadingLike(true);
    const wasLiked = liked;

    // Optimistic update
    setLiked(!wasLiked);
    setLikes((prev) => wasLiked ? prev - 1 : prev + 1);
    if (!wasLiked) {
      setHeartPop(true);
      setTimeout(() => setHeartPop(false), 500);
    }

    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });

    if (res.ok) {
      const data = await res.json();
      // Sync with definitive server state
      setLikes(data.count);
      setLiked(data.liked);
    } else {
      // Server failed — revert the optimistic update
      setLiked(wasLiked);
      setLikes((prev) => wasLiked ? prev + 1 : prev - 1);
    }

    setLoadingLike(false);
  }

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (loadingSave) return;
    setLoadingSave(true);
    const res = await fetch("/api/user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, action: "toggle-saved" }),
    });
    if (res.ok) {
      const data = await res.json();
      setSaved(data.saved);
    }
    setLoadingSave(false);
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postSlug}`;
    let didShare = false;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        didShare = true;
      } catch {
        // User cancelled native share — don't count it
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        didShare = true;
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Clipboard access denied — try fallback
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;top:-9999px;left:-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand("copy");
          didShare = true;
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {}
        document.body.removeChild(ta);
      }
    }

    if (didShare) {
      fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      })
        .then((r) => r.json())
        .then((data) => { if (typeof data.shares === "number") setShares(data.shares); })
        .catch(() => {});
    }
  }

  return (
    <div className={`post-interactions${variant === "post" ? " post-interactions--post" : ""}`}>

      {/* Like / Heart */}
      <button
        className={`pi-btn pi-like${liked ? " pi-active" : ""}${heartPop ? " pi-heart-pop" : ""}`}
        onClick={toggleLike}
        disabled={loadingLike}
        aria-label={liked ? "Quitar me gusta" : "Me gusta"}
        aria-pressed={liked}
        title={isLoggedIn ? undefined : "Regístrate para reaccionar"}
      >
        <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{likes}</span>
      </button>

      {/* Comments */}
      {variant === "post" ? (
        <a
          href="#comentarios"
          className="pi-btn pi-comments"
          onClick={(e) => e.stopPropagation()}
          aria-label="Ver comentarios"
        >
          <MessageSquare size={14} aria-hidden="true" />
          <span>{commentsCount}</span>
        </a>
      ) : (
        <span className="pi-btn pi-comments pi-static">
          <MessageSquare size={14} aria-hidden="true" />
          <span>{commentsCount}</span>
        </span>
      )}

      {/* Save (post view only) */}
      {variant === "post" && (
        <button
          className={`pi-btn pi-save${saved ? " pi-active" : ""}`}
          onClick={toggleSave}
          disabled={loadingSave}
          aria-label={saved ? "Quitar de guardados" : "Guardar artículo"}
          aria-pressed={saved}
          title={isLoggedIn ? undefined : "Regístrate para guardar"}
        >
          <Bookmark size={13} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      )}

      {/* Share */}
      <button
        className={`pi-btn pi-share${copied ? " pi-copied" : ""}`}
        onClick={handleShare}
        aria-label={copied ? "Enlace copiado" : "Compartir"}
      >
        {copied ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <Share2 size={14} aria-hidden="true" />
        )}
        <span className={shares > 0 && !copied ? "" : "pi-text-hide-mobile"}>
          {copied ? "¡Copiado!" : shares > 0 ? shares : "Compartir"}
        </span>
      </button>

    </div>
  );
}
