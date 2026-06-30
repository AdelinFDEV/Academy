"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Lock, Gem, ArrowRight, Sparkles, UserPlus } from "lucide-react";

export type ToolModalReason = "login" | "premium";

interface ToolAccessModalProps {
  open: boolean;
  reason: ToolModalReason;
  toolName: string;
  onClose: () => void;
}

export default function ToolAccessModal({ open, reason, toolName, onClose }: ToolAccessModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const isLogin = reason === "login";

  return (
    <div
      className="tool-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={isLogin ? "Acceso requerido" : "Plan Premium requerido"}
    >
      <div className="tool-modal" ref={dialogRef}>
        {/* Close button */}
        <button className="tool-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {/* Icon */}
        <div className={`tool-modal-icon-wrap ${isLogin ? "tool-modal-icon-wrap--login" : "tool-modal-icon-wrap--premium"}`}>
          {isLogin ? <Lock size={28} strokeWidth={1.8} /> : <Gem size={28} strokeWidth={1.8} />}
        </div>

        {/* Content */}
        <div className="tool-modal-content">
          <h2 className="tool-modal-title">
            {isLogin ? "Crea tu cuenta gratis" : "Hazte Premium"}
          </h2>
          <p className="tool-modal-tool-name">{toolName}</p>
          <p className="tool-modal-desc">
            {isLogin
              ? "Regístrate gratis en segundos y accede a esta herramienta y a todo el contenido de la academia."
              : "Esta herramienta está disponible para miembros Premium. Desbloquea el acceso completo con análisis avanzados, herramientas exclusivas y guías premium."}
          </p>

          {/* Features */}
          <ul className="tool-modal-features">
            {isLogin ? (
              <>
                <li><Sparkles size={14} /> Acceso a herramientas gratuitas</li>
                <li><Sparkles size={14} /> Artículos y análisis de mercado</li>
                <li><Sparkles size={14} /> Sin tarjeta de crédito</li>
              </>
            ) : (
              <>
                <li><Sparkles size={14} /> Todas las herramientas desbloqueadas</li>
                <li><Sparkles size={14} /> Diario de trading + Portfolio Spot</li>
                <li><Sparkles size={14} /> Guías premium y análisis avanzados</li>
              </>
            )}
          </ul>

          {/* CTAs */}
          <div className="tool-modal-actions">
            {isLogin ? (
              <>
                <Link href="/register" className="tool-modal-btn-primary" onClick={onClose}>
                  <UserPlus size={16} />
                  Crear cuenta gratis
                  <ArrowRight size={16} className="tool-modal-btn-arrow" />
                </Link>
                <Link href="/login" className="tool-modal-btn-secondary" onClick={onClose}>
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </>
            ) : (
              <>
                <Link href="/premium" className="tool-modal-btn-premium" onClick={onClose}>
                  <Gem size={16} />
                  Ver planes Premium
                  <ArrowRight size={16} className="tool-modal-btn-arrow" />
                </Link>
                <button className="tool-modal-btn-secondary" onClick={onClose}>
                  Ahora no
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
