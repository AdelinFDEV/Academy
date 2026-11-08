"use client";
import { useEffect } from "react";

// Montado una única vez en el layout raíz: cuenta la racha sin importar en qué
// página del sitio entre el usuario. El endpoint es idempotente — si ya se
// llamó hoy, devuelve el valor actual sin tocar nada.
//
// Solo se llama con sesión (08-11-2026): antes se llamaba en cada carga de
// cualquier visitante, y para quien no tiene cuenta era una petición que el
// servidor siempre contestaba con 401. La sesión de Supabase vive en una
// cookie «sb-…-auth-token» (a veces partida en .0, .1…) que el navegador puede
// leer; sin ella no hay racha que contar.
export default function StreakTracker() {
  useEffect(() => {
    if (!/(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    fetch("/api/streak", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
