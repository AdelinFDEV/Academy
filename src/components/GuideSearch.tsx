"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { GUIDES_NEWEST_FIRST } from "@/lib/guides";
import type { GuiaBuscador } from "@/app/api/guias/publicadas/route";

const esCripto = (g: { tags: string[] }) => g.tags.includes("CRIPTOMONEDAS");
const CRYPTO_GUIDES: GuiaBuscador[] = GUIDES_NEWEST_FIRST.filter(esCripto);

/** Sin tildes ni mayúsculas: «Ripple» y «ripple», «Ondo» y «ondó» son lo mismo. */
function plano(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Busca una criptomoneda entre las guías que la explican. Solo las guías con la
 * etiqueta CRIPTOMONEDAS: el buscador sirve para «quiero entender esta moneda».
 *
 * Va a la vista en la sección de guías del home, en /guias y arriba del menú;
 * cada sitio lo viste desde su CSS (home.css, listado.css, menu-movil.css).
 * Al enfocarlo sin escribir enseña las criptomonedas explicadas: quien no sabe
 * qué hay, lo ve sin tener que adivinar un nombre.
 */
export default function GuideSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Las guías publicadas desde /admin/acciones que aún están en BORRADORES:
  // `GUIDES` no las tiene hasta ascenderlas, y el buscador debe enseñarlas
  // desde que se publican. Se piden una vez, la primera vez que se abre.
  const [publicadas, setPublicadas] = useState<GuiaBuscador[]>([]);
  const pedidas = useRef(false);
  function cargarPublicadas() {
    if (pedidas.current) return;
    pedidas.current = true;
    fetch("/api/guias/publicadas")
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: GuiaBuscador[]) => {
        const nuevas = lista.filter((g) => esCripto(g) && !CRYPTO_GUIDES.some((c) => c.slug === g.slug));
        if (nuevas.length) setPublicadas(nuevas);
      })
      // Sin red, el buscador sigue con las de GUIDES.
      .catch(() => {});
  }
  const guias = publicadas.length ? [...publicadas, ...CRYPTO_GUIDES] : CRYPTO_GUIDES;

  useEffect(() => {
    // `pointerdown`: Safari en el iPhone no lanza `mousedown` al tocar una
    // zona que no es un enlace, y la lista no se cerraba al tocar fuera.
    function onClickOutside(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onClickOutside);
    return () => document.removeEventListener("pointerdown", onClickOutside);
  }, []);

  const q = plano(query.trim());
  const hasQuery = q.length >= 2;
  // Por título y por nombre corto: «xrp» encuentra «XRP y Ripple» aunque el
  // título largo empiece por otra cosa. No busca en la descripción, para que
  // los resultados sean siempre predecibles.
  const results = hasQuery
    ? guias.filter((g) => plano(g.title).includes(q) || plano(g.shortTitle).includes(q))
    : [];

  function ir(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/guias/${slug}`);
  }

  return (
    <div className="guide-search" ref={wrapRef}>
      <div className="guide-search-box">
        <Search size={19} aria-hidden="true" className="guide-search-icon" />
        <input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          className="guide-search-input"
          placeholder="Busca una criptomoneda: XRP, Render, Worldcoin…"
          aria-label="Buscar una criptomoneda en las guías"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); cargarPublicadas(); }}
          onFocus={() => { setOpen(true); cargarPublicadas(); }}
          onKeyDown={(e) => {
            // Intro abre el primer resultado; Escape cierra la lista.
            if (e.key === "Enter" && results[0]) ir(results[0].slug);
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {query && (
          <button
            type="button"
            className="guide-search-clear"
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery("")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div className="guide-search-dropdown">
          {!hasQuery ? (
            <>
              <p className="guide-search-sugerencias-titulo">Criptomonedas explicadas</p>
              <div className="guide-search-sugerencias">
                {guias.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guias/${g.slug}`}
                    className="guide-search-chip"
                    onClick={() => setOpen(false)}
                  >
                    <span className="guide-search-result-dot" style={{ background: g.color }} />
                    {g.shortTitle}
                  </Link>
                ))}
              </div>
            </>
          ) : results.length === 0 ? (
            <p className="guide-search-empty">
              Aún no hay guía de &quot;{query}&quot;. Prueba con otra criptomoneda.
            </p>
          ) : (
            results.map((g) => (
              <Link
                key={g.slug}
                href={`/guias/${g.slug}`}
                className="guide-search-result"
                onClick={() => setOpen(false)}
              >
                <span className="guide-search-result-dot" style={{ background: g.color }} />
                <span className="guide-search-result-body">
                  <span className="guide-search-result-title">{g.shortTitle}</span>
                  <span className="guide-search-result-desc">{g.description}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
