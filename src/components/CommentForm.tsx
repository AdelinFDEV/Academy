"use client";

import { useState } from "react";

export default function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    const body = new FormData();
    body.append("post_id", postId);
    body.append("content", content.trim());

    const res = await fetch("/api/comments", { method: "POST", body });

    if (res.ok || res.redirected) {
      setStatus("success");
      setContent("");
    } else {
      setErrorMsg("No se pudo enviar el comentario. Inténtalo de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="comment-success">
        Comentario enviado — estará visible tras revisión. Gracias por participar.
      </div>
    );
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        name="content"
        placeholder="Escribe tu comentario..."
        rows={4}
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={status === "loading"}
      />
      {status === "error" && <p className="comment-error">{errorMsg}</p>}
      <button type="submit" className="btn-primary btn-small" disabled={status === "loading"}>
        {status === "loading" ? "Enviando…" : "Enviar comentario"}
      </button>
    </form>
  );
}
