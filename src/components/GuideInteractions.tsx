"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, Share2 } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

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
  const router = useRouter();
  const [likes, setLikes]           = useState(initialLikes);
  const [liked, setLiked]           = useState(initialLiked);
  const [saved, setSaved]           = useState(initialSaved);
  const [shares, setShares]         = useState(initialShares);
  const [shareLabel, setShareLabel] = useState<string | null>(null);
  const [liking, setLiking]         = useState(false);
  const [saving, setSaving]         = useState(false);

  async function handleLike() {
    if (!isLoggedIn) { router.push("/login"); return; }
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
      sonar("error");
    }
    setLiking(false);
  }

  async function handleSave() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (saving) return;
    setSaving(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch("/api/guide-saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_slug: guideSlug }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Guardarla suena a «clac»; quitarla ya hizo su clic de tecla.
      if (next) sonar("guardado");
    } catch {
      setSaved(!next);
      sonar("error");
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

  // Tres teclas pequeñas (estilo «Cuaderno de estudio»): blancas en reposo y,
  // encendidas, del color de lo que significan: coral el me gusta, menta lo
  // guardado y cielo lo compartido.
  return (
    <div className="gi-fila">
      <Tecla
        tamano="peq"
        color={liked ? "coral" : "blanca"}
        className="gi-tecla"
        onClick={handleLike}
        aria-pressed={liked}
        aria-label={liked ? "Quitar me gusta" : "Me gusta"}
      >
        <Heart size={17} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2.4} aria-hidden="true" />
        <span>{likes > 0 ? likes : "Me gusta"}</span>
      </Tecla>

      <Tecla
        tamano="peq"
        color={saved ? "menta" : "blanca"}
        className="gi-tecla"
        onClick={handleSave}
        aria-pressed={saved}
        aria-label={saved ? "Quitar de guardados" : "Guardar guía"}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} strokeWidth={saved ? 0 : 2.4} aria-hidden="true" />
        <span>{saved ? "Guardado" : "Guardar"}</span>
      </Tecla>

      {/* El «¡Copiado!» se ve en la tecla; aquí se anuncia al lector de pantalla. */}
      <span className="sr-only" role="status">{shareLabel ?? ""}</span>

      <Tecla
        tamano="peq"
        color={shareLabel ? "cielo" : "blanca"}
        className="gi-tecla"
        onClick={handleShare}
        aria-label="Compartir guía"
      >
        <Share2 size={17} strokeWidth={2.4} aria-hidden="true" />
        <span>{shareLabel ?? (shares > 0 ? `Compartir · ${shares}` : "Compartir")}</span>
      </Tecla>
    </div>
  );
}
