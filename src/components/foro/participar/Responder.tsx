"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Tecla from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES } from "@/lib/foro/limites";
import { sonar } from "@/lib/sonidos";
import { useHilo } from "./ContextoHilo";
import EditorForo from "./EditorForo";
import Invitacion from "./Invitacion";
import SubirImagenes, { type Subida } from "./SubirImagenes";

/**
 * Escribir una respuesta a la pregunta, o una réplica a un mensaje (`a`).
 *
 * El texto viaja tal cual y el servidor lo limpia, lo mide y lo pasa por el
 * filtro: si lo rechaza, la frase que devuelve dice qué hay que quitar y lo
 * escrito no se pierde. El contador de aquí es solo una ayuda.
 */
export default function Responder({
  a,
  alTerminar,
  alCancelar,
}: {
  /** El mensaje al que se contesta. Sin él, es una respuesta a la pregunta. */
  a?: string;
  /** Para cerrar el formulario de una réplica al publicarla o cancelar. */
  alTerminar?: () => void;
  /** Cancelar sin publicar (con su sonido de cerrar). Sin él, cancelar es `alTerminar`. */
  alCancelar?: () => void;
}) {
  const router = useRouter();
  const { preguntaId, mio, participantes } = useHilo();
  const [texto, setTexto] = useState("");
  const [imagenes, setImagenes] = useState<Subida[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const limite = a ? LIMITES.replica : LIMITES.respuesta;
  const largo = Array.from(texto.trim()).length;

  if (!mio) return null;
  const cancelar = alCancelar ?? alTerminar;
  if (!mio.puede) return <Invitacion motivo={mio.motivo} onCerrar={cancelar} />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/foro/responder", {
      pregunta: preguntaId,
      ...(a ? { a } : {}),
      cuerpo: texto,
      ...(imagenes.length ? { imagenes: imagenes.map((i) => i.id) } : {}),
    });
    setEnviando(false);
    if (!r.ok) {
      sonar("error");
      setError(r.mensaje);
      return;
    }
    sonar("guardado");
    setTexto("");
    setImagenes([]);
    alTerminar?.();
    // La página del hilo se vuelve a pedir al servidor: lo nuevo sale ya en su sitio.
    router.refresh();
  }

  return (
    <form className={`fp-form${a ? " fp-form--replica" : ""}`} onSubmit={enviar}>
      <EditorForo
        valor={texto}
        cambiar={setTexto}
        etiqueta={a ? "Tu réplica" : "Tu respuesta"}
        // «Tu respuesta» ya es el título de la caja: aquí solo para lectores de pantalla.
        etiquetaOculta={!a}
        filas={a ? 3 : 6}
        maximo={limite.max * 2}
        placeholder={a ? "Aclara o matiza esta respuesta. Con @ mencionas a alguien del hilo." : "Responde a la pregunta con lo que sabes. Sé claro y respetuoso."}
        bloqueado={enviando}
        requerido
        participantes={participantes}
        imagenes={imagenes}
      />
      <SubirImagenes
        max={LIMITES.imagenesPorRespuesta}
        imagenes={imagenes}
        setImagenes={setImagenes}
        subiendo={subiendo}
        setSubiendo={setSubiendo}
        setError={setError}
        bloqueado={enviando}
        nota={`Hasta ${LIMITES.imagenesPorRespuesta} imágenes. Sin frases semilla, claves ni datos personales.`}
      />
      <div className="fp-fila fp-fila--entre">
        <span className={`fp-contador${largo > limite.max ? " es-malo" : ""}`}>
          {largo} / {limite.max}
        </span>
        <span className="fp-fila">
          {cancelar && <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={cancelar}>Cancelar</Tecla>}
          <Tecla type="submit" color="coral" tamano={a ? "peq" : "normal"} disabled={enviando || subiendo || largo < limite.min || largo > limite.max}>
            {enviando ? "Publicando…" : a ? "Publicar réplica" : "Publicar respuesta"}
          </Tecla>
        </span>
      </div>
      {error && <p className="fp-error" role="alert">{error}</p>}
    </form>
  );
}
