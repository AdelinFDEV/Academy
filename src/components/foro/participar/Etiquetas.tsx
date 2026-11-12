"use client";

import { useState } from "react";
import { HandHeart, Lightbulb, Users, type LucideIcon } from "lucide-react";
import { pedirForo } from "@/components/foro/pedir";
import { ETIQUETAS, type EtiquetaId } from "@/lib/foro/limites";
import { useHilo } from "./ContextoHilo";
import Invitacion from "./Invitacion";

type Cuentas = { interesante: number; gracias: number; yo_tambien: number };

const ICONO: Record<EtiquetaId, LucideIcon> = { interesante: Lightbulb, gracias: HandHeart, yo_tambien: Users };

/**
 * Las tres etiquetas de una pregunta: Interesante, Gracias y Yo también.
 * Se ven los totales, nunca quién las puso (FORO.md §8). Quien preguntó solo
 * ve las cifras: nadie valora lo suyo.
 */
export default function Etiquetas({ inicial }: { inicial: Cuentas }) {
  const { preguntaId, mio, cambiar } = useHilo();
  const [cuentas, setCuentas] = useState(inicial);
  const [enviando, setEnviando] = useState<EtiquetaId | null>(null);
  const [invitar, setInvitar] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function alternar(tipo: EtiquetaId) {
    if (!mio || enviando) return;
    if (!mio.puede) {
      setInvitar(mio.motivo);
      return;
    }
    const puesta = mio.etiquetas.includes(tipo);
    setEnviando(tipo);
    setError("");
    const r = await pedirForo<Cuentas>("/api/foro/etiquetar", { pregunta: preguntaId, tipo, poner: !puesta });
    setEnviando(null);
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setCuentas({ interesante: r.interesante, gracias: r.gracias, yo_tambien: r.yo_tambien });
    cambiar((a) => ({ ...a, etiquetas: puesta ? a.etiquetas.filter((x) => x !== tipo) : [...a.etiquetas, tipo] }));
  }

  return (
    <div className="fp-etiquetas">
      <ul className="fh-etiquetas" aria-label="Valoraciones de la pregunta">
        {ETIQUETAS.map((e) => {
          const Icono = ICONO[e.id];
          const puesta = mio?.etiquetas.includes(e.id) ?? false;
          return mio?.esAutorDeLaPregunta ? (
            <li key={e.id} className="fp-etiqueta es-propia" title={e.ayuda}>
              <Icono size={15} strokeWidth={2.2} aria-hidden="true" />
              {e.nombre}
              <b>{cuentas[e.id]}</b>
            </li>
          ) : (
            <li key={e.id}>
              <button
                type="button"
                className={`fp-etiqueta${puesta ? " is-puesta" : ""}`}
                aria-pressed={puesta}
                title={e.ayuda}
                disabled={!mio || enviando !== null}
                onClick={() => alternar(e.id)}
              >
                <Icono size={15} strokeWidth={2.2} aria-hidden="true" />
                {e.nombre}
                <b>{cuentas[e.id]}</b>
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="fp-error" role="alert">{error}</p>}
      {invitar !== null && <Invitacion motivo={invitar} onCerrar={() => setInvitar(null)} />}
    </div>
  );
}
