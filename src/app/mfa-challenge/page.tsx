"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function MfaChallengePage() {
  const router = useRouter();
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      supabase.auth.mfa.listFactors().then(({ data, error }) => {
        if (error || !data) {
          setError("No se pudo cargar tu verificación en dos pasos. Vuelve a iniciar sesión.");
          setLoading(false);
          return;
        }
        const totp = data.totp[0];
        if (!totp) {
          // No hay factor verificado — no debería llegarse aquí, pero por si acaso
          // dejamos pasar en vez de bloquear al usuario sin salida.
          router.push("/dashboard");
          return;
        }
        setFactorId(totp.id);
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 80);
      });
    });
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length < 6) return;
    setVerifying(true);
    setError("");

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      setVerifying(false);
      setError("Código incorrecto. Comprueba tu app de autenticación e inténtalo de nuevo.");
      setCode("");
      return;
    }

    const nextParam = new URLSearchParams(window.location.search).get("next");
    let target = "/dashboard";
    if (nextParam) {
      try {
        const url = new URL(nextParam, window.location.origin);
        if (url.origin === window.location.origin) {
          target = url.pathname + url.search + url.hash;
        }
      } catch { /* malformed URL → keep default */ }
    }
    // Navegación DURA (no router.push): tras verificar el 2FA, el cliente de
    // Supabase acaba de escribir las cookies de la nueva sesión AAL2. Una
    // navegación blanda de Next dispara la petición al servidor antes de que
    // esas cookies se propaguen (sobre todo en Safari/iOS, que las escribe más
    // lento), así el middleware leería la cookie vieja (AAL1), creería que el
    // 2FA sigue pendiente y rebotaría aquí → página colgada en "Verificando...".
    // `location.replace` fuerza una carga nueva con las cookies AAL2 ya puestas
    // y, además, no deja /mfa-challenge en el historial (el botón atrás no vuelve).
    window.location.replace(target);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="auth-page">
      <div className="bg-ambient" />

      <div className="auth-card mfa-challenge-card">
        <Link href="/" className="auth-brand" style={{ textDecoration: "none" }}>
          adelin<span>btc</span>
        </Link>

        <div className="mfa-challenge-icon">
          <ShieldCheck size={26} strokeWidth={1.8} />
        </div>

        <p className="auth-subtitle">Verificación en dos pasos</p>
        <p className="mfa-challenge-desc">
          Introduce el código de 6 dígitos de tu app de autenticación (Google Authenticator o similar).
        </p>

        {loading ? (
          <p className="mfa-challenge-loading">Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="mfa-code">Código de verificación</label>
              <input
                id="mfa-code"
                ref={inputRef}
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
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={verifying || code.length < 6}>
              {verifying ? "Verificando..." : "Verificar"}
            </button>
          </form>
        )}

        <button onClick={handleLogout} className="mfa-challenge-logout">
          Usar otra cuenta / cerrar sesión
        </button>
      </div>
    </div>
  );
}
