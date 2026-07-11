"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "site_visit_tracked_paths";

// Evita que una misma pestaña cuente la misma ruta más de una vez: si el
// usuario recarga (F5) o vuelve a la pestaña, no se duplica la visita.
// sessionStorage se limpia solo al cerrar la pestaña, así que una pestaña
// nueva (o volver a entrar más tarde) sí cuenta como una visita nueva.
function alreadyTracked(pathname: string): boolean {
  try {
    const tracked: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]");
    if (tracked.includes(pathname)) return true;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...tracked, pathname]));
    return false;
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — mejor contar de más
    // que perder el dato por completo.
    return false;
  }
}

export default function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (alreadyTracked(pathname)) return;

    fetch("/api/site-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
