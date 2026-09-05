"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { CONSENT_EVENT, leerConsentimiento } from "@/lib/consent";

/**
 * Google Analytics 4 — solo si el visitante lo ha consentido.
 *
 * Dos decisiones que conviene no deshacer sin pensarlo:
 *
 * 1. **No se carga nada hasta que acepta.** Existe el «modo de consentimiento»
 *    de Google, que carga la etiqueta con el almacenamiento denegado y manda
 *    pings sin cookies. Es legal en muchos sitios, pero en España la AEPD lo
 *    mira con lupa y la política de cookies de este sitio ya prometía por
 *    escrito pedir consentimiento *previo* para la analítica de terceros. No
 *    cargar nada es la lectura literal de esa promesa, y además es más simple:
 *    o hay etiqueta o no la hay.
 * 2. **La vista de página en cada ruta se manda a mano.** Es una SPA: al
 *    navegar entre páginas no hay recarga, así que la etiqueta solo vería la
 *    primera. Sin esto, GA4 diría que todo el mundo entra y se va sin moverse.
 *
 * Si falta `NEXT_PUBLIC_GA_ID` el componente no pinta nada, así que el sitio
 * funciona igual sin la variable — que es como está en local.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const [acepta, setAcepta] = useState(false);
  const pathname = usePathname();
  // La etiqueta ya manda la primera vista al configurarse; sin esto, la página
  // de entrada se contaría dos veces.
  const primeraVista = useRef(true);

  useEffect(() => {
    setAcepta(leerConsentimiento() === "all");

    function alElegir() {
      setAcepta(leerConsentimiento() === "all");
    }
    window.addEventListener(CONSENT_EVENT, alElegir);
    // Otra pestaña del mismo sitio también cuenta.
    window.addEventListener("storage", alElegir);
    return () => {
      window.removeEventListener(CONSENT_EVENT, alElegir);
      window.removeEventListener("storage", alElegir);
    };
  }, []);

  useEffect(() => {
    if (!acepta || !GA_ID) return;
    if (primeraVista.current) {
      primeraVista.current = false;
      return;
    }
    window.gtag?.("event", "page_view", {
      page_path: pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [acepta, pathname]);

  if (!GA_ID || !acepta) return null;

  return (
    <>
      <Script
        id="ga-init"
        strategy="afterInteractive"
        // Un solo bloque en línea que prepara la cola, fija el consentimiento y
        // solo entonces inyecta la etiqueta. Hacerlo en dos <Script> dejaría el
        // orden al azar, y el consentimiento tiene que estar puesto antes de que
        // gtag.js procese la cola.
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted'
});
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });
var s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
document.head.appendChild(s);
          `.trim(),
        }}
      />
    </>
  );
}
