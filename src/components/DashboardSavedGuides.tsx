"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import type { GuideMeta } from "@/lib/guides";

type SavedGuide = {
  slug: string;
  savedAt: string;
  meta: GuideMeta;
};

export default function DashboardSavedGuides({ initialGuides }: { initialGuides: SavedGuide[] }) {
  const [guides, setGuides] = useState(initialGuides);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  /** Se quita al instante; si el servidor no lo confirma, vuelve a su sitio y se avisa. */
  async function unsave(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;
    const antes = guides;
    setRemoving(slug);
    setError("");
    setGuides((prev) => prev.filter((g) => g.slug !== slug));
    try {
      const r = await fetch("/api/guide-saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_slug: slug }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      setGuides(antes);
      setError("No se pudo quitar la guía. Inténtalo de nuevo.");
      sonar("error");
    }
    setRemoving(null);
  }

  if (guides.length === 0) {
    return (
      <div className="pn-vacio">
        <span className="pn-vacio-icono tono-cielo" aria-hidden="true"><BookOpen size={22} /></span>
        <p>No tienes guías guardadas aún.</p>
        <Tecla href="/guias" color="cielo" tamano="peq">Explorar guías</Tecla>
      </div>
    );
  }

  return (
    <>
      {error && <p className="pn-error" role="alert">{error}</p>}
      <ul className="dash-guardadas">
        {guides.map((g) => (
          <li key={g.slug} className="dash-guardada">
            <Link href={`/guias/${g.slug}`} className="dash-guardada-enlace">
              <span className="dash-guardada-icono tono-cielo" aria-hidden="true"><BookOpen size={20} /></span>
              <span className="dash-guardada-cuerpo">
                <span className="pn-etiqueta">Guía · {g.meta.difficulty}</span>
                <span className="dash-guardada-titulo">{g.meta.title}</span>
                <span className="dash-guardada-datos">
                  <span className="pn-chip tono-gris">{g.meta.sections} secciones</span>
                  <span className="pn-chip tono-gris">{g.meta.readTime}</span>
                </span>
              </span>
            </Link>
            <Tecla
              color="blanca"
              tamano="peq"
              icono
              className="dash-quitar"
              onClick={(e) => unsave(e, g.slug)}
              disabled={removing === g.slug}
              aria-label={`Quitar «${g.meta.title}» de guardados`}
            >
              <X size={14} strokeWidth={2.6} aria-hidden="true" />
            </Tecla>
          </li>
        ))}
      </ul>
    </>
  );
}
