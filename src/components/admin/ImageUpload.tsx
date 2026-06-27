"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  compact?: boolean;
}

export default function ImageUpload({ onUpload, label = "Subir imagen", compact = false }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(file: File) {
    setErr("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setErr(data.error ?? "Error al subir");
      return;
    }

    onUpload(data.url);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  }

  return (
    <span className={`img-upload-wrap${compact ? " img-upload-wrap--compact" : ""}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="img-upload-input"
        onChange={handleChange}
        aria-label={label}
      />
      <button
        type="button"
        className={compact ? "md-toolbar-btn" : "btn-upload"}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        title={label}
      >
        {uploading ? (compact ? "…" : "Subiendo…") : (compact ? "📁" : `📁 ${label}`)}
      </button>
      {err && <span className="img-upload-err">{err}</span>}
    </span>
  );
}
