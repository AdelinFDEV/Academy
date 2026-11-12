"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";
import { LIMITES } from "@/lib/foro/limites";
import { useHilo } from "./ContextoHilo";
import Invitacion from "./Invitacion";

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
}: {
  /** El mensaje al que se contesta. Sin él, es una respuesta a la pregunta. */
  a?: string;
  /** Para cerrar el formulario de una réplica al publicarla o cancelar. */
  alTerminar?: () => void;
}) {
  const router = useRouter();
  const { preguntaId, mio } = useHilo();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const limite = a ? LIMITES.replica : LIMITES.respuesta;
  const largo = Array.from(texto.trim()).length;

  if (!mio) return null;
  if (!mio.puede) return <Invitacion motivo={mio.motivo} onCerrar={alTerminar} />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/foro/responder", { pregunta: preguntaId, ...(a ? { a } : {}), cuerpo: texto });
    setEnviando(false);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setTexto("");
    alTerminar?.();
    // La página del hilo se vuelve a pedir al servidor: lo nuevo sale ya en su sitio.
    router.refresh();
  }

  return (
    <form className={`fp-form${a ? " fp-form--replica" : ""}`} onSubmit={enviar}>
      <label className="fp-campo">
        <span>{a ? "Tu réplica" : "Tu respuesta"}</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={a ? 3 : 6}
          maxLength={limite.max * 2}
          placeholder={a ? "Aclara o matiza esta respuesta." : "Responde a la pregunta con lo que sabes. Sé claro y respetuoso."}
          required
        />
      </label>
      <div className="fp-fila fp-fila--entre">
        <span className={`fp-contador${largo > limite.max ? " es-malo" : ""}`}>
          {largo} / {limite.max}
        </span>
        <span className="fp-fila">
          {alTerminar && <button type="button" className="fp-btn" disabled={enviando} onClick={alTerminar}>Cancelar</button>}
          <button type="submit" className="fp-btn fp-btn--firme" disabled={enviando || largo < limite.min || largo > limite.max}>
            {enviando ? "Publicando…" : a ? "Publicar réplica" : "Publicar respuesta"}
          </button>
        </span>
      </div>
      {error && <p className="fp-error" role="alert">{error}</p>}
    </form>
  );
}
