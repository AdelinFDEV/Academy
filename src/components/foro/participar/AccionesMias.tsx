"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Tecla from "@/components/cuaderno/Tecla";
import { pedirForo } from "@/components/foro/pedir";
import { sonar } from "@/lib/sonidos";

/** Marcar todos los avisos como leídos. Solo los propios: lo decide el servidor. */
export function MarcarLeidos({ hay }: { hay: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  if (!hay) return null;

  async function marcar() {
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/foro/avisos", {});
    setEnviando(false);
    if (!r.ok) {
      sonar("error");
      setError(r.mensaje);
    } else {
      sonar("guardado");
      router.refresh();
    }
  }

  return (
    <>
      <Tecla color="blanca" tamano="peq" disabled={enviando} onClick={marcar}>
        {enviando ? "Marcando…" : "Marcar todos como leídos"}
      </Tecla>
      {error && <span className="fp-error" role="alert">{error}</span>}
    </>
  );
}

/**
 * Aparecer o no en el ranking: el interruptor del sistema (disenos/sistema.html
 * §11). Quien sale sigue ganando puntos y nivel (FORO.md §10.4).
 *
 * Es un `role="switch"` y no una tecla: un conmutador on/off se lee y se usa
 * mejor así. Cambia en el acto y, si el servidor dice que no, vuelve atrás y
 * lo explica.
 */
export function PreferenciaRanking({ fuera }: { fuera: boolean }) {
  const router = useRouter();
  const [dentro, setDentro] = useState(!fuera);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cambiar() {
    if (enviando) return;
    const antes = dentro;
    sonar("interruptor");
    setDentro(!antes);
    setEnviando(true);
    setError("");
    const r = await pedirForo("/api/foro/ranking", { fuera: antes });
    setEnviando(false);
    if (!r.ok) {
      sonar("error");
      setDentro(antes);
      setError(r.mensaje);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="fm-ranking">
      <button
        type="button"
        role="switch"
        aria-checked={dentro}
        aria-labelledby="fm-ranking-texto"
        className={`fm-interruptor${dentro ? " is-on" : ""}`}
        disabled={enviando}
        onClick={cambiar}
      />
      <p id="fm-ranking-texto">
        <b>Aparecer en el ranking</b>
        <span>{dentro ? "Sales con tu alias y tu foto." : "No sales, pero sigues ganando puntos y nivel."}</span>
      </p>
      {error && <span className="fp-error" role="alert">{error}</span>}
    </div>
  );
}
