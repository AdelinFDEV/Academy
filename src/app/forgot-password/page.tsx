"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Turnstile from "@/components/Turnstile";
import Tecla from "@/components/cuaderno/Tecla";
import AccesoShell, { type Apunte } from "@/components/acceso/AccesoShell";
import { Aviso, Campo, useSonidoDeError } from "@/components/acceso/Campos";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  useSonidoDeError(error);

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
      captchaToken,
    });

    setLoading(false);
    // El token de captcha es de un solo uso: se regenera tras cada intento.
    setCaptchaToken("");
    setCaptchaKey((k) => k + 1);
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
    <AccesoShell
      nota="Le pasa a cualquiera"
      titulo={<>Recupera tu <span className="fluor">contraseña</span></>}
      lead={sent ? undefined : "Escribe tu correo y te enviamos un enlace para elegir una nueva."}
      apunte={APUNTE}
    >
      {sent ? (
        <>
          <Aviso tipo="ok" titulo="Enlace enviado">
            Revisa tu bandeja de entrada. Te hemos enviado un enlace para restablecer tu contraseña.
          </Aviso>
          <Tecla href="/login" tamano="grande" ancho>
            Volver al inicio de sesión
          </Tecla>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="acc-form">
          <Campo
            id="email"
            name="email"
            etiqueta="Tu correo"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />

          {error && (
            <Aviso tipo="error" titulo="No se ha enviado">
              {error}
            </Aviso>
          )}

          <Turnstile
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken("")}
            resetKey={captchaKey}
          />

          <Tecla type="submit" tamano="grande" ancho disabled={loading || cooldown > 0 || !captchaToken}>
            {loading ? "Enviando…" : cooldown > 0 ? `Reenviar en ${cooldown}s` : "Enviar enlace de recuperación"}
          </Tecla>
        </form>
      )}

      {!sent && (
        <p className="acc-pie">
          <Link href="/login">← Volver al inicio de sesión</Link>
        </p>
      )}
    </AccesoShell>
  );
}

/** El apunte de la derecha: cómo no volver a olvidarla. */
const APUNTE: Apunte = {
  tema: "Truco",
  pregunta: "¿Cómo no volver a olvidarla?",
  respuesta: "Un gestor",
  detalle: "Un gestor de contraseñas las recuerda por ti, y las crea largas y distintas para cada web.",
  color: "naranja",
  postit: "Sin agobios",
  nota: "Si no lo ves, mira en la carpeta de spam",
};
