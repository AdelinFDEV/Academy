"use client";

import { useEffect, useRef } from "react";

// Site key PÚBLICA de Cloudflare Turnstile (puede ir en el cliente sin riesgo).
// Se puede sobreescribir con NEXT_PUBLIC_TURNSTILE_SITE_KEY sin tocar código.
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAD0Qf2ylbdL4y6yp";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

/**
 * Widget de Turnstile. Llama a `onVerify(token)` cuando el usuario pasa el reto.
 * El token es de un solo uso: si un intento de login falla, sube `resetKey`
 * (p. ej. resetKey+1) para regenerar el widget y obtener un token nuevo.
 */
export default function Turnstile({
  onVerify,
  onExpire,
  resetKey = 0,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Guardamos los callbacks en refs para no re-ejecutar el efecto al cambiar su
  // identidad en cada render del padre.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  useEffect(() => {
    let cancelled = false;

    function render() {
      const api = getTurnstile();
      if (cancelled || !containerRef.current || !api || widgetId.current !== null) return;
      widgetId.current = api.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerifyRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onExpireRef.current?.(),
      });
    }

    if (getTurnstile()) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      const api = getTurnstile();
      if (widgetId.current !== null && api) {
        try { api.remove(widgetId.current); } catch {}
      }
      widgetId.current = null;
    };
  }, [resetKey]);

  return <div ref={containerRef} className="turnstile-widget" />;
}
