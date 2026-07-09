"use client";
import { useEffect } from "react";

// Montado una única vez en el layout raíz: cuenta la racha sin importar en qué
// página del sitio entre el usuario. El endpoint es idempotente — si ya se
// llamó hoy, devuelve el valor actual sin tocar nada.
export default function StreakTracker() {
  useEffect(() => {
    fetch("/api/streak", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
