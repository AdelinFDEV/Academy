"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

interface Props {
  postId: string;
  initialSaved: boolean;
  initialRead: boolean;
}

export default function PostActions({ postId, initialSaved, initialRead }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [read, setRead] = useState(initialRead);
  const [loadingSave, setLoadingSave] = useState(false);

  // Auto-mark as read on mount, then check for newly unlocked badges
  useEffect(() => {
    if (read) return;
    fetch("/api/user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, action: "mark-read" }),
    })
      .then((r) => { if (r.ok) setRead(true); })
      .then(() => fetch("/api/badges", { method: "POST" }))
      .then((r) => r?.json())
      .then((data) => {
        if (data?.newlyUnlocked?.length > 0) {
          window.dispatchEvent(
            new CustomEvent("badge-unlocked", { detail: { ids: data.newlyUnlocked } })
          );
        }
      })
      .catch(() => {});
  }, [postId, read]);

  async function toggleSaved() {
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

  return (
    <div className="post-actions">
      {read && (
        <span className="post-action-read">
          <Icon name="check" size={13} /> Leído
        </span>
      )}
      <button
        className={`post-action-save${saved ? " saved" : ""}`}
        onClick={toggleSaved}
        disabled={loadingSave}
        aria-label={saved ? "Quitar de guardados" : "Guardar artículo"}
      >
        <Icon name="bookmark" size={15} />
        {saved ? "Guardado" : "Guardar"}
      </button>
    </div>
  );
}
