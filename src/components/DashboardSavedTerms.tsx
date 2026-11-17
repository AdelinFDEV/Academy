"use client";

import { useState } from "react";
import Tecla from "@/components/cuaderno/Tecla";
import { X } from "lucide-react";
import Icon from "@/components/Icon";
import { sonar } from "@/lib/sonidos";

type SavedTerm = {
  term: string;
  definition: string;
  category: string;
};

export default function DashboardSavedTerms({
  initialTerms,
}: {
  initialTerms: SavedTerm[];
}) {
  const [terms, setTerms] = useState(initialTerms);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  /** Se quita al instante; si el servidor no lo confirma, vuelve a su sitio y se avisa. */
  async function unsave(t: SavedTerm) {
    if (removing) return;
    const antes = terms;
    setRemoving(t.term);
    setError("");
    setTerms((prev) => prev.filter((x) => x.term !== t.term));
    try {
      const r = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: t.term, definition: t.definition, category: t.category }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      setTerms(antes);
      setError("No se pudo quitar el término. Inténtalo de nuevo.");
      sonar("error");
    }
    setRemoving(null);
  }

  if (terms.length === 0) {
    return (
      <div className="pn-vacio">
        <span className="pn-vacio-icono tono-amarillo" aria-hidden="true"><Icon name="book" size={22} /></span>
        <p>No tienes términos guardados aún.</p>
        <Tecla href="/glosario" color="amarillo" tamano="peq">Explorar el diccionario</Tecla>
      </div>
    );
  }

  return (
    <>
      {error && <p className="pn-error" role="alert">{error}</p>}
      <ul className="dash-terminos">
        {terms.map((t, i) => (
          <li key={t.term} className={`dash-termino dash-termino--${i % 3}`}>
            <div className="dash-termino-cab">
              <span className="dash-termino-nombre">{t.term}</span>
              <Tecla
                color="blanca"
                tamano="peq"
                icono
                className="dash-quitar"
                onClick={() => unsave(t)}
                disabled={removing === t.term}
                aria-label={`Quitar «${t.term}» de guardados`}
                title="Quitar de guardados"
              >
                <X size={14} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
            <span className="pn-chip tono-amarillo">{t.category}</span>
            <p className="dash-termino-def">{t.definition}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
