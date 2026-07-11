"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";

export default function AdminMfaResetButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}/mfa`, { method: "DELETE" });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="admin-mfa-confirm">
        <button className="admin-mfa-confirm-yes" onClick={handleReset} disabled={loading}>
          {loading ? "..." : "Confirmar"}
        </button>
        <button className="admin-mfa-confirm-no" onClick={() => setConfirming(false)} disabled={loading}>
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      className="admin-mfa-reset-btn"
      onClick={() => setConfirming(true)}
      title="Resetear 2FA — el usuario podrá entrar solo con contraseña"
    >
      <ShieldOff size={13} /> Activo
    </button>
  );
}
