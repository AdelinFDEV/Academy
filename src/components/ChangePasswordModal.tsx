"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Eye, EyeOff, KeyRound, Check } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { useEnviarALaVista } from "@/components/acceso/EnviarALaVista";
import { bloquearScroll } from "@/components/trading/useVentanaMovil";
import { sonar } from "@/lib/sonidos";
import { passwordChecks, passwordValid } from "@/lib/passwordRules";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Cambiar la contraseña desde «Mi perfil». Pide lo mismo que el registro y la
 * página de contraseña nueva (`@/lib/passwordRules`, la política de Supabase
 * Auth): la lista se va marcando mientras se escribe, en vez de un error
 * genérico al enviar. Suena `abrir` al abrirse, `cerrar` al cerrarlo la
 * persona, `guardado` al cambiarla y `error` si no se puede.
 */
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
  useEnviarALaVista();

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
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, cerrar]);

  // En <html> y en <body>: con solo <body>, la página de detrás seguía
  // corriendo en el móvil (globals.css pone overflow-x en <html>).
  useEffect(() => {
    if (!open) return;
    return bloquearScroll();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!passwordValid(password)) { setError("La contraseña no cumple todos los requisitos de la lista."); sonar("error"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); sonar("error"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError("No se pudo actualizar. Inténtalo de nuevo.");
      sonar("error");
      return;
    }
    await supabase.auth.signOut({ scope: "others" });
    setLoading(false);
    setDone(true);
    sonar("guardado");
    setTimeout(onClose, 2200);
  }

  if (!open) return null;

  return (
    <div
      className="tool-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Cambiar contraseña"
    >
      <div className="tool-modal" style={{ maxWidth: 420 }}>
        <Tecla color="blanca" tamano="peq" icono className="tool-modal-close" onClick={cerrar} aria-label="Cerrar">
          <X size={18} aria-hidden="true" />
        </Tecla>

        <div className="tool-modal-icon-wrap tool-modal-icon-wrap--login">
          <KeyRound size={26} strokeWidth={1.8} aria-hidden="true" />
        </div>

        <div className="tool-modal-content">
          {done ? (
            <div className="modal-hecho" role="status">
              <span className="modal-hecho-marca" aria-hidden="true">
                <Check size={30} strokeWidth={3} />
              </span>
              <p className="modal-hecho-titulo">Contraseña actualizada</p>
              <p className="modal-hecho-texto">Las demás sesiones han sido cerradas por seguridad.</p>
            </div>
          ) : (
            <>
              <h2 className="tool-modal-title">Cambiar contraseña</h2>
              <p className="tool-modal-desc">Elige una contraseña nueva. Por seguridad, se cerrarán tus otras sesiones abiertas.</p>

              <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: "0.75rem" }}>
                <div className="field">
                  <label htmlFor="cp-password">Nueva contraseña</label>
                  <div className="mp-clave">
                    <input
                      id="cp-password"
                      ref={inputRef}
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-describedby="cp-requisitos"
                      required
                    />
                    <Tecla color="blanca" icono aria-label="Mostrar la contraseña" aria-pressed={showPw} aria-controls="cp-password" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </Tecla>
                  </div>
                </div>

                <div className="mp-req">
                  <p id="cp-requisitos-titulo" className="mp-req-titulo">Tu contraseña necesita</p>
                  <ul id="cp-requisitos" aria-labelledby="cp-requisitos-titulo">
                    {passwordChecks(password).map((req) => (
                      <li key={req.label} className={req.ok ? "is-ok" : undefined}>
                        <span className="mp-req-caja" aria-hidden="true"><Check size={12} strokeWidth={3.5} /></span>
                        {req.label}
                        <span className="sr-only">{req.ok ? ": cumplido" : ": pendiente"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="field">
                  <label htmlFor="cp-confirm">Repite la contraseña</label>
                  <div className="mp-clave">
                    <input
                      id="cp-confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                    <Tecla color="blanca" icono aria-label="Mostrar la contraseña repetida" aria-pressed={showConfirm} aria-controls="cp-confirm" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </Tecla>
                  </div>
                </div>

                {error && <p className="auth-error" role="alert">{error}</p>}

                <Tecla type="submit" ancho disabled={loading}>
                  {loading ? "Guardando…" : "Guardar contraseña"}
                </Tecla>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
