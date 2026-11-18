"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import LogoutButton from "@/components/LogoutButton";
import { sonar } from "@/lib/sonidos";
import AccesoShell from "@/components/acceso/AccesoShell";
import { Aviso, Campo } from "@/components/acceso/Campos";

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
      sonar("error");
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
    // 2FA sigue pendiente y rebotaría aquí → página colgada en «Verificando…».
    // `location.replace` fuerza una carga nueva con las cookies AAL2 ya puestas
    // y, además, no deja /mfa-challenge en el historial (el botón atrás no vuelve).
    window.location.replace(target);
  }

  return (
    <AccesoShell
      nota="Último paso"
      titulo={<>Verificación en <span className="fluor">dos pasos</span></>}
      lead="Introduce el código de 6 dígitos de tu app de autenticación (Google Authenticator o similar)."
      icono={<ShieldCheck size={28} strokeWidth={2.2} />}
     
    >
      {loading ? (
        <p className="acc-cargando" role="status">
          Cargando…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="acc-form">
          <Campo
            id="mfa-code"
            name="one-time-code"
            inputRef={inputRef}
            etiqueta="Código de verificación"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            claseInput="acc-codigo"
            aria-invalid={error ? true : undefined}
            required
          />

          {error && (
            <Aviso tipo="error" titulo="No se ha podido verificar">
              {error}
            </Aviso>
          )}

          <Tecla type="submit" tamano="grande" ancho disabled={verifying || code.length < 6}>
            {verifying ? "Verificando…" : "Verificar"}
          </Tecla>
        </form>
      )}

      {/* El mismo cierre de sesión que el resto de la web, vestido de tecla. */}
      <LogoutButton tecla={{ color: "blanca", tamano: "peq", ancho: true }}>
        Usar otra cuenta / cerrar sesión
      </LogoutButton>
    </AccesoShell>
  );
}

