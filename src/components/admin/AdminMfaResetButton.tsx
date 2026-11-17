"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

/**
 * La verificación en dos pasos de un usuario, en la tabla de /admin. Pulsarla
 * pide confirmación y la quita: el usuario podrá entrar solo con contraseña.
 * La confirmación va en coral, porque deja la cuenta menos protegida. Quitarla
 * suena `interruptor`; si el servidor no la quita, `error`, y se avisa.
 */
export default function AdminMfaResetButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fallo, setFallo] = useState(false);
  const router = useRouter();

  async function handleReset() {
    setLoading(true);
    setFallo(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}/mfa`, { method: "DELETE" });
      if (!res.ok) throw new Error(String(res.status));
      sonar("interruptor");
      setConfirming(false);
      router.refresh();
    } catch {
      sonar("error");
      setFallo(true);
    }
    setLoading(false);
  }

  if (confirming) {
    return (
      <span className="admin-mfa-confirm">
        <Tecla color="coral" tamano="peq" onClick={handleReset} disabled={loading}>
          {loading ? "Quitando…" : "Quitar 2FA"}
        </Tecla>
        <Tecla color="blanca" tamano="peq" onClick={() => { setConfirming(false); setFallo(false); }} disabled={loading}>
          Cancelar
        </Tecla>
        {fallo && <span className="admin-fallo" role="alert">No se pudo quitar</span>}
      </span>
    );
  }

  return (
    <Tecla
      color="menta"
      tamano="peq"
      onClick={() => setConfirming(true)}
      title="Resetear 2FA — el usuario podrá entrar solo con contraseña"
    >
      <ShieldOff size={14} aria-hidden="true" /> Activo
    </Tecla>
  );
}
