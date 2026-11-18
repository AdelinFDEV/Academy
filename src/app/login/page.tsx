"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Turnstile from "@/components/Turnstile";
import Tecla from "@/components/cuaderno/Tecla";
import AccesoShell from "@/components/acceso/AccesoShell";
import { Aviso, Campo, CampoClave, GoogleIcon, Separador, useSonidoDeError } from "@/components/acceso/Campos";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  useSonidoDeError(error);

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
    <AccesoShell
      nota="Hola de nuevo"
      // El candado escribe su contraseña, la llave no mira y el escudo para a
      // la lupa cotilla (18-11-2026). Solo en el ordenador.
      ilustracion="/cuaderno/login-pegatina.webp"
      titulo={
        vieneAPagar ? (
          <>Inicia sesión y pasas <span className="fluor">directo al pago</span></>
        ) : (
          <>Accede a tu <span className="fluor">academia</span></>
        )
      }
     
    >
      {/* Sale de /auth/callback: cuenta de Google fuera de política o enlace
          de confirmación caducado. Antes se redirigía con ?error= y no se
          mostraba en ninguna parte. */}
      {aviso && !error && (
        <Aviso tipo="error" titulo="No se pudo completar">
          {aviso}
        </Aviso>
      )}

      <form onSubmit={handleLogin} className="acc-form">
        <Campo
          id="email"
          name="email"
          etiqueta="Tu correo"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />

        <CampoClave
          id="password"
          name="password"
          etiqueta="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tu contraseña"
          required
          extra={
            <Link href="/forgot-password" className="acc-olvido">
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />

        {error && (
          <Aviso tipo="error" titulo="No has podido entrar">
            {error}
          </Aviso>
        )}

        <Turnstile
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken("")}
          resetKey={captchaKey}
        />

        <Tecla type="submit" tamano="grande" ancho disabled={loading || !captchaToken}>
          {loading ? "Entrando…" : "Iniciar sesión"}
        </Tecla>
      </form>

      <Separador>o continúa con</Separador>

      <Tecla color="blanca" ancho onClick={handleGoogle}>
        <GoogleIcon />
        Continuar con Google
      </Tecla>

      <p className="acc-pie">
        ¿No tienes cuenta?{" "}
        {/* Conserva el destino: quien venía a pagar y cambia a registro no
            debe acabar en el dashboard. */}
        <Link href={nextSeguro ? `/register?next=${encodeURIComponent(nextSeguro)}` : "/register"}>Regístrate</Link>
      </p>
    </AccesoShell>
  );
}

