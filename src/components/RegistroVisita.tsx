"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Avisa al servidor de cada página vista (`/api/visita`). No usa cookies ni
 * almacenamiento: lo único que recuerda es, mientras la pestaña siga abierta,
 * si ya contó la primera página, que es la «entrada» y la única que lleva el
 * origen (de qué web llegó y sus UTM).
 */
let yaEntro = false;

export default function RegistroVisita() {
  const ruta = usePathname();

  useEffect(() => {
    if (!ruta || ruta.startsWith("/admin")) return;

    let referente: string | null = null;
    try {
      referente = document.referrer ? new URL(document.referrer).hostname : null;
    } catch {
      referente = null;
    }
    // Es entrada la primera página de la pestaña, salvo que venga de la propia
    // web (un enlace abierto en otra pestaña) o sea una recarga, que conserva
    // el referente original y la contaría dos veces.
    const navegacion = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const entrada = !yaEntro && referente !== location.hostname && navegacion?.type !== "reload";
    yaEntro = true;

    const p = new URLSearchParams(location.search);
    const cuerpo = JSON.stringify({
      ruta,
      entrada,
      referente: entrada ? referente : null,
      utm_source: entrada ? p.get("utm_source") : null,
      utm_medium: entrada ? p.get("utm_medium") : null,
      utm_campaign: entrada ? p.get("utm_campaign") : null,
    });

    fetch("/api/visita", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true }).catch(() => {});
  }, [ruta]);

  return null;
}
