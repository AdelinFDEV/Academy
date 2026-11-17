"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Bookmark, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { GLOSARIO as TERMS, GLOSARIO_CATEGORIAS as CATEGORIES } from "@/lib/glosario";
import { sonar } from "@/lib/sonidos";

interface Props {
  isLoggedIn: boolean;
  initialSaved: string[];
}

/**
 * Términos por página.
 *
 * Siete es lo que pidió el admin, y encaja: la lista deja de ser un muro de
 * texto interminable.
 */
const POR_PAGINA = 7;

/** El abecedario del fichero. «#» agrupa los que empiezan por número (2FA…). */
const ABC = [..."ABCDEFGHIJKLMNÑOPQRSTUVWXYZ", "#"];

/** La letra del fichero en la que se archiva un término: sin tildes, y los números en «#». */
function inicial(term: string): string {
  const primera = term.trim().charAt(0).toUpperCase();
  if (primera === "Ñ") return "Ñ";
  const sinTilde = primera.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return /[A-Z]/.test(sinTilde) ? sinTilde : "#";
}

/** El orden de un fichero: alfabético, como se busca una palabra. */
const ORDENADOS = [...TERMS].sort((a, b) => a.term.localeCompare(b.term, "es", { sensitivity: "base" }));

/** El nombre de una categoría para enseñarlo («DeFi», no el id «defi»). */
const NOMBRE_CATEGORIA = new Map(CATEGORIES.map((c) => [c.id as string, c.label]));

