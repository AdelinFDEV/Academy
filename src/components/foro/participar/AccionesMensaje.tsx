"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CornerDownRight, Flag, Pencil, Trash2 } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES, MOTIVOS_REPORTE, type MotivoReporteId } from "@/lib/foro/limites";
import { sonar } from "@/lib/sonidos";
import { celebrarGanadora } from "./celebrar";
import { useHilo } from "./ContextoHilo";
import BarraFormato from "./BarraFormato";
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
  const campoEditar = useRef<HTMLTextAreaElement>(null);
  const idEditar = useId();

  if (!mio) return null;

  const clave = respuestaId ?? "pregunta";
  const esMio = respuestaId ? mio.mios.includes(respuestaId) : mio.esAutorDeLaPregunta;
  const yaReportado = mio.reportados.includes(clave);
  const destino = { pregunta: preguntaId, ...(respuestaId ? { respuesta: respuestaId } : {}) };
  // Solo decide si se ENSEÑA el botón: el plazo de verdad lo cuenta la base de datos.
  const editable = esMio && !esGanadora && Date.now() - new Date(fecha).getTime() < LIMITES.minutosParaEditar * 60 * 1000;

  /** Abre un panel, o la invitación si no puede participar. Pulsar el mismo otra vez lo cierra. */
  const abrir = (cual: Exclude<Panel, null | "invitar">) => {
    setError("");
    setHecho("");
    const siguiente = panel === cual ? null : mio.puede || cual === "borrar" ? cual : "invitar";
    sonar(siguiente === null ? "cerrar" : "abrir");
    setPanel(siguiente);
  };

  const cerrar = () => {
    sonar("cerrar");
    setPanel(null);
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

  /** Manda la acción. Suena `guardado` al salir bien (o lo que diga `alAcertar`) y `error` si no. */
  async function enviar(ruta: string, cuerpo: Record<string, unknown>, despues: () => void, alAcertar: () => void = () => sonar("guardado")) {
    setEnviando(true);
    setError("");
    const r = await pedirForo(ruta, cuerpo);
    setEnviando(false);
    if (!r.ok) {
      sonar("error");
      setError(r.mensaje);
      return;
    }
    alAcertar();
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

  // Elegir la respuesta que te resolvió la duda es un logro: fanfarria y confeti.
  const elegir = () =>
    enviar("/api/foro/ganadora", { pregunta: preguntaId, respuesta: respuestaId }, () => router.refresh(), celebrarGanadora);

  return (
    <div className="fp-acciones">
      <div className="fp-fila">
        {respuestaId && !hiloCerrado && (
          <Tecla color="blanca" tamano="peq" className="fp-accion" aria-expanded={panel === "replicar"} onClick={() => abrir("replicar")}>
            <CornerDownRight size={15} strokeWidth={2.6} aria-hidden="true" /> Replicar
          </Tecla>
        )}
        {esRespuesta && !esGanadora && !hiloCerrado && mio.esAutorDeLaPregunta && !esMio && (
          <Tecla color="menta" tamano="peq" className="fp-accion" aria-expanded={panel === "ganadora"} onClick={() => abrir("ganadora")}>
            <BadgeCheck size={15} strokeWidth={2.6} aria-hidden="true" /> Elegir como respuesta
          </Tecla>
        )}
        {!esMio && (
          <Tecla color="blanca" tamano="peq" className="fp-accion" disabled={yaReportado} aria-expanded={panel === "reportar"} onClick={() => abrir("reportar")}>
            <Flag size={14} strokeWidth={2.6} aria-hidden="true" /> {yaReportado ? "Reportado" : "Reportar"}
          </Tecla>
        )}
        {editable && (
          <Tecla
            color="blanca"
            tamano="peq"
            className="fp-accion"
            aria-expanded={panel === "editar"}
            onClick={() => { setNuevoTexto(texto); setNuevoTitulo(titulo ?? ""); abrir("editar"); }}
          >
            <Pencil size={14} strokeWidth={2.6} aria-hidden="true" /> Editar
          </Tecla>
        )}
        {esMio && !esGanadora && (
          <Tecla color="coral" tamano="peq" className="fp-accion" aria-expanded={panel === "borrar"} onClick={() => abrir("borrar")}>
            <Trash2 size={14} strokeWidth={2.6} aria-hidden="true" /> Borrar
          </Tecla>
        )}
      </div>

      {panel === "invitar" && <Invitacion motivo={mio.motivo} onCerrar={cerrar} />}

      {panel === "replicar" && respuestaId && <Responder a={respuestaId} alTerminar={() => setPanel(null)} alCancelar={cerrar} />}

      {panel === "editar" && (
        <div className="fp-panel">
          {!respuestaId && (
            <label className="fp-campo">
              <span>Título</span>
              <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} maxLength={LIMITES.titulo.max * 2} />
            </label>
          )}
          {/* Un div, no un label: la barra de formato lleva botones. */}
          <div className="fp-campo">
            <span className="fp-campo-cab">
              <label htmlFor={idEditar}>Texto <small>— puedes editarlo durante {LIMITES.minutosParaEditar} minutos desde que lo publicaste</small></label>
              <BarraFormato campo={campoEditar} valor={nuevoTexto} cambiar={setNuevoTexto} bloqueado={enviando} />
            </span>
            <textarea ref={campoEditar} id={idEditar} value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)} rows={respuestaId ? 5 : 9} maxLength={LIMITES.pregunta.max * 2} />
          </div>
          <div className="fp-fila">
            <Tecla
              color="coral"
              tamano="peq"
              disabled={enviando || nuevoTexto.trim() === "" || (nuevoTexto.trim() === texto.trim() && nuevoTitulo.trim() === (titulo ?? "").trim())}
              onClick={guardarEdicion}
            >
              {enviando ? "Guardando…" : "Guardar cambios"}
            </Tecla>
            <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={cerrar}>Cancelar</Tecla>
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
            <Tecla color="menta" tamano="peq" disabled={enviando} onClick={elegir}>
              {enviando ? "Guardando…" : "Sí, es la respuesta"}
            </Tecla>
            <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={cerrar}>Cancelar</Tecla>
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
            <Tecla color="coral" tamano="peq" disabled={enviando} onClick={reportar}>
              {enviando ? "Enviando…" : "Enviar reporte"}
            </Tecla>
            <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={cerrar}>Cancelar</Tecla>
          </div>
        </div>
      )}

      {panel === "borrar" && (
        <div className="fp-panel">
          <p>{respuestaId ? "Vas a borrar este mensaje." : "Vas a borrar tu pregunta."} No se puede deshacer.</p>
          <div className="fp-fila">
            <Tecla color="coral" tamano="peq" disabled={enviando} onClick={borrar}>
              {enviando ? "Borrando…" : "Borrar"}
            </Tecla>
            <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={cerrar}>Cancelar</Tecla>
          </div>
        </div>
      )}

      {error && <p className="fp-error" role="alert">{error}</p>}
      {hecho && <p className="fp-hecho" role="status">{hecho}</p>}
    </div>
  );
}
