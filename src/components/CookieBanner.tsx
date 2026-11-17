"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Tecla from "@/components/cuaderno/Tecla";
import { guardarConsentimiento, leerConsentimiento } from "@/lib/consent";
import "./cookie-banner.css";

/**
 * Banner de cookies.
 *
 * Hasta que entró Google Analytics esto era informativo: guardaba la respuesta
 * y no la leía nadie, porque no había nada opcional que activar. Ahora la
 * elección **decide de verdad** si se carga la analítica, y por eso el estado
 * vive en `@/lib/consent` en vez de aquí dentro.
 *
 * Estilo «Cuaderno de estudio» desde el 17-11-2026: una nota de papel que sube
 * desde abajo, con su galleta dibujada. Las dos teclas son del MISMO tamaño y
 * las dos de color sólido, una al lado de la otra: rechazar lo opcional tiene
 * que ser exactamente tan fácil como aceptarlo (RGPD, PLATAFORMA.md).
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
    <div className="cb" role="dialog" aria-label="Preferencias de cookies" aria-live="polite">
      <div className="cb-nota">
        <svg className="cb-galleta" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <defs>
            <mask id="cb-mordisco">
              <rect width="64" height="64" fill="#fff" />
              <circle cx="57" cy="9" r="11" fill="#000" />
              <circle cx="61" cy="23" r="7" fill="#000" />
            </mask>
          </defs>
          <g mask="url(#cb-mordisco)">
            <circle className="cb-g-canto" cx="32" cy="34" r="26" />
            <circle className="cb-g-masa" cx="32" cy="32" r="26" />
            <circle cx="22" cy="24" r="3.6" className="cb-g-pepita" />
            <circle cx="37" cy="40" r="3.6" className="cb-g-pepita" />
            <circle cx="20" cy="41" r="2.8" className="cb-g-pepita" />
            <circle cx="41" cy="25" r="2.6" className="cb-g-pepita" />
            <circle cx="30" cy="31" r="2.2" className="cb-g-pepita" />
          </g>
        </svg>

        <div className="cb-texto">
          <p className="cb-titulo">Usamos cookies</p>
          <p className="cb-desc">
            Las esenciales mantienen tu sesión y la seguridad del sitio, y no se pueden
            desactivar. Si lo aceptas, usamos también <strong>cookies de analítica</strong>{" "}
            (Google&nbsp;Analytics) para saber qué páginas se leen y mejorar el contenido.
            No usamos publicidad ni vendemos tus datos.{" "}
            <Link href="/cookies" className="cb-enlace">Ver política de cookies</Link>
          </p>
        </div>

        <div className="cb-acciones">
          <Tecla color="azul" className="cb-tecla" onClick={() => elegir("essential")}>
            Solo esenciales
          </Tecla>
          <Tecla className="cb-tecla" onClick={() => elegir("all")}>
            Aceptar todas
          </Tecla>
        </div>
      </div>
    </div>
  );
}
