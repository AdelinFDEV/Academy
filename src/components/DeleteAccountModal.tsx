"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, AlertTriangle, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
}

const CONFIRM_WORD = "ELIMINAR";

export default function DeleteAccountModal({ open, onClose, isPremium }: Props) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmText(""); setError(""); setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, loading]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleDelete() {
    if (confirmText !== CONFIRM_WORD || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "No se pudo eliminar la cuenta. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      // Cierre defensivo también en el cliente, por si la cookie tarda en
      // invalidarse tras el signOut del servidor.
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});

      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="tool-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Eliminar cuenta"
    >
      <div className="tool-modal" style={{ maxWidth: 440 }}>
        <button className="tool-modal-close" onClick={onClose} disabled={loading} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="tool-modal-icon-wrap tool-modal-icon-wrap--danger">
          <AlertTriangle size={26} strokeWidth={1.8} />
        </div>

        <div className="tool-modal-content">
          <h2 className="tool-modal-title">Eliminar cuenta</h2>
          <p className="tool-modal-desc">
            Esta acción es <strong>irreversible</strong>. Se eliminarán permanentemente:
          </p>

          <ul className="danger-warning-list">
            <li>Tu perfil, progreso, insignias y racha</li>
            <li>Diario de trading, watchlist y portfolio</li>
            <li>Comentarios, me gustas y términos guardados</li>
            {isPremium && <li><strong>Tu suscripción Premium, cancelada al instante</strong></li>}
          </ul>

          <div className="danger-confirm-field">
            <label htmlFor="delete-confirm">
              Escribe <strong>{CONFIRM_WORD}</strong> para confirmar
            </label>
            <input
              id="delete-confirm"
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="tool-modal-actions">
            <button
              className="tool-modal-btn-danger"
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || loading}
            >
              <Trash2 size={16} />
              {loading ? "Eliminando..." : "Eliminar mi cuenta para siempre"}
            </button>
            <button className="tool-modal-btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
