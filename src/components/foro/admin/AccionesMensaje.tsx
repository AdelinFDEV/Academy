"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";

type Panel = null | "ocultar" | "borrar" | "sancionar";

/**
 * Lo que el admin puede hacer con un mensaje de la cola de `/admin/foro`.
 *
 * Ocultar, borrar y sancionar piden un motivo, porque el afectado lo ve
 * (FORO.md §7.3). El navegador solo manda qué mensaje y qué acción: quién es
 * su autor lo busca el servidor.
 */
export default function AccionesMensaje({
  preguntaId,
  respuestaId,
  estado,
  conReportes,
  puedeModerar,
}: {
  preguntaId: number;
  respuestaId: string | null;
  estado: string;
  conReportes: boolean;
  /** false si la sesión del admin no ha pasado la verificación en dos pasos. */
  puedeModerar: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [motivo, setMotivo] = useState("");
  const [tipo, setTipo] = useState<"aviso" | "suspension" | "expulsion">("aviso");
  const [dias, setDias] = useState(7);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const destino = { pregunta: preguntaId, ...(respuestaId ? { respuesta: respuestaId } : {}) };

  async function enviar(ruta: string, cuerpo: Record<string, unknown>) {
    setEnviando(true);
    setError("");
    const r = await pedirForo(ruta, cuerpo);
    setEnviando(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setPanel(null);
    setMotivo("");
    router.refresh();
  }

  const moderar = (accion: string, conMotivo = false) =>
    enviar("/api/admin/foro/moderar", { accion, ...destino, ...(conMotivo ? { motivo } : {}) });

  function confirmarPanel() {
    if (panel === "sancionar") {
      return enviar("/api/admin/foro/sancionar", { ...destino, tipo, motivo, ...(tipo === "suspension" ? { dias } : {}) });
    }
    if (panel) return moderar(panel, true);
  }

  if (!puedeModerar) return null;

  return (
    <div className="fa-acciones">
      <div className="fa-botones">
        {estado === "publicada" && (
          <button type="button" className="fa-btn" disabled={enviando} onClick={() => setPanel(panel === "ocultar" ? null : "ocultar")}>
            Ocultar
          </button>
        )}
        {estado === "oculta" && (
          <button type="button" className="fa-btn" disabled={enviando} onClick={() => moderar("restaurar")}>
            Restaurar
          </button>
        )}
        {estado !== "borrada" && (
          <button type="button" className="fa-btn fa-btn--peligro" disabled={enviando} onClick={() => setPanel(panel === "borrar" ? null : "borrar")}>
            Borrar
          </button>
        )}
        {conReportes && estado === "publicada" && (
          <button type="button" className="fa-btn" disabled={enviando} onClick={() => moderar("desestimar")}>
            Desestimar reportes
          </button>
        )}
        <button type="button" className="fa-btn" disabled={enviando} onClick={() => setPanel(panel === "sancionar" ? null : "sancionar")}>
          Sancionar al autor
        </button>
      </div>

      {panel && (
        <div className="fa-panel">
          {panel === "sancionar" && (
            <div className="fa-panel-fila">
              <label>
                Sanción
                <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
                  <option value="aviso">Aviso</option>
                  <option value="suspension">Suspensión</option>
                  <option value="expulsion">Expulsión del foro</option>
                </select>
              </label>
              {tipo === "suspension" && (
                <label>
                  Días
                  <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
                    <option value={7}>7</option>
                    <option value={30}>30</option>
                  </select>
                </label>
              )}
            </div>
          )}
          <label className="fa-panel-motivo">
            Motivo <span>(lo verá el autor)</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} maxLength={1000} />
          </label>
          <div className="fa-botones">
            <button
              type="button"
              className={`fa-btn fa-btn--firme${panel === "ocultar" ? "" : " fa-btn--peligro"}`}
              disabled={enviando || motivo.trim().length < 3}
              onClick={confirmarPanel}
            >
              {enviando ? "Enviando…" : panel === "ocultar" ? "Ocultar mensaje" : panel === "borrar" ? "Borrar para siempre" : "Aplicar sanción"}
            </button>
            <button type="button" className="fa-btn" disabled={enviando} onClick={() => setPanel(null)}>
              Cancelar
            </button>
          </div>
          {panel === "borrar" && <p className="fa-nota">Borrar no se puede deshacer y le quita 10 puntos al autor.</p>}
        </div>
      )}

      {error && <p className="fa-error" role="alert">{error}</p>}
    </div>
  );
}
