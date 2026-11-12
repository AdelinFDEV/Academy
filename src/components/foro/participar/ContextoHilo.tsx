"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MioEnHilo } from "@/lib/foro/tipos";

/**
 * Lo PERSONAL de quien mira un hilo: si puede participar, a qué le ha dado me
 * gusta, qué etiquetas ha puesto, qué mensajes son suyos.
 *
 * La página del hilo es la misma para todos y no lleva nada de esto. Se pide
 * aparte, a `/api/foro/mio`, que nunca se cachea (FORO.md §6.0, regla 5), y
 * los botones del hilo lo leen de aquí.
 *
 * Lo que diga este estado solo decide QUÉ SE ENSEÑA. La barrera de verdad es
 * el servidor: si alguien fuerza un botón, la API lo rechaza igual.
 */

const SIN_SESION: MioEnHilo = {
  puede: false, motivo: "sin_sesion", esAutorDeLaPregunta: false, meGusta: [], etiquetas: [], mios: [], reportados: [],
};

type Valor = {
  preguntaId: number;
  /** null mientras se está pidiendo. */
  mio: MioEnHilo | null;
  /** Cambia lo propio en pantalla tras una acción, sin volver a pedirlo. */
  cambiar: (cambio: (antes: MioEnHilo) => MioEnHilo) => void;
};

const Contexto = createContext<Valor | null>(null);

export function useHilo(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error("useHilo se usa dentro de <ContextoHilo>");
  return v;
}

export default function ContextoHilo({
  preguntaId,
  conSesion,
  children,
}: {
  preguntaId: number;
  conSesion: boolean;
  children: React.ReactNode;
}) {
  const [mio, setMio] = useState<MioEnHilo | null>(conSesion ? null : SIN_SESION);

  useEffect(() => {
    if (!conSesion) return;
    let vivo = true;
    fetch(`/api/foro/mio?pregunta=${preguntaId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: unknown) => {
        if (!vivo) return;
        const r = d as Partial<MioEnHilo> & { ok?: boolean };
        // Si falla, se queda como quien no puede: los botones invitan en vez de romperse.
        setMio(
          r.ok === true
            ? {
                puede: r.puede === true,
                motivo: typeof r.motivo === "string" ? r.motivo : null,
                esAutorDeLaPregunta: r.esAutorDeLaPregunta === true,
                meGusta: Array.isArray(r.meGusta) ? r.meGusta : [],
                etiquetas: Array.isArray(r.etiquetas) ? r.etiquetas : [],
                mios: Array.isArray(r.mios) ? r.mios : [],
                reportados: Array.isArray(r.reportados) ? r.reportados : [],
              }
            : { ...SIN_SESION, motivo: "interno" },
        );
      })
      .catch(() => { if (vivo) setMio({ ...SIN_SESION, motivo: "interno" }); });
    return () => { vivo = false; };
  }, [conSesion, preguntaId]);

  const cambiar = useCallback((cambio: (antes: MioEnHilo) => MioEnHilo) => {
    setMio((antes) => (antes ? cambio(antes) : antes));
  }, []);

  const valor = useMemo(() => ({ preguntaId, mio, cambiar }), [preguntaId, mio, cambiar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
