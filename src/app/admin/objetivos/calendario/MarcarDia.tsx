"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTIVIDAD, type Balance, type Productividad } from "@/lib/objetivos";

/**
 * Marcar un día desde el propio calendario, en el pie de cada celda:
 * ✅ / ❌ de un toque, y 📌 para la nota, que sale como aviso al pasar por
 * encima. Guarda en modo parcial: el dinero del día no se toca.
 */

type Props = { dia: string; balance?: Balance; aLaIzquierda: boolean };

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
    <div className={`obj-marcar${actual ? " obj-marcar--hecho" : ""}`} ref={caja}>
      {actual ? (
        <button
          type="button"
          className={`obj-marcar-estado obj-marcar-estado--${actual}`}
          onClick={abrir}
          title="Pulsa para cambiarlo o editar la nota"
        >
          <span aria-hidden="true">{actual === 3 ? "🔥" : PRODUCTIVIDAD[actual].emoji}</span>
          <span className="obj-marcar-estado-texto">{actual === 1 ? "No productivo" : actual === 3 ? "Muy productivo" : "Productivo"}</span>
        </button>
      ) : (
        <>
          <button type="button" className="obj-marcar-rapido obj-marcar-rapido--si" onClick={() => guardar(2, notaGuardada)} disabled={guardando} title="Día productivo" aria-label="Marcar como productivo">✅</button>
          <button type="button" className="obj-marcar-rapido obj-marcar-rapido--no" onClick={() => guardar(1, notaGuardada)} disabled={guardando} title="Día no productivo" aria-label="Marcar como no productivo">❌</button>
        </>
      )}

      {notaGuardada ? (
        <span className="obj-cal-nota" tabIndex={0} onClick={abrir} aria-label={`Nota del día: ${notaGuardada}`}>
          📌
          <span className={`obj-cal-nota-pop${aLaIzquierda ? " obj-cal-nota-pop--izq" : ""}`} role="tooltip">
            <strong>📌 Nota del día</strong>
            {notaGuardada}
          </span>
        </span>
      ) : (
        <button type="button" className="obj-marcar-rapido obj-marcar-rapido--nota" onClick={abrir} title="Añadir una nota al día" aria-label="Añadir una nota al día">📌</button>
      )}

      {abierto && (
        <div className={`obj-marcar-pop${aLaIzquierda ? " obj-marcar-pop--izq" : ""}`} role="dialog" aria-label="Marcar el día">
          <span className="obj-marcar-titulo">¿Cómo ha ido el día?</span>
          <div className="obj-marcar-opciones">
            {([3, 2, 1] as Productividad[]).map((n) => (
              <button
                key={n}
                type="button"
                className={`obj-marcar-op obj-marcar-op--${n}${prod === n ? " obj-marcar-op--activo" : ""}`}
                onClick={() => setProd(prod === n ? null : n)}
                aria-pressed={prod === n}
              >
                <span aria-hidden="true">{n === 3 ? "🔥" : PRODUCTIVIDAD[n].emoji}</span> {PRODUCTIVIDAD[n].texto}
              </button>
            ))}
          </div>
          <label className="obj-marcar-campo">
            <span>📌 Nota del día <small>· saldrá al pasar por el día</small></span>
            <textarea
              className="obj-input"
              rows={2}
              maxLength={500}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej.: grabé dos vídeos y cerré la entrada de Solana"
              autoFocus
            />
          </label>
          {error && <p className="obj-error">⚠️ {error}</p>}
          <div className="obj-marcar-acciones">
            {(actual || notaGuardada) && (
              <button type="button" className="obj-boton obj-boton--suave obj-boton--pequeno" onClick={() => guardar(null, "")} disabled={guardando}>
                Quitar
              </button>
            )}
            <button type="button" className="obj-boton obj-boton--principal obj-boton--pequeno" onClick={() => guardar(prod, nota)} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
