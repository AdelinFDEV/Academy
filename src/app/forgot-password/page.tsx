"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setError("");

    // redirectTo points to /auth/callback with type=recovery explicit.
    // Supabase appends &code=... so the callback receives both params.
    // The URL must also be in the Supabase "Redirect URLs" allowlist or
    // Supabase will ignore it and redirect to the Site URL (home page).
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    });

    setLoading(false);
    if (error) {
      setError("No se pudo enviar el email. Verifica que la dirección sea correcta.");
      return;
    }
    setSent(true);

    // 60-second cooldown to prevent email spam
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div className="auth-page">
      <div className="bg-ambient" />
      <div className="auth-card">
        <Link href="/" className="auth-brand" style={{ textDecoration: "none" }}>
          adelin<span>btc</span>
        </Link>
        <p className="auth-subtitle">Recupera tu contraseña</p>

        {sent ? (
          <div className="auth-success">
            <p>
              Revisa tu bandeja de entrada. Te hemos enviado un enlace para
              restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="btn-primary"
              style={{ marginTop: "16px", display: "block", textAlign: "center" }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading || cooldown > 0}>
              {loading ? "Enviando..." : cooldown > 0 ? `Reenviar en ${cooldown}s` : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link href="/login">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
