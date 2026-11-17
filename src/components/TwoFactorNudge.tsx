"use client";

import { useState, useEffect } from "react";
import Tecla from "@/components/cuaderno/Tecla";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, X } from "lucide-react";

const DISMISS_KEY = "2fa_nudge_dismissed_at";
const SNOOZE_DAYS = 14;

export default function TwoFactorNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
          const elapsedDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
          if (elapsedDays < SNOOZE_DAYS) return;
        }
      } catch {
        // localStorage unavailable — sigue con la comprobación igualmente
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (cancelled || error || !data) return;
      if (data.totp.length === 0) setVisible(true);
    }

    check();
    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="pn-aviso tono-amarillo dash-2fa" role="status">
      <span className="pn-aviso-ic" aria-hidden="true"><ShieldAlert size={18} strokeWidth={2.4} /></span>
      <p className="pn-aviso-texto">
        <b>Protege tu cuenta</b>
        Tu cuenta no tiene verificación en dos pasos. Actívala para protegerla mejor.
      </p>
      <span className="dash-2fa-acciones">
        <Tecla href="/dashboard/perfil#seguridad" color="amarillo" tamano="peq">
          Activar 2FA
        </Tecla>
        <Tecla color="blanca" tamano="peq" icono onClick={dismiss} aria-label="Recordar más tarde">
          <X size={16} strokeWidth={2.6} aria-hidden="true" />
        </Tecla>
      </span>
    </div>
  );
}
