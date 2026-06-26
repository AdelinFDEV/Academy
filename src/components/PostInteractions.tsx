"use client";

import { useState, useEffect } from "react";

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
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none" aria-hidden="true">
          <path
            d="M7.5 12.5C7.5 12.5 1.5 8.8 1.5 5C1.5 3.07 3.07 1.5 5 1.5C6.1 1.5 7.1 2.04 7.5 2.9C7.9 2.04 8.9 1.5 10 1.5C11.93 1.5 13.5 3.07 13.5 5C13.5 8.8 7.5 12.5 7.5 12.5Z"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
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
          <CommentIcon />
          <span>{commentsCount}</span>
        </a>
      ) : (
        <span className="pi-btn pi-comments pi-static">
          <CommentIcon />
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
          <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
            <path
              d="M2 1.5h8v10L6 9 2 11.5V1.5Z"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <span className="pi-text-hide-mobile">{saved ? "Guardado" : "Guardar"}</span>
        </button>
      )}

      {/* Share */}
      <button
        className={`pi-btn pi-share${copied ? " pi-copied" : ""}`}
        onClick={handleShare}
        aria-label={copied ? "Enlace copiado" : "Compartir"}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v8M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 9v3.5h10V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        <span className={shares > 0 && !copied ? "" : "pi-text-hide-mobile"}>
          {copied ? "¡Copiado!" : shares > 0 ? shares : "Compartir"}
        </span>
      </button>

    </div>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 2.5C2 1.95 2.45 1.5 3 1.5h8c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H7.5L5.5 12 4 9.5H3c-.55 0-1-.45-1-1v-6Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}
