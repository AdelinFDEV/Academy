"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ShieldOff, X, Check, Loader2 } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

type Status = "loading" | "off" | "on" | "enrolling";

/**
 * El asistente de la verificación en dos pasos de «Mi perfil». Activarla o
 * desactivarla suena como un interruptor (`interruptor`); un código mal o un
 * fallo, `error`.
 *
 * `onCambio` avisa a quien la contiene cuando se activa o se desactiva, para
 * que refresque lo que dependa de ello (en «Mi perfil», el aviso destacado).
 */
export default function TwoFactorSettings({ onCambio }: { onCambio?: () => void } = {}) {
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
    // Diferido un tick: el estado se escribe cuando responde Supabase, no en
    // el cuerpo del efecto (regla react-hooks/set-state-in-effect).
    const t = window.setTimeout(() => { void refreshStatus(); }, 0);
    return () => window.clearTimeout(t);
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
      sonar("error");
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
      sonar("error");
      return;
    }
    sonar("interruptor");
    setQrCode("");
    setSecret("");
    setCode("");
    setStatus("on");
    onCambio?.();
  }

  async function disable2FA() {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    setShowDisableConfirm(false);
    if (error) {
      setError("No se pudo desactivar. Inténtalo de nuevo.");
      sonar("error");
      return;
    }
    sonar("interruptor");
    setFactorId(null);
    setStatus("off");
    onCambio?.();
  }

  if (status === "loading") {
    return (
      <div className="cuenta-2fa-loading" role="status">
        <Loader2 size={16} className="cuenta-2fa-spin" aria-hidden="true" /> Comprobando…
      </div>
    );
  }

  if (status === "on") {
    return (
      <div className="cuenta-2fa">
        <div className="cuenta-2fa-status cuenta-2fa-status--on">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Verificación en dos pasos activada</span>
        </div>
        <p className="cuenta-2fa-hint">
          Cada vez que inicies sesión te pediremos un código de tu app de autenticación.
        </p>

        {!showDisableConfirm ? (
          <Tecla color="blanca" tamano="peq" onClick={() => setShowDisableConfirm(true)}>
            <ShieldOff size={14} aria-hidden="true" /> Desactivar
          </Tecla>
        ) : (
          <div className="cuenta-2fa-confirm">
            <p>¿Seguro? Tu cuenta quedará protegida solo con la contraseña.</p>
            <div className="cuenta-2fa-confirm-actions">
              <Tecla color="coral" tamano="peq" onClick={disable2FA} disabled={busy}>
                {busy ? "Desactivando…" : "Sí, desactivar"}
              </Tecla>
              <Tecla color="blanca" tamano="peq" onClick={() => setShowDisableConfirm(false)}>
                Cancelar
              </Tecla>
            </div>
          </div>
        )}
        {error && <p className="pn-error" role="alert">{error}</p>}
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
          {/* eslint-disable-next-line @next/next/no-img-element -- un data: URI generado al momento: no hay nada que optimizar */}
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
            className="cuenta-2fa-codigo"
            aria-label="Código de 6 dígitos"
            required
          />
          <Tecla type="submit" color="menta" disabled={busy || code.length < 6}>
            {busy ? "Verificando…" : <><Check size={15} aria-hidden="true" /> Activar</>}
          </Tecla>
        </form>
        {error && <p className="pn-error" role="alert">{error}</p>}

        <Tecla color="blanca" tamano="peq" onClick={cancelEnroll}>
          <X size={14} aria-hidden="true" /> Cancelar
        </Tecla>
      </div>
    );
  }

  return (
    <div className="cuenta-2fa">
      <div className="cuenta-2fa-status">
        <ShieldOff size={16} aria-hidden="true" />
        <span>Verificación en dos pasos desactivada</span>
      </div>
      <p className="cuenta-2fa-hint">
        Añade una capa extra de seguridad: además de tu contraseña, pedirá un código
        de una app como Google Authenticator al iniciar sesión.
      </p>
      <Tecla color="amarillo" onClick={startEnroll} disabled={busy}>
        <ShieldCheck size={15} aria-hidden="true" />
        {busy ? "Preparando…" : "Activar verificación en dos pasos"}
      </Tecla>
      {error && <p className="pn-error" role="alert">{error}</p>}
    </div>
  );
}
