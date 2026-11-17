"use client";

import { useRef, useState } from "react";
import { Brain, Check } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { ANIMOS, NOTA_MAX, type Animo, type DiaDiario } from "./tjDias";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "No se pudo guardar");

/** La lectura de cada ánimo: una frase útil, no un adorno. */
const LECTURA: Record<Animo, string> = {
  4: "En tu mejor versión. Vigila el exceso de confianza: es cuando más se arriesga.",
  3: "Sereno. Es el estado en el que mejor se sigue un plan.",
  2: "Algo te pesa. Baja el tamaño de la operación o espera a mañana.",
  1: "Hoy no es el día. La mejor operación puede ser no hacer ninguna.",
};

/**
 * La cara de cada ánimo, dibujada: cuatro expresiones con el mismo trazo. Lleva
 * su clase `mood-N`, así que se pinta con el color de su ánimo donde se ponga.
 * Es la ÚNICA forma de enseñar un ánimo en el Diario: nada de emojis, que en
 * cada dispositivo salen distintos (y el estilo no los quiere).
 * `peq`: del tamaño de la letra que la rodea, para ir dentro de un texto o de
 * un circulito.
 */
export function Cara({ valor, peq = false }: { valor: Animo; peq?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={`djc-cara mood-${valor}${peq ? " djc-cara--peq" : ""}`} aria-hidden="true">
      <circle cx="24" cy="24" r="21" className="djc-cara-fondo" />
      {valor === 4 && (
        <>
          <path d="M13 21 q3.5 -5 7 0" /><path d="M28 21 q3.5 -5 7 0" />
          <path d="M14 28 q10 11 20 0 z" className="djc-cara-boca" />
        </>
      )}
      {valor === 3 && (
        <>
          <circle cx="17" cy="20" r="2.1" className="djc-cara-ojo" /><circle cx="31" cy="20" r="2.1" className="djc-cara-ojo" />
          <path d="M16 29 q8 6 16 0" />
        </>
      )}
      {valor === 2 && (
        <>
          <circle cx="17" cy="21" r="2.1" className="djc-cara-ojo" /><circle cx="31" cy="21" r="2.1" className="djc-cara-ojo" />
          <path d="M13 15 l7 2" /><path d="M35 15 l-7 2" />
          <path d="M17 32 q7 -5 14 0" />
        </>
      )}
      {valor === 1 && (
        <>
          <path d="M13 17 l7 4 l-7 4" /><path d="M35 17 l-7 4 l7 4" />
          <path d="M15 33 q3 -4 6 0 t6 0 t6 0" />
        </>
      )}
    </svg>
  );
}

/**
 * Sensaciones de un día (ánimo y nota), dentro del formulario de operación: es el
 * único sitio donde se apuntan. La nota se guarda sola al salir del campo (que
 * es lo que pasa al pulsar «Guardar operación»), no a cada tecla.
 *
 * El ánimo se marca AL INSTANTE (13-11-2026): antes el botón esperaba a que el
 * servidor contestara para pintarse, y eran uno o dos segundos sin respuesta.
 * Ahora se pinta primero y se guarda después; si el guardado falla, vuelve a
 * como estaba y se dice.
 *
 * Se monta con key={fecha}: cambiar de día empieza con el borrador limpio.
 */
export default function TjDayJournal({
  fecha,
  dia,
  isToday,
  onSave,
}: {
  fecha: string;
  dia: DiaDiario | undefined;
  isToday: boolean;
  onSave: (d: DiaDiario) => Promise<void>;
}) {
  const guardado = dia?.animo ?? null;
  const guardada = dia?.nota ?? "";
  // Lo que se enseña mientras el servidor contesta. `undefined` = lo guardado.
  const [pendiente, setPendiente] = useState<Animo | null | undefined>(undefined);
  const animo = pendiente === undefined ? guardado : pendiente;
  const [nota, setNota] = useState(guardada);
  const [guardando, setGuardando] = useState(false);
  const [avisoGuardado, setAvisoGuardado] = useState(false);
  const [error, setError] = useState("");
  // Con dos pulsaciones seguidas, solo cuenta la respuesta de la última.
  const turno = useRef(0);

  async function elegir(valor: Animo) {
    // Pulsar el que ya está elegido lo quita.
    const nuevo = animo === valor ? null : valor;
    const mio = ++turno.current;
    setPendiente(nuevo);
    setError("");
    try {
      await onSave({ fecha, animo: nuevo, nota: guardada.trim() || null });
    } catch (err) {
      if (mio === turno.current) setError(errorMessage(err));
    } finally {
      // Ya manda lo que haya quedado guardado: si falló, vuelve a lo de antes.
      if (mio === turno.current) setPendiente(undefined);
    }
  }

  async function guardarNota() {
    setGuardando(true);
    setError("");
    try {
      await onSave({ fecha, animo, nota: nota.trim() || null });
      setAvisoGuardado(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  const sinGuardar = nota.trim() !== guardada.trim();

  return (
    <div className="djc-diario">
      <div className="djc-diario-cab">
        <span className="djc-diario-ico" aria-hidden="true"><Brain size={20} /></span>
        <div>
          <h3 className="djc-diario-tit">{isToday ? "Tu cabeza, hoy" : "Tu cabeza, ese día"}</h3>
          <p className="djc-diario-sub">El mercado es el mismo para todos. Lo que cambia de un día a otro eres tú.</p>
        </div>
      </div>

      <div className="djc-caras" role="radiogroup" aria-label={isToday ? "Cómo te sientes hoy" : "Cómo te sentiste ese día"}>
        {ANIMOS.map(a => (
          <Tecla
            key={a.value}
            color="blanca"
            role="radio"
            aria-checked={animo === a.value}
            className={`djc-cara-tecla mood-${a.value}${animo === a.value ? " is-on" : ""}`}
            onClick={() => void elegir(a.value)}
          >
            <Cara valor={a.value} />
            <span>{a.label}</span>
          </Tecla>
        ))}
      </div>
      <p className={`djc-lectura${animo ? ` mood-${animo}` : ""}`} aria-live="polite">
        {animo ? LECTURA[animo] : isToday ? "¿Cómo llegas hoy al mercado? Elige una cara." : "¿Cómo estabas ese día? Elige una cara."}
      </p>

      <div className="dj-campo djc-nota-campo">
        <label htmlFor={`djc-nota-${fecha}`}>
          {isToday ? "Lo que te llevas de hoy" : "Lo que te llevaste de ese día"}
        </label>
        <textarea
          id={`djc-nota-${fecha}`}
          className="djc-renglones"
          value={nota}
          maxLength={NOTA_MAX}
          rows={4}
          placeholder="Qué hiciste bien, qué te sacó del plan, qué repetirías mañana..."
          onChange={e => { setNota(e.target.value); setAvisoGuardado(false); }}
          onBlur={sinGuardar ? () => void guardarNota() : undefined}
        />
        <div className="djc-nota-pie">
          <span className={`djc-cuenta${nota.length > NOTA_MAX - 60 ? " is-cerca" : ""}`}>{nota.length}/{NOTA_MAX}</span>
          {error && <span className="djc-nota-error" role="alert">{error}</span>}
          {avisoGuardado && !sinGuardar && !error && <span className="dj-chip dj-chip--menta"><Check size={13} strokeWidth={3} /> Guardado</span>}
          {guardando && <span className="djc-cuenta">Guardando...</span>}
          {!guardando && !avisoGuardado && !error && <span className="ayuda">Se guarda sola</span>}
        </div>
      </div>
    </div>
  );
}