export default function GlosarioClient({ isLoggedIn, initialSaved }: Props) {
  const [search, setBusqueda] = useState("");
  const [category, setCategoria] = useState<string>("all");
  const [letra, setLetraFiltro] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
  const [toggling, setToggling] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  /** Una nota debajo de la ficha que se intentó guardar: sin sesión, o si falló. */
  const [nota, setNota] = useState<{ term: string; tipo: "sesion" | "error" } | null>(null);
  const conteo = useRef<HTMLParagraphElement>(null);

  /** Cambiar de página desde abajo: la lista vuelve a empezar arriba, a la vista. */
  const irAPagina = (n: number) => {
    setPagina(n);
    conteo.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  /** Lo que dejan la búsqueda y la categoría, antes de elegir letra. */
  const sinLetra = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ORDENADOS.filter((t) => {
      const matchesCat = category === "all" || t.category === category;
      const matchesText =
        !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      return matchesCat && matchesText;
    });
  }, [search, category]);

  /** Las teclas del abecedario que tienen algo detrás. */
  const letrasConTerminos = useMemo(() => new Set(sinLetra.map((t) => inicial(t.term))), [sinLetra]);

  const filtered = useMemo(
    () => (letra ? sinLetra.filter((t) => inicial(t.term) === letra) : sinLetra),
    [sinLetra, letra],
  );

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA));

  // Al buscar, cambiar de categoría o de letra se vuelve a la primera página:
  // si no, filtrar desde la página 5 deja la lista en blanco sin explicar por qué.
  // Se hace en el mismo gesto que cambia el filtro, no en un efecto aparte.
  const setSearch = (v: string) => { setBusqueda(v); setPagina(1); };
  const setCategory = (v: string) => { setCategoria(v); setPagina(1); };
  const setLetra = (v: string | null) => { setLetraFiltro(v); setPagina(1); };

  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA;

  async function toggleSave(t: { term: string; definition: string; category: string }) {
    // Sin sesión no se guarda nada: se dice cómo, junto a la ficha.
    if (!isLoggedIn) {
      sonar("abrir");
      setNota({ term: t.term, tipo: "sesion" });
      return;
    }
    setToggling(t.term);
    setNota(null);
    const isSaved = saved.has(t.term);
    try {
      const res = await fetch("/api/terms", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: t.term, definition: t.definition, category: t.category }),
      });
      if (!res.ok) {
        sonar("error");
        setNota({ term: t.term, tipo: "error" });
        return;
      }
      // Guardar suena a guardado; quitarlo, al interruptor que se apaga.
      sonar(isSaved ? "interruptor" : "guardado");
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(t.term);
        else next.add(t.term);
        return next;
      });
    } catch {
      sonar("error");
      setNota({ term: t.term, tipo: "error" });
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
      {/* ── El cajón de búsqueda: buscador, categorías y abecedario ── */}
      <div className="glx-filtros">
        <label className="glx-buscador">
          <Search size={20} strokeWidth={2.6} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca un término…"
            aria-label="Buscar en el diccionario"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            // La lista se filtra mientras se escribe: en el móvil, «Buscar»
            // solo cierra el teclado para dejar ver los resultados.
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) e.currentTarget.blur();
            }}
          />
        </label>

        <div className="glx-cats" role="group" aria-label="Categorías">
          <Tecla
            tamano="peq"
            color={category === "all" ? "amarillo" : "blanca"}
            className={category === "all" ? "is-pulsada" : undefined}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            Todas
          </Tecla>
          {CATEGORIES.map((cat) => (
            <Tecla
              key={cat.id}
              tamano="peq"
              color={category === cat.id ? "amarillo" : "blanca"}
              className={category === cat.id ? "is-pulsada" : undefined}
              aria-pressed={category === cat.id}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </Tecla>
          ))}
        </div>

        {/* El canto del fichero: una tecla por letra; las letras sin términos,
            apagadas. Pulsar la letra activa la suelta. */}
        <div className="glx-abc" role="group" aria-label="Filtrar por letra">
          <Tecla
            tamano="peq"
            color={letra === null ? "amarillo" : "blanca"}
            className={`glx-abc-todas${letra === null ? " is-pulsada" : ""}`}
            aria-pressed={letra === null}
            onClick={() => setLetra(null)}
          >
            A–Z
          </Tecla>
          {ABC.map((l) => {
            const activa = letra === l;
            return (
              <Tecla
                key={l}
                tamano="peq"
                color={activa ? "amarillo" : "blanca"}
                className={`glx-abc-letra${activa ? " is-pulsada" : ""}`}
                aria-pressed={activa}
                aria-label={l === "#" ? "Términos que empiezan por un número" : `Términos con la letra ${l}`}
                disabled={!activa && !letrasConTerminos.has(l)}
                onClick={() => setLetra(activa ? null : l)}
              >
                {l}
              </Tecla>
            );
          })}
        </div>
      </div>

      <p className="glx-conteo" ref={conteo}>
        {filtered.length} término{filtered.length !== 1 ? "s" : ""}
        {totalPaginas > 1 && (
          <span className="glx-conteo-pag"> · página {pagina} de {totalPaginas}</span>
        )}
      </p>

      {/*
        Se pintan TODOS los términos y se ocultan los que no tocan en esta
        página, en vez de recortar el array.

        Es deliberado y es por SEO: esta página es el nodo que enlaza a todas
        las fichas del diccionario, el bloque de URLs más grande del sitio. Con
        un `.slice()` solo llegarían siete enlaces al HTML y Google perdería el
        resto de golpe. Así se ve lo que pidió el admin —siete a la vez— sin
        desmontar el enlazado interno.
      */}
      <div className="glx-lista">
        {filtered.map((t, i) => {
          const isSaved = saved.has(t.term);
          const enPagina = i >= desde && i < hasta;
          return (
            <article key={t.term} className={`glx-ficha glx-ficha--${t.category}`} hidden={!enPagina}>
              <span className="glx-ficha-pestana" aria-hidden="true">{inicial(t.term)}</span>

              <div className="glx-ficha-cab">
                <span className="glx-ficha-cat">{NOMBRE_CATEGORIA.get(t.category) ?? t.category}</span>
                <Tecla
                  icono
                  tamano="peq"
                  color={isSaved ? "menta" : "blanca"}
                  className="glx-guardar"
                  onClick={() => toggleSave(t)}
                  disabled={toggling === t.term}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? "Quitar de guardados" : "Guardar término"}
                  title={
                    isLoggedIn
                      ? isSaved
                        ? "Quitar de guardados"
                        : "Guardar en tu diccionario"
                      : "Inicia sesión para guardar términos"
                  }
                >
                  <Bookmark size={17} strokeWidth={2.6} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
                </Tecla>
              </div>

              {/* `data-sin-popup`: aquí la definición ya está a la vista, así
                  que el enlace va directo a la ficha (GlosarioPopupGlobal). */}
              {/* Solo enlazan los términos que ya tienen desarrollo largo. El
                  resto se queda sin enlace, que si no daría un 404. */}
              {/* El nombre es un <h2>: cada término es una sección de esta
                  página, y así Google entiende la estructura en vez de ver
                  un muro de enlaces sueltos. */}
              <h2 className="glx-ficha-nombre">
                {t.extended ? (
                  <Link href={`/glosario/${t.slug}`} className="glx-ficha-link" data-sin-popup>
                    {t.term}
                  </Link>
                ) : (
                  t.term
                )}
              </h2>

              <p className="glx-ficha-def">{t.definition}</p>

              {nota?.term === t.term && (
                <p className={`glx-ficha-aviso${nota.tipo === "error" ? " es-error" : ""}`} role={nota.tipo === "error" ? "alert" : "status"}>
                  {nota.tipo === "error" ? (
                    "No se ha podido guardar. Inténtalo de nuevo."
                  ) : (
                    <>
                      <Link href="/login?next=/glosario">Inicia sesión</Link> para guardarlo en tu dashboard.
                    </>
                  )}
                </p>
              )}

              {t.extended && (
                <Link href={`/glosario/${t.slug}`} className="glx-ficha-mas" data-sin-popup>
                  Leer la explicación completa
                  <ChevronRight size={16} strokeWidth={3} aria-hidden="true" />
                </Link>
              )}
            </article>
          );
        })}

        {filtered.length === 0 && (
          <p className="glx-vacio">
            {search.trim()
              ? `No se encontró ningún término para «${search}».`
              : "No hay términos con esa letra en esta categoría."}
          </p>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPaginas > 1 && (
        <nav className="glx-paginacion" aria-label="Paginación del diccionario">
          <Tecla
            tamano="peq"
            color="blanca"
            onClick={() => irAPagina(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} strokeWidth={3} aria-hidden="true" />
            <span className="glx-pag-texto">Anterior</span>
          </Tecla>

          <div className="glx-pag-numeros">
            {paginas.map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="glx-pag-elipsis" aria-hidden="true">…</span>
              ) : (
                <Tecla
                  key={n}
                  tamano="peq"
                  color={n === pagina ? "amarillo" : "blanca"}
                  className={`glx-pag-num${n === pagina ? " is-pulsada" : ""}`}
                  onClick={() => irAPagina(n)}
                  aria-current={n === pagina ? "page" : undefined}
                  aria-label={`Página ${n}`}
                >
                  {n}
                </Tecla>
              )
            )}
          </div>

          <Tecla
            tamano="peq"
            color="blanca"
            onClick={() => irAPagina(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <span className="glx-pag-texto">Siguiente</span>
            <ChevronRight size={16} strokeWidth={3} aria-hidden="true" />
          </Tecla>
        </nav>
      )}
    </>
  );
}
