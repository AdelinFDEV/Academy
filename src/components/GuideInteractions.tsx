"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";

interface Props {
  guideSlug: string;
  initialLikes: number;
  initialLiked: boolean;
  initialSaved: boolean;
  initialShares: number;
  isLoggedIn: boolean;
}

export default function GuideInteractions({
  guideSlug,
  initialLikes,
  initialLiked,
  initialSaved,
  initialShares,
  isLoggedIn,
}: Props) {
  const [likes, setLikes]           = useState(initialLikes);
  const [liked, setLiked]           = useState(initialLiked);
  const [saved, setSaved]           = useState(initialSaved);
  const [shares, setShares]         = useState(initialShares);
  const [shareLabel, setShareLabel] = useState<string | null>(null);
  const [liking, setLiking]         = useState(false);
  const [saving, setSaving]         = useState(false);

  async function handleLike() {
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (liking) return;
    setLiking(true);
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch("/api/guide-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_slug: guideSlug }),
      });
      const data = await res.json();
      if (typeof data.count === "number") { setLikes(data.count); setLiked(data.liked); }
    } catch {
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
    }
    setLiking(false);
  }

  async function handleSave() {
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (saving) return;
    setSaving(true);
    const next = !saved;
    setSaved(next);
    try {
      await fetch("/api/guide-saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_slug: guideSlug }),
      });
    } catch {
      setSaved(!next);
    }
    setSaving(false);
  }

  async function handleShare() {
    const url = window.location.href;
    let ok = false;

    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); ok = true; } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); ok = true; } catch {
        const ta = document.createElement("textarea");
        ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta); ok = true;
      }
    }

    if (ok) {
      setShares((c) => c + 1);
      setShareLabel("¡Copiado!");
      fetch("/api/guide-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_slug: guideSlug }),
      }).catch(() => {});
      setTimeout(() => setShareLabel(null), 2500);
    }
  }

  return (
    <div className="guide-interactions">
      <button
        className={`guide-int-btn guide-int-btn--like${liked ? " active" : ""}`}
        onClick={handleLike}
        aria-label={liked ? "Quitar me gusta" : "Me gusta"}
      >
        <Heart size={17} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2} aria-hidden="true" />
        <span>{likes > 0 ? likes : "Me gusta"}</span>
      </button>

      <button
        className={`guide-int-btn guide-int-btn--save${saved ? " active" : ""}`}
        onClick={handleSave}
        aria-label={saved ? "Quitar de guardados" : "Guardar guía"}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} strokeWidth={saved ? 0 : 2} aria-hidden="true" />
        <span>{saved ? "Guardado" : "Guardar"}</span>
      </button>

      <button
        className={`guide-int-btn guide-int-btn--share${shareLabel ? " active" : ""}`}
        onClick={handleShare}
        aria-label="Compartir guía"
      >
        <Share2 size={17} aria-hidden="true" />
        <span>{shareLabel ?? (shares > 0 ? `Compartir · ${shares}` : "Compartir")}</span>
      </button>
    </div>
  );
}
