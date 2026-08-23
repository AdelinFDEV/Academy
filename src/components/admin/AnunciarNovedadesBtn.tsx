"use client";

import { useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";

type Resultado = { total: number; guias?: string[]; entradas?: string[]; videos?: string[] };

/**
 * Lanza el anunciador a mano, sin esperar al cron diario.
 *
 * Existe sobre todo por los vídeos de YouTube: YouTube no nos avisa de nada,
 * hay que ir a preguntarle, y eso solo pasa una vez al día. También sirve para
 * las guías, que llegan con un despliegue de código y tampoco tienen ningún
 * evento en base de datos que las dispare.
 *
 * Es seguro pulsarlo las veces que haga falta: el anunciador lleva su propio
 * registro y no repite nada que ya haya salido.
 */
export default function AnunciarNovedadesBtn() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");

  async function lanzar() {
    setCargando(true);
    setError("");
    setResultado(null);
    try {
      const res = await fetch("/api/admin/announce", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo lanzar");
      setResultado(data as Resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  const partes: string[] = [];
  if (resultado) {
    if (resultado.videos?.length) partes.push(`${resultado.videos.length} vídeo(s)`);
    if (resultado.entradas?.length) partes.push(`${resultado.entradas.length} entrada(s)`);
    if (resultado.guias?.length) partes.push(`${resultado.guias.length} guía(s)`);
  }

  return (
    <div className="anunciar-caja">
      <button type="button" onClick={lanzar} disabled={cargando} className="anunciar-btn">
        {cargando ? <Loader2 size={15} className="cuenta-tg-spin" /> : <Megaphone size={15} />}
        {cargando ? "Buscando novedades…" : "Anunciar novedades"}
      </button>

      {resultado && (
        <span className={`anunciar-aviso${resultado.total > 0 ? " anunciar-aviso--ok" : ""}`}>
          {resultado.total > 0
            ? `✅ Anunciado: ${partes.join(" · ")}`
            : "No había nada pendiente que anunciar."}
        </span>
      )}

      {error && <span className="anunciar-aviso anunciar-aviso--error">⚠️ {error}</span>}
    </div>
  );
}
