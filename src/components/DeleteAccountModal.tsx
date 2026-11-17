"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { useEnviarALaVista } from "@/components/acceso/EnviarALaVista";
import { bloquearScroll } from "@/components/trading/useVentanaMovil";
import { sonar } from "@/lib/sonidos";

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
  useEnviarALaVista();

  // Suena `abrir` al abrirse y `cerrar` cuando la persona lo cierra.
  const cerrar = useCallback(() => {
    sonar("cerrar");
    onClose();
  }, [onClose]);

  // Quien lo usa lo monta solo mientras está abierto: cada vez empieza de
  // cero, sin tener que vaciar el estado a mano.
  useEffect(() => {
    if (!open) return;
    sonar("abrir");
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) cerrar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, cerrar, loading]);

  // En <html> y en <body>: con solo <body>, la página de detrás seguía
  // corriendo en el móvil (globals.css pone overflow-x en <html>).
  useEffect(() => {
    if (!open) return;
    return bloquearScroll();
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
        sonar("error");
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
      sonar("error");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="tool-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) cerrar(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Eliminar cuenta"
    >
      <div className="tool-modal" style={{ maxWidth: 440 }}>
        <Tecla color="blanca" tamano="peq" icono className="tool-modal-close" onClick={cerrar} disabled={loading} aria-label="Cerrar">
          <X size={18} aria-hidden="true" />
        </Tecla>

        <div className="tool-modal-icon-wrap tool-modal-icon-wrap--danger">
          <AlertTriangle size={26} strokeWidth={1.8} aria-hidden="true" />
        </div>

        <div className="tool-modal-content">
          <h2 className="tool-modal-title">Eliminar cuenta</h2>
          <p className="tool-modal-desc">
            Esta acción es <strong>irreversible</strong>. Se eliminarán permanentemente:
          </p>

          <ul className="danger-warning-list">
            <li>Tu perfil, progreso, insignias y racha</li>
            <li>Diario de trading</li>
            <li>Me gustas y términos guardados</li>
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
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <div className="tool-modal-actions">
            <Tecla
              color="coral"
              ancho
              data-enviar
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || loading}
            >
              <Trash2 size={16} aria-hidden="true" />
              {loading ? "Eliminando…" : "Eliminar mi cuenta para siempre"}
            </Tecla>
            <Tecla color="blanca" ancho onClick={cerrar} disabled={loading}>
              Cancelar
            </Tecla>
          </div>
        </div>
      </div>
    </div>
  );
}
