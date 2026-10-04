"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Turnstile from "@/components/Turnstile";
import { MENSAJE_DOMINIO_NO_PERMITIDO } from "@/lib/emailPolicy";

/** Avisos que llegan por ?error= desde /auth/callback. */
const AVISOS: Record<string, string> = {
  dominio: MENSAJE_DOMINIO_NO_PERMITIDO,
  confirm: "El enlace de confirmación ya no es válido. Pide uno nuevo registrándote otra vez.",
};

// useSearchParams obliga a un límite de Suspense, igual que en /register.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const aviso = AVISOS[searchParams.get("error") ?? ""] ?? "";
  // Mismo filtro que /register: solo rutas propias (contra open-redirect).
  const nextCrudo = searchParams.get("next");
  const nextSeguro = nextCrudo && nextCrudo.startsWith("/") && !nextCrudo.startsWith("//") ? nextCrudo : null;
  const vieneAPagar = nextSeguro === "/api/checkout";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    if (error) {
      setError("Email o contraseña incorrectos");
      // El token de captcha es de un solo uso: se regenera para el reintento.
      setCaptchaToken("");
      setCaptchaKey((k) => k + 1);
      setLoading(false);
      return;
    }

    // Only redirect to paths on the same origin to prevent open-redirect attacks.
    // Backslash and encoded variants bypass simple startsWith checks, so we use
    // URL() which normalises everything before comparing origins.
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

    // Una ruta de API (el checkout) redirige fuera, a Stripe: eso solo lo
    // sigue una navegación completa, no la del router de Next.
    if (target.startsWith("/api/")) {
      window.location.assign(target);
      return;
    }

    router.push(target);
    router.refresh();
  }

  async function handleGoogle() {
    const nextParam = new URLSearchParams(window.location.search).get("next");
    let callbackUrl = `${location.origin}/auth/callback`;
    if (nextParam) {
      try {
        const url = new URL(nextParam, window.location.origin);
        if (url.origin === window.location.origin) {
          callbackUrl += `?next=${encodeURIComponent(url.pathname + url.search + url.hash)}`;
        }
      } catch { /* malformed URL → keep default */ }
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  return (
    <div className="auth-page">
      <div className="bg-ambient" />

      <div className="auth-card">
        <Link href="/" className="auth-brand" style={{ textDecoration: "none" }}>
          adelin<span>btc</span>
        </Link>
        <p className="auth-subtitle">
          {vieneAPagar ? "Inicia sesión y pasas directo al pago" : "Accede a tu academia"}
        </p>

        {/* Sale de /auth/callback: cuenta de Google fuera de política o enlace
            de confirmación caducado. Antes se redirigía con ?error= y no se
            mostraba en ninguna parte. */}
        {aviso && !error && <p className="auth-error">{aviso}</p>}

        <form onSubmit={handleLogin} className="auth-form">
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

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label htmlFor="password">Contraseña</label>
              <Link href="/forgot-password" className="auth-forgot-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="field-pw-wrap">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button type="button" className="field-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <Turnstile
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken("")}
            resetKey={captchaKey}
          />

          <button type="submit" className="btn-primary" disabled={loading || !captchaToken}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="auth-divider">
          <span>o continúa con</span>
        </div>

        <button onClick={handleGoogle} className="btn-google">
          <GoogleIcon />
          Google
        </button>

        <p className="auth-footer">
          ¿No tienes cuenta?{" "}
          {/* Conserva el destino: quien venía a pagar y cambia a registro no
              debe acabar en el dashboard. */}
          <Link href={nextSeguro ? `/register?next=${encodeURIComponent(nextSeguro)}` : "/register"}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
