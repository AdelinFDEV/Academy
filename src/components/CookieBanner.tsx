"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { guardarConsentimiento, leerConsentimiento } from "@/lib/consent";

/**
 * Banner de cookies.
 *
 * Hasta que entró Google Analytics esto era informativo: guardaba la respuesta
 * y no la leía nadie, porque no había nada opcional que activar. Ahora la
 * elección **decide de verdad** si se carga la analítica, y por eso el estado
 * vive en `@/lib/consent` en vez de aquí dentro.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!leerConsentimiento()) setVisible(true);
  }, []);

  function elegir(valor: "all" | "essential") {
    guardarConsentimiento(valor);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Preferencias de cookies" aria-live="polite">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-text">
          <p className="cookie-banner-title">Usamos cookies</p>
          <p className="cookie-banner-desc">
            Las esenciales mantienen tu sesión y la seguridad del sitio, y no se pueden
            desactivar. Si lo aceptas, usamos también <strong>cookies de analítica</strong>{" "}
            (Google&nbsp;Analytics) para saber qué páginas se leen y mejorar el contenido.
            No usamos publicidad ni vendemos tus datos.{" "}
            <Link href="/cookies" className="cookie-banner-link">Ver política de cookies</Link>
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button className="cookie-btn-essential" onClick={() => elegir("essential")}>
            Solo esenciales
          </button>
          <button className="cookie-btn-accept" onClick={() => elegir("all")}>
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
