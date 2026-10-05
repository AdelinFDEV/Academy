"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTIVIDAD, type Balance, type Productividad } from "@/lib/objetivos";

/**
 * Marcar un día desde el propio calendario, en la esquina de su cuadrado:
 * - sin marcar: ✓ y ✗ (aparecen al pasar por el día) guardan de un toque;
 * - marcado: su emoji, que abre el panelito para cambiarlo o escribir la nota;
 * - con nota: un 📌 que la enseña al pasar por encima.
 * Guarda en modo parcial: el dinero del día no se toca.
 */

type Props = { dia: string; balance?: Balance; aLaIzquierda: boolean };

const EMOJI: Record<Productividad, string> = { 3: "🔥", 2: "✅", 1: "❌" };

export function MarcarDia({ dia, balance, aLaIzquierda }: Props) {
  const router = useRouter();
  const caja = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [prod, setProd] = useState<Productividad | null>(balance?.productividad ?? null);
  const [nota, setNota] = useState(balance?.nota ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  function abrir() {
    setProd(balance?.productividad ?? null);
    setNota(balance?.nota ?? "");
    setError("");
    setAbierto(true);
  }

  async function guardar(productividad: Productividad | null, texto: string) {
    setGuardando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/plan/dia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: dia, productividad, nota: texto, parcial: true }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "No se pudo guardar.");
      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setAbierto(true);
    } finally {
      setGuardando(false);
    }
  }

  const actual = balance?.productividad ?? null;
  const notaGuardada = balance?.nota ?? "";

  return (
    <div className={`cal-marca${actual ? " cal-marca--hecho" : ""}`} ref={caja}>
      {notaGuardada && (
        <span className="cal-marca-nota" tabIndex={0} onClick={abrir} aria-label={`Nota del día: ${notaGuardada}`}>
          📌
          <span className={`cal-marca-aviso${aLaIzquierda ? " cal-marca-aviso--izq" : ""}`} role="tooltip">{notaGuardada}</span>
        </span>
      )}

      {actual ? (
        <button type="button" className="cal-marca-estado" onClick={abrir} title={`${PRODUCTIVIDAD[actual].texto}. Pulsa para cambiarlo.`}>
          {EMOJI[actual]}
        </button>
      ) : (
        <span className="cal-marca-rapido">
          <button type="button" onClick={() => guardar(2, notaGuardada)} disabled={guardando} title="Día productivo" aria-label="Marcar como productivo">✓</button>
          <button type="button" onClick={() => guardar(1, notaGuardada)} disabled={guardando} title="Día no productivo" aria-label="Marcar como no productivo">✗</button>
          {!notaGuardada && <button type="button" onClick={abrir} title="Añadir una nota" aria-label="Añadir una nota al día">✎</button>}
        </span>
      )}

      {abierto && (
        <div className={`cal-marca-pop${aLaIzquierda ? " cal-marca-pop--izq" : ""}`} role="dialog" aria-label="Marcar el día">
          <span className="cal-marca-titulo">¿Cómo ha ido el día?</span>
          <div className="cal-marca-opciones">
            {([3, 2, 1] as Productividad[]).map((n) => (
              <button
                key={n}
                type="button"
                className={`cal-marca-op cal-marca-op--${n}${prod === n ? " cal-marca-op--activo" : ""}`}
                onClick={() => setProd(prod === n ? null : n)}
                aria-pressed={prod === n}
              >
                <span aria-hidden="true">{EMOJI[n]}</span> {PRODUCTIVIDAD[n].texto}
              </button>
            ))}
          </div>
          <label className="cal-marca-campo">
            <span>Nota del día</span>
            <textarea
              rows={2}
              maxLength={500}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Una frase: qué hizo que el día fuera así"
              autoFocus
            />
          </label>
          {error && <p className="cal-error">{error}</p>}
          <div className="cal-marca-acciones">
            {(actual || notaGuardada) && (
              <button type="button" className="cal-texto-boton cal-texto-boton--peligro" onClick={() => guardar(null, "")} disabled={guardando}>
                Quitar
              </button>
            )}
            <button type="button" className="cal-boton" onClick={() => guardar(prod, nota)} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
