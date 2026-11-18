"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { passwordChecks } from "@/lib/passwordRules";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import AccesoShell from "@/components/acceso/AccesoShell";
import { Aviso, CampoClave, RequisitosClave } from "@/components/acceso/Campos";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let expired = false;

    // /auth/callback already exchanged the PKCE code and set a recovery session
    // before redirecting here. Check immediately for that session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (expired) return;
      if (session) { setReady(true); return; }
    });

    // Fallback: also listen for PASSWORD_RECOVERY (hash-based / implicit flow).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // If no session arrives within 10 seconds, the link is expired or invalid.
    const timeout = setTimeout(() => {
      expired = true;
      setError("El enlace ha expirado o ya fue usado. Solicita uno nuevo.");
    }, 10000);

    return () => {
      expired = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordChecks(password).every((c) => c.ok)) {
      setError("La contraseña no cumple todos los requisitos indicados abajo.");
      sonar("error");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      sonar("error");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      const msg = error.message || "";
      setError(
        /password/i.test(msg) && /(should contain|at least|character)/i.test(msg)
          ? "La contraseña no cumple todos los requisitos indicados abajo."
          : "No se pudo actualizar la contraseña. El enlace puede haber expirado."
      );
      sonar("error");
      return;
    }

    // Invalidate all other active sessions so a potential attacker loses access.
    await supabase.auth.signOut({ scope: "others" });
    setLoading(false);
    setDone(true);
    sonar("guardado");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  const titulo = done ? (
    <>Contraseña <span className="fluor">actualizada</span></>
  ) : error && !ready ? (
    "Enlace inválido"
  ) : !ready ? (
    "Verificando enlace…"
  ) : (
    <>Elige una <span className="fluor">nueva contraseña</span></>
  );

  return (
    <AccesoShell nota="Contraseña nueva" titulo={titulo}>
      {done ? (
        <Aviso tipo="ok" titulo="Guardada">
          Tu contraseña se ha guardado correctamente. Redirigiendo...
        </Aviso>
      ) : error && !ready ? (
        <>
          <Aviso tipo="error" titulo="No podemos usar este enlace">
            {error}
          </Aviso>
          <Tecla href="/forgot-password" tamano="grande" ancho>
            Solicitar nuevo enlace
          </Tecla>
        </>
      ) : !ready ? (
        <p className="acc-cargando" role="status">
          Un segundo, estamos comprobando tu enlace…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="acc-form">
          <CampoClave
            id="password"
            name="new-password"
            etiqueta="Nueva contraseña"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            describe="requisitos-clave"
            required
          />
          <CampoClave
            id="confirm"
            name="confirm-password"
            etiqueta="Confirmar contraseña"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            required
          />

          <RequisitosClave id="requisitos-clave" password={password} />

          {error && (
            <Aviso tipo="error" titulo="No se ha guardado">
              {error}
            </Aviso>
          )}

          <Tecla type="submit" tamano="grande" ancho disabled={loading}>
            {loading ? "Guardando…" : "Guardar nueva contraseña"}
          </Tecla>
        </form>
      )}
    </AccesoShell>
  );
}

