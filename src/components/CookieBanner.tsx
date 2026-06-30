"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — don't show banner
    }
  }, []);

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, "all"); } catch { /* noop */ }
    setVisible(false);
  }

  function essentialOnly() {
    try { localStorage.setItem(CONSENT_KEY, "essential"); } catch { /* noop */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Preferencias de cookies" aria-live="polite">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-text">
          <p className="cookie-banner-title">Usamos cookies</p>
          <p className="cookie-banner-desc">
            Utilizamos cookies esenciales para que el sitio funcione correctamente (sesión, seguridad de pagos). No usamos cookies de publicidad ni rastreo.{" "}
            <Link href="/cookies" className="cookie-banner-link">Ver política de cookies</Link>
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button className="cookie-btn-essential" onClick={essentialOnly}>
            Solo esenciales
          </button>
          <button className="cookie-btn-accept" onClick={accept}>
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
