"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

type Panel = null | "ocultar" | "borrar" | "sancionar" | "editar";

/**
 * Lo que el admin puede hacer con un mensaje de la cola de `/admin/foro`.
 *
 * Ocultar, borrar y sancionar piden un motivo, porque el afectado lo ve
 * (FORO.md §7.3). El navegador solo manda qué mensaje y qué acción: quién es
 * su autor lo busca el servidor.
 *
 * Teclas del cuaderno: restaurar en menta, borrar en coral, sancionar en
 * amarillo (riesgo) y lo demás en blanca. En el panel de confirmación, la
 * acción en naranja, o en coral si es borrar o sancionar.
 *
 * Sonidos: el panel suena `abrir` y `cerrar`; lo aplicado, `guardado`; un
 * fallo, `error`.
 */
export default function AccionesMensaje({
  preguntaId,
  respuestaId,
  estado,
  texto,
  conReportes,
  puedeModerar,
}: {
  preguntaId: number;
  respuestaId: string | null;
  estado: string;
  /** El texto actual, para corregirlo sin tener que ocultar el mensaje. */
  texto: string;
  conReportes: boolean;
  /** false si la sesión del admin no ha pasado la verificación en dos pasos. */
  puedeModerar: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [motivo, setMotivo] = useState("");
  const [corregido, setCorregido] = useState(texto);
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
      sonar("error");
      return;
    }
    sonar("guardado");
    setPanel(null);
    setMotivo("");
    router.refresh();
  }

  /** Abre un panel, o lo cierra si ya estaba abierto. */
  function alternar(p: Exclude<Panel, null>) {
    const abrir = panel !== p;
    sonar(abrir ? "abrir" : "cerrar");
    setPanel(abrir ? p : null);
  }

  function cerrarPanel() {
    sonar("cerrar");
    setPanel(null);
  }

  const moderar = (accion: string, conMotivo = false) =>
    enviar("/api/admin/foro/moderar", { accion, ...destino, ...(conMotivo ? { motivo } : {}) });

  function confirmarPanel() {
    if (panel === "editar") {
      return enviar("/api/admin/foro/editar", { ...destino, cuerpo: corregido, motivo });
    }
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
          <Tecla color="blanca" tamano="peq" aria-expanded={panel === "ocultar"} disabled={enviando} onClick={() => alternar("ocultar")}>
            Ocultar
          </Tecla>
        )}
        {estado === "oculta" && (
          <Tecla color="menta" tamano="peq" disabled={enviando} onClick={() => moderar("restaurar")}>
            Restaurar
          </Tecla>
        )}
        {estado !== "borrada" && (
          <Tecla color="coral" tamano="peq" aria-expanded={panel === "borrar"} disabled={enviando} onClick={() => alternar("borrar")}>
            Borrar
          </Tecla>
        )}
        {conReportes && estado === "publicada" && (
          <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={() => moderar("desestimar")}>
            Desestimar reportes
          </Tecla>
        )}
        {estado !== "borrada" && (
          <Tecla
            color="blanca"
            tamano="peq"
            aria-expanded={panel === "editar"}
            disabled={enviando}
            onClick={() => { setCorregido(texto); alternar("editar"); }}
          >
            Corregir el texto
          </Tecla>
        )}
        <Tecla color="amarillo" tamano="peq" aria-expanded={panel === "sancionar"} disabled={enviando} onClick={() => alternar("sancionar")}>
          Sancionar al autor
        </Tecla>
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
          {panel === "editar" && (
            <label className="fa-panel-motivo">
              Texto corregido <span>(quedará marcado «editado por moderación»)</span>
              <textarea value={corregido} onChange={(e) => setCorregido(e.target.value)} rows={6} maxLength={5000} />
            </label>
          )}
          <label className="fa-panel-motivo">
            Motivo <span>{panel === "editar" ? "(queda en el registro)" : "(lo verá el autor)"}</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} maxLength={1000} />
          </label>
          <div className="fa-botones">
            <Tecla
              color={panel === "ocultar" || panel === "editar" ? "naranja" : "coral"}
              tamano="peq"
              disabled={enviando || motivo.trim().length < 3 || (panel === "editar" && corregido.trim() === texto.trim())}
              onClick={confirmarPanel}
            >
              {enviando ? "Enviando…" : panel === "ocultar" ? "Ocultar mensaje" : panel === "borrar" ? "Borrar para siempre" : panel === "editar" ? "Guardar corrección" : "Aplicar sanción"}
            </Tecla>
            <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={cerrarPanel}>
              Cancelar
            </Tecla>
          </div>
          {panel === "borrar" && <p className="fa-nota">Borrar no se puede deshacer y le quita 10 puntos al autor.</p>}
        </div>
      )}

      {error && <p className="fa-error" role="alert">{error}</p>}
    </div>
  );
}
