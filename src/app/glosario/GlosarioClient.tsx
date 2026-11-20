"use client";

import { useState, useMemo, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import BuscadorPopup from "./BuscadorPopup";
import { GLOSARIO_ALFABETICO, GLOSARIO_CATEGORIAS as CATEGORIES, numeroCromo } from "@/lib/glosario";
import { sonar } from "@/lib/sonidos";

interface Props {
  isLoggedIn: boolean;
  initialSaved: string[];
}

/**
 * Cromos por página (20-11-2026, pedido por el admin): seis en el ordenador,
 * dos filas de tres, y cuatro en el móvil, uno debajo de otro.
 */
const POR_PAGINA = 6;
const POR_PAGINA_MOVIL = 4;

/** El móvil es donde la rejilla pasa a una columna (glosario.css, 600 px). */
const MOVIL = "(max-width: 600px)";
function suscribir(avisar: () => void) {
  const mq = window.matchMedia(MOVIL);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}
const esMovil = () => window.matchMedia(MOVIL).matches;
const enServidor = () => false;

/** El orden de un fichero: alfabético, como se busca una palabra. */
const ORDENADOS = GLOSARIO_ALFABETICO;

/** Cuántos cromos tiene el álbum: el número que va detrás de la barra («Nº 003/231»). */
const TOTAL = ORDENADOS.length;


/** El nombre de una categoría para enseñarlo («DeFi», no el id «defi»). */
const NOMBRE_CATEGORIA = new Map(CATEGORIES.map((c) => [c.id as string, c.label]));

export default function GlosarioClient({ isLoggedIn, initialSaved }: Props) {
  const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
  const [toggling, setToggling] = useState<string | null>(null);
  const [elegida, setPagina] = useState(1);
  const porPagina = useSyncExternalStore(suscribir, esMovil, enServidor) ? POR_PAGINA_MOVIL : POR_PAGINA;
  /** Una nota debajo de la ficha que se intentó guardar: sin sesión, o si falló. */
  const [nota, setNota] = useState<{ term: string; tipo: "sesion" | "error" } | null>(null);
  const conteo = useRef<HTMLParagraphElement>(null);

  /** Cambiar de página desde abajo: la lista vuelve a empezar arriba, a la vista. */
  const irAPagina = (n: number) => {
    setPagina(n);
    conteo.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  // La búsqueda vive en su ventana (BuscadorPopup): la lista es el diccionario
  // entero, por orden alfabético.
  const filtered = ORDENADOS;

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / porPagina));
  // Si al girar o ensanchar la pantalla hay menos páginas, se queda en la última.
  const pagina = Math.min(elegida, totalPaginas);

  const desde = (pagina - 1) * porPagina;
  const hasta = desde + porPagina;

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
      {/* ── El buscador: una barra que abre la ventana de búsqueda ── */}
      <div className="glx-filtros">
        <BuscadorPopup />
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
        un `.slice()` solo llegarían seis enlaces al HTML y Google perdería el
        resto de golpe. Así se ve lo que pidió el admin —seis a la vez, cuatro en el móvil— sin
        desmontar el enlazado interno.
      */}
      <div className="glx-lista">
        {filtered.map((t, i) => {
          const isSaved = saved.has(t.term);
          const enPagina = i >= desde && i < hasta;
          return (
            <article key={t.term} className={`glx-ficha glx-ficha--${t.category}`} hidden={!enPagina}>
              {/* La cabecera del cromo, en el propio marco de color: categoría,
                  número en el álbum y el nombre en grande. */}
              <div className="glx-cromo-cab">
                <div className="glx-cromo-datos">
                  <span className="glx-cromo-cat">{NOMBRE_CATEGORIA.get(t.category) ?? t.category}</span>
                  <span className="glx-cromo-num">
                    Nº {numeroCromo(t.slug)}/{TOTAL}
                  </span>
                </div>

                {/* `data-sin-popup`: aquí la definición ya está a la vista, así
                    que el enlace va directo a la ficha (GlosarioPopupGlobal).
                    Solo enlazan los términos con desarrollo largo: el resto
                    daría un 404. El nombre es un <h2>: cada término es una
                    sección de esta página. Su enlace cubre el cromo entero. */}
                <h2 className="glx-ficha-nombre">
                  {t.extended ? (
                    <Link
                      href={`/glosario/${t.slug}`}
                      className="glx-ficha-link"
                      data-sin-popup
                      // Suena como una tecla al hundirse, como todas las de la web.
                      onPointerDown={() => sonar("tecla")}
                    >
                      {t.term}
                    </Link>
                  ) : (
                    t.term
                  )}
                </h2>
              </div>

              <div className="glx-cromo">
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

                <div className="glx-cromo-pie">
                  {/* Decorativo: el enlace que lleva a la ficha es el nombre,
                      y cubre el cromo entero. */}
                  {t.extended && (
                    <span className="glx-cromo-leer" aria-hidden="true">
                      Leer completo
                      <ArrowRight size={15} strokeWidth={3} />
                    </span>
                  )}
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
              </div>
            </article>
          );
        })}
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
