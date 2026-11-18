"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { GUIDES_NEWEST_FIRST } from "@/lib/guides";
import type { GuiaBuscador } from "@/app/api/guias/publicadas/route";
import { bloquearScroll } from "@/lib/bloquearScroll";
import "./guide-search-ventana.css";

const esCripto = (g: { tags: string[] }) => g.tags.includes("CRIPTOMONEDAS");
const CRYPTO_GUIDES: GuiaBuscador[] = GUIDES_NEWEST_FIRST.filter(esCripto);

/** Sin tildes ni mayúsculas: «Ripple» y «ripple», «Ondo» y «ondó» son lo mismo. */
function plano(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * En el móvil el texto de ejemplo tiene que leerse entero (pedido por el admin
 * el 18-11-2026): con los nombres de ejemplo se cortaba. En el ordenador, con
 * sitio, se quedan. Se lee de la pantalla, no del CSS: el texto de ejemplo no
 * se puede cambiar con estilos.
 */
const MOVIL = "(max-width: 640px)";
function suscribirMovil(avisar: () => void) {
  const mq = window.matchMedia(MOVIL);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}
const esMovil = () => window.matchMedia(MOVIL).matches;
const enServidor = () => false;

/**
 * Busca una criptomoneda entre las guías que la explican. Solo las guías con la
 * etiqueta CRIPTOMONEDAS: el buscador sirve para «quiero entender esta moneda».
 *
 * Va a la vista en la sección de guías del home, en /guias y arriba del menú;
 * cada sitio lo viste desde su CSS (home.css, listado.css, menu-movil.css).
 * Al enfocarlo sin escribir enseña las criptomonedas explicadas: quien no sabe
 * qué hay, lo ve sin tener que adivinar un nombre.
 *
 * `ventanaEnMovil` (18-11-2026, pedido por el admin): en el móvil, tocar el
 * buscador abre una hoja que sube desde abajo, con el campo grande ya
 * enfocado, las criptomonedas como teclitas y los resultados al escribir
 * (guide-search-ventana.css). En el ordenador, y en el menú (que ya ocupa toda
 * la pantalla), sigue siendo el desplegable de siempre. En el menú, las
 * sugerencias salen a partir de tres letras (`sugerenciasDesde`).
 */
export default function GuideSearch({
  ventanaEnMovil = false,
  sugerenciasDesde = 0,
}: {
  ventanaEnMovil?: boolean;
  /** Con un número, el desplegable no sale hasta escribir esas letras (y sin
   *  las teclitas de criptomonedas al enfocar). El menú usa 3 (18-11-2026). */
  sugerenciasDesde?: number;
} = {}) {
  const movil = useSyncExternalStore(suscribirMovil, esMovil, enServidor);
  const enVentana = movil && ventanaEnMovil;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [ventana, setVentana] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const campoVentana = useRef<HTMLInputElement>(null);

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

  // Con la hoja abierta, la página de detrás no se mueve, y Escape la cierra.
  useEffect(() => {
    if (!ventana) return;
    const soltar = bloquearScroll();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVentana(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      soltar();
      document.removeEventListener("keydown", alTeclear);
    };
  }, [ventana]);

  const q = plano(query.trim());
  const hasQuery = q.length >= Math.max(2, sugerenciasDesde);
  // Con `sugerenciasDesde`, antes de esas letras no se enseña nada.
  const esperando = sugerenciasDesde > 0 && !hasQuery;
  // Por título y por nombre corto: «xrp» encuentra «XRP y Ripple» aunque el
  // título largo empiece por otra cosa. No busca en la descripción, para que
  // los resultados sean siempre predecibles.
  const results = hasQuery
    ? guias.filter((g) => plano(g.title).includes(q) || plano(g.shortTitle).includes(q))
    : [];

  function ir(slug: string) {
    setOpen(false);
    setVentana(false);
    setQuery("");
    router.push(`/guias/${slug}`);
  }

  /**
   * Abre la hoja. El campo de la hoja ya está en la página (escondido) y se
   * enfoca AQUÍ, dentro del toque: el iPhone solo saca el teclado si el foco
   * llega en el mismo gesto del dedo.
   */
  function abrirVentana() {
    cargarPublicadas();
    campoVentana.current?.focus({ preventScroll: true });
    setVentana(true);
  }

  /** La lista: las criptomonedas explicadas o, al escribir, los resultados. */
  const lista = (alElegir: () => void, clase: string) =>
    !hasQuery ? (
      <>
        <p className="guide-search-sugerencias-titulo">Criptomonedas explicadas</p>
        <div className={`guide-search-sugerencias ${clase}`}>
          {guias.map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className="guide-search-chip" onClick={alElegir}>
              <span className="guide-search-result-dot" style={{ background: g.color }} />
              {g.shortTitle}
            </Link>
          ))}
        </div>
      </>
    ) : results.length === 0 ? (
      <p className="guide-search-empty">Aún no hay guía de &quot;{query}&quot;. Prueba con otra criptomoneda.</p>
    ) : (
      results.map((g) => (
        <Link key={g.slug} href={`/guias/${g.slug}`} className="guide-search-result" onClick={alElegir}>
          <span className="guide-search-result-dot" style={{ background: g.color }} />
          <span className="guide-search-result-body">
            <span className="guide-search-result-title">{g.shortTitle}</span>
            <span className="guide-search-result-desc">{g.description}</span>
          </span>
        </Link>
      ))
    );

  return (
    <div className="guide-search" ref={wrapRef}>
      <div className="guide-search-box">
        <Search size={19} aria-hidden="true" className="guide-search-icon" />
        <input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          className="guide-search-input"
          placeholder={movil ? "Busca una criptomoneda" : "Busca una criptomoneda: XRP, Render, Worldcoin…"}
          aria-label="Buscar una criptomoneda en las guías"
          // En la hoja se escribe en su propio campo: este solo la abre.
          readOnly={enVentana}
          aria-haspopup={enVentana ? "dialog" : undefined}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); cargarPublicadas(); }}
          onFocus={() => { if (!enVentana) { setOpen(true); cargarPublicadas(); } }}
          onPointerDown={(e) => {
            if (!enVentana) return;
            e.preventDefault();
            abrirVentana();
          }}
          onKeyDown={(e) => {
            if (enVentana && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              abrirVentana();
              return;
            }
            // Intro abre el primer resultado; Escape cierra la lista.
            if (e.key === "Enter" && results[0]) ir(results[0].slug);
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {query && !enVentana && (
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

      {open && !enVentana && !esperando && <div className="guide-search-dropdown">{lista(() => setOpen(false), "")}</div>}

      {enVentana &&
        createPortal(
          <div
            className={`gs-ventana${ventana ? " is-abierta" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar una criptomoneda"
            aria-hidden={ventana ? undefined : true}
          >
            <div className="gs-velo" onClick={() => setVentana(false)} />
            <div className="gs-hoja">
              <span className="gs-asa" aria-hidden="true" />
              <div className="gs-cabecera">
                <Image src="/cuaderno/lupa-pegatina.webp" alt="" width={330} height={367} className="gs-lupa" draggable={false} />
                <p className="gs-titulo">¿Qué cripto quieres entender?</p>
                <button type="button" className="gs-cerrar" aria-label="Cerrar el buscador" onClick={() => setVentana(false)}>
                  <X size={20} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>

              <div className="guide-search-box gs-caja">
                <Search size={20} aria-hidden="true" className="guide-search-icon" />
                <input
                  ref={campoVentana}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  className="guide-search-input"
                  placeholder="Bitcoin, XRP, Solana…"
                  aria-label="Nombre de la criptomoneda"
                  tabIndex={ventana ? 0 : -1}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results[0]) ir(results[0].slug);
                  }}
                />
                {query && (
                  <button type="button" className="guide-search-clear" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}>
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="gs-lista">{lista(() => setVentana(false), "gs-chips")}</div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
