"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { GLOSARIO as TERMS, GLOSARIO_CATEGORIAS as CATEGORIES } from "@/lib/glosario";

interface Props {
  isLoggedIn: boolean;
  initialSaved: string[];
}

/**
 * Términos por página.
 *
 * Siete es lo que pidió el admin, y encaja: con 49 términos salen siete
 * páginas justas y la lista deja de ser un muro de texto interminable.
 */
const POR_PAGINA = 7;

export default function GlosarioClient({ isLoggedIn, initialSaved }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
  const [toggling, setToggling] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TERMS.filter((t) => {
      const matchesCat = category === "all" || t.category === category;
      const matchesText =
        !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      return matchesCat && matchesText;
    });
  }, [search, category]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));

  // Al buscar o cambiar de categoría se vuelve a la primera página: si no,
  // filtrar desde la página 5 deja la lista en blanco sin explicar por qué.
  useEffect(() => {
    setPagina(1);
  }, [search, category]);

  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA;

  async function toggleSave(t: { term: string; definition: string; category: string }) {
    if (!isLoggedIn) return;
    setToggling(t.term);
    const isSaved = saved.has(t.term);
    try {
      const res = await fetch("/api/terms", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: t.term, definition: t.definition, category: t.category }),
      });
      if (!res.ok) return;
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(t.term);
        else next.add(t.term);
        return next;
      });
    } finally {
      setToggling(null);
    }
  }

  /** Números de página a pintar, con elipsis cuando hay muchas. */
  const paginas = useMemo(() => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const cerca = [1, totalPaginas, pagina, pagina - 1, pagina + 1]
      .filter((n) => n >= 1 && n <= totalPaginas)
      .sort((a, b) => a - b);
    const unicas = [...new Set(cerca)];
    const salida: (number | "…")[] = [];
    unicas.forEach((n, i) => {
      if (i > 0 && n - unicas[i - 1] > 1) salida.push("…");
      salida.push(n);
    });
    return salida;
  }, [pagina, totalPaginas]);

  return (
    <>
      {/* ── Buscador y categorías ── */}
      <div className="gl-filtros">
        <label className="gl-buscador">
          <Search size={16} strokeWidth={2.2} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca un término…"
            aria-label="Buscar en el diccionario"
          />
        </label>

        <div className="gl-cats">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`gl-cat${category === "all" ? " is-activa" : ""}`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`gl-cat${category === cat.id ? " is-activa" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="gl-conteo">
        {filtered.length} término{filtered.length !== 1 ? "s" : ""}
        {totalPaginas > 1 && (
          <span className="gl-conteo-pag"> · página {pagina} de {totalPaginas}</span>
        )}
      </p>

      {/*
        Se pintan TODOS los términos y se ocultan los que no tocan en esta
        página, en vez de recortar el array.

        Es deliberado y es por SEO: esta página es el nodo que enlaza a las 49
        fichas del diccionario, el bloque de URLs más grande del sitio. Con un
        `.slice()` solo llegarían siete enlaces al HTML y Google perdería los
        otros cuarenta y dos de golpe. Así se ve lo que pidió el admin —siete a
        la vez— sin desmontar el enlazado interno.
      */}
      <div className="gl-lista">
        {filtered.map((t, i) => {
          const isSaved = saved.has(t.term);
          const enPagina = i >= desde && i < hasta;
          return (
            <article key={t.term} className="gl-termino" hidden={!enPagina}>
              <div className="gl-termino-head">
                {/* Solo enlazan los términos que ya tienen desarrollo largo. El
                    resto se queda sin enlace, que si no daría un 404. */}
                {/* El nombre es un <h2>: cada término es una sección de esta
                    página, y así Google entiende la estructura en vez de ver
                    un muro de enlaces sueltos. Antes era un span. */}
                <h2 className="gl-termino-nombre">
                  {t.extended ? (
                    <Link href={`/glosario/${t.slug}`} className="gl-termino-link">
                      {t.term}
                    </Link>
                  ) : (
                    t.term
                  )}
                </h2>

                <div className="gl-termino-acciones">
                  <span className={`gl-termino-cat gl-termino-cat--${t.category}`}>
                    {t.category}
                  </span>
                  <button
                    className={`gl-guardar${isSaved ? " is-guardado" : ""}`}
                    onClick={() => toggleSave(t)}
                    disabled={toggling === t.term}
                    aria-label={isSaved ? "Quitar de guardados" : "Guardar término"}
                    title={
                      isLoggedIn
                        ? isSaved
                          ? "Quitar de guardados"
                          : "Guardar en tu diccionario"
                        : "Inicia sesión para guardar términos"
                    }
                  >
                    <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="gl-termino-def">{t.definition}</p>

              {t.extended && (
                <Link href={`/glosario/${t.slug}`} className="gl-termino-mas">
                  Leer la explicación completa
                  <ChevronRight size={13} strokeWidth={2.6} aria-hidden="true" />
                </Link>
              )}
            </article>
          );
        })}

        {filtered.length === 0 && (
          <p className="gl-vacio">No se encontró ningún término para «{search}».</p>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPaginas > 1 && (
        <nav className="gl-paginacion" aria-label="Paginación del diccionario">
          <button
            type="button"
            className="gl-pag-flecha"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
            <span className="gl-pag-flecha-texto">Anterior</span>
          </button>

          <div className="gl-pag-numeros">
            {paginas.map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="gl-pag-elipsis" aria-hidden="true">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className={`gl-pag-num${n === pagina ? " is-activa" : ""}`}
                  onClick={() => setPagina(n)}
                  aria-current={n === pagina ? "page" : undefined}
                  aria-label={`Página ${n}`}
                >
                  {n}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="gl-pag-flecha"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <span className="gl-pag-flecha-texto">Siguiente</span>
            <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}
