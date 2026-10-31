"use client";

import { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { GUIDES_NEWEST_FIRST } from "@/lib/guides";

const CRYPTO_GUIDES = GUIDES_NEWEST_FIRST.filter((g) => g.tags.includes("CRIPTOMONEDAS"));

/** Una vuelta completa al borde, en milisegundos. Lenta y siempre igual. */
const VUELTA_MS = 18000;

/** Radio del foco de luz, en px: cuánto borde ilumina a cada lado. */
const RADIO_FOCO = 46;

/**
 * Contorno de un rectángulo redondeado como `path`, empezando arriba a la
 * izquierda tras la curva y en sentido horario. Se construye a mano para poder
 * medirlo con getTotalLength/getPointAtLength en cualquier navegador.
 */
function contorno(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M ${x + r} ${y}`,
    `H ${x + w - r}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

/**
 * Foco de luz que recorre el borde del buscador, lento y a velocidad constante.
 *
 * No se mueve un objeto: se pinta el borde ENTERO con un degradado radial y lo
 * que se desplaza es el centro del degradado, calculado en cada fotograma con
 * getPointAtLength. Resultado: un brillo continuo, sin escalones, que siempre
 * va pegado al contorno porque es el contorno lo que se ilumina.
 *
 * Es la cuarta versión, y cada una cayó por algo: el degradado cónico corría en
 * los lados largos y se frenaba en las curvas; la línea rígida con offset-path
 * se despegaba en cada curva; y cuatro trazos superpuestos se leían como un
 * bloque en varios tonos.
 */
function BordeDeLuz({ caja }: { caja: React.RefObject<HTMLDivElement | null> }) {
  const [marco, setMarco] = useState<{ w: number; h: number; r: number } | null>(null);
  const id = useId().replace(/:/g, "");
  const foco = `gs-foco-${id}`;
  const brillo = `gs-brillo-${id}`;
  const guiaRef = useRef<SVGPathElement>(null);
  const focoRef = useRef<SVGRadialGradientElement>(null);

  // Medida en vivo de la caja: el ancho cambia al enfocar el campo.
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // El radio sale del CSS, no se repite aquí: si cambia allí, la luz lo sigue.
      const radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      setMarco({ w, h, r: Math.min(radio, h / 2, w / 2) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [caja]);

  // El movimiento. Sin estado de React: se escriben los atributos del
  // degradado directamente, para no renderizar 60 veces por segundo.
  useEffect(() => {
    const guia = guiaRef.current;
    const grad = focoRef.current;
    if (!marco || !guia || !grad) return;

    const total = guia.getTotalLength();
    const colocar = (ms: number) => {
      const p = guia.getPointAtLength(((ms % VUELTA_MS) / VUELTA_MS) * total);
      grad.setAttribute("cx", String(p.x));
      grad.setAttribute("cy", String(p.y));
    };

    // Con movimiento reducido, el foco se queda quieto arriba a la derecha.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      colocar(VUELTA_MS * 0.12);
      return;
    }

    let frame = 0;
    const paso = (ms: number) => {
      colocar(ms);
      frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [marco]);

  if (!marco || marco.w < 2 || marco.h < 2) return null;
  const { w, h, r } = marco;
  // Centrado sobre la línea del borde de 1px.
  const d = contorno(0.5, 0.5, w - 1, h - 1, Math.max(r - 0.5, 0));

  return (
    <svg className="guide-search-luz" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <radialGradient ref={focoRef} id={foco} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={RADIO_FOCO}>
          <stop offset="0" stopColor="#ffe4d1" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ff9a5c" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#ff6b2b" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ff6b2b" stopOpacity="0" />
        </radialGradient>
        <filter id={brillo} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      {/* Trayecto que se mide; no se pinta. */}
      <path ref={guiaRef} d={d} fill="none" stroke="none" />
      {/* Resplandor: el mismo borde, más grueso y desenfocado. */}
      <path d={d} fill="none" stroke={`url(#${foco})`} strokeWidth={4} opacity={0.7} filter={`url(#${brillo})`} />
      {/* El filo nítido del borde iluminado. */}
      <path d={d} fill="none" stroke={`url(#${foco})`} strokeWidth={1.5} />
    </svg>
  );
}

/** Sin tildes ni mayúsculas: «Ripple» y «ripple», «Ondo» y «ondó» son lo mismo. */
function plano(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Busca una criptomoneda entre las guías que la explican. Solo las guías con la
 * etiqueta CRIPTOMONEDAS: el buscador sirve para «quiero entender esta moneda».
 *
 * Va a la vista en la sección de guías del home, en /guias y arriba del menú.
 * Al enfocarlo sin escribir enseña las criptomonedas explicadas: quien no sabe
 * qué hay, lo ve sin tener que adivinar un nombre.
 */
export default function GuideSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = plano(query.trim());
  const hasQuery = q.length >= 2;
  // Por título y por nombre corto: «xrp» encuentra «XRP y Ripple» aunque el
  // título largo empiece por otra cosa. No busca en la descripción, para que
  // los resultados sean siempre predecibles.
  const results = hasQuery
    ? CRYPTO_GUIDES.filter((g) => plano(g.title).includes(q) || plano(g.shortTitle).includes(q))
    : [];

  function ir(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/guias/${slug}`);
  }

  return (
    <div className="guide-search" ref={wrapRef}>
      <div className="guide-search-box" ref={boxRef}>
        <BordeDeLuz caja={boxRef} />
        <Search size={19} aria-hidden="true" className="guide-search-icon" />
        <input
          type="search"
          className="guide-search-input"
          placeholder="Busca una criptomoneda: XRP, Render, Worldcoin…"
          aria-label="Buscar una criptomoneda en las guías"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
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
                {CRYPTO_GUIDES.map((g) => (
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
