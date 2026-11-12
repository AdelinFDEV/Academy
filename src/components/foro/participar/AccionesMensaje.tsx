"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES, MOTIVOS_REPORTE, type MotivoReporteId } from "@/lib/foro/limites";
import { useHilo } from "./ContextoHilo";
import Invitacion from "./Invitacion";
import Responder from "./Responder";

type Panel = null | "replicar" | "reportar" | "borrar" | "ganadora" | "invitar" | "editar";

/**
 * Lo que se puede hacer con un mensaje del hilo, debajo de él: replicar,
 * elegirlo como ganadora, reportarlo o borrarlo si es propio.
 *
 * Qué botones salen depende de quién mira (`useHilo`). Es solo lo que se
 * ENSEÑA: cada acción la decide el servidor, que comprueba que quien elige
 * ganadora es el autor de la pregunta, que nadie reporta lo suyo, etc.
 */
export default function AccionesMensaje({
  respuestaId,
  esRespuesta,
  esGanadora,
  hiloCerrado,
  texto,
  titulo,
  fecha,
}: {
  /** Sin id, las acciones son sobre la PREGUNTA (reportarla o borrarla). */
  respuestaId?: string;
  /** Una respuesta a la pregunta, no una réplica: solo ellas pueden ser ganadoras. */
  esRespuesta?: boolean;
  esGanadora?: boolean;
  hiloCerrado: boolean;
  /** El texto y la fecha del mensaje, para poder editarlo si es propio y reciente. */
  texto: string;
  /** Solo en la pregunta. */
  titulo?: string;
  fecha: string;
}) {
  const router = useRouter();
  const { preguntaId, mio, cambiar } = useHilo();
  const [panel, setPanel] = useState<Panel>(null);
  const [motivo, setMotivo] = useState<MotivoReporteId>("estafa");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState("");
  const [nuevoTexto, setNuevoTexto] = useState(texto);
  const [nuevoTitulo, setNuevoTitulo] = useState(titulo ?? "");

  if (!mio) return null;

  const clave = respuestaId ?? "pregunta";
  const esMio = respuestaId ? mio.mios.includes(respuestaId) : mio.esAutorDeLaPregunta;
  const yaReportado = mio.reportados.includes(clave);
  const destino = { pregunta: preguntaId, ...(respuestaId ? { respuesta: respuestaId } : {}) };
  // Solo decide si se ENSEÑA el botón: el plazo de verdad lo cuenta la base de datos.
  const editable = esMio && !esGanadora && Date.now() - new Date(fecha).getTime() < LIMITES.minutosParaEditar * 60 * 1000;

  /** Abre un panel, o la invitación si no puede participar. */
  const abrir = (cual: Exclude<Panel, null | "invitar">) => {
    setError("");
    setHecho("");
    setPanel(panel === cual ? null : mio.puede || cual === "borrar" ? cual : "invitar");
  };

  const guardarEdicion = () =>
    enviar(
      "/api/foro/editar",
      {
        ...destino,
        cuerpo: nuevoTexto,
        ...(respuestaId ? (esRespuesta ? {} : { esReplica: true }) : { titulo: nuevoTitulo }),
      },
      () => router.refresh(),
    );

  async function enviar(ruta: string, cuerpo: Record<string, unknown>, despues: () => void) {
    setEnviando(true);
    setError("");
    const r = await pedirForo(ruta, cuerpo);
    setEnviando(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setPanel(null);
    despues();
  }

  const reportar = () =>
    enviar("/api/foro/reportar", { ...destino, motivo, ...(detalle.trim() ? { detalle } : {}) }, () => {
      cambiar((a) => ({ ...a, reportados: [...a.reportados, clave] }));
      setDetalle("");
      setHecho("Reporte enviado. Gracias por avisar.");
    });

  const borrar = () =>
    enviar("/api/foro/borrar", destino, () => {
      if (respuestaId) router.refresh();
      else router.push("/foro");
    });

  const elegir = () => enviar("/api/foro/ganadora", { pregunta: preguntaId, respuesta: respuestaId }, () => router.refresh());

  return (
    <div className="fp-acciones">
      <div className="fp-fila">
        {respuestaId && !hiloCerrado && (
          <button type="button" className="fp-accion" onClick={() => abrir("replicar")}>Replicar</button>
        )}
        {esRespuesta && !esGanadora && !hiloCerrado && mio.esAutorDeLaPregunta && !esMio && (
          <button type="button" className="fp-accion fp-accion--elegir" onClick={() => abrir("ganadora")}>Elegir como respuesta</button>
        )}
        {!esMio && (
          <button type="button" className="fp-accion" disabled={yaReportado} onClick={() => abrir("reportar")}>
            {yaReportado ? "Reportado" : "Reportar"}
          </button>
        )}
        {editable && (
          <button
            type="button"
            className="fp-accion"
            onClick={() => { setNuevoTexto(texto); setNuevoTitulo(titulo ?? ""); abrir("editar"); }}
          >
            Editar
          </button>
        )}
        {esMio && !esGanadora && (
          <button type="button" className="fp-accion" onClick={() => abrir("borrar")}>Borrar</button>
        )}
      </div>

      {panel === "invitar" && <Invitacion motivo={mio.motivo} onCerrar={() => setPanel(null)} />}

      {panel === "replicar" && respuestaId && <Responder a={respuestaId} alTerminar={() => setPanel(null)} />}

      {panel === "editar" && (
        <div className="fp-panel">
          {!respuestaId && (
            <label className="fp-campo">
              <span>Título</span>
              <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} maxLength={LIMITES.titulo.max * 2} />
            </label>
          )}
          <label className="fp-campo">
            <span>Texto <small>— puedes editarlo durante {LIMITES.minutosParaEditar} minutos desde que lo publicaste</small></span>
            <textarea value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)} rows={respuestaId ? 5 : 9} maxLength={LIMITES.pregunta.max * 2} />
          </label>
          <div className="fp-fila">
            <button
              type="button"
              className="fp-btn fp-btn--firme"
              disabled={enviando || nuevoTexto.trim() === "" || (nuevoTexto.trim() === texto.trim() && nuevoTitulo.trim() === (titulo ?? "").trim())}
              onClick={guardarEdicion}
            >
              {enviando ? "Guardando…" : "Guardar cambios"}
            </button>
            <button type="button" className="fp-btn" disabled={enviando} onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {panel === "ganadora" && (
        <div className="fp-panel">
          <p>
            Al elegirla, el hilo queda <b>resuelto</b>: no admitirá más respuestas y esta se fijará arriba. No podrás
            cambiarla después.
          </p>
          <div className="fp-fila">
            <button type="button" className="fp-btn fp-btn--firme" disabled={enviando} onClick={elegir}>
              {enviando ? "Guardando…" : "Sí, es la respuesta"}
            </button>
            <button type="button" className="fp-btn" disabled={enviando} onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {panel === "reportar" && (
        <div className="fp-panel">
          <label className="fp-campo">
            <span>Motivo</span>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoReporteId)}>
              {MOTIVOS_REPORTE.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </label>
          <label className="fp-campo">
            <span>Detalle (opcional)</span>
            <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={2} maxLength={500} />
          </label>
          <div className="fp-fila">
            <button type="button" className="fp-btn fp-btn--firme" disabled={enviando} onClick={reportar}>
              {enviando ? "Enviando…" : "Enviar reporte"}
            </button>
            <button type="button" className="fp-btn" disabled={enviando} onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {panel === "borrar" && (
        <div className="fp-panel">
          <p>{respuestaId ? "Vas a borrar este mensaje." : "Vas a borrar tu pregunta."} No se puede deshacer.</p>
          <div className="fp-fila">
            <button type="button" className="fp-btn fp-btn--peligro" disabled={enviando} onClick={borrar}>
              {enviando ? "Borrando…" : "Borrar"}
            </button>
            <button type="button" className="fp-btn" disabled={enviando} onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {error && <p className="fp-error" role="alert">{error}</p>}
      {hecho && <p className="fp-hecho" role="status">{hecho}</p>}
    </div>
  );
}
