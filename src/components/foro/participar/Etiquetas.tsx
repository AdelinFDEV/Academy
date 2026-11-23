"use client";

import { useState } from "react";
import { Check, HandHeart, Lightbulb, MessageCircle, Users, type LucideIcon } from "lucide-react";
import Tecla, { type ColorTecla } from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { sonar } from "@/lib/sonidos";
import { ETIQUETAS, type EtiquetaId } from "@/lib/foro/limites";
import { useHilo } from "./ContextoHilo";
import Invitacion from "./Invitacion";

type Cuentas = { interesante: number; gracias: number; yo_tambien: number };

const ICONO: Record<EtiquetaId, LucideIcon> = { interesante: Lightbulb, gracias: HandHeart, yo_tambien: Users };

/** El color de la tecla cuando la etiqueta es tuya: la idea en amarillo, el gracias en menta, la misma duda en cielo. */
const COLOR: Record<EtiquetaId, ColorTecla> = { interesante: "amarillo", gracias: "menta", yo_tambien: "cielo" };

/**
 * Las tres etiquetas de una pregunta: Interesante, Gracias y Yo también.
 * Se ven los totales, nunca quién las puso (FORO.md §8). Quien preguntó solo
 * ve las cifras: nadie valora lo suyo.
 */
export default function Etiquetas({ inicial, comentarios }: { inicial: Cuentas; comentarios: number }) {
  const { preguntaId, mio, cambiar } = useHilo();
  const [cuentas, setCuentas] = useState(inicial);
  const [enviando, setEnviando] = useState<EtiquetaId | null>(null);
  const [invitar, setInvitar] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function alternar(tipo: EtiquetaId) {
    if (!mio || enviando) return;
    if (!mio.puede) {
      if (invitar === null) sonar("abrir");
      setInvitar(mio.motivo);
      return;
    }
    const puesta = mio.etiquetas.includes(tipo);
    setEnviando(tipo);
    setError("");
    const r = await pedirForo<Cuentas>("/api/foro/etiquetar", { pregunta: preguntaId, tipo, poner: !puesta });
    setEnviando(null);
    if (!r.ok) {
      sonar("error");
      setError(r.mensaje);
      return;
    }
    // Cada etiqueta es un conmutador (puesta / quitada).
    sonar("interruptor");
    setCuentas({ interesante: r.interesante, gracias: r.gracias, yo_tambien: r.yo_tambien });
    cambiar((a) => ({ ...a, etiquetas: puesta ? a.etiquetas.filter((x) => x !== tipo) : [...a.etiquetas, tipo] }));
  }

  return (
    <div className="fp-etiquetas">
      <ul aria-label="Valoraciones de la pregunta">
        {ETIQUETAS.map((e) => {
          const Icono = ICONO[e.id];
          const puesta = mio?.etiquetas.includes(e.id) ?? false;
          // Cada una se colorea en cuanto recibe la primera (23-11-2026).
          const con = cuentas[e.id] > 0;
          return mio?.esAutorDeLaPregunta ? (
            <li key={e.id} className={`fp-etiqueta es-propia is-${COLOR[e.id]}${con ? " is-con" : ""}`} title={e.ayuda}>
              <Icono size={16} strokeWidth={2.5} aria-hidden="true" />
              {e.nombre}
              <b>{cuentas[e.id]}</b>
            </li>
          ) : (
            <li key={e.id}>
              <Tecla
                color={con || puesta ? COLOR[e.id] : "blanca"}
                tamano="peq"
                className={`fp-etiqueta${puesta ? " is-puesta" : ""}`}
                aria-pressed={puesta}
                title={puesta ? `${e.ayuda} (la tuya)` : e.ayuda}
                disabled={!mio || enviando !== null}
                onClick={() => alternar(e.id)}
              >
                {puesta ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : <Icono size={16} strokeWidth={2.5} aria-hidden="true" />}
                {e.nombre}
                <b>{cuentas[e.id]}</b>
              </Tecla>
            </li>
          );
        })}
        {/* Los comentarios: un dato de la fila, no un botón; coral en
            cuanto llega la primera respuesta. */}
        <li className={`fp-etiqueta es-propia is-coral${comentarios > 0 ? " is-con" : ""}`}>
          <MessageCircle size={16} strokeWidth={2.5} aria-hidden="true" />
          Comentarios
          <b>{comentarios}</b>
        </li>
      </ul>
      {error && <p className="fp-error" role="alert">{error}</p>}
      {invitar !== null && <Invitacion motivo={invitar} onCerrar={() => { sonar("cerrar"); setInvitar(null); }} />}
    </div>
  );
}
