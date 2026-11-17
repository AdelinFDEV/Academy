"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedirForo } from "@/components/foro/pedir";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

const MODOS = [
  { id: "cerrado", nombre: "Cerrado", ayuda: "Solo tú ves y usas el foro. Para todos los demás no existe." },
  { id: "lectura", nombre: "Solo lectura", ayuda: "Se lee, pero nadie publica, vota ni reporta. La palanca de emergencia." },
  { id: "abierto", nombre: "Abierto", ayuda: "Funcionamiento normal: leen todos y participan los Premium." },
] as const;

/**
 * El interruptor del foro (FORO.md §6.1). Cambiarlo es inmediato: las
 * funciones de la base de datos leen el modo en cada acción.
 *
 * Tres teclas: la del modo actual se queda hundida, en menta; la elegida y
 * aún sin confirmar, en amarillo. El cambio confirmado suena `interruptor`.
 */
export default function ModoForo({ modo, puedeModerar }: { modo: string; puedeModerar: boolean }) {
  const router = useRouter();
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    if (!pendiente) return;
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/admin/foro/modo", { modo: pendiente });
    setEnviando(false);
    if (!r.ok) {
      setError(r.mensaje);
      sonar("error");
      return;
    }
    sonar("interruptor");
    setPendiente(null);
    router.refresh();
  }

  const actual = MODOS.find((m) => m.id === modo) ?? MODOS[0];
  const elegido = MODOS.find((m) => m.id === pendiente);

  return (
    <div className="fa-modo">
      <div className="fa-modo-opciones" role="group" aria-label="Modo del foro">
        {MODOS.map((m) => (
          <Tecla
            key={m.id}
            color={m.id === pendiente ? "amarillo" : "blanca"}
            tamano="peq"
            className={`fa-modo-opcion${m.id === modo ? " is-actual" : ""}`}
            aria-pressed={m.id === modo}
            disabled={!puedeModerar || enviando || m.id === modo}
            onClick={() => setPendiente(m.id)}
          >
            {m.nombre}
          </Tecla>
        ))}
      </div>
      <p className="fa-modo-ayuda">{(elegido ?? actual).ayuda}</p>
      {elegido && (
        <div className="fa-botones">
          <Tecla tamano="peq" disabled={enviando} onClick={confirmar}>
            {enviando ? "Cambiando…" : `Pasar a «${elegido.nombre}»`}
          </Tecla>
          <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={() => setPendiente(null)}>
            Cancelar
          </Tecla>
        </div>
      )}
      {error && <p className="fa-error" role="alert">{error}</p>}
    </div>
  );
}
