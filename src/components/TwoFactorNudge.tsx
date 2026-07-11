"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    <div className="dash-2fa-nudge" role="status">
      <ShieldAlert size={18} className="dash-2fa-nudge-icon" />
      <p className="dash-2fa-nudge-text">
        Tu cuenta no tiene verificación en dos pasos. Actívala para protegerla mejor.
      </p>
      <Link href="/cuenta#seguridad" className="dash-2fa-nudge-cta">
        Activar 2FA
      </Link>
      <button className="dash-2fa-nudge-dismiss" onClick={dismiss} aria-label="Recordar más tarde">
        <X size={15} />
      </button>
    </div>
  );
}
