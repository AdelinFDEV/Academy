"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ShieldOff, X, Check, Loader2 } from "lucide-react";

type Status = "loading" | "off" | "on" | "enrolling";

export default function TwoFactorSettings() {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  async function refreshStatus() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) { setStatus("off"); return; }
    const verified = data.totp[0];
    if (verified) {
      setFactorId(verified.id);
      setStatus("on");
    } else {
      setStatus("off");
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setError("");
    setBusy(true);

    // Limpia factores sin verificar que hayan quedado de intentos anteriores
    // (p.ej. si se cerró la página a medio proceso) — si no, Supabase rechaza
    // el enroll nuevo por nombre duplicado.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const leftover = existing?.all.filter((f) => f.factor_type === "totp" && f.status === "unverified") ?? [];
    for (const f of leftover) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `totp-${Date.now()}`,
      issuer: "AdelinBTC Academy",
    });
    setBusy(false);
    if (error || !data) {
      console.error("[2FA enroll] error:", error);
      setError(error?.message ? `No se pudo iniciar la activación: ${error.message}` : "No se pudo iniciar la activación. Inténtalo de nuevo.");
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setCode("");
    setStatus("enrolling");
  }

  async function cancelEnroll() {
    if (factorId) {
      await supabase.auth.mfa.unenroll({ factorId });
    }
    setFactorId(null);
    setQrCode("");
    setSecret("");
    setCode("");
    setError("");
    setStatus("off");
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length < 6) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (error) {
      setError("Código incorrecto. Comprueba tu app de autenticación e inténtalo de nuevo.");
      setCode("");
      return;
    }
    setQrCode("");
    setSecret("");
    setCode("");
    setStatus("on");
  }

  async function disable2FA() {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    setShowDisableConfirm(false);
    if (error) {
      setError("No se pudo desactivar. Inténtalo de nuevo.");
      return;
    }
    setFactorId(null);
    setStatus("off");
  }

  if (status === "loading") {
    return (
      <div className="cuenta-2fa-loading">
        <Loader2 size={16} className="cuenta-2fa-spin" /> Comprobando…
      </div>
    );
  }

  if (status === "on") {
    return (
      <div className="cuenta-2fa">
        <div className="cuenta-2fa-status cuenta-2fa-status--on">
          <ShieldCheck size={16} />
          <span>Verificación en dos pasos activada</span>
        </div>
        <p className="cuenta-2fa-hint">
          Cada vez que inicies sesión te pediremos un código de tu app de autenticación.
        </p>

        {!showDisableConfirm ? (
          <button className="cuenta-2fa-btn-disable" onClick={() => setShowDisableConfirm(true)}>
            <ShieldOff size={14} /> Desactivar
          </button>
        ) : (
          <div className="cuenta-2fa-confirm">
            <p>¿Seguro? Tu cuenta quedará protegida solo con la contraseña.</p>
            <div className="cuenta-2fa-confirm-actions">
              <button className="cuenta-2fa-btn-disable" onClick={disable2FA} disabled={busy}>
                {busy ? "Desactivando..." : "Sí, desactivar"}
              </button>
              <button className="cuenta-2fa-btn-cancel" onClick={() => setShowDisableConfirm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {error && <p className="auth-error">{error}</p>}
      </div>
    );
  }

  if (status === "enrolling") {
    return (
      <div className="cuenta-2fa">
        <p className="cuenta-2fa-step-title">1. Escanea este código con tu app de autenticación</p>
        <div className="cuenta-2fa-qr">
          {/* data.totp.qr_code ya es un data: URI completo y listo para usar
              como src — así lo documenta Supabase, sin envolverlo de más. */}
          <img src={qrCode} alt="Código QR para activar la verificación en dos pasos" />
        </div>

        <p className="cuenta-2fa-step-title">¿No puedes escanear? Introduce esta clave manualmente:</p>
        <code className="cuenta-2fa-secret">{secret}</code>

        <p className="cuenta-2fa-step-title">2. Introduce el código de 6 dígitos que te muestra la app</p>
        <form onSubmit={confirmEnroll} className="cuenta-2fa-verify-form">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="mfa-challenge-input"
            required
          />
          <button type="submit" className="btn-primary" disabled={busy || code.length < 6}>
            {busy ? "Verificando..." : <><Check size={15} /> Activar</>}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}

        <button className="cuenta-2fa-btn-cancel" onClick={cancelEnroll}>
          <X size={14} /> Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="cuenta-2fa">
      <div className="cuenta-2fa-status">
        <ShieldOff size={16} />
        <span>Verificación en dos pasos desactivada</span>
      </div>
      <p className="cuenta-2fa-hint">
        Añade una capa extra de seguridad: además de tu contraseña, pedirá un código
        de una app como Google Authenticator al iniciar sesión.
      </p>
      <button className="cuenta-btn-manage" onClick={startEnroll} disabled={busy}>
        <ShieldCheck size={15} />
        {busy ? "Cargando..." : "Activar verificación en dos pasos"}
      </button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}
