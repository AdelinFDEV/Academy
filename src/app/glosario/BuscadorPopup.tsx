"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, CornerDownLeft } from "lucide-react";
import { GLOSARIO, GLOSARIO_CATEGORIAS } from "@/lib/glosario";
import { bloquearScroll } from "@/lib/bloquearScroll";
import { sonar } from "@/lib/sonidos";
import "./buscador-popup.css";

/**
 * El buscador del diccionario (20-11-2026, pedido por el admin): en la página
 * solo hay una barra que parece un campo de texto; al pulsarla se abre en
 * mitad de la pantalla una hoja de libreta con espiral, el campo grande y los
 * resultados al vuelo como fichas con el lomo de su categoría.
 *
 * - Busca sin tildes ni mayúsculas («abstraccion» encuentra «Abstracción»), y
 *   ordena: primero los que EMPIEZAN por lo escrito, luego los que lo llevan en
 *   el nombre y al final los que solo lo llevan en la definición.
 * - Lo encontrado va pasado a rotulador amarillo.
 * - Flechas para moverse, Intro para abrir, Esc o el velo para cerrar.
 * - Bloquea el scroll con `bloquearScroll`, como toda ventana de la web, y va
 *   al <body> con un portal.
 */

/** Cuántos resultados se enseñan como mucho. */
const MAX = 7;

/** Para empezar, cuando aún no se ha escrito nada. Términos reales. */
const SUGERIDOS = ["halving", "staking", "fomo", "stop-loss", "wallet"];

const NOMBRE_CATEGORIA = new Map(GLOSARIO_CATEGORIAS.map((c) => [c.id as string, c.label]));

/** Quita tildes y mayúsculas SIN cambiar la longitud: así las posiciones sirven para resaltar. */
function plano(s: string): string {
  return Array.from(s, (c) => c.normalize("NFD").charAt(0).toLowerCase()).join("");
}

/** Lo que se ve de la definición: su primera frase. */
function primeraFrase(def: string): string {
  const corte = def.indexOf(". ");
  return corte === -1 ? def : def.slice(0, corte + 1);
}

const TERMINOS = GLOSARIO.filter((t) => t.extended).map((t) => ({
  ...t,
  plano: plano(t.term),
  planoDef: plano(t.definition),
}));

/** El texto con lo buscado envuelto en <mark> (el rotulador). */
function Resaltado({ texto, q }: { texto: string; q: string }) {
  if (!q) return <>{texto}</>;
  const i = plano(texto).indexOf(q);
  if (i === -1) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark>{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length)}
    </>
  );
}

export default function BuscadorPopup() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activo, setActivo] = useState(0);
  const barra = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const q = plano(texto.trim());

  const resultados = useMemo(() => {
    if (!q) return [];
    const empiezan = TERMINOS.filter((t) => t.plano.startsWith(q));
    const nombre = TERMINOS.filter((t) => !t.plano.startsWith(q) && t.plano.includes(q));
    const definicion = TERMINOS.filter((t) => !t.plano.includes(q) && t.planoDef.includes(q));
    return [...empiezan, ...nombre, ...definicion];
  }, [q]);

  const visibles = resultados.slice(0, MAX);
  const sugeridos = useMemo(
    () => SUGERIDOS.map((s) => TERMINOS.find((t) => t.slug === s)).filter((t): t is (typeof TERMINOS)[number] => !!t),
    [],
  );

  useEffect(() => {
    if (!abierto) return;
    const soltar = bloquearScroll();
    // El foco al campo en cuanto se monta: en el móvil abre el teclado.
    campo.current?.focus();
    return soltar;
  }, [abierto]);

  function abrir() {
    sonar("abrir");
    setAbierto(true);
  }

  function cerrar() {
    sonar("cerrar");
    setAbierto(false);
    setTexto("");
    setActivo(0);
    barra.current?.focus();
  }

  function escribir(v: string) {
    setTexto(v);
    setActivo(0);
  }

  function alTeclearCampo(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || visibles.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((a) => (a + 1) % visibles.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((a) => (a - 1 + visibles.length) % visibles.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      router.push(`/glosario/${visibles[activo].slug}`);
    }
  }

  return (
    <>
      {/* La barra de la página: parece un campo, pero es un botón que abre la ventana. */}
      <button
        ref={barra}
        type="button"
        className="glx-buscador"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={abrir}
      >
        <Search size={20} strokeWidth={2.6} aria-hidden="true" />
        <span className="glx-buscador-txt">Busca un término…</span>
      </button>

      {abierto &&
        createPortal(
          // Esc cierra: el foco está siempre dentro de la ventana.
          <div className="bp-velo" onClick={cerrar} onKeyDown={(e) => e.key === "Escape" && cerrar()}>
            <div
              className="bp-hoja"
              role="dialog"
              aria-modal="true"
              aria-label="Buscar en el diccionario"
              onClick={(e) => e.stopPropagation()}
            >
              {/* La espiral de la libreta, cosida arriba. */}
              <span className="bp-espiral" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>

              <button type="button" className="bp-cerrar" aria-label="Cerrar" onClick={cerrar}>
                <X size={18} strokeWidth={2.8} aria-hidden="true" />
              </button>

              <p className="bp-nota" aria-hidden="true">¿qué palabra buscas?</p>

              <label className="bp-campo">
                <Search size={26} strokeWidth={2.6} aria-hidden="true" />
                <input
                  ref={campo}
                  type="search"
                  value={texto}
                  onChange={(e) => escribir(e.target.value)}
                  onKeyDown={alTeclearCampo}
                  placeholder="halving, staking, wallet…"
                  aria-label="Buscar en el diccionario"
                  aria-controls="bp-resultados"
                  aria-activedescendant={visibles.length ? `bp-r-${activo}` : undefined}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                />
              </label>

              {!q ? (
                <div className="bp-sugeridos">
                  <span className="bp-sugeridos-txt">Para empezar:</span>
                  {sugeridos.map((t) => (
                    <Link key={t.slug} href={`/glosario/${t.slug}`} className="bp-chip" data-sin-popup>
                      {t.term}
                    </Link>
                  ))}
                </div>
              ) : visibles.length === 0 ? (
                <p className="bp-vacio">
                  «{texto.trim()}» no está en el diccionario… todavía.
                </p>
              ) : (
                <>
                  <ul id="bp-resultados" className="bp-lista" role="listbox" aria-label="Resultados">
                    {visibles.map((t, i) => (
                      <li key={t.slug} role="presentation" style={{ "--i": i } as React.CSSProperties}>
                        <Link
                          id={`bp-r-${i}`}
                          role="option"
                          aria-selected={i === activo}
                          href={`/glosario/${t.slug}`}
                          className={`bp-res bp-res--${t.category}${i === activo ? " es-activo" : ""}`}
                          onMouseEnter={() => setActivo(i)}
                          data-sin-popup
                        >
                          <span className="bp-res-lomo" aria-hidden="true" />
                          <span className="bp-res-cuerpo">
                            <span className="bp-res-cab">
                              <span className="bp-res-nombre">
                                <Resaltado texto={t.term} q={q} />
                              </span>
                              <span className="bp-res-cat">{NOMBRE_CATEGORIA.get(t.category) ?? t.category}</span>
                            </span>
                            <span className="bp-res-def">{primeraFrase(t.definition)}</span>
                          </span>
                          <CornerDownLeft className="bp-res-intro" size={18} strokeWidth={2.6} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {resultados.length > MAX && (
                    <p className="bp-mas">
                      y {resultados.length - MAX} más: afina un poco la búsqueda
                    </p>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
