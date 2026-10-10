"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FUENTES, PRODUCTIVIDAD, type Balance, type Fuente, type Productividad, formatoES } from "@/lib/objetivos";

/**
 * «Cierre del día»: cómo de productivo fue y cuánto ganaste, por fuente.
 * Se abre desde el número de cualquier día del calendario y desde el diario.
 *
 *   const cierre = useCierreDia();
 *   …onClick={() => cierre.abrir(fecha, balance)}
 *
 * Premium no se apunta aquí: lo cobrado llega solo desde Stripe
 * (src/lib/cobrosStripe.ts) y se enseña con lo apuntado a mano ese día.
 *   {cierre.modal}
 */

type Estado = {
  fecha: string;
  productividad: Productividad | null;
  nota: string;
  ingresos: Record<Fuente, string>;
  /** Lo apuntado a mano ese día en la pestaña Dinero y lo cobrado por Stripe: se enseña, no se edita aquí. */
  manuales: Balance["manuales"];
};

const VACIO: Record<Fuente, string> = { premium: "", youtube: "", trading: "", asesorias: "", trabajo: "", otros: "" };

/** Lo que se apunta al cerrar el día: todo menos Premium, que llega de Stripe. */
const FUENTES_CIERRE = (Object.keys(FUENTES) as Fuente[]).filter((f) => f !== "premium");

function fechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

function euros(n: number): string {
  return formatoES(n, { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export function useCierreDia() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!estado) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !guardando) setEstado(null);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [estado, guardando]);

  function abrir(fecha: string, balance?: Balance) {
    setError("");
    const ingresos = { ...VACIO };
    // Solo lo del cierre: lo apuntado a mano ese día se enseña aparte y no se toca.
    for (const [f, v] of Object.entries(balance?.ingresosCierre ?? {})) ingresos[f as Fuente] = String(v);
    setEstado({ fecha, productividad: balance?.productividad ?? null, nota: balance?.nota ?? "", ingresos, manuales: balance?.manuales ?? [] });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!estado) return;
    setGuardando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/plan/dia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: estado.fecha, productividad: estado.productividad, nota: estado.nota, ingresos: estado.ingresos }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "No se pudo guardar.");
      setEstado(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const total = estado
    ? Object.values(estado.ingresos).reduce((s, v) => s + (Number(String(v).replace(",", ".")) || 0), 0)
    : 0;

  const modal = estado && (
    <div className="obj-modal-fondo" onClick={() => !guardando && setEstado(null)}>
      <form className="obj-modal" onSubmit={guardar} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cierre-titulo">
        <div className="obj-modal-cabeza">
          <span className="obj-modal-emoji" aria-hidden="true">🌙</span>
          <div className="obj-cierre-titulos">
            <h3 id="cierre-titulo" className="obj-modal-titulo">Cierre del día</h3>
            <span className="obj-cierre-fecha">{fechaLarga(estado.fecha)}</span>
          </div>
          <button type="button" className="obj-modal-cerrar" onClick={() => setEstado(null)} aria-label="Cerrar" disabled={guardando}>✕</button>
        </div>

        <div className="obj-modal-cuerpo">
          <div className="obj-opciones-bloque">
            <span className="obj-etiqueta">¿Cómo de productivo ha sido?</span>
            <div className="obj-productividad" role="radiogroup" aria-label="Productividad">
              {([3, 2, 1] as Productividad[]).map((n) => {
                const activo = estado.productividad === n;
                return (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    aria-checked={activo}
                    className={`obj-prod obj-prod--${n}${activo ? " obj-prod--activo" : ""}`}
                    onClick={() => setEstado({ ...estado, productividad: activo ? null : n })}
                  >
                    <span className="obj-prod-emoji" aria-hidden="true">{PRODUCTIVIDAD[n].emoji}</span>
                    <span>{PRODUCTIVIDAD[n].texto}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="obj-campo obj-cierre-nota">
            <span className="obj-etiqueta">📌 Nota del día</span>
            <span className="obj-ayuda">Una frase corta: saldrá como aviso al pasar por este día en el calendario.</span>
            <textarea
              className="obj-input"
              rows={2}
              value={estado.nota}
              maxLength={500}
              onChange={(e) => setEstado({ ...estado, nota: e.target.value })}
              placeholder="Ej.: grabé dos vídeos y cerré la entrada de Solana"
            />
          </label>

          <div className="obj-opciones-bloque">
            <span className="obj-etiqueta">💶 ¿Cuánto has ganado hoy?</span>
            <div className="obj-ingresos">
              {FUENTES_CIERRE.map((f) => (
                <label key={f} className="obj-ingreso">
                  <span className="obj-ingreso-fuente"><span aria-hidden="true">{FUENTES[f].emoji}</span> {FUENTES[f].texto}</span>
                  <span className="obj-ingreso-campo">
                    <input
                      className="obj-input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0"
                      value={estado.ingresos[f]}
                      onChange={(e) => setEstado({ ...estado, ingresos: { ...estado.ingresos, [f]: e.target.value } })}
                    />
                    <span aria-hidden="true">€</span>
                  </span>
                </label>
              ))}
            </div>
            {estado.manuales.length > 0 && (
              <div className="obj-cierre-manuales">
                <span>También ese día: lo cobrado por Stripe y lo apuntado en Gastos</span>
                {estado.manuales.map((m, i) => (
                  <div key={i}>
                    <span>{FUENTES[m.fuente]?.emoji ?? "💶"} {m.concepto}</span>
                    <strong>{euros(m.importe)}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="obj-ingresos-total">
              <span>Total del día</span>
              <strong>{euros(total + estado.manuales.reduce((s, m) => s + m.importe, 0))}</strong>
            </div>
          </div>

        </div>

        {error && <p className="obj-error">⚠️ {error}</p>}

        <div className="obj-modal-acciones">
          <button type="button" className="obj-boton obj-boton--suave" onClick={() => setEstado(null)} disabled={guardando}>Cancelar</button>
          <button type="submit" className="obj-boton obj-boton--principal" disabled={guardando}>
            {guardando ? "Guardando…" : "🌙 Cerrar el día"}
          </button>
        </div>
      </form>
    </div>
  );

  return { abrir, modal };
}
