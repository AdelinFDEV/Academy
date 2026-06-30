"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      return;
    }

    // Invalidate all other active sessions so a potential attacker loses access.
    await supabase.auth.signOut({ scope: "others" });
    setLoading(false);
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  return (
    <div className="auth-page">
      <div className="bg-ambient" />
      <div className="auth-card">
        <Link href="/" className="auth-brand" style={{ textDecoration: "none" }}>
          adelin<span>btc</span>
        </Link>

        {done ? (
          <>
            <p className="auth-subtitle">Contraseña actualizada</p>
            <div className="auth-success">
              <p>Tu contraseña se ha guardado correctamente. Redirigiendo...</p>
            </div>
          </>
        ) : error && !ready ? (
          <>
            <p className="auth-subtitle">Enlace inválido</p>
            <div className="auth-success">
              <p>{error}</p>
              <Link
                href="/forgot-password"
                className="btn-primary"
                style={{ marginTop: "16px", display: "block", textAlign: "center" }}
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          </>
        ) : !ready ? (
          <p className="auth-subtitle">Verificando enlace...</p>
        ) : (
          <>
            <p className="auth-subtitle">Elige una nueva contraseña</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field">
                <label htmlFor="password">Nueva contraseña</label>
                <div className="field-pw-wrap">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button type="button" className="field-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? "Ocultar" : "Mostrar"}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirmar contraseña</label>
                <div className="field-pw-wrap">
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                  />
                  <button type="button" className="field-pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? "Ocultar" : "Mostrar"}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
