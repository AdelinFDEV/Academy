"use client";

import { useEffect, useState } from "react";

/**
 * El punto rojo de «Lo mío» en la cabecera del foro (23-11-2026, pedido por el
 * admin): cuántas novedades tiene sin leer (respuestas, réplicas, me gusta,
 * etiquetas, ganadora, moderación). El listado del foro es igual para todos y
 * se puede guardar en caché, así que lo personal NO va en él: se pide aparte,
 * desde el navegador y sin caché (FORO.md §6.0, regla 5), a la misma ruta que
 * usa «Lo mío». Sin sesión, sin novedades o si falla, no se pinta nada.
 */
export default function PuntoNovedades() {
  const [sinLeer, setSinLeer] = useState(0);

  useEffect(() => {
    let vivo = true;
    fetch("/api/foro/avisos", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok?: boolean; sinLeer?: unknown } | null) => {
        if (vivo && d?.ok && typeof d.sinLeer === "number") setSinLeer(d.sinLeer);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (sinLeer <= 0) return null;
  return (
    <span className="flc-punto">
      <span aria-hidden="true">{sinLeer > 9 ? "9+" : sinLeer}</span>
      <span className="sr-only">{sinLeer === 1 ? "1 novedad sin leer" : `${sinLeer} novedades sin leer`}</span>
    </span>
  );
}
