"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Eye, EyeOff, KeyRound, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPassword(""); setConfirm(""); setError(""); setDone(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError("No se pudo actualizar. Inténtalo de nuevo.");
      return;
    }
    await supabase.auth.signOut({ scope: "others" });
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 2200);
  }

  if (!open) return null;

  return (
    <div
      className="tool-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Cambiar contraseña"
    >
      <div className="tool-modal" style={{ maxWidth: 420 }}>
        <button className="tool-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="tool-modal-icon-wrap tool-modal-icon-wrap--login">
          <KeyRound size={26} strokeWidth={1.8} />
        </div>

        <div className="tool-modal-content">
          {done ? (
            <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
              <div style={{ color: "var(--accent-orange)", marginBottom: "0.75rem" }}>
                <Check size={32} strokeWidth={2} />
              </div>
              <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.35rem" }}>
                Contraseña actualizada
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Las demás sesiones han sido cerradas por seguridad.
              </p>
            </div>
          ) : (
            <>
              <h2 className="tool-modal-title">Cambiar contraseña</h2>
              <p className="tool-modal-desc">Elige una contraseña nueva. Las demás sesiones activas se cerrarán automáticamente.</p>

              <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: "0.75rem" }}>
                <div className="field">
                  <label htmlFor="cp-password">Nueva contraseña</label>
                  <div className="field-pw-wrap">
                    <input
                      id="cp-password"
                      ref={inputRef}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button type="button" className="field-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? "Ocultar" : "Mostrar"}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="cp-confirm">Confirmar contraseña</label>
                  <div className="field-pw-wrap">
                    <input
                      id="cp-confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                    />
                    <button type="button" className="field-pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? "Ocultar" : "Mostrar"}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
